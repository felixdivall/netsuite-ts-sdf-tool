import fs from 'fs'
import path from 'path'
import chalk from 'chalk'

const [,, /* command */, ...args] = process.argv

export async function executeAuthIdCommand () {
    const newAuthId = args[0]
    console.log('test')
    const projectPath = path.join(process.cwd(), '/project.json') // define the path to the project.json file

    if (fs.existsSync(projectPath)) {
        const projectConfigData = fs.readFileSync(projectPath, 'utf8')
        const projectConfig = JSON.parse(projectConfigData)
        const oldAuthId = projectConfig.defaultAuthId

        if (newAuthId) {
            if (oldAuthId === newAuthId) {
                console.log(`authID remains ${chalk.green(oldAuthId)}. No change was made.`)
                process.exit(0)
            }

            projectConfig.defaultAuthId = newAuthId

            fs.writeFileSync(projectPath, JSON.stringify(projectConfig, null, 4), 'utf8')

            console.log(`authID ${chalk.red(oldAuthId)} was swapped out for ${chalk.green(newAuthId)}`)
        } else {
            console.log(`Current authID: ${chalk.hex('#FFAF53').bold(projectConfig.defaultAuthId)}`)
        }
    } else {
        console.error('project.json does not exist or is not readable.')
        process.exit(1)
    }
}
