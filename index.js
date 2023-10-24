#!/usr/bin/env node

import inquirer from 'inquirer';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { readFileSync } from 'fs';
import { join } from 'path';
import ora from 'ora';
import { fileURLToPath } from 'url';
import { spawn, execSync } from 'child_process';
import os from 'os';


// get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// TODO script templates, let user's also save their template and add custom templates
// TODO help command

const scriptTypes = [
    { name: 'User Event', value: 'ue' },
    { name: 'Client Script', value: 'cs' },
    { name: 'Suitelet', value: 'sl' },
    { name: 'Map/Reduce', value: 'mr' },
    { name: 'Scheduled Script', value: 'ss' },
    { name: 'RESTlet', value: 'rl' },
    { name: 'Portlet', value: 'plet' },
    { name: 'Mass Update', value: 'mu' },
    { name: 'Workflow Action', value: 'wfa' }
];

const scriptTypesMap = new Map([
    ['User Event', ['beforeLoad()', 'beforeSubmit()', 'afterSubmit()']],
    ['Client Script', ['fieldChanged()', 'lineInit()', 'pageInit()', 'postSourcing()', 'saveRecord()', 'sublistChanged()', 'validateDelete()', 'validateField()', 'validateInsert()', 'validateLine()', 'localizationContextEnter()', 'localizationContextExit()']],
    ['Suitelet', ['Base']],
    ['Map/Reduce', ['Base']],
    ['Scheduled Script', ['execute()']],
    ['RESTlet', ['get()', 'post()', 'put()', 'delete()', 'patch()', 'head()']],
    ['Portlet', ['render()']],
    ['Mass Update', ['each()']],
    ['Workflow Action', ['onAction()']],
]);
const multipleSelectionTypes = ['Client Script', 'User Event', 'RESTlet'];

const [,, command, ...args] = process.argv;

function updateWebpackConfig(fileName, folderPath, projectPath = '') {
    const webpackConfigPath = path.join(projectPath, 'webpack-entry-config.json');
    let configContent;
 
    // check if webpackConfigPath exists and is not an empty file
    if (fs.existsSync(webpackConfigPath) && fs.statSync(webpackConfigPath).size > 0) {
        try {
            configContent = JSON.parse(fs.readFileSync(webpackConfigPath, 'utf8'));
        } catch (error) {
            console.error('Error parsing webpack-entry-config.json:', error);
            configContent = {};
        }
    } else {
        configContent = {};
    }

    const file = [fileName.replace('.ts', '')].join('_');
    
    // using folderPath if provided, otherwise just using fileName
    const entryKey = folderPath ? `${folderPath}/${file}` : file;
    configContent[entryKey] = `./src/TypeScript/${file}.ts`;
    
    fs.writeFileSync(webpackConfigPath, JSON.stringify(configContent, null, 4), 'utf8');
    console.log(`webpack-entry-config.json updated successfully.`);
}


