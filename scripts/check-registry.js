// Validates registry/registry.json against the files on disk:
//  - every listed file exists (per framework)
//  - every `@/…` import is provided by the item itself or its registryDependencies
//  - every npm package imported is declared in the item's dependencies (or ships with the template)
//  - no file in registry/ is left out of every item
import path from 'node:path';
import fs from 'fs-extra';
import { REGISTRY_DIR, FRAMEWORKS, loadRegistry, resolveItems } from '../cli/registry.js';

// packages every registry-based template already depends on
const PROVIDED = { next: ['react', 'react-dom', 'next'], react: ['react', 'react-dom', 'react-router'] };

const registry = await loadRegistry();
const errors = [];
const used = new Set();

const filesFor = (item, fw) => (Array.isArray(item.files) ? item.files : (item.files?.[fw] ?? []));
const stripExt = (p) => p.replace(/\.(tsx?|jsx?)$/, '');
const packageOf = (spec) => (spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0]);

for (const name of registry.base) {
    if (!registry.items[name]) errors.push(`base: unknown item "${name}"`);
}

for (const fw of FRAMEWORKS) {
    for (const [name, item] of Object.entries(registry.items)) {
        let closure;
        try {
            closure = resolveItems(registry, [name]);
        } catch (err) {
            errors.push(`${name}: ${err.message}`);
            continue;
        }

        const provided = new Set();
        const deps = new Set(PROVIDED[fw]);
        for (const dep of closure) {
            for (const file of filesFor(registry.items[dep], fw)) provided.add(stripExt(file));
            for (const pkg of Object.keys(registry.items[dep].dependencies ?? {})) deps.add(pkg);
        }

        for (const file of filesFor(item, fw)) {
            const candidates = [path.join(REGISTRY_DIR, fw, file), path.join(REGISTRY_DIR, 'shared', file)];
            const source = candidates.find((c) => fs.existsSync(c));
            if (!source) {
                errors.push(`${name} (${fw}): missing file ${file}`);
                continue;
            }
            used.add(path.relative(REGISTRY_DIR, source).replace(/\\/g, '/'));

            const code = await fs.readFile(source, 'utf8');
            for (const [, spec] of code.matchAll(/(?:from|import)\s+['"]([^'"]+)['"]/g)) {
                if (spec.startsWith('@/')) {
                    if (!provided.has(spec.slice(2))) errors.push(`${name} (${fw}): ${file} imports ${spec}, which no registryDependency provides`);
                } else if (spec.startsWith('.')) {
                    const target = stripExt(path.posix.join(path.posix.dirname(file), spec));
                    if (!provided.has(target)) errors.push(`${name} (${fw}): ${file} imports ${spec}, which isn't in the item`);
                } else if (!spec.startsWith('node:') && !deps.has(packageOf(spec))) {
                    errors.push(`${name} (${fw}): ${file} imports "${spec}" but "${packageOf(spec)}" isn't in its dependencies`);
                }
            }
        }
    }
}

for (const file of await fs.readdir(REGISTRY_DIR, { recursive: true })) {
    const rel = file.replace(/\\/g, '/');
    if (rel === 'registry.json' || !/\.(tsx?|jsx?|css)$/.test(rel)) continue;
    if (!used.has(rel)) errors.push(`registry/${rel} isn't listed in any item`);
}

if (errors.length) {
    console.error(`Registry check failed:\n${errors.map((e) => `  - ${e}`).join('\n')}`);
    process.exit(1);
}
console.log(`Registry OK: ${Object.keys(registry.items).length} items, ${used.size} files.`);
