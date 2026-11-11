import path from 'node:path';
import fs from 'fs-extra';
import { fileURLToPath } from 'node:url';

export const REGISTRY_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'registry');

export const FRAMEWORKS = ['next', 'react'];

export const loadRegistry = () => fs.readJson(path.join(REGISTRY_DIR, 'registry.json'));

export const detectFramework = (pkg) => {
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    if (deps.next) return 'next';
    if (deps['react-router']) return 'react';
    return null;
};

// components resolve `@/…` to src/ when the project has one (both templates do)
export const sourceRoot = async (projectDir) => {
    const src = path.join(projectDir, 'src');
    return (await fs.pathExists(src)) ? src : projectDir;
};

const filesFor = (item, framework) =>
    Array.isArray(item.files) ? item.files : (item.files?.[framework] ?? []);

/** Returns the requested items plus everything they depend on, dependencies first. */
export const resolveItems = (registry, names) => {
    const ordered = [];
    const seen = new Set();

    const visit = (name, trail) => {
        if (seen.has(name)) return;
        const item = registry.items[name];
        if (!item) {
            const via = trail.length ? ` (needed by ${trail.at(-1)})` : '';
            throw new Error(`Unknown component "${name}"${via}. Run "create-lazy-init add --list" to see them all.`);
        }
        seen.add(name);
        for (const dep of item.registryDependencies ?? []) visit(dep, [...trail, name]);
        ordered.push(name);
    };

    for (const name of names) visit(name, []);
    return ordered;
};

/**
 * Copies the items' files into `root`. Existing files that differ are left alone
 * unless `overwrite` is set, so `add` never clobbers your edits by accident.
 */
export const installItems = async ({ registry, names, framework, root, overwrite = false }) => {
    const result = { items: resolveItems(registry, names), written: [], identical: [], skipped: [], dependencies: {} };

    for (const name of result.items) {
        const item = registry.items[name];
        Object.assign(result.dependencies, item.dependencies);

        for (const file of filesFor(item, framework)) {
            const frameworkSource = path.join(REGISTRY_DIR, framework, file);
            const source = (await fs.pathExists(frameworkSource))
                ? frameworkSource
                : path.join(REGISTRY_DIR, 'shared', file);
            const target = path.join(root, file);
            const content = await fs.readFile(source, 'utf8');

            if (await fs.pathExists(target)) {
                const current = await fs.readFile(target, 'utf8');
                if (current.replace(/\r\n/g, '\n') === content) {
                    result.identical.push(file);
                    continue;
                }
                if (!overwrite) {
                    result.skipped.push(file);
                    continue;
                }
            }

            await fs.outputFile(target, content);
            result.written.push(file);
        }
    }

    return result;
};

/** The dependencies from `wanted` that package.json doesn't list yet. */
export const missingDependencies = (pkg, wanted) => {
    const present = { ...pkg.dependencies, ...pkg.devDependencies };
    return Object.fromEntries(Object.entries(wanted).filter(([name]) => !present[name]));
};

export const sortKeys = (obj) => Object.fromEntries(Object.entries(obj).sort(([a], [b]) => a.localeCompare(b)));
