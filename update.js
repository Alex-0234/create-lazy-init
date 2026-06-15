import fs from 'fs-extra'
import path from 'path'
import { intro, outro, text, select } from '@clack/prompts'

const hasPackageJson = fs.pathExists(path.join(process.cwd(), 'package.json'));

if (!hasPackageJson) {
    console.error("Error: No package.json found.");
}

intro('lazy-update')

const addThis = await select({
    message: 'What would you like to add?',
    options: [
        { value: 'db', label: 'Database'},
        { value: 'idk', label: 'test'}
    ]
});

outro(`Selected ${addThis}`);