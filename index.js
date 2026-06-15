import { intro, text, select, outro, isCancel, cancel, progress, tasks } from '@clack/prompts'
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs-extra';

const execAsync = promisify(exec);

/* STATIC */
const staticBuilder = async () => {

    
    const framework = await select({
    message: 'Choose your frontend framework:',
    options: [
        { value: 'react', label: 'React'},
        { value: 'vue', label: 'Vue'}
    ]
    });

    if (isCancel(framework)) {
        cancel('Operation canceled.');
        process.exit(0);
    }

    const language = await select({
        message: 'What language will be used?',
        options: [
            { value: 'js', label: 'JavaScript' },
            { value: 'ts', label: 'TypeScript' },
        ],
    });

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
    const p = progress({max: 10});

    p.start('.')
    p.advance(3, '..');
    await execAsync(`npm create vite@latest "${projectName}" -- --template ${activeTemplate}`);
    p.advance(7, '...');
    p.stop('done');

    outro('All done');
};




/* DYNAMIC */
const dynamicBuilder = async () => {

    const architecture = await select({
        message: 'Choose your dynamic architecture style:',
        options: [
            { value: 'ssr', label: 'Full-stack Meta-Framework (SSR)' },
            { value: 'split', label: 'Separate Frontend + Dedicated Node Server' }
        ]
    });
    if (isCancel(architecture)) {
        cancel('Operation canceled.');
        process.exit(0);
    }

    if (architecture === 'split') {

        const framework = await select({
        message: 'Choose your frontend framework:',
        options: [
            { value: 'react', label: 'React'},
            { value: 'vue', label: 'Vue'}
        ]
        });
        if (isCancel(framework)) {
            cancel('Operation canceled.');
            process.exit(0);
        }

        const language = await select({
            message: 'What language will be used?',
            options: [
                { value: 'js', label: 'JavaScript' },
                { value: 'ts', label: 'TypeScript' },
            ],
        });

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
        const p = progress({max: 10});

        p.start('.')
        p.advance(3, '..');
        await execAsync(`npm create vite@latest "${projectName}" -- --template ${activeTemplate}`);
        p.advance(7, '...');
        p.stop('done');

        outro('All done');
    }

  

   
}

intro('Lazy Init');

const projectName = await text({ message: 'What is the projects called?'}); 

if (isCancel(projectName)){
    cancel('Operation canceled.');
    process.exit(0);
}

const projectType = await select({
    message: 'What type will it be?',
    options: [
        { value: 'static', label: 'Static - Frontend'},
        { value: 'dynamic', label: 'Dynamic - Fullstack'},
        { value: 'api', label: 'API - Backend'}
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
