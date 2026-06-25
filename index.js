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



const additionalTools = ['eslint','tailwindcss','lenis','gsap'];
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
const handleCleanup = (targetPath, additional) => {
    if (additional === []) return;
    try {
        let toolsToCleanup = additionalTools;
        additional.forEach(addon => {
            toolsToCleanup = toolsToCleanup.filter(e => e !== addon );
        });
        toolsToCleanup.forEach((tool) => {
            switch (tool) {
                case 'eslint':
                    handleEslintCleanup(targetPath, true);
                    break;
                case 'tailwindcss':
                    handleTailwindCleanup(targetPath, true);
                    break;
            }
        })
    }
    catch (err) {
        console.log('Cleanup failed: ', err);
    }
    
}
const handleEslintCleanup = async (targetPath) => {
    try {
        await fs.remove(path.join(targetPath, 'eslint.config.js'));

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
        let viteConfigPath = '';
        if (fs.pathExists(path.join(targetPath, '/vite.config.js'))) {
            viteConfigPath = path.join(targetPath, '/vite.config.js')
        }
        else {
            viteConfigPath = path.join(targetPath, '/vite.config.ts')
        }
        const viteConfig = await fs.readFile(viteConfigPath, 'utf8');
            console.log(viteConfig);
            let newFile = viteConfig.replace(`import tailwindcss from '@tailwindcss/vite'`, '');
            if (newFile.includes(', tailwindcss()')) {
                newFile = newFile.replace(', tailwindcss()', '');
            }
            else {
                newFile = newFile.replace('tailwindcss()', '');
            }
            
        
            await fs.outputFile(viteConfigPath, newFile);
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
    const framework = await checkForFramework('frontend');
    handleCancel(framework);

    const language = await checkForLanguage();
    handleCancel(language);

    const additional = await confirm({
        message: 'Do you want to see optional fluff?',
        initialValue: false,
    });
    handleCancel(additional);
    let selectedTools = [];

    if (additional) {
        selectedTools = await multiselect({
            message: 'Select additional tools.',
            options: [
                { value: 'eslint', label: 'ESLint', hint: 'recommended' },
                { value: 'tailwindcss', label: 'Tailwindcss'},
                { value: 'lenis', label: 'Lenis', disabled: true },
                { value: 'gsap', label: 'GSAP', disabled: true},
            ],
            required: false,
        });
    }
    
    const shouldGitInit = await confirm({
        message: 'Initialize a local Git repository?',
        initialValue: true, 
    });
    handleCancel(shouldGitInit);


    let activeTemplate = framework + '-' + language;

    const p = progress({ max: 5 });
    p.start('Scaffolding static project...');
    p.advance(1, 'Reaching into templates...');

    if (activeTemplate.startsWith('vanilla')) {
        await fs.copy(
            path.join(__dirname, 'templates', 'client-vanilla', `${activeTemplate}`),
            targetPath
        );
    }
    else if (activeTemplate.startsWith('react')) {
        await fs.copy(
            path.join(__dirname, 'templates', 'client-react', `${activeTemplate}`),
            targetPath
        );
    }
    else if (activeTemplate.startsWith('vue')) {
        await fs.copy(
            path.join(__dirname, 'templates', 'client-vue', `${activeTemplate}`),
            targetPath
        );
    }
    else {
        await execAsync(`npx --yes create-vite@latest "${targetPath}" --template ${activeTemplate}`);
    }
    
    p.advance(2, 'Handling any clean-ups...');
        await handleCleanup(targetPath, selectedTools);

    if (shouldGitInit) {
        p.advance(4, 'Initializing local Git repository...');
        await initializeGit(targetPath);
    }

    p.stop('Done!');

    outro('All set up! Happy coding.');
};

const dynamicBuilder = async (targetPath) => {
    const architecture = await select({
        message: 'Choose your dynamic architecture style:',
        options: [
            { value: 'split', label: 'Separate Frontend + Dedicated Node Server' },
        ]
    });
    handleCancel(architecture);

    if (architecture === 'split') {
        try {
            const framework = await checkForFramework('frontend');
            handleCancel(framework);

            const language = await checkForLanguage();
            handleCancel(language);
            
            let activeTemplate = framework + '-' + language;

            const nodeFramework = await checkForFramework('node');
            handleCancel(nodeFramework);
            
            const additional = await confirm({
                message: 'Do you want to see optional fluff?',
                initialValue: false,
            });
            handleCancel(additional);
            let selectedTools = [];

            if (additional) {
                selectedTools = await multiselect({
                    message: 'Select additional tools.',
                    options: [
                        { value: 'eslint', label: 'ESLint', hint: 'recommended' },
                        { value: 'tailwindcss', label: 'Tailwindcss'},
                        { value: 'lenis', label: 'Lenis', disabled: true },
                        { value: 'gsap', label: 'GSAP', disabled: true},
                    ],
                    required: false,
                });
            }
            
            const shouldGitInit = await confirm({
                message: 'Initialize a local Git repository?',
                initialValue: true, 
            });
            handleCancel(shouldGitInit);
            
            const p = progress({ max: 10 });
            p.start('Building fullstack split-project...');
            
            p.advance(1, 'Creating directories...');
            const clientPath = path.join(targetPath, 'client');
            const serverPath = path.join(targetPath, 'server');
            
            await fs.ensureDir(clientPath);
            await fs.ensureDir(serverPath);
            
            p.advance(3, 'Scaffolding Vite frontend...');
            if (activeTemplate.startsWith('vanilla')) {
                await fs.copy(
                    path.join(__dirname, 'templates', 'client-vanilla', `${activeTemplate}`),
                    clientPath
                );
            }
            else if (activeTemplate.startsWith('react')) {
                await fs.copy(
                    path.join(__dirname, 'templates', 'client-react', `${activeTemplate}`),
                    clientPath
                );
            }
            else if (activeTemplate.startsWith('vue')) {
                await fs.copy(
                    path.join(__dirname, 'templates', 'client-vue', `${activeTemplate}`),
                    targetPath
                );
            }
            else {
                await execAsync(`npx --yes create-vite@latest "${clientPath}" --template ${activeTemplate}`);
            }
            
            p.advance(5, 'Injecting server boilerplate...');
            await fs.copy(
                path.join(__dirname, 'templates', `server-${nodeFramework}`), 
                serverPath
            );
            
            p.advance(7, 'Handling any clean-ups...');
            await handleCleanup(clientPath, selectedTools);

            if (shouldGitInit) {
                p.advance(9, 'Initializing local Git repository...');
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