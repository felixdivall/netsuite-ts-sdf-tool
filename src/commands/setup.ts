import chalk from 'chalk'
import inquirer from 'inquirer'
import { readUserConfig, writeUserConfig } from '../utils/config-helpers.js'

interface UserConfig {
    filePrefix?: string;
    filenameFormat?: string;
    company?: string;
    username?: string;
}

export async function executeSetupCommand() {
    let userConfig: UserConfig = await readUserConfig()

    let isRunning = true
    while (isRunning) {
        const choices = [
            `Set Prefix ${chalk.grey(`${userConfig.filePrefix || 'Not set'}`)}`,
            `Modify Filename Format ${chalk.grey(`${userConfig.filenameFormat || 'Not set'}`)}`,
            `Modify Username ${chalk.grey(`${userConfig.username || 'Not set'}`)}`,
            `Modify Company ${chalk.grey(`${userConfig.company || 'Not set'}`)}`,
            'Cancel'
        ]

        const answers = await inquirer.prompt([
            {
                type: 'list',
                name: 'setupOption',
                message: 'Please choose an option:',
                choices: choices,
            }
        ])

        switch (answers.setupOption) {
            case choices[0]:
                await setPrefix()
                break

            case choices[1]:
                await modifyFilenameFormat()
                break

            case choices[2]:
                await modifyUsername()
                break

            case choices[3]:
                await modifyCompany()
                break

            case 'Cancel':
                isRunning = false
                break
        }
        userConfig = await readUserConfig()
    }
}

// --------------------------------------------------------------------------------------------------
//  Setup Options
// --------------------------------------------------------------------------------------------------
async function setPrefix() {
    const answers = await inquirer.prompt([
        {
            type: 'input',
            name: 'filePrefix',
            message: 'Enter a new file prefix:',
            validate: input => !!input || 'Prefix cannot be empty!'
        }
    ])

    await writeUserConfig({ filePrefix: answers.filePrefix })
    console.log(`Prefix set to: ${answers.filePrefix}`)
}

async function modifyFilenameFormat() {
    const userConfig = await readUserConfig()
    const currentFormat = userConfig.filenameFormat || '{prefix}_{scriptType}_{projectName}'
    console.log(`Current Filename Format: ${chalk.hex('#FFAF53').bold(currentFormat)}`)

    const answers = await inquirer.prompt([
        {
            type: 'input',
            name: 'newFilenameFormat',
            message: `Enter a new filename format (use ${chalk.yellow('{prefix}')}, ${chalk.yellow('{scriptType}')}, and ${chalk.yellow('{projectName}')} as placeholders):`,
            validate: input => {
                const placeholders = ['{prefix}', '{scriptType}', '{projectName}']
                return placeholders.every(ph => input.includes(ph)) || 'Must include all placeholders: {prefix}, {projectName}, {scriptType}'
            }
        }
    ])

    await writeUserConfig({ filenameFormat: answers.newFilenameFormat })
    console.log(`Filename format updated to: ${chalk.green.bold(answers.newFilenameFormat)}`)
}

async function modifyUsername() {
    const answers = await inquirer.prompt([
        {
            type: 'input',
            name: 'username',
            message: 'Enter your full name:',
            validate: input => input === '' || input.match(/^[a-zA-Z0-9-_ ]+$/) !== null || 'Only alphanumeric, spaces, hyphens, and underscores allowed!'
        }
    ])
    await writeUserConfig({ username: answers.username })
    console.log(`Username set to: ${answers.username}`)
}

async function modifyCompany() {
    const answers = await inquirer.prompt([
        {
            type: 'input',
            name: 'company',
            message: 'Enter the name of your company:',
            validate: input => input === '' || input.match(/^[a-zA-Z0-9-_ ]+$/) !== null || 'Only alphanumeric, spaces, hyphens, and underscores allowed!'
        }
    ])
    await writeUserConfig({ company: answers.company })
    console.log(`Company set to: ${answers.company}`)
}
