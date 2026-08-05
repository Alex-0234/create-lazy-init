#!/usr/bin/env node

import { intro, text, select, outro, isCancel, cancel, progress, confirm, multiselect } from '@clack/prompts';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



const additionalTools = ['eslint', 'tailwindcss'];

const clientTemplateDirs = {
    vanilla: 'client-vanilla',
    react: 'client-react',
    vue: 'client-vue',
};

const dotfileStubs = {
    _gitignore: '.gitignore',
    _env: '.env',
};

/* HELPER FUNCTIONS */

const handleCancel = (prop) => {
    if (isCancel(prop)) {
        cancel('Operation canceled.');
        process.exit(0);
    }
}

const checkForFramework = async (where) => {
    if (where === 'frontend') {
        const framework = await select({
            message: 'Choose your frontend framework:',
            options: [
                { value: 'vanilla', label: 'Vanilla'},
                { value: 'react', label: 'React'},
                { value: 'vue', label: 'Vue'},
            ]
        });
        return framework;
    } else {
        const nodeFramework = await select({
            message: 'Choose your backend framework:',
            options: [
                { value: 'express', label: 'Express.js' },
            ],
        });
        return nodeFramework;
    }
}

const checkForLanguage = async () => {
    const language = await select({
        message: 'What frontend language will be used?',
        options: [
            { value: 'js', label: 'JavaScript' },
            { value: 'ts', label: 'TypeScript' },
        ],
    });
    return language;
};

const checkForTools = async () => {
    const additional = await confirm({
        message: 'Do you want to see optional fluff?',
        initialValue: false,
    });
    handleCancel(additional);

    if (!additional) return [];

    const selectedTools = await multiselect({
        message: 'Select additional tools.',
        options: [
            { value: 'eslint', label: 'ESLint', hint: 'recommended' },
            { value: 'tailwindcss', label: 'Tailwindcss' },
        ],
        required: false,
    });
    handleCancel(selectedTools);

    return selectedTools;
};

// npm strips dotfiles such as .gitignore and .env from published packages, so templates ship stubs
const restoreDotfiles = async (targetPath) => {
    for (const [stub, dotfile] of Object.entries(dotfileStubs)) {
        const stubPath = path.join(targetPath, stub);
        if (await fs.pathExists(stubPath)) {
            await fs.move(stubPath, path.join(targetPath, dotfile), { overwrite: true });
        }
    }
};

const copyTemplate = async (templateDir, targetPath) => {
    await fs.copy(path.join(__dirname, 'templates', ...templateDir), targetPath);
    await restoreDotfiles(targetPath);
};

const handleCleanup = async (targetPath, additional) => {
    try {
        const toolsToCleanup = additionalTools.filter(tool => !additional.includes(tool));
        for (const tool of toolsToCleanup) {
            switch (tool) {
                case 'eslint':
                    await handleEslintCleanup(targetPath);
                    break;
                case 'tailwindcss':
                    await handleTailwindCleanup(targetPath);
                    break;
            }
        }
    }
    catch (err) {
        console.log('Cleanup failed: ', err);
    }
}
const handleEslintCleanup = async (targetPath) => {
    try {
        await fs.remove(path.join(targetPath, 'eslint.config.js'));
        await fs.remove(path.join(targetPath, 'eslint.config.mjs'));

        const packageJsonPath = path.join(targetPath, 'package.json');
        const pkg = await fs.readJson(packageJsonPath);

        if (pkg.devDependencies) {
            Object.keys(pkg.devDependencies).forEach((key) => {
                if (key.includes('eslint') || key.includes('globals')) {
                    delete pkg.devDependencies[key];
                }
            });
        }

        if (pkg.scripts && pkg.scripts.lint) {
            delete pkg.scripts.lint;
        }

        await fs.writeJson(packageJsonPath, pkg, { spaces: 2 });
    }
    catch (err) {
        console.log('Eslint cleanup failed: ', err);
    }
}

