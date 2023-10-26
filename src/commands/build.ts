import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import chalk from 'chalk'
import inquirer from 'inquirer'

type Answers = {
    buildPaths: string[];
};

export async function executeBuildCommand() {
    const webpackConfigPath = path.join(process.cwd(), 'webpack-entry-config.json')
    if (fs.existsSync(webpackConfigPath)) {
        const configContent = JSON.parse(fs.readFileSync(webpackConfigPath, 'utf8'))
        const entryPaths = Object.keys(configContent).map(key => {
            const pathComponents = key.split('/')
            const fileName = pathComponents.pop() + '.js'
            const path = pathComponents.join('/') + (pathComponents.length > 0 ? '/' : '')
            return {
                name: `${path}${chalk.bold(fileName)}`,
                value: `${key}.js`,
            }
        })

        inquirer.prompt([{
            type: 'checkbox',
            name: 'buildPaths',
            message: 'Please select the path(s) to build:',
            choices: entryPaths,
        }])
            .then(async (answers: Answers) => {
                const { buildPaths } = answers // extracting buildPaths from answers

                if (buildPaths.length === 0) {
                    console.log(chalk.yellow('No paths selected. Please select at least one path to proceed.'))
                    return // exit if no paths were selected
                }

                const safePaths = buildPaths.map(p => `/SuiteScripts/${p.replace(/(["\s'$`\\])/g, '\\$1')}`)

                try {
                    const projectConfig = JSON.parse(fs.readFileSync('./project.json', 'utf8'))
                    if (typeof projectConfig !== 'object' || !projectConfig.defaultAuthId) {
                        throw new Error('Invalid project configuration or missing defaultAuthId.')
                    }
                    const authId = projectConfig.defaultAuthId

                    const uploadConfirmation = await inquirer.prompt([{
                        type: 'confirm',
                        name: 'shouldContinue',
                        message: `The file will be uploaded using the account ${chalk.yellow(authId)}. Do you want to continue?`,
                        default: false
                    }])

                    if (!uploadConfirmation.shouldContinue) {
                        console.log('Upload cancelled by user.')
                        return
                    }

                    const toolkit = process.argv[3] === 'bun' ? 'bun' : 'npm'
                    execSync(`${toolkit} run build`, { stdio: 'inherit' })
                    execSync(`suitecloud file:upload --paths ${safePaths.join(' ')}`, { stdio: 'inherit' })

                    console.log(`${chalk.green('Upload complete!')}`)
                } catch (e) {
                // if ((e as Error).message.includes("Invalid project configuration or missing defaultAuthId")) {
                    if ((e as Error).message.includes('Command failed')) {
                        console.error(`${chalk.red((e as Error).message)}`)
                    } else {
                        console.error(`${chalk.red('No account connected.')} Run ${chalk.magenta.bold('suitecloud account:setup -i')}`)
                    }
                }
            })
    } else {
        console.error('webpack-entry-config.json does not exist or is not readable.')
    }
}
