import chalk from 'chalk'

export async function executeHelpCommand() {
    console.log(`
Welcome to the CLI!

Available Commands:
  help                          Display this help message.
  create                        Create a project and run npm install automatically.
  newfile                       Create a new .ts file and update webpack automatically.
  template                      Start the template flow. Choose the script type, select the function(s) to add, and then select the file to replace.
                                ${chalk.gray(`Only files with less than 20 lines will show up to prevent overwriting important files.`)}
  build                         Runs npm run build && suitecloud file:upload --paths "path1" "path2" etc.
  authid [new authid]           Without argument it responds with the current authID, with argument it will change authID to the typed one.
  setup                         Access the setup menu to configure CLI settings.
    -> Set Prefix               Set the file prefix for templates.
    -> Modify Filename Format   Modify the filename format for templates.
    -> Modify Username          Set or modify the username. Used to set the author on the header from template command.
                                ${chalk.gray(`If not set, it will fetch the user from the computer.`)}
    -> Modify Company           Set or modify the company name. Used to set copyright information on the header from template command.
                                ${chalk.gray(`If not set, it will fetch the domain from email used in git.`)}

Usage:
  [command] [options]

Examples:
  $ nsx help          Show help information.
  $ nsx create        Create a project.
  $ nsx setup         Access the setup menu to configure CLI settings.
  $ nsx template      Start the template flow.

For more detailed information or to report issues, please refer to the documentation or contact the developer.
    `)
}
