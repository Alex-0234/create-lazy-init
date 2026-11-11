#!/usr/bin/env node

const [command, ...rest] = process.argv.slice(2);

if (command === 'add') {
    const { add } = await import('./cli/add.js');
    await add(rest);
} else {
    const { create } = await import('./cli/create.js');
    await create(process.argv.slice(2));
}
