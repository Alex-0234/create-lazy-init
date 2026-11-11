import { intro, text, select, outro, isCancel, cancel, confirm, multiselect, spinner, log } from '@clack/prompts';
import { execFile } from 'node:child_process';
import { promisify, parseArgs } from 'node:util';
import path from 'node:path';
import fs from 'fs-extra';
import { fileURLToPath } from 'node:url';
import { loadRegistry, installItems, sortKeys } from './registry.js';

const execFileAsync = promisify(execFile);
const TEMPLATES_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'templates');

// `registry`: the template is a shell that gets its providers, hooks and data from registry/.
// The registry components are built on Tailwind, so those templates always include it.
const TEMPLATES = {
    react: { label: 'React', hint: 'Vite + React Router + TypeScript', registry: true },
    next: { label: 'Next.js', hint: 'App Router + TypeScript', registry: true },
    vanilla: { label: 'Vanilla', hint: 'Vite + TypeScript', registry: false },
};

// npm strips dotfiles such as .gitignore from published packages, so templates ship stubs
const DOTFILE_STUBS = { _gitignore: '.gitignore' };

const HELP = `
Usage: npm create lazy-init@latest [directory] [options]
       npx create-lazy-init@latest add [components...]   (see "add --help")

Options:
  -t, --template <name>     ${Object.keys(TEMPLATES).join(' | ')}
  -c, --components <list>   comma separated components to include, or "all" (react / next)
      --eslint              include ESLint
      --tailwind            include Tailwind CSS (vanilla; react / next always have it)
      --no-git              skip git init
  -y, --yes                 skip remaining prompts and use defaults (no extras, git init)
  -f, --force               write into a non-empty directory without asking
  -h, --help                show this help
`;

/* HELPERS */

const bail = (message = 'Operation canceled.') => {
    cancel(message);
    process.exit(1);
};

const ask = async (prompt) => {
    const value = await prompt;
    if (isCancel(value)) bail();
    return value;
};

const toPackageName = (dir) =>
    path.basename(dir)
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/^[._]+/, '')
        .replace(/[^a-z0-9-~._]+/g, '-') || 'app';

const isEmptyDir = async (dir) => {
    if (!(await fs.pathExists(dir))) return true;
    const entries = await fs.readdir(dir);
    return entries.every((entry) => entry === '.git');
};

const isInsideGitRepo = async (dir) => {
    // the target may not exist yet, so ask git from its nearest existing ancestor
    while (!(await fs.pathExists(dir))) dir = path.dirname(dir);
    try {
        await execFileAsync('git', ['rev-parse', '--is-inside-work-tree'], { cwd: dir });
        return true;
    } catch {
        return false;
    }
};

const updatePackageJson = async (targetPath, mutate) => {
    const pkgPath = path.join(targetPath, 'package.json');
    const pkg = await fs.readJson(pkgPath);
    mutate(pkg);
    await fs.writeJson(pkgPath, pkg, { spaces: 2 });
};

const removeDevDeps = (pkg, predicate) => {
    for (const key of Object.keys(pkg.devDependencies ?? {})) {
        if (predicate(key)) delete pkg.devDependencies[key];
    }
};

/* SCAFFOLD STEPS */

const copyTemplate = async (template, targetPath) => {
    await fs.copy(path.join(TEMPLATES_DIR, template), targetPath);
    for (const [stub, dotfile] of Object.entries(DOTFILE_STUBS)) {
        const stubPath = path.join(targetPath, stub);
        if (await fs.pathExists(stubPath)) {
            await fs.move(stubPath, path.join(targetPath, dotfile), { overwrite: true });
        }
    }
};

const addRegistryItems = async (registry, framework, targetPath, components) => {
    const { dependencies } = await installItems({
        registry,
        names: [...registry.base, ...components],
        framework,
        root: path.join(targetPath, 'src'),
        overwrite: true,
    });
    await updatePackageJson(targetPath, (pkg) => {
        pkg.dependencies = sortKeys({ ...pkg.dependencies, ...dependencies });
    });
};

const removeEslint = async (targetPath) => {
    await fs.remove(path.join(targetPath, 'eslint.config.js'));
    await fs.remove(path.join(targetPath, 'eslint.config.mjs'));
    await updatePackageJson(targetPath, (pkg) => {
        removeDevDeps(pkg, (key) => key.includes('eslint') || key === 'globals');
        delete pkg.scripts?.lint;
    });
};

