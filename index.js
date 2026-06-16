#!/usr/bin/env node

import { intro, text, select, outro, isCancel, cancel, progress } from '@clack/prompts';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const checkForFramework = async (where) => {
    if (where === 'frontend') {
         const framework = await select({
            message: 'Choose your frontend framework:',
            options: [
                { value: 'vanilla', label: 'Vanilla'},
                { value: 'react', label: 'React'},
                { value: 'vue', label: 'Vue'}
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
        message: 'What language will be used?',
        options: [
            { value: 'js', label: 'JavaScript' },
            { value: 'ts', label: 'TypeScript' },
        ],
    });
    return language;
};

async function createServerFolder(projectName) {
    const serverFolder = path.join(process.cwd(), projectName, 'server');
    await fs.ensureDir(serverFolder);
};

const staticBuilder = async (projectName) => {
    const framework = await checkForFramework('frontend');
    if (isCancel(framework)) { cancel('Operation canceled.'); process.exit(0); }

    const language = await checkForLanguage();
    if (isCancel(language)) { cancel('Operation canceled.'); process.exit(0); }

    let activeTemplate = framework + '-' + language;
    if (activeTemplate === 'react-js') activeTemplate = 'react';
    if (activeTemplate === 'vue-js') activeTemplate = 'vue';
    if (activeTemplate === 'vanilla-js') activeTemplate = 'vanilla';

    const p = progress({ max: 10 });
    p.start('Scaffolding static project...');
    
    p.advance(3, 'Running Vite installer...');
    await execAsync(`npm create vite@latest "${projectName}" -- --template ${activeTemplate}`);
    
    p.advance(7, 'Finalizing files...');
    p.stop('Done!');

    outro('All set up! Happy coding.');
};

const dynamicBuilder = async (projectName) => {
    const architecture = await select({
        message: 'Choose your dynamic architecture style:',
        options: [
            { value: 'split', label: 'Separate Frontend + Dedicated Node Server' }
        ]
    });
    if (isCancel(architecture)) { cancel('Operation canceled.'); process.exit(0); }

    if (architecture === 'split') {
        try {
            const framework = await checkForFramework('frontend');
            if (isCancel(framework)) { cancel('Operation canceled.'); process.exit(0); }

            const language = await checkForLanguage();
            if (isCancel(language)) { cancel('Operation canceled.'); process.exit(0); }
            
            let activeTemplate = framework + '-' + language;
            if (activeTemplate === 'react-js') activeTemplate = 'react';
            if (activeTemplate === 'vue-js') activeTemplate = 'vue';
            if (activeTemplate === 'vanilla-js') activeTemplate = 'vanilla';

            const nodeFramework = await checkForFramework('node');
            if (isCancel(nodeFramework)) { cancel('Operation canceled.'); process.exit(0); }
            
            const p = progress({ max: 10 });

            p.start('Building fullstack split-project...');
            
            p.advance(1, 'Creating directories...');
            await createServerFolder(projectName);
            
            p.advance(3, 'Scaffolding Vite frontend...');
            await execAsync(`npm create vite@latest client -- --template ${activeTemplate}`, { 
                cwd: path.join(process.cwd(), projectName) 
            });
            
            p.advance(5, 'Injecting server boilerplate...');
            await fs.copy(
                path.join(__dirname, 'templates', `server-${nodeFramework}`), 
                path.join(process.cwd(), projectName, 'server')
            );
            
            p.advance(8, 'Installing backend dependencies...');
            await execAsync(`npm i ${nodeFramework}`, { 
                cwd: path.join(process.cwd(), projectName, 'server') 
            });
            
            p.stop('Project generated successfully!');
            outro('Your backend and frontend environments are ready.');
        }
        catch (err) {
            console.error('\nAn error occurred during build:', err);
        }
    }
}

intro('Lazy Init');

const projectName = await text({ message: 'What is the project called?' }); 
if (isCancel(projectName)) { cancel('Operation canceled.'); process.exit(0); }

const projectType = await select({
    message: 'What type will it be?',
    options: [
        { value: 'static', label: 'Static - Frontend' },
        { value: 'dynamic', label: 'Dynamic - Fullstack' }
    ]
});
if (isCancel(projectType)) { cancel('Operation canceled.'); process.exit(0); }

switch (projectType) {
    case 'static': 
        await staticBuilder(projectName);
        break;
    case 'dynamic':
        await dynamicBuilder(projectName);
        break;
};