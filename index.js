#!/usr/bin/env node

import { intro, text, select, outro, isCancel, cancel, progress, tasks } from '@clack/prompts'
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs-extra';

const execAsync = promisify(exec);

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
    }
    else {
        const nodeFramework = await select({
            message: 'What language will be used?',
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
    return language
};

async function createServerFolder(projectName) {
    const serverFolder = path.join(process.cwd(), projectName, 'server');

    try {
        await fs.ensureDir(serverFolder);
    } catch (error) {
        console.error('Error creating folder:', error);
    }
};

const staticBuilder = async () => {

    
    const framework = await checkForFramework('frontend');

    if (isCancel(framework)) {
        cancel('Operation canceled.');
        process.exit(0);
    }

    const language = await checkForLanguage();

    if (isCancel(language)) {
        cancel('Operation canceled.');
        process.exit(0);
    }

    let activeTemplate = framework + '-' + language;

    if (activeTemplate === 'react-js') {
        activeTemplate = 'react';
    }
    else if (activeTemplate === 'vue-js') {
        activeTemplate = 'vue'
    }
    else if (activeTemplate === 'vanilla-js') {
        activeTemplate = 'vanilla';
    }
    const p = progress({max: 10});

    p.start('.')
    p.advance(3, 'Using vite template...');
    await execAsync(`npm create vite@latest "${projectName}" -- --template ${activeTemplate}`);
    p.advance(7, '...');
    p.stop('done');

    outro('All done');
};




const dynamicBuilder = async () => {

    const architecture = await select({
        message: 'Choose your dynamic architecture style:',
        options: [
            //{ value: 'ssr', label: 'Full-stack Meta-Framework (SSR)' },
            { value: 'split', label: 'Separate Frontend + Dedicated Node Server' }
        ]
    });
    if (isCancel(architecture)) {
        cancel('Operation canceled.');
        process.exit(0);
    }

    if (architecture === 'split') {

        const framework = await checkForFramework('frontend')

        if (isCancel(framework)) {
            cancel('Operation canceled.');
            process.exit(0);
        }

        const language = await checkForLanguage();

        if (isCancel(language)) {
        cancel('Operation canceled.');
        process.exit(0);
        }
        
        let activeTemplate = framework + '-' + language;

        if (activeTemplate === 'react-js') {
            activeTemplate = 'react';
        }
        else if (activeTemplate === 'vue-js') {
            activeTemplate = 'vue'
        }
        else if (activeTemplate === 'vanilla-js') {
            activeTemplate = 'vanilla';
        }

        const nodeFramework = await checkForFramework('node');

        if (isCancel(nodeFramework)) {
            cancel('Operation canceled.');
            process.exit(0);
        }
        
        const p = progress({max: 10});
        const clientFolder = path.join(process.cwd(), `${projectName}/client`)
        console.log(clientFolder);

        p.start('.')
        p.advance(1, 'Making a project folder.');
        await createServerFolder(projectName);
        p.advance(3, 'Using vite template...');
        await execAsync(`npm create vite@latest client -- --template ${activeTemplate}`, {cwd: path.join(process.cwd(), `${projectName}`)});
        p.advance(5, 'Making the server file.');
        await fs.copy(`templates/server-${nodeFramework}`, path.join(process.cwd(), `${projectName}/server`));
        p.advance(8, 'Installing the dependencies.');
        await execAsync(`npm i ${nodeFramework}`, {cwd: path.join(process.cwd(), `${projectName}/server`)});
        p.stop('done');

        outro('All done');
    }

  

   
}


intro('Lazy Init');

const projectName = await text({ message: 'What is the project called?'}); 

if (isCancel(projectName)){
    cancel('Operation canceled.');
    process.exit(0);
}

const projectType = await select({
    message: 'What type will it be?',
    options: [
        { value: 'static', label: 'Static - Frontend'},
        { value: 'dynamic', label: 'Dynamic - Fullstack'},
        //{ value: 'api', label: 'API - Backend'}
    ]
});
if (isCancel(projectType)){
    cancel('Operation canceled.');
    process.exit(0);
}

switch (projectType) {
    case 'static': 
        staticBuilder();
        break;
    case 'dynamic':
        dynamicBuilder();
        break;
    case 'api':
        apiBuilder();
        break;
};



/* 
const targetDir = path.join(process.cwd(), projectName);


let activeTemplate = null;

if (language === 'js' && framework === 'react') {
    activeTemplate = 'react';
}
else if (language === 'ts' && framework === 'react') {
    activeTemplate = 'react-ts';
}
else if (language === 'js' && framework === 'vue') {
    activeTemplate = 'vue';
}
else if (language === 'js' && framework === 'vue') {
    activeTemplate = 'vue-ts';
}
else {
    activeTemplate = false;
}
if (activeTemplate) {

const activeTasks = await tasks([
    {
    title: 'Installing via npm',
    task: async (message) => {
      // Do installation here
      execSync(`npm create vite@latest "${projectName}" -- --template ${activeTemplate}`);
      return 'Installed via npm';
    },
  },
])

outro('All done');

// await fs.outputFile('./idk', `${language}`);

}
 */