switch (command) {
    case 'create':
        const userConfigPath = join(__dirname, 'userConfig.json');
        let userConfig;
        let filePrefix;
        let filenameFormat;

        if (fs.existsSync(userConfigPath)) {
            userConfig = JSON.parse(readFileSync(userConfigPath, 'utf8'));
            filePrefix = userConfig.filePrefix;
            filenameFormat = userConfig.filenameFormat || "{prefix}_{scriptType}_{projectName}";
        }

        if (!filePrefix) {
            inquirer.prompt([
                {
                    type: 'input',
                    name: 'filePrefix',
                    message: 'Please enter a prefix for file names:',
                    validate: (input) => {
                        if (!input.trim()) {
                            return "The prefix cannot be empty";
                        }
                        return true;
                    }
                }
            ])
            .then((answers) => {
                filePrefix = answers.filePrefix;
                fs.writeFileSync(userConfigPath, JSON.stringify({ filePrefix }, null, 4));
                promptForProjectDetails();
            });
        } else {
            promptForProjectDetails();
        }

        function promptForProjectDetails() {
            inquirer.prompt([
                {
                    type: 'list',
                    name: 'scriptType',
                    message: 'Please select the script type:',
                    choices: scriptTypes,
                },
                {
                    type: 'input',
                    name: 'projectName',
                    message: 'Please enter the project name:',
                },
                {
                    type: 'input',
                    name: 'folderPath',
                    message: 'Please enter the folder path for FileCabinet (leave empty for root):',
                }
            ])
            .then(async (answers) => {
                const { projectName, scriptType, folderPath } = answers;
                let fileName = formatFilename(filenameFormat, filePrefix, scriptType, projectName);
        
                const confirmAnswer = await inquirer.prompt([
                    {
                        type: 'confirm',
                        name: 'confirmFileName',
                        message: `The file will be named: ${chalk.yellow(fileName)}. Do you want to proceed?`,
                    }
                ]);
        
                if (confirmAnswer.confirmFileName) {
                    const projectPath = createProjectStructure(projectName, fileName);
                    updateWebpackConfig(fileName, folderPath, projectPath);
                } else {
                    const customFileNameAnswer = await inquirer.prompt([
                        {
                            type: 'input',
                            name: 'customFileName',
                            message: 'Please enter a custom file name:',
                            validate: input => input.match(/^[a-zA-Z-_]+(\.ts)?$/) !== null || "Filename cannot be empty and should only contain letters, hyphens, underscores, and optionally end with .ts!"
                        }
                    ]);
        
                    fileName = customFileNameAnswer.customFileName;
        
                    // continue with project creation with customFileName
                    const projectPath = createProjectStructure(projectName, fileName);
                    updateWebpackConfig(fileName, folderPath, projectPath);
                }
                if (os.platform() === 'win32') {
                    execSync(`cd "${projectName}" && npm install`, { stdio: 'inherit' });
                } else {
                    execSync(`cd "${projectName}" && curl -fsSL https://bun.sh/install | bash && bun install`, { stdio: 'inherit' });
                }
            });
        }
        
        function formatFilename(filenameFormat, filePrefix, scriptType, str) {
            // process str: replace '-' with '_' and remove any '.ts' suffix
            str = str.replace(/-|\.ts$/g, function(match) {
                if (match === '.ts') return '';
                if (match === '-') return '_';
            });
        
            const replacements = {
                '{prefix}': filePrefix,
                '{projectName}': str.toLowerCase().replace(/\s+/g, '_'),
                '{scriptType}': scriptType
            };
        
            let filename = filenameFormat;
            for (const [placeholder, value] of Object.entries(replacements)) {
                filename = filename.replace(new RegExp(placeholder, 'g'), value);
            }
        
            return filename + '.ts';
        }
        
        break;

    case 'newfile':
        inquirer.prompt([
                {
                    type: 'input',
                    name: 'fileName',
                    message: 'Please enter the filename:',
                    validate: input => input.match(/^[a-zA-Z0-9-_]+$/) !== null || "Only alphanumeric, - and _ allowed in filenames!"
                },
                {
                    type: 'input',
                    name: 'folderPath',
                    message: 'Please enter the folder path (leave empty for root):'
                }
            ])
            .then((answers) => {
                const { fileName, folderPath } = answers;
                createNewFile(fileName);
                updateWebpackConfig(fileName, folderPath);
            });

            function createNewFile(fileName, folderPath = '') {
                const tsFilePath = path.join(process.cwd(), 'src', 'TypeScript', folderPath, `${fileName}.ts`);
                fs.mkdirSync(path.dirname(tsFilePath), { recursive: true });  // ensure the directory exists
                fs.writeFileSync(tsFilePath, '// Your TypeScript code here', 'utf8');
                console.log(`File ${chalk.green.bold(`${fileName}.ts`)} created successfully.`);
            }
        break;
        
    case 'build':
        const webpackConfigPath = path.join(process.cwd(), 'webpack-entry-config.json');
        if (fs.existsSync(webpackConfigPath)) {
            const configContent = JSON.parse(fs.readFileSync(webpackConfigPath, 'utf8'));
            const entryPaths = Object.keys(configContent).map(key => {
                const pathComponents = key.split('/');
                const fileName = pathComponents.pop() + '.js';
                const path = pathComponents.join('/') + (pathComponents.length > 0 ? '/' : '');
                return {
                    name: `${path}${chalk.bold(fileName)}`,
                    value: `${key}.js`,
                };
            });

            inquirer.prompt([{
                type: 'checkbox',
                name: 'buildPaths',
                message: 'Please select the path(s) to build:',
                choices: entryPaths,
            }])
            .then(async (answers) => {
                const { buildPaths } = answers;

                if (buildPaths.length === 0) {
                    console.log(chalk.yellow('No paths selected. Please select at least one path to proceed.'));
                    return; // exit if no paths were selected
                }

                const safePaths = buildPaths.map(p => `/SuiteScripts/${p.replace(/(["\s'$`\\])/g, '\\$1')}`);

                try {
                    const projectConfig = JSON.parse(fs.readFileSync('./project.json', 'utf8'));
                    if (typeof projectConfig !== 'object' || !projectConfig.defaultAuthId) {
                        throw new Error("Invalid project configuration or missing defaultAuthId.");
                    }
                    const authId = projectConfig.defaultAuthId;
                
                    const uploadConfirmation = await inquirer.prompt([{
                        type: 'confirm',
                        name: 'shouldContinue',
                        message: `The file will be uploaded using the account ${chalk.yellow(authId)}. Do you want to continue?`,
                        default: false
                    }]);
                
                    if (!uploadConfirmation.shouldContinue) {
                        console.log('Upload cancelled by user.');
                        return;
                    }
                
                    const toolkit = process.argv[3] === 'bun' ? 'bun' : 'npm';
                    execSync(`${toolkit} run build`, { stdio: 'inherit' })
                    execSync(`suitecloud file:upload --paths ${safePaths.join(' ')}`, { stdio: 'inherit' });
                
                    console.log(`${chalk.green('Upload complete!')}`);
                } catch (e) {
                    if (e.message.includes("Invalid project configuration or missing defaultAuthId")) {
                        console.error(`${chalk.red(e.message)}`);
                    } else {
                        console.error(`${chalk.red('No account connected.')} Run ${chalk.magenta.bold('suitecloud account:setup -i')}`);
                    }
                }
            });
        } else {
            console.error("webpack-entry-config.json does not exist or is not readable.");
        }
        break;

    case 'template':
        inquirer.prompt([
            {
                type: 'list',
                name: 'scriptType',
                message: 'Please select the script type:',
                choices: Array.from(scriptTypesMap.keys()),
            }
        ]).then(answers => {
            const { scriptType } = answers;
            const subTypes = scriptTypesMap.get(scriptType);
            
            if (subTypes && subTypes.length > 0) {
                let message = `Select the ${scriptType} function(s) to add:`;
                let promptType = 'list';
            
                if (multipleSelectionTypes.includes(scriptType)) {
                    message = `Select the ${scriptType} functions to add:`;
                    promptType = 'checkbox';
                }

                inquirer.prompt([
                    {
                        type: promptType,
                        name: 'subTypes',
                        message: message,
                        choices: subTypes,
                    }
                ]).then(subAnswers => {
                    const selectedFunctions = Array.isArray(subAnswers.subTypes) ? subAnswers.subTypes : [subAnswers.subTypes];
                    promptForTargetFile(scriptType, selectedFunctions);
                });
            } else {
                promptForTargetFile(scriptType);
            }
        });
        break;

                
    case 'authid':
        const newAuthId = args[0];
        const projectPath = path.join(process.cwd(), 'project.json'); // define the path to the project.json file

        if (fs.existsSync(projectPath)) {
            const projectConfigData = fs.readFileSync(projectPath, 'utf8');
            const projectConfig = JSON.parse(projectConfigData);

            if (newAuthId) {
                
                if (oldAuthId === newAuthId) {
                    console.log(`authID remains ${chalk.green(oldAuthId)}. No change was made.`);
                    process.exit(0);
                }

                projectConfig.defaultAuthId = newAuthId;

                fs.writeFileSync(projectPath, JSON.stringify(projectConfig, null, 4), 'utf8');
                
                console.log(`authID ${chalk.red(oldAuthId)} was swapped out for ${chalk.green(newAuthId)}`);
            } else {
                console.log(`Current authID: ${chalk.hex('#FFAF53').bold(projectConfig.defaultAuthId)}`);
            }
        } else {
            console.error("project.json does not exist or is not readable.");
            process.exit(1);
        }
        break;

    case 'setup':
        setupMenu();
        break;

    case 'help':
        displayHelp();
        break;

    default:
        console.log(`Unknown command: ${command}`);
        break;
}

export function createProjectStructure(projectName, fileName) {
    const rootDir = path.join(process.cwd(), projectName);
    const paths = [
        'src/FileCabinet/SuiteScripts',
        'src/TypeScript',
        'vscode',
    ];
    const files = [
        'src/deploy.xml',
        'src/manifest.xml',
        'vscode/settings.json',
        '.eslintignore',
        '.eslintrc.json',
        '.gitignore',
        'gulpfile.js',
        'package.json',
        'project.json',
        'projectconfig.js',
        'README.md',
        'suitecloud.config.js',
        'tsconfig.json',
        'webpack-entry-config.json',
        'webpack.config.js',
    ];

    // creating directories
    paths.forEach(p => fs.mkdirSync(path.join(rootDir, p), { recursive: true }));

    // creating files
    files.forEach(f => {
        const templatePath = path.join(__dirname, 'templates', f);
        let content = '';
        if (fs.existsSync(templatePath)) {
            content = fs.readFileSync(templatePath, 'utf8');
            content = content.replace(/%%PROJECT_NAME%%/g, projectName);
            content = content.replace(/%%FILE_NAME%%/g, fileName.replace('.ts', ''));
        }
        fs.writeFileSync(path.join(rootDir, f), content, 'utf8');
    });
    
    if (!fileName.endsWith('.ts')) { fileName += '.ts'; }
    const tsFilePath = path.join(rootDir, 'src', 'TypeScript', `${fileName}`);
    fs.mkdirSync(path.dirname(tsFilePath), { recursive: true });  // ensure the directory exists
    fs.writeFileSync(tsFilePath, '// run \'nst template\' to jump start your project', 'utf8');

    console.log(`Project ${projectName} created successfully.`);
    return rootDir;  // return the created project path
}

function isValidFileName(fileName) {
    const regex = /^[a-z_]+(?:\.ts)?$/; // regular expression: allows only lowercase a-z, _, and ., and must end with .ts
    return regex.test(fileName);
}

// --------------------------------------------------------------------------------------------------
//  Setup Menu
// --------------------------------------------------------------------------------------------------
async function setupMenu() {
    const userConfigPath = path.join(__dirname, 'userConfig.json');
    let userConfig = {};
    
    // Read the user configuration if it exists
    if (fs.existsSync(userConfigPath)) {
        userConfig = JSON.parse(fs.readFileSync(userConfigPath, 'utf8'));
    }
    
    let isRunning = true;

    while (isRunning) {
        const choices = [
            `Set Prefix ${chalk.grey(`${userConfig.filePrefix || 'Not set'}`)}`,
            `Modify Filename Format ${chalk.grey(`${userConfig.filenameFormat || 'Not set'}`)}`,
            `Modify Username ${chalk.grey(`${userConfig.username || 'Not set'}`)}`,
            `Modify Company ${chalk.grey(`${userConfig.company || 'Not set'}`)}`,
            'Cancel'
        ];

        const answers = await inquirer.prompt([
            {
                type: 'list',
                name: 'setupOption',
                message: 'Please choose an option:',
                choices: choices,
            }
        ]);

        switch (answers.setupOption) {
            case choices[0]:  // Based on the choices array
                await setPrefix();
                break;

            case choices[1]:
                await modifyFilenameFormat();
                break;
            
            case choices[2]:
                await modifyUsername();
                break;
            
            case choices[3]:
                await modifyCompany();
                break;

            case 'Cancel':
                isRunning = false;
                break;
        }
    }
}


async function setPrefix() {
    const answers = await inquirer.prompt([
        {
            type: 'input',
            name: 'filePrefix',
            message: 'Enter a new file prefix:',
            validate: input => !!input || "Prefix cannot be empty!"
        }
    ]);

    const userConfigPath = path.join(__dirname, 'userConfig.json');
    let userConfig = {};

    if (fs.existsSync(userConfigPath)) {
        userConfig = JSON.parse(fs.readFileSync(userConfigPath, 'utf8'));
    }

    userConfig.filePrefix = answers.filePrefix;

    fs.writeFileSync(userConfigPath, JSON.stringify(userConfig, null, 4), 'utf8');
    console.log(`Prefix set to: ${answers.filePrefix}`);
}

async function modifyFilenameFormat() {
    const userConfigPath = path.join(__dirname, 'userConfig.json');
    let userConfig = {};

    if (fs.existsSync(userConfigPath)) {
        userConfig = JSON.parse(fs.readFileSync(userConfigPath, 'utf8'));
    }

    const currentFormat = userConfig.filenameFormat || '{prefix}_{scriptType}_{projectName}';
    console.log(`Current Filename Format: ${chalk.hex('#FFAF53').bold(currentFormat)}`);

    const answers = await inquirer.prompt([
        {
            type: 'input',
            name: 'newFilenameFormat',
            message: `Enter a new filename format (use ${chalk.yellow('{prefix}')}, ${chalk.yellow('{scriptType}')}, and ${chalk.yellow('{projectName}')} as placeholders):`,
            validate: input => {
                const placeholders = ['{prefix}', '{scriptType}', '{projectName}'];
                return placeholders.every(ph => input.includes(ph)) || "Must include all placeholders: {prefix}, {projectName}, {scriptType}";
            }
        }
    ]);

    userConfig.filenameFormat = answers.newFilenameFormat;
    fs.writeFileSync(userConfigPath, JSON.stringify(userConfig, null, 4), 'utf8');
    console.log(`Filename format updated to: ${chalk.green.bold(answers.newFilenameFormat)}`);
}

async function modifyUsername() {
    const answers = await inquirer.prompt([
        {
            type: 'input',
            name: 'username',
            message: 'Enter your full name:',
            validate: input => input === "" || input.match(/^[a-zA-Z0-9-_ ]+$/) !== null || "Only alphanumeric, spaces, hyphens, and underscores allowed!"
        }
    ]);
    const userConfigPath = path.join(__dirname, 'userConfig.json');
    let userConfig = {};

    if (fs.existsSync(userConfigPath)) {
        userConfig = JSON.parse(fs.readFileSync(userConfigPath, 'utf8'));
    }
    
    userConfig.username = answers.username;

    fs.writeFileSync(userConfigPath, JSON.stringify(userConfig, null, 4), 'utf8');
    console.log(`Username set to: ${answers.username}`);
}

async function modifyCompany() {
    const answers = await inquirer.prompt([
        {
            type: 'input',
            name: 'company',
            message: 'Enter the name of your company:',
            validate: input => input === "" || input.match(/^[a-zA-Z0-9-_ ]+$/) !== null || "Only alphanumeric, spaces, hyphens, and underscores allowed!"
        }
    ]);
    const userConfigPath = path.join(__dirname, 'userConfig.json');
    let userConfig = {};

    if (fs.existsSync(userConfigPath)) {
        userConfig = JSON.parse(fs.readFileSync(userConfigPath, 'utf8'));
    }
    
    userConfig.company = answers.company;

    fs.writeFileSync(userConfigPath, JSON.stringify(userConfig, null, 4), 'utf8');
    console.log(`Company set to: ${answers.company}`);
}

// --------------------------------------------------------------------------------------------------
//  Help
// --------------------------------------------------------------------------------------------------
function displayHelp() {
    console.log(`
Welcome to the CLI!

Available Commands:
  help                          Display this help message.
  create                        Create a project and run npm install automatically.
  newfile                       Create a new .ts file and update webpack automatically.
  template                      Start the template flow. Choose the script type, select the function(s) to add, and then select the file to replace.
                                ${chalk.gray(`Only files with less than 20 lines will show up to prevent overwriting important files.`)}
  build                         Runs npm run build && suitecloud file:upload --paths "path1" "path2" etc.
  authid [new authid]           Without argument it responds with the current authID, with argument it will change authID to the typed one.
  setup                         Access the setup menu to configure CLI settings.
    -> Set Prefix               Set the file prefix for templates.
    -> Modify Filename Format   Modify the filename format for templates.
    -> Modify Username          Set or modify the username. Used to set the author on the header from template command.
                                ${chalk.gray(`If not set, it will fetch the user from the computer.`)}
    -> Modify Company           Set or modify the company name. Used to set copyright information on the header from template command.
                                ${chalk.gray(`If not set, it will fetch the domain from email used in git.`)}

Usage:
  [command] [options]

Examples:
  $ nsx help          Show help information.
  $ nsx create        Create a project.
  $ nsx setup         Access the setup menu to configure CLI settings.
  $ nsx template      Start the template flow.

For more detailed information or to report issues, please refer to the documentation or contact the developer.
    `);
}



// --------------------------------------------------------------------------------------------------
//  Templates
// --------------------------------------------------------------------------------------------------
function promptForTargetFile(scriptType, subTypes) {
    // read the src/TypeScript directory to get all .ts files
    const scriptFiles = fs.readdirSync('src/TypeScript')
        .filter(file => file.endsWith('.ts'))
        .filter(file => {
            const fileContent = fs.readFileSync(`src/TypeScript/${file}`, 'utf8');
            const lineCount = fileContent.split('\n').length;
            return lineCount <= 20;
        });

    if (scriptFiles.length === 0) {
        console.error('No valid files found with less than 20 lines. Command has been canceled to prevent overwriting important files.');
        return;
    }

    inquirer.prompt([
        {
            type: 'list',
            name: 'targetFile',
            message: 'Please select the file you want to replace:',
            choices: scriptFiles,
        }
    ]).then(targetFileAnswers => {
        const { targetFile } = targetFileAnswers;
        replaceFileWithTemplate(`src/TypeScript/${targetFile}`, scriptType, subTypes);
    });
}


async function replaceFileWithTemplate(targetFilePath, scriptType, subTypes) {
    // define template paths
    const scriptTypeFolderName = scriptType.replace(/\//g, '').replace(/\s/g, '');
    const headerTemplatePath = path.join(__dirname, 'templates/scripts/_header.ts');
    const tagsTemplatePath = path.join(__dirname, `templates/scripts/${scriptTypeFolderName}/_tags.ts`);
    const interfaceTemplatePath = path.join(__dirname, `templates/scripts/${scriptTypeFolderName}/_interface.ts`);
    const importTemplatePath = path.join(__dirname, `templates/scripts/${scriptTypeFolderName}/_import.ts`);

    // get the paths for each selected function
    const functionTemplatePaths = (subTypes || []).map(subType => path.join(__dirname, `templates/scripts/${scriptTypeFolderName}/${subType}.ts`));
    
    let combinedTemplate = '';

    // load and combine templates
    if (fs.existsSync(tagsTemplatePath)) {
        combinedTemplate += fs.readFileSync(tagsTemplatePath, 'utf8') + '\n';
    }
    if (fs.existsSync(headerTemplatePath)) {
        combinedTemplate += fs.readFileSync(headerTemplatePath, 'utf8') + '\n';
    }
    if (fs.existsSync(importTemplatePath)) {
        combinedTemplate += fs.readFileSync(importTemplatePath, 'utf8') + '\n';
    }
    if (fs.existsSync(interfaceTemplatePath)) {
        combinedTemplate += fs.readFileSync(interfaceTemplatePath, 'utf8') + '\n';
    }
    for (const funcPath of functionTemplatePaths) {
        if (fs.existsSync(funcPath)) {
            combinedTemplate += fs.readFileSync(funcPath, 'utf8') + '\n';
        }
    }

    // if no templates were found, exit
    if (!combinedTemplate) {
        console.error('No templates found.');
        return;
    }

    // the placeholder replacement process
    const today = new Date();
    const filename = path.basename(targetFilePath);

    const userConfigPath = path.join(__dirname, 'userConfig.json');
    let userConfig = {};

    if (fs.existsSync(userConfigPath)) {
        userConfig = JSON.parse(fs.readFileSync(userConfigPath, 'utf8'));
    }

    let username = userConfig.username ? userConfig.username : os.userInfo().username;
    let userCompany = userConfig.company;

    if (!userCompany) {
        try {
            const email = execSync('git config --global user.email').toString().trim();
            userCompany = email.split('@')[1];
        } catch (error) {
            const answer = await inquirer.prompt([{
                type: 'input',
                name: 'company',
                message: 'Please enter your company name:',
            }]);
            userConfig.company = answer.company;
            userCompany = answer.company;
            fs.writeFileSync(userConfigPath, JSON.stringify(userConfig, null, 4), 'utf8');
        }
    }

    let tabsRequired = Math.ceil((32 - username.length) / 4);
    let tabs = '\t'.repeat(tabsRequired);
    combinedTemplate = combinedTemplate
        .replace(/%%YEAR%%/g, today.getFullYear().toString())
        .replace(/%%DATE%%/g, today.toISOString().split('T')[0])
        .replace(/%%AUTHOR%%/g, username)
        .replace(/%%TABS%%/g, tabs)
        .replace(/%%FILENAME%%/g, filename)
        .replace(/%%COMPANY%%/g, userCompany);

    fs.writeFileSync(targetFilePath, combinedTemplate, 'utf8');
    console.log('File content replaced with template.');
}


