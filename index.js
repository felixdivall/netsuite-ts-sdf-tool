#!/usr/bin/env node

import readline from 'readline';
import inquirer from 'inquirer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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
// const command = process.argv[2];
// const buildToolArg = process.argv[3];

function updateWebpackConfig(fileName, folderPath, projectPath = '') {
    const webpackConfigPath = path.join(projectPath, 'webpack-entry-config.json');
    // const webpackConfigPath = path.join(projectPath, 'webpack-entry-config.json');
    let configContent;

    // Check if webpackConfigPath exists and is not an empty file.
    if (fs.existsSync(webpackConfigPath) && fs.statSync(webpackConfigPath).size > 0) {
        try {
            configContent = JSON.parse(fs.readFileSync(webpackConfigPath, 'utf8'));
        } catch (error) {
            console.error('Error parsing webpack-entry-config.json:', error);
            // Decide how you want to handle this error.
            // E.g., you might choose to overwrite the file with new content,
            // log the error and exit, etc.
            configContent = {};
        }
    } else {
        configContent = {};
    }

    // Using folderPath if provided, otherwise just using fileName
    const file = fileName.replace('.ts', '')
    const entryKey = folderPath ? `${folderPath}/${file}` : file;
    configContent[entryKey] = `./src/TypeScript/${file}.ts`;
    
    fs.writeFileSync(webpackConfigPath, JSON.stringify(configContent, null, 4), 'utf8');
    console.log(`webpack-entry-config.json updated successfully.`);
}



switch (command) {
    case 'create':
        inquirer
            .prompt([
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
            .then((answers) => {
                const { projectName, scriptType, folderPath } = answers;
                const fileName = formatFilename(projectName, scriptType);
                const projectPath = createProjectStructure(projectName, fileName, folderPath);  
                updateWebpackConfig(fileName, folderPath, projectPath);
            });

        function formatFilename(str, scriptType) {
            return `sta_${scriptType}_` + str.toLowerCase().replace(/\s+/g, '_') + '.ts';
        }
        break;
    case 'newfile':
        inquirer
            .prompt([
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
                fs.mkdirSync(path.dirname(tsFilePath), { recursive: true });  // Ensure the directory exists
                fs.writeFileSync(tsFilePath, '// Your TypeScript code here', 'utf8');
                console.log(`File ${fileName}.ts created successfully.`);
            }
        break;
    case 'build':
        // run npm run build && suitecloud file:upload --paths "/SuiteScripts/<path from webpack-entry-config.json>.js"
        // the user should be able to select which file to upload
        const getEntries = () => {
            const entryFilePath = path.resolve(__dirname, 'webpack-entry-config.json');
            if (fs.existsSync(entryFilePath)) {
                const entries = require(entryFilePath);
                console.log('entries ' + entries)
                return entries;
            }
            return {};
        };
        case 'build':
            const webpackConfigPath = path.join(process.cwd(), 'webpack-entry-config.json');
            // Ensure webpack-entry-config.json exists and is readable
            if (fs.existsSync(webpackConfigPath)) {
                const configContent = JSON.parse(fs.readFileSync(webpackConfigPath, 'utf8'));
                const entryPaths = Object.keys(configContent).map(key => `${key}.js`);
                inquirer
                    .prompt([
                        {
                            type: 'list',
                            name: 'buildPath',
                            message: 'Please select the path to build:',
                            choices: entryPaths,
                        }
                    ])
                    .then((answers) => {
                        const { buildPath } = answers;
    
                        // Ensure to escape any special characters in path to avoid shell injection
                        const safePath = buildPath.replace(/(["\s'$`\\])/g,'\\$1');

                        // Execute build and upload commands
                        const toolkit = process.argv[3] === 'bun' ? 'bun' : 'npm';
                        // console.log('output: ' + `${toolkit} run build && suitecloud file:upload --paths "/SuiteScript/${safePath}`)
                        exec(`${toolkit} run build && suitecloud file:upload --paths "/SuiteScript/${safePath}.js"`, (error, stdout, stderr) => {
                            if (error) {
                                console.error(`Error during build or upload: ${error.message}`);
                                return;
                            }
                            if (stderr) {
                                console.error(`stderr: ${stderr}`);
                                return;
                            }
                            console.log(`stdout: ${stdout}`);
                        });
                    });
            } else {
                console.error("webpack-entry-config.json does not exist or is not readable.");
            }
            break;
    default:
        console.log(`Unknown command: ${command}`);
        break;
}

export function createProjectStructure(projectName, fileName, folderPath) {
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
    
    const tsFilePath = path.join(rootDir, 'src', 'TypeScript', folderPath || '', fileName);
    fs.mkdirSync(path.dirname(tsFilePath), { recursive: true });  // Ensure the directory exists
    fs.writeFileSync(tsFilePath, '// Your TypeScript code here', 'utf8');

    console.log(`Project ${projectName} created successfully.`);
    return rootDir;  // Return the created project path
}

