import fs from 'fs'
import path from 'path'
import chalk from 'chalk'
import inquirer from 'inquirer'
import * as FOLDER from '../definitions/folder.js'
import { readUserConfig, UserConfig } from '../utils/config-helpers.js'
import { updateWebpackConfig } from '../utils/project-helpers.js'
import { extractScriptType } from '../utils/string-helpers.js'
const userConfig: UserConfig = await readUserConfig()

export async function executeNewFileCommand() {
    inquirer.prompt([
        {
            type: 'input',
            name: 'fileName',
            message: 'Please enter the filename:',
            validate: input => input.match(/^[a-zA-Z0-9-_]+$/) !== null || 'Only alphanumeric, - and _ allowed in filenames!'
        },
        {
            type: 'input',
            name: 'folderPath',
            message: 'Please enter the folder path (leave empty for root):'
        }
    ])
        .then((answers) => {
            const { fileName, folderPath } = answers
            createNewFile(fileName)
            updateWebpackConfig(fileName, folderPath)
        })

}

function createNewFile(fileName: string): void {
    let tsFilePath = path.join(process.cwd(), 'src', 'TypeScript', `${fileName}.ts`)

    if (userConfig.folderStructure === FOLDER.STRUCTURE.SCRIPT_TYPE) {
        const scriptType = extractScriptType(fileName)
        if (scriptType) {
            tsFilePath = path.join(process.cwd(), 'src', 'TypeScript', scriptType, `${fileName}.ts`)
        }
    }

    fs.mkdirSync(path.dirname(tsFilePath), { recursive: true })  // ensure the directory exists
    fs.writeFileSync(tsFilePath, '// run \'nsx template\' to jump start your project', 'utf8')
    console.log(`File ${chalk.green.bold(`${fileName}.ts`)} created successfully.`)
}

