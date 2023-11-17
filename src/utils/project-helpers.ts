import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import * as FOLDER from '../definitions/folder.js'
import { readUserConfig, UserConfig } from '../utils/config-helpers.js'
import { extractScriptType } from '../utils/string-helpers.js'
const userConfig: UserConfig = await readUserConfig()

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export function createProjectStructure(projectName: string, fileName: string, scriptType: string) {
    const rootDir = path.join(process.cwd(), projectName)
    const paths = [
        'src/FileCabinet/SuiteScripts',
        'src/Objects',
        'src/TypeScript',
        'vscode',
    ]
    if (userConfig.folderStructure === FOLDER.STRUCTURE.SCRIPT_TYPE) {
        paths.push(`src/TypeScript/entry_points/${scriptType}`)
        paths.push(`src/TypeScript/core/enums`)
        paths.push(`src/TypeScript/core/repositories`)
        paths.push(`src/TypeScript/core/services`)
        paths.push(`src/TypeScript/libs`)
    }
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
    ]

    // creating directories
    paths.forEach(p => fs.mkdirSync(path.join(rootDir, p), { recursive: true }))

    // creating files
    files.forEach(f => {
        const templatePath = path.join(__dirname, '../..', 'templates', f)
        let content = ''
        if (fs.existsSync(templatePath)) {
            content = fs.readFileSync(templatePath, 'utf8')
            content = content.replace(/%%PROJECT_NAME%%/g, projectName)
            content = content.replace(/%%FILE_NAME%%/g, fileName.replace('.ts', ''))
        }
        fs.writeFileSync(path.join(rootDir, f), content, 'utf8')
    })

    if (!fileName.endsWith('.ts')) { fileName += '.ts' }
    let tsFilePath = path.join(rootDir, 'src', 'TypeScript', fileName)
    if (userConfig.folderStructure === FOLDER.STRUCTURE.SCRIPT_TYPE) {
        tsFilePath = path.join(rootDir, 'src', 'TypeScript', 'entry_points', scriptType, fileName)
    }

    fs.mkdirSync(path.dirname(tsFilePath), { recursive: true })  // ensure the directory exists
    fs.writeFileSync(tsFilePath, '// run \'nsx template\' to jump start your project', 'utf8')

    console.log(`Project ${projectName} created successfully.`)
    return rootDir  // return the created project path
}

export function updateWebpackConfig(fileName: string, folderPath: string, projectPath = '') {
    const webpackConfigPath = path.join(projectPath, 'webpack-entry-config.json')
    let configContent

    // check if webpackConfigPath exists and is not an empty file
    if (fs.existsSync(webpackConfigPath) && fs.statSync(webpackConfigPath).size > 0) {
        try {
            configContent = JSON.parse(fs.readFileSync(webpackConfigPath, 'utf8'))
        } catch (error) {
            console.error('Error parsing webpack-entry-config.json:', error)
            configContent = {}
        }
    } else {
        configContent = {}
    }

    const file = [fileName.replace('.ts', '')].join('_')

    // using folderPath if provided, otherwise just using fileName
    const entryKey = folderPath ? `${folderPath}/${file}` : file
    if (userConfig.folderStructure === FOLDER.STRUCTURE.SCRIPT_TYPE) {
        const scriptType = extractScriptType(file)
        configContent[entryKey] = `./src/TypeScript/entry_points/${scriptType}/${file}.ts`
    } else {
        configContent[entryKey] = `./src/TypeScript/${file}.ts`
    }

    fs.writeFileSync(webpackConfigPath, JSON.stringify(configContent, null, 4), 'utf8')
    console.log(`webpack-entry-config.json updated successfully.`)
}

