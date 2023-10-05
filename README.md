## NetSuite TypeScript SDF Tool

To install dependencies:

```bash
bun install
```
or
```bash
npm install
```

#### Commands
###### create
```bash
nst create
```
The create command initializes a new project structure with predefined directories and template files. It prompts you to specify the project name, script type, and optional folder path. The project structure is generated in the current working directory and is configured according to the responses given to the prompts.

###### newfile
```bash
nst newfile
```
Utilizing newfile, you can swiftly generate a new TypeScript file in your project. The command prompts you to enter a filename and an optional folder path. It ensures the file is created at the desired location and updates the webpack configuration automatically.

###### build [bun]
```bash
nst build
```
or with an optional argument:
```bash
nst build bun
```
The build command facilitates building and uploading your script to the NetSuite account. Upon execution, it prompts you to select a path (from those specified in webpack-entry-config.json) for which the build and upload processes will be carried out.

If used without an argument, it uses npm for the build process:

```bash
npm run build && suitecloud file:upload --paths "/SuiteScript/YOUR_SELECTED_PATH.js"
```
When used with the bun argument:
```bash
nst build bun
```
It swaps npm with bun for the build process:

```bash
bun build && suitecloud file:upload --paths "/SuiteScript/YOUR_SELECTED_PATH.js"
```
Getting Started

#### Installation
```bash
npm install -g netsuite-ts-sdf-tool
```
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
