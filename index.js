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





        {  /* HELPER FUNCTIONS */   }

    const handleCancel = (prop) => {
        if (isCancel(prop)) { cancel('Operation canceled.'); process.exit(0); }
    }

    async function createFolder(projectName, folderName) {
        const folder = path.join(process.cwd(), projectName, `${folderName}`);
        await fs.ensureDir(folder);
    };


    const checkForFramework = async (where) => {
        if (where === 'frontend') {
            const framework = await select({
                message: 'Choose your frontend framework:',
                options: [
                    { value: 'vanilla', label: 'Vanilla'},
                    { value: 'react', label: 'React'},
                    { value: 'vue', label: 'Vue'},
                    //{ value: 'angular', label: 'Angular'},
                ]
            });
            return framework;
        } else {
            const nodeFramework = await select({
                message: 'Choose your backend framework:', 
                options: [
                    { value: 'express', label: 'Express.js' },
                    //{ value: 'nestJS', label: 'NestJS' },
                    //{ value: 'django', label: 'Django' },
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
                //{ value: 'kotlin', label: 'Kotlin' },
                //{ value: 'swift', label: 'Swift' },
            ],
        });
        return language;
    };


    {/* MAIN FUNCTIONS */}

const staticBuilder = async (projectName) => {

    const framework = await checkForFramework('frontend');
    handleCancel(framework);

    const language = await checkForLanguage();
    handleCancel(language);

    let activeTemplate = framework + '-' + language;
    if (activeTemplate === 'vue-js') activeTemplate = 'vue';

    const p = progress({ max: 10 });
    p.start('Scaffolding static project...');

    p.advance(3, 'Running Vite installer...');

        if (activeTemplate.startsWith('vanilla')) {
                await fs.copy(
                    path.join(__dirname, 'templates', 'client-vanilla', `${activeTemplate}`),
                    path.join(process.cwd(), `${projectName}`)
                );
        }
        else if (activeTemplate.startsWith('react')) {
                await fs.copy(
                    path.join(__dirname, 'templates', 'client-react', `${activeTemplate}`),
                    path.join(process.cwd(), `${projectName}`)
                );
        }
        else {
            await execAsync(`npx --yes create-vite@latest "${projectName}" --template ${activeTemplate}`);
        }
    
    
    p.advance(7, 'Finalizing files...');
    p.stop('Done!');

    outro('All set up! Happy coding.');
};

const dynamicBuilder = async (projectName) => {
    const architecture = await select({
        message: 'Choose your dynamic architecture style:',
        options: [
            { value: 'split', label: 'Separate Frontend + Dedicated Node Server' },
            // 
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
            if (activeTemplate === 'vue-js') activeTemplate = 'vue';

            const nodeFramework = await checkForFramework('node');
            handleCancel(nodeFramework);
            
            const p = progress({ max: 10 });

            p.start('Building fullstack split-project...');
            
            p.advance(1, 'Creating directories...');
            await createFolder(projectName, 'server');
            
            p.advance(3, 'Scaffolding Vite frontend...');
            if (activeTemplate.startsWith('vanilla')) {
                await fs.copy(
                    path.join(__dirname, 'templates', 'client-vanilla', `${activeTemplate}`),
                    path.join(process.cwd(), `${projectName}`)
                );
            }
            else if (activeTemplate.startsWith('react')) {
                    await fs.copy(
                        path.join(__dirname, 'templates', 'client-react', `${activeTemplate}`),
                        path.join(process.cwd(), `${projectName}`)
                    );
            }
            else {
                await execAsync(`npx --yes create-vite@latest "${projectName}" --template ${activeTemplate}`);
            }
            
            p.advance(5, 'Injecting server boilerplate...');
            await fs.copy(
                path.join(__dirname, 'templates', `server-${nodeFramework}`), 
                path.join(process.cwd(), projectName, 'server')
            );
            
            p.advance(8, 'Installing backend dependencies...');
            
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
handleCancel(projectName);

const projectType = await select({
    message: 'What type will it be?',
    options: [
        { value: 'static', label: 'Static - Frontend' },
        { value: 'dynamic', label: 'Dynamic - Fullstack' },
        //{ value: 'api', label: 'API-only - Backend'}
    ]
});
handleCancel(projectType);

switch (projectType) {
    case 'static': 
        await staticBuilder(projectName);
        break;
    case 'dynamic':
        await dynamicBuilder(projectName);
        break;

    // api
};