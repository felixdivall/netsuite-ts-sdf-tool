## NetSuite TypeScript SDF Tool
netsuite-ts-sdf-tool is a command-line interface (CLI) tool designed to automate and streamline your project creation and build processes, particularly focusing on SuiteScripts development for the NetSuite platform.

To install netsuite-ts-sdf-tool, use npm:
```bash
npm install -g netsuite-ts-sdf-tool
```
Ensure that you have Node.js and npm installed on your machine.

To install dependencies:
```bash
npm install
```

#### Usage
###### setup
Use the setup command to configure the CLI with user-specific details, such as file prefix and filename format.
```bash
nst setup
```
It will guide you through a setup wizard to configure your user settings.

###### create
The create command initializes a new project structure, including appropriate naming and directory handling.
```bash
nst create
```
After running the command, follow the prompts to define script type, project name, and destination folder. Your file will be named according to the format specified during setup (or default if not set). You will be prompted to confirm the suggested name and be able to override it.

###### newfile
```bash
nst newfile
```
Utilizing newfile, you can swiftly generate a new TypeScript file in your project. The command prompts you to enter a filename and an optional folder path. It ensures the file is created at the desired location and updates the webpack configuration automatically.

###### build [bun]
Use the build command to compile your project and upload the built file(s) to the SuiteCloud File Cabinet.
```bash
nst build
```
or with an optional argument:
```bash
nst build bun
```
Upon execution, the CLI will prompt you to select one or more path(s) to build from a list. Choose the desired option(s) and the script will handle the build and upload process. Ensure your project.json is properly configured and not empty, as the CLI will fetch the account authentication ID from this file as a security step to not accidentaly deploy to Production.

If used without bun as argument, it uses npm for the build process. If used with bun as argument it'll run using bun instead.

```bash
npm/bun run build && suitecloud file:upload --paths "/SuiteScript/YOUR_SELECTED_PATH.js" "/SuiteScript/ANOTHER_SELECTED_PATH.js"
```

#### Configuration
Ensure to run the setup before creating a new project to specify your desired filename prefix and format. You can specify filename format using placeholders like {prefix}, {scriptType}, and {projectName}.
Example format: "{prefix}_{scriptType}_{projectName}"

Ensure your project.json is correctly configured and authenticated using SuiteCloud CLI.
If not authenticated, utilize: suitecloud account:setup -i

#### Contribution
Contributions to netsuite-ts-sdf-tool are always welcome, whether it be improvements to documentation, feature requests and implementation, bug fixes, and more.

Here are some ways you can contribute:

Reporting Issues: Provide a detailed report of any issues encountered, steps to reproduce them, and relevant system details.
Submitting Pull Requests: Work on improvements or fixes and submit them to be reviewed for inclusion in the project.
Enhancement Suggestions: Provide thoughts on current features and suggestions for new ones.
Ensure to follow the contribution guidelines detailed in CONTRIBUTING.md (if available) when submitting any changes.

#### License
netsuite-ts-sdf-tool is MIT licensed. This means you're free to use this software for any purpose, to distribute it, to modify it, and to distribute modified versions of the software under the terms of the license.

The detailed license can be found in the LICENSE file in the repository. It essentially allows you to do anything you want with the software, as long as you include the original copyright and license notice in any copy of the software or any substantial portion of it.
