#!/usr/bin/env node

import { executeAuthIdCommand } from './commands/authid.js'
import { executeBuildCommand } from './commands/build.js'
import { executeCreateCommand } from './commands/create.js'
import { executeHelpCommand } from './commands/help.js'
import { executeNewFileCommand } from './commands/newfile.js'
import { executeSetupCommand } from './commands/setup.js'
import { executeTemplateCommand } from './commands/template.js'

// TODO script templates, let user's also save their template and add custom templates

const [,, command] = process.argv

switch (command) {
    case 'create':
        await executeCreateCommand()
        break

    case 'newfile':
        await executeNewFileCommand()
        break

    case 'build':
        await executeBuildCommand()
        break

    case 'template':
        await executeTemplateCommand()
        break

    case 'authid':
        await executeAuthIdCommand()
        break

    case 'setup':
        await executeSetupCommand()
        break

    case 'help':
        await executeHelpCommand()
        break

    default:
        console.log(`Unknown command: ${command}`)
        break
}
