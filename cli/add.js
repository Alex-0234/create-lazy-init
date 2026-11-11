import { intro, outro, multiselect, isCancel, cancel, log, spinner } from '@clack/prompts';
import { spawn } from 'node:child_process';
import { parseArgs } from 'node:util';
import path from 'node:path';
import fs from 'fs-extra';
import {
    loadRegistry, detectFramework, sourceRoot, installItems, missingDependencies,
} from './registry.js';

const HELP = `
Usage: npx create-lazy-init@latest add [components...] [options]

Run inside a project made with create-lazy-init (or any Next.js / React Router
project with the "@/*" path alias). Files are copied into your project, so you
own them and can edit them freely.

Options:
  -a, --all         add every component
  -l, --list        list available components
  -o, --overwrite   replace files that already exist and differ
      --no-install  don't install npm dependencies, just print them
  -h, --help        show this help
`;

const packageManager = async (dir) => {
    if (await fs.pathExists(path.join(dir, 'pnpm-lock.yaml'))) return ['pnpm', 'add'];
    if (await fs.pathExists(path.join(dir, 'yarn.lock'))) return ['yarn', 'add'];
    if (await fs.pathExists(path.join(dir, 'bun.lock')) || await fs.pathExists(path.join(dir, 'bun.lockb'))) return ['bun', 'add'];
    return ['npm', 'install'];
};

const run = (command, args, cwd) => new Promise((resolve, reject) => {
    // npm / pnpm are .cmd shims on Windows, which only resolve through a shell.
    // Quote the args there, or cmd.exe eats the ^ in "gsap@^3.15.1"
    const windows = process.platform === 'win32';
    const child = spawn(command, windows ? args.map((a) => `"${a}"`) : args, { cwd, stdio: 'ignore', shell: windows });
    child.on('error', reject);
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${command} exited with code ${code}`))));
});

export async function add(argv) {
    let args;
    try {
        args = parseArgs({
            args: argv,
            allowPositionals: true,
            allowNegative: true,
            options: {
                all: { type: 'boolean', short: 'a' },
                list: { type: 'boolean', short: 'l' },
                overwrite: { type: 'boolean', short: 'o' },
                install: { type: 'boolean', default: true },
                help: { type: 'boolean', short: 'h' },
            },
        });
    } catch (err) {
        console.error(err.message + '\n' + HELP);
        process.exit(1);
    }
    const { values: flags, positionals: requested } = args;

    if (flags.help) {
        console.log(HELP);
        return;
    }

    const registry = await loadRegistry();
    const components = Object.entries(registry.items).filter(([name]) => !registry.base.includes(name));

    if (flags.list) {
        const width = Math.max(...components.map(([name]) => name.length));
        console.log('\nComponents:\n');
        for (const [name, item] of components) console.log(`  ${name.padEnd(width)}  ${item.description}`);
        console.log(`\nIncluded in every project: ${registry.base.join(', ')}\n`);
        return;
    }

    const cwd = process.cwd();
    const pkgPath = path.join(cwd, 'package.json');
    if (!(await fs.pathExists(pkgPath))) {
        console.error('No package.json here. Run this from your project root.');
        process.exit(1);
    }
    const pkg = await fs.readJson(pkgPath);
    const framework = detectFramework(pkg);
    if (!framework) {
        console.error('This doesn\'t look like a Next.js or React Router project (no "next" or "react-router" dependency).');
        process.exit(1);
    }

    intro(`create-lazy-init add (${framework === 'next' ? 'Next.js' : 'React'})`);

    let names = flags.all ? components.map(([name]) => name) : requested;
    if (names.length === 0) {
        names = await multiselect({
            message: 'Which components? (space to toggle, enter to confirm)',
            options: components.map(([value, item]) => ({ value, label: value, hint: item.description })),
            required: true,
        });
        if (isCancel(names)) {
            cancel('Operation canceled.');
            process.exit(1);
        }
    }

    let result;
    try {
        result = await installItems({ registry, names, framework, root: await sourceRoot(cwd), overwrite: flags.overwrite });
    } catch (err) {
        cancel(err.message);
        process.exit(1);
    }

    if (result.written.length) log.success(`Added:\n${result.written.map((f) => `  ${f}`).join('\n')}`);
    if (result.identical.length && !result.written.length) log.info('Everything was already up to date.');
    if (result.skipped.length) {
        log.warn(`Kept your existing version (it differs from the registry, use --overwrite to replace):\n${result.skipped.map((f) => `  ${f}`).join('\n')}`);
    }

    const missing = Object.entries(missingDependencies(pkg, result.dependencies)).map(([name, version]) => `${name}@${version}`);
    if (missing.length) {
        const [pm, verb] = await packageManager(cwd);
        if (flags.install) {
            const s = spinner();
            s.start(`Installing ${missing.join(' ')}...`);
            try {
                await run(pm, [verb, ...missing], cwd);
                s.stop('Installed dependencies.');
            } catch (err) {
                s.error(`Install failed (${err.message}). Run it yourself: ${pm} ${verb} ${missing.join(' ')}`);
            }
        } else {
            log.info(`Install the dependencies with:\n  ${pm} ${verb} ${missing.join(' ')}`);
        }
    }

    outro('Done.');
}
