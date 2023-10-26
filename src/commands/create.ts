import { execSync } from 'child_process'
import os from 'os'
import chalk from 'chalk'
import inquirer from 'inquirer'
import { readUserConfig, writeUserConfig } from '../utils/config-helpers.js'
import { createProjectStructure, updateWebpackConfig } from '../utils/project-helpers.js'

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
]

export async function executeCreateCommand() {
    const userConfig = await readUserConfig()  // Use the readUserConfig function
    let filePrefix: string = userConfig.filePrefix || ''
    const filenameFormat: string = userConfig.filenameFormat || '{prefix}_{scriptType}_{projectName}'

    if (filePrefix) {
        promptForProjectDetails(filenameFormat, filePrefix)
    } else {
        inquirer.prompt([
            {
                type: 'input',
                name: 'filePrefix',
                message: 'Please enter a prefix for file names:',
                validate: (input) => {
                    if (!input.trim()) {
                        return 'The prefix cannot be empty'
                    }
                    return true
                }
            }
        ]).then(async (answers) => {   // Note the async here, since we are using await inside
            filePrefix = answers.filePrefix
            await writeUserConfig({ filePrefix })  // Use the writeUserConfig function
            promptForProjectDetails(filenameFormat, filePrefix)
        })
    }
}

function promptForProjectDetails(filenameFormat: string, filePrefix: string) {
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
            const { projectName, scriptType, folderPath } = answers
            let fileName = formatFilename(filenameFormat!, filePrefix!, scriptType, projectName)

            const confirmAnswer = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'confirmFileName',
                    message: `The file will be named: ${chalk.yellow(fileName)}. Do you want to proceed?`,
                }
            ])

            if (confirmAnswer.confirmFileName) {
                const projectPath = createProjectStructure(projectName, fileName)
                updateWebpackConfig(fileName, folderPath, projectPath)
            } else {
                const customFileNameAnswer = await inquirer.prompt([
                    {
                        type: 'input',
                        name: 'customFileName',
                        message: 'Please enter a custom file name:',
                        validate: input => input.match(/^[a-zA-Z-_]+(\.ts)?$/) !== null || 'Filename cannot be empty and should only contain letters, hyphens, underscores, and optionally end with .ts!'
                    }
                ])

                fileName = customFileNameAnswer.customFileName

                // continue with project creation with customFileName
                const projectPath = createProjectStructure(projectName, fileName)
                updateWebpackConfig(fileName, folderPath, projectPath)
            }
            if (os.platform() === 'win32') {
                execSync(`cd "${projectName}" && npm install`, { stdio: 'inherit' })
            } else {
                execSync(`cd "${projectName}" && curl -fsSL https://bun.sh/install | bash && bun install`, { stdio: 'inherit' })
            }
        })
}

function formatFilename(filenameFormat: string, filePrefix: string, scriptType: string, str: string) {
    // process str: replace '-' with '_' and remove any '.ts' suffix
    str = str.replace(/-|\.ts$/g, function(match) {
        if (match === '.ts') { return '' }
        if (match === '-') { return '_' }
        return match
    })

    const replacements = {
        '{prefix}': filePrefix,
        '{projectName}': str.toLowerCase().replace(/\s+/g, '_'),
        '{scriptType}': scriptType
    }

    let filename = filenameFormat
    for (const [placeholder, value] of Object.entries(replacements)) {
        filename = filename.replace(new RegExp(placeholder, 'g'), value)
    }

    return filename + '.ts'
}