const handleTailwindCleanup = async (targetPath) => {
    try {
        // Next.js templates wire tailwind through postcss, vite templates through the vite plugin
        const postcssConfigPath = path.join(targetPath, 'postcss.config.mjs');
        if (await fs.pathExists(postcssConfigPath)) {
            await fs.remove(postcssConfigPath);
        }
        else {
            let viteConfigPath = path.join(targetPath, 'vite.config.js');
            if (!(await fs.pathExists(viteConfigPath))) {
                viteConfigPath = path.join(targetPath, 'vite.config.ts');
            }
            const viteConfig = await fs.readFile(viteConfigPath, 'utf8');
            let newFile = viteConfig.replace(/^import tailwindcss from ['"]@tailwindcss\/vite['"]\r?\n/m, '');
            newFile = newFile.replace(/,\s*tailwindcss\(\)|tailwindcss\(\)/, '');
            await fs.outputFile(viteConfigPath, newFile);
        }

        const cssCandidates = ['src/app/globals.css', 'src/index.css', 'src/style.css'];
        for (const candidate of cssCandidates) {
            const cssPath = path.join(targetPath, candidate);
            if (await fs.pathExists(cssPath)) {
                const css = await fs.readFile(cssPath, 'utf8');
                await fs.outputFile(cssPath, css.replace(/^@import ["']tailwindcss["'];(\r?\n)+/m, ''));
            }
        }

        const packageJsonPath = path.join(targetPath, 'package.json');
        const pkg = await fs.readJson(packageJsonPath);
        if (pkg.devDependencies) {
            Object.keys(pkg.devDependencies).forEach((key) => {
                if (key.includes('tailwindcss')) {
                    delete pkg.devDependencies[key];
                }
            });
        }
        await fs.writeJson(packageJsonPath, pkg, { spaces: 2 });
    }
    catch (err) {
        console.log('Tailwindcss cleanup failed: ', err)
    }
}

async function initializeGit(targetPath) {
    try {
        await execAsync('git init', { cwd: targetPath });

        await execAsync('git add .', { cwd: targetPath });

        await execAsync('git commit -m "chore: initial commit from lazy-init"', { cwd: targetPath });
    } catch (error) {

    }
}

/* MAIN BUILDERS */

const staticBuilder = async (targetPath) => {
    try {
        const framework = await checkForFramework('frontend');
        handleCancel(framework);

        const language = await checkForLanguage();
        handleCancel(language);

        const selectedTools = await checkForTools();

        const shouldGitInit = await confirm({
            message: 'Initialize a local Git repository?',
            initialValue: true,
        });
        handleCancel(shouldGitInit);

        const p = progress({ max: shouldGitInit ? 3 : 2 });
        p.start('Scaffolding static project...');

        p.advance(1, 'Reaching into templates...');
        await copyTemplate([clientTemplateDirs[framework], `${framework}-${language}`], targetPath);

        p.advance(1, 'Handling any clean-ups...');
        await handleCleanup(targetPath, selectedTools);

        if (shouldGitInit) {
            p.advance(1, 'Initializing local Git repository...');
            await initializeGit(targetPath);
        }

        p.stop('Done!');
        outro(`All set up at: ${targetPath}. Happy coding.`);
    }
    catch (err) {
        console.error('\nAn error occurred during build:', err);
    }
};

const dynamicBuilder = async (targetPath) => {
    const architecture = await select({
        message: 'Choose your dynamic architecture style:',
        options: [
            { value: 'split', label: 'Separate Frontend + Dedicated Node Server' },
            { value: 'unified', label: 'Unified Fullstack (Next.js)' },
        ]
    });
    handleCancel(architecture);

    if (architecture === 'unified') {
        try {
            const selectedTools = await checkForTools();

            const shouldGitInit = await confirm({
                message: 'Initialize a local Git repository?',
                initialValue: true,
            });
            handleCancel(shouldGitInit);

            const p = progress({ max: shouldGitInit ? 3 : 2 });
            p.start('Building unified fullstack project...');

            p.advance(1, 'Scaffolding Next.js app...');
            await copyTemplate(['fullstack-next', 'next-ts'], targetPath);

            p.advance(1, 'Handling any clean-ups...');
            await handleCleanup(targetPath, selectedTools);

            if (shouldGitInit) {
                p.advance(1, 'Initializing local Git repository...');
                await initializeGit(targetPath);
            }

            p.stop('Project generated successfully!');
            outro(`Your fullstack environment is ready at: ${targetPath}`);
        }
        catch (err) {
            console.error('\nAn error occurred during build:', err);
        }
        return;
    }

    if (architecture === 'split') {
        try {
            const framework = await checkForFramework('frontend');
            handleCancel(framework);

            const language = await checkForLanguage();
            handleCancel(language);

            const nodeFramework = await checkForFramework('node');
            handleCancel(nodeFramework);

            const selectedTools = await checkForTools();

            const shouldGitInit = await confirm({
                message: 'Initialize a local Git repository?',
                initialValue: true,
            });
            handleCancel(shouldGitInit);

            const p = progress({ max: shouldGitInit ? 5 : 4 });
            p.start('Building fullstack split-project...');

            p.advance(1, 'Creating directories...');
            const clientPath = path.join(targetPath, 'client');
            const serverPath = path.join(targetPath, 'server');

            await fs.ensureDir(clientPath);
            await fs.ensureDir(serverPath);

            p.advance(1, 'Scaffolding Vite frontend...');
            await copyTemplate([clientTemplateDirs[framework], `${framework}-${language}`], clientPath);

            p.advance(1, 'Injecting server boilerplate...');
            await copyTemplate([`server-${nodeFramework}`], serverPath);

            p.advance(1, 'Handling any clean-ups...');
            await handleCleanup(clientPath, selectedTools);

            if (shouldGitInit) {
                p.advance(1, 'Initializing local Git repository...');
                await initializeGit(targetPath);
            }

            p.stop('Project generated successfully!');
            outro(`Your fullstack environment is ready at: ${targetPath}`);
        }
        catch (err) {
            console.error('\nAn error occurred during build:', err);
        }
    }
}

/* CLI INTRO */

intro('Lazy Init');

let userInput = process.argv[2];

if (!userInput) {
    userInput = await text({
        message: 'Where do you want to initialize?',
        placeholder: '"." for current folder'
    });
    handleCancel(userInput);
}

const targetPath = userInput === '.' ? process.cwd() : path.resolve(process.cwd(), userInput);

const projectType = await select({
    message: 'What type will it be?',
    options: [
        { value: 'static', label: 'Static - Frontend' },
        { value: 'dynamic', label: 'Dynamic - Fullstack' },
    ]
});
handleCancel(projectType);

switch (projectType) {
    case 'static':
        await staticBuilder(targetPath);
        break;
    case 'dynamic':
        await dynamicBuilder(targetPath);
        break;
};
