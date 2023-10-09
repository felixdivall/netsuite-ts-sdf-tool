#!/usr/bin/env node

import inquirer from 'inquirer';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { readFileSync } from 'fs';
import { join } from 'path';
import ora from 'ora';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
// import { exec } from 'child_process';

// Get the directory name of the current module.
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const scriptTypes = [
    { name: 'User Event', value: 'ue' },
    { name: 'Client Script', value: 'cs' },
    { name: 'Suitelet', value: 'sl' },
    { name: 'Map/Reduce', value: 'mr' },
    { name: 'Scheduled Script', value: 'ss' },
    { name: 'RESTlet', value: 'rl' },
    { name: 'Portlet', value: 'plet' },
    { name: 'Mass Update', value: 'mu' },
    { name: 'Workflow Action', value: 'wa' }
];

const [,, command, ...args] = process.argv;

function updateWebpackConfig(fileName, folderPath, projectPath = '') {
    const webpackConfigPath = path.join(projectPath, 'webpack-entry-config.json');
    let configContent;

    // Check if webpackConfigPath exists and is not an empty file.
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

    // Using folderPath if provided, otherwise just using fileName
    // const file = `${filePrefix}_${fileName.replace('.ts', '')}`
    const file = [fileName.replace('.ts', '')].join('_');
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

        // Check if the userConfig.json file exists and if it has a filePrefix
        if (fs.existsSync(userConfigPath)) {
            userConfig = JSON.parse(readFileSync(userConfigPath, 'utf8'));
            filePrefix = userConfig.filePrefix;
            filenameFormat = userConfig.filenameFormat || "{prefix}_{scriptType}_{projectName}";
        }

        // If filePrefix is undefined, null, or empty, prompt the user to input it.
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
                        // More validations if necessary
                        return true;
                    }
                }
            ])
            .then((answers) => {
                filePrefix = answers.filePrefix;

                // Save the filePrefix back to userConfig.json
                fs.writeFileSync(userConfigPath, JSON.stringify({ filePrefix }, null, 4));

                // Continue with the existing prompts
                promptForProjectDetails();
            });
        } else {
            // Continue with the existing prompts
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
        
                // Ask user for confirmation on file name
                const confirmAnswer = await inquirer.prompt([
                    {
                        type: 'confirm',
                        name: 'confirmFileName',
                        message: `The file will be named: ${chalk.yellow(fileName)}. Do you want to proceed?`,
                    }
                ]);
        
                if (confirmAnswer.confirmFileName) {
                    // Continue with project creation
                    const projectPath = createProjectStructure(projectName, fileName);
                    updateWebpackConfig(fileName, folderPath, projectPath);
                } else {
                    // Ask for custom file name
                    const customFileNameAnswer = await inquirer.prompt([
                        {
                            type: 'input',
                            name: 'customFileName',
                            message: 'Please enter a custom file name:',
                            validate: input => input.match(/^[a-zA-Z-_]+(\.ts)?$/) !== null || "Filename cannot be empty and should only contain letters, hyphens, underscores, and optionally end with .ts!"
                        }
                    ]);
        
                    fileName = customFileNameAnswer.customFileName;
        
                    // Continue with project creation with customFileName
                    const projectPath = createProjectStructure(projectName, fileName);
                    updateWebpackConfig(fileName, folderPath, projectPath);
                }
            });
        }
        

        function formatFilename(filenameFormat, filePrefix, scriptType, str) {
            const replacements = {
                '{prefix}': filePrefix,
                '{projectName}': str.toLowerCase().replace(/\s+/g, '_'),
                '{scriptType}': scriptType
            };
        
            let filename = filenameFormat;
            for (const [placeholder, value] of Object.entries(replacements)) {
                filename = filename.replace(placeholder, value);
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
                // const userConfig = JSON.parse(fs.readFileSync(join(__dirname, 'userConfig.json'), 'utf8'));
                // const filePrefix = userConfig.filePrefix || ""; // Default to an empty string if not defined
                updateWebpackConfig(fileName, folderPath);
            });

            function createNewFile(fileName, folderPath = '') {
                const tsFilePath = path.join(process.cwd(), 'src', 'TypeScript', folderPath, `${fileName}.ts`);
                fs.mkdirSync(path.dirname(tsFilePath), { recursive: true });  // Ensure the directory exists
                fs.writeFileSync(tsFilePath, '// Your TypeScript code here', 'utf8');
                console.log(`File ${chalk.green.bold(`${fileName}.ts`)} created successfully.`);
            }
        break;
        
    case 'build':
    const webpackConfigPath = path.join(process.cwd(), 'webpack-entry-config.json');
    if (fs.existsSync(webpackConfigPath)) {
        const configContent = JSON.parse(fs.readFileSync(webpackConfigPath, 'utf8'));
        // const entryPaths = Object.keys(configContent).map(key => `${key}.js`);
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
                return; // Here we exit if no paths were selected.
            }

            const safePaths = buildPaths.map(p => `/SuiteScripts/${p.replace(/(["\s'$`\\])/g, '\\$1')}`);

            try {
                const projectConfig = JSON.parse(fs.readFileSync('./project.json', 'utf8'));
                if (typeof projectConfig !== 'object' || !projectConfig.defaultAuthId) {
                    throw new Error();
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
                const build = spawn(toolkit, ['run', 'build', '--color']);

                const sanitizeOutput = (data) => {
                    // return data.toString().split('\n').map(line => line.trim()).filter(line => line).join('\n');
                    return data.toString().split('\n').map(line => line.trim()).filter(line => line).join('\n').replace(/\n+/g, '\n');
                };
                
                build.stdout.on('data', (data) => {
                    console.log(sanitizeOutput(data));
                });
                
                build.stderr.on('data', (data) => {
                    console.error(sanitizeOutput(data));
                }); 

                build.on('close', (code) => {
                    if(code !== 0) {
                        console.error(`Build process exited with code ${code}`);
                        return;
                    }

                    const spinner = ora('Uploading file, please wait...').start();

                    const upload = spawn('suitecloud', ['file:upload', '--paths', ...safePaths]);
                    
                    upload.stdout.on('data', (data) => {
                        console.log(sanitizeOutput(data));
                    });
                    
                    upload.stderr.on('data', (data) => {
                        console.error(sanitizeOutput(data));
                    });                    

                    upload.on('close', (code) => {
                        spinner.stop();
                        if(code !== 0) {
                            console.error(`${chalk.red(`Upload process exited with code ${code}`)}`);
                        } else {
                            console.log(`${chalk.green('Upload complete!')}`);
                        }
                    });
                });
            } catch (e) {
                console.error(`${chalk.red('No account connected.')} Run ${chalk.magenta.bold('suitecloud account:setup -i')}`);
            }
        });
    } else {
        console.error("webpack-entry-config.json does not exist or is not readable.");
    }
    break;

                
    case 'authid':
        const newAuthId = args[0]; // Get the new AuthID from arguments
        const projectPath = path.join(process.cwd(), 'project.json'); // Define the path to the project.json file

        // Check if the project.json file exists
        if (fs.existsSync(projectPath)) {
            // Read the file content, then parse it to get the projectConfig object
            const projectConfigData = fs.readFileSync(projectPath, 'utf8');
            const projectConfig = JSON.parse(projectConfigData);

            // If a new AuthID is provided, update the project.json file, otherwise print the current AuthID
            if (newAuthId) {
                const oldAuthId = projectConfig.defaultAuthId; // Get the old AuthID
                
                if (oldAuthId === newAuthId) {
                    console.log(`authID remains ${chalk.green(oldAuthId)}. No change was made.`);
                    process.exit(0);
                }

                // Update the defaultAuthId in the projectConfig object
                projectConfig.defaultAuthId = newAuthId;

                // Write the updated projectConfig object back to the project.json file
                fs.writeFileSync(projectPath, JSON.stringify(projectConfig, null, 4), 'utf8');
                
                // Log a message indicating the old and new AuthID
                console.log(`authID ${chalk.red(oldAuthId)} was swapped out for ${chalk.green(newAuthId)}`);
            } else {
                // Log the current AuthID
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

    // Creating Directories
    paths.forEach(p => fs.mkdirSync(path.join(rootDir, p), { recursive: true }));

    // Creating Files
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
    fs.mkdirSync(path.dirname(tsFilePath), { recursive: true });  // Ensure the directory exists
    fs.writeFileSync(tsFilePath, '// Your TypeScript code here', 'utf8');

    console.log(`Project ${projectName} created successfully.`);
    return rootDir;  // Return the created project path
}

function isValidFileName(fileName) {
    // Regular expression: allows only lowercase a-z, _, and ., and must end with .ts
    const regex = /^[a-z_]+(?:\.ts)?$/;
    return regex.test(fileName);
}

// --------------------------------------------------------------------------------------------------
//  Setup Menu
// --------------------------------------------------------------------------------------------------
async function setupMenu() {
    let isRunning = true;

    while (isRunning) {
        const answers = await inquirer.prompt([
            {
                type: 'list',
                name: 'setupOption',
                message: 'Please choose an option:',
                choices: [
                    'Set Prefix',
                    'Modify Filename Format',
                    'Cancel'
                ],
            }
        ]);

        switch (answers.setupOption) {
            case 'Set Prefix':
                await setPrefix();
                break;

            case 'Modify Filename Format':
                await modifyFilenameFormat();
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

