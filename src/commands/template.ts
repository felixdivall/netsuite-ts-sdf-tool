import { execSync } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { fileURLToPath } from 'url'
import inquirer from 'inquirer'
import { readUserConfig, writeUserConfig } from '../utils/config-helpers.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '../..')

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
])
const multipleSelectionTypes = ['Client Script', 'User Event', 'RESTlet']

export async function executeTemplateCommand() {
    inquirer.prompt([
        {
            type: 'list',
            name: 'scriptType',
            message: 'Please select the script type:',
            choices: Array.from(scriptTypesMap.keys()),
        }
    ]).then(answers => {
        const { scriptType } = answers
        const subTypes = scriptTypesMap.get(scriptType)

        if (subTypes && subTypes.length > 0) {
            let message = `Select the ${scriptType} function(s) to add:`
            let promptType = 'list'

            if (multipleSelectionTypes.includes(scriptType)) {
                message = `Select the ${scriptType} functions to add:`
                promptType = 'checkbox'
            }

            inquirer.prompt([
                {
                    type: promptType,
                    name: 'subTypes',
                    message: message,
                    choices: subTypes,
                }
            ]).then(subAnswers => {
                const selectedFunctions = Array.isArray(subAnswers.subTypes) ? subAnswers.subTypes : [subAnswers.subTypes]
                promptForTargetFile(scriptType, selectedFunctions)
            })
        } else {
            promptForTargetFile(scriptType, [])
        }
    })
}


function promptForTargetFile(scriptType: string, subTypes: string[] | string) {
    // read the src/TypeScript directory to get all .ts files
    const scriptFiles = fs.readdirSync('src/TypeScript')
        .filter(file => file.endsWith('.ts'))
        .filter(file => {
            const fileContent = fs.readFileSync(`src/TypeScript/${file}`, 'utf8')
            const lineCount = fileContent.split('\n').length
            return lineCount <= 20
        })

    if (scriptFiles.length === 0) {
        console.error('No valid files found with less than 20 lines. Command has been canceled to prevent overwriting important files.')
        return
    }

    inquirer.prompt([
        {
            type: 'list',
            name: 'targetFile',
            message: 'Please select the file you want to replace:',
            choices: scriptFiles,
        }
    ]).then(targetFileAnswers => {
        const { targetFile } = targetFileAnswers
        replaceFileWithTemplate(`src/TypeScript/${targetFile}`, scriptType, subTypes)
    })
}


async function replaceFileWithTemplate(targetFilePath: string, scriptType: string, subTypes: string[] | string) {
    // define template paths
    const scriptTypeFolderName = scriptType.replace(/\//g, '').replace(/\s/g, '')
    const headerTemplatePath = path.join(projectRoot, 'templates/scripts/_header.ts')
    const tagsTemplatePath = path.join(projectRoot, `templates/scripts/${scriptTypeFolderName}/_tags.ts`)
    const interfaceTemplatePath = path.join(projectRoot, `templates/scripts/${scriptTypeFolderName}/_interface.ts`)
    const importTemplatePath = path.join(projectRoot, `templates/scripts/${scriptTypeFolderName}/_import.ts`)

    // get the paths for each selected function
    const subTypesArray = Array.isArray(subTypes) ? subTypes : [subTypes]
    const functionTemplatePaths = subTypesArray.map((subType: string) => {
        return path.join(projectRoot, `templates/scripts/${scriptTypeFolderName}/${subType}.ts`)
    })

    let combinedTemplate = ''

    // load and combine templates
    if (fs.existsSync(tagsTemplatePath)) {
        combinedTemplate += fs.readFileSync(tagsTemplatePath, 'utf8') + '\n'
    }
    if (fs.existsSync(headerTemplatePath)) {
        combinedTemplate += fs.readFileSync(headerTemplatePath, 'utf8') + '\n'
    }
    if (fs.existsSync(importTemplatePath)) {
        combinedTemplate += fs.readFileSync(importTemplatePath, 'utf8') + '\n'
    }
    if (fs.existsSync(interfaceTemplatePath)) {
        combinedTemplate += fs.readFileSync(interfaceTemplatePath, 'utf8') + '\n'
    }
    for (const funcPath of functionTemplatePaths) {
        if (fs.existsSync(funcPath)) {
            combinedTemplate += fs.readFileSync(funcPath, 'utf8') + '\n'
        }
    }

    // if no templates were found, exit
    if (!combinedTemplate) {
        console.error('No templates found.')
        return
    }

    // the placeholder replacement process
    const today: Date = new Date()
    const filename = path.basename(targetFilePath)

    const userConfig = await readUserConfig()

    const username = userConfig.username ? userConfig.username : os.userInfo().username
    let userCompany = userConfig.company

    if (!userCompany) {
        try {
            const email = execSync('git config --global user.email').toString().trim()
            userCompany = email.split('@')[1]
        } catch (error) {
            const answer = await inquirer.prompt([{
                type: 'input',
                name: 'company',
                message: 'Please enter your company name:',
            }])
            userConfig.company = answer.company
            userCompany = answer.company
            await writeUserConfig({ company: userCompany })
        }
    }

    const tabsRequired = Math.ceil((32 - username.length) / 4)
    const tabs = '\t'.repeat(tabsRequired)
    combinedTemplate = combinedTemplate
        .replace(/%%YEAR%%/g, today.getFullYear().toString())
        .replace(/%%DATE%%/g, today.toISOString().split('T')[0]!)
        .replace(/%%AUTHOR%%/g, username)
        .replace(/%%TABS%%/g, tabs)
        .replace(/%%FILENAME%%/g, filename)
        .replace(/%%COMPANY%%/g, userCompany!)

    fs.writeFileSync(targetFilePath, combinedTemplate, 'utf8')
    console.log('File content replaced with template.')
}
