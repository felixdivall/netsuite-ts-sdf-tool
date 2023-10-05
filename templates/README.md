# Netsuite SDF Project Inforamtion 

NetSuite SDF Repo for client projects.
Uses TypeScript and Webpack 

# To Do checklist:
1. Ensure that you have installed Java17, Suitecloud and node/npm, see inforamtion how to install in **xxxxx**
2. Change name of the SDF Project folder (SDF Project Template) to a descriptive name of the project/feature you are developing 
3. Change project name in manifest.xml file 
4. Enter project name in projectconfig.js file 
5. run: _npm install_ in the terminal from your new project folder
6. For each new Type Script file – add file path to the entries object in the webpack.config.js file. 

# Up&Running
7. run: 'npm run build' in the terminal to compile and pack TypeScript files.
8. run: 'suitecloud' in the terminal to see all the available suitecloud commands


# Directory Structure
src/FileCabinet/SuiteScripts - _Pure JS SuiteScripts files end up here after npm run build_
TypeScripts/ - _Code Goes here_
Objects/ - _Contains XML representations of NetSuite objects when running command 'suitecloud object:import -i'

# Using Bun
Bun is a fast, all-in-one toolkit for running, building, testing, and debugging JavaScript and TypeScript, from a single file to a full-stack application. Install bun and swap out 'npm' to 'bun' to get some extra superpowers.
Install by running: _curl -fsSL https://bun.sh/install | bash_