const removeTailwind = async (targetPath) => {
    const viteConfigPath = path.join(targetPath, 'vite.config.ts');
    if (await fs.pathExists(viteConfigPath)) {
        const config = (await fs.readFile(viteConfigPath, 'utf8'))
            .replace(/^import tailwindcss from ['"]@tailwindcss\/vite['"];?\r?\n/m, '')
            .replace(/,\s*tailwindcss\(\)|tailwindcss\(\),?\s*/, '');
        await fs.outputFile(viteConfigPath, config);
    }

    const cssPath = path.join(targetPath, 'src/style.css');
    if (await fs.pathExists(cssPath)) {
        const css = await fs.readFile(cssPath, 'utf8');
        await fs.outputFile(cssPath, css.replace(/^@import ["']tailwindcss["'];(\r?\n)+/m, ''));
    }

    await updatePackageJson(targetPath, (pkg) => removeDevDeps(pkg, (key) => key.includes('tailwindcss')));
};

const initGit = async (targetPath) => {
    await execFileAsync('git', ['init'], { cwd: targetPath });
    await execFileAsync('git', ['add', '-A'], { cwd: targetPath });
    await execFileAsync('git', ['commit', '-m', 'chore: initial commit from create-lazy-init'], { cwd: targetPath });
};

/* MAIN */

export async function create(argv) {
    let args;
    try {
        args = parseArgs({
            args: argv,
            allowPositionals: true,
            allowNegative: true,
            options: {
                template: { type: 'string', short: 't' },
                components: { type: 'string', short: 'c' },
                eslint: { type: 'boolean' },
                tailwind: { type: 'boolean' },
                git: { type: 'boolean' },
                yes: { type: 'boolean', short: 'y' },
                force: { type: 'boolean', short: 'f' },
                help: { type: 'boolean', short: 'h' },
            },
        });
    } catch (err) {
        console.error(err.message + '\n' + HELP);
        process.exit(1);
    }

    const { values: flags, positionals } = args;

    if (flags.help) {
        console.log(HELP);
        return;
    }

    if (flags.template && !TEMPLATES[flags.template]) {
        console.error(`Unknown template "${flags.template}". Use one of: ${Object.keys(TEMPLATES).join(', ')}`);
        process.exit(1);
    }

    const registry = await loadRegistry();
    const componentNames = Object.keys(registry.items).filter((name) => !registry.base.includes(name));

    intro('create-lazy-init');

    const dirInput = positionals[0] ?? await ask(text({
        message: 'Where do you want to create the project?',
        placeholder: '"." for the current folder',
        validate: (value) => (!value?.trim() ? 'Please enter a folder name, or "." for the current folder.' : undefined),
    }));

    const targetPath = path.resolve(process.cwd(), dirInput.trim());

    if (!(await isEmptyDir(targetPath)) && !flags.force) {
        if (flags.yes) bail(`${targetPath} is not empty. Use --force to write into it anyway.`);
        const proceed = await ask(confirm({
            message: `${targetPath} is not empty. Continue? Files with the same name will be overwritten.`,
            initialValue: false,
        }));
        if (!proceed) bail();
    }

    const template = flags.template ?? await ask(select({
        message: 'Pick a template:',
        options: Object.entries(TEMPLATES).map(([value, { label, hint }]) => ({ value, label, hint })),
    }));
    const { registry: usesRegistry } = TEMPLATES[template];

    let components = [];
    if (usesRegistry) {
        if (flags.components !== undefined) {
            components = flags.components === 'all'
                ? componentNames
                : flags.components.split(',').map((name) => name.trim()).filter(Boolean);
            const unknown = components.filter((name) => !componentNames.includes(name));
            if (unknown.length) bail(`Unknown component(s): ${unknown.join(', ')}. Run "create-lazy-init add --list" to see them all.`);
        } else if (!flags.yes) {
            components = await ask(multiselect({
                message: 'Include components? (space to toggle, enter to skip or confirm; you can "add" more later)',
                options: componentNames.map((value) => ({ value, label: value, hint: registry.items[value].description })),
                required: false,
            }));
        }
    }

    const tools = [];
    if (usesRegistry) {
        tools.push('tailwind');
        const eslint = flags.eslint ?? (flags.yes ? false : await ask(confirm({ message: 'Include ESLint?', initialValue: false })));
        if (eslint) tools.push('eslint');
    } else if (flags.eslint !== undefined || flags.tailwind !== undefined || flags.yes) {
        if (flags.eslint) tools.push('eslint');
        if (flags.tailwind) tools.push('tailwind');
    } else {
        tools.push(...await ask(multiselect({
            message: 'Optional extras (space to toggle, enter to confirm):',
            options: [
                { value: 'eslint', label: 'ESLint' },
                { value: 'tailwind', label: 'Tailwind CSS' },
            ],
            required: false,
        })));
    }

    const alreadyInRepo = await isInsideGitRepo(targetPath);
    let useGit = false;
    if (!alreadyInRepo) {
        useGit = flags.git ?? (flags.yes ? true : await ask(confirm({
            message: 'Initialize a git repository?',
            initialValue: true,
        })));
    }

    const s = spinner();
    s.start('Copying template...');
    try {
        await copyTemplate(template, targetPath);
        if (usesRegistry) await addRegistryItems(registry, template, targetPath, components);
        await updatePackageJson(targetPath, (pkg) => { pkg.name = toPackageName(targetPath); });
        if (!tools.includes('eslint')) await removeEslint(targetPath);
        if (!tools.includes('tailwind')) await removeTailwind(targetPath);
        s.stop(`Created ${TEMPLATES[template].label} project${components.length ? ` with ${components.length} component(s)` : ''}.`);
    } catch (err) {
        s.error('Failed to create project.');
        console.error(err);
        process.exit(1);
    }

    if (useGit) {
        try {
            await initGit(targetPath);
            log.success('Initialized git repository.');
        } catch (err) {
            log.warn(`Git setup failed, skipping it: ${(err.stderr || err.message).trim()}`);
        }
    } else if (alreadyInRepo) {
        log.info('Already inside a git repository, skipped git init.');
    }

    const rel = path.relative(process.cwd(), targetPath);
    const steps = [rel && `cd ${rel.includes(' ') ? `"${rel}"` : rel}`, 'npm install', 'npm run dev'].filter(Boolean);
    outro(`Done. Next steps:\n\n   ${steps.join('\n   ')}`);
}
