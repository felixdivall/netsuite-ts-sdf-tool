const fs = require('fs')
const path = require('path')
const webpack = require('webpack')

/**
 * Folder to place packed files in
 */
const outFolder = path.resolve(
    __dirname,
    'src/TypeScript/'
)

/**
 * Add All Entry point scripts here, the key will be used for output filename.
 *  FOR TRYING WHEN WEBPACK 5 IS RELEASED:
 * const entries = {
 * eqtf_SS_processAexeoExports:
 *   {import: path.resolve(__dirname,'/src/TypeScript/EQT Invoices/aexeo export/eqtf_SS_processAexeoExport.ts'), dependOn: 'shared'},
 *  shared: 'moment'
}
 */

const getEntries = () => {
    // You might load your entries from a JSON file, or scan directories to generate them, etc.
    // In this example, let's assume you have an `entryConfig.json` file.
    const entryFilePath = path.resolve(__dirname, 'webpack-entry-config.json');
    if (fs.existsSync(entryFilePath)) {
        const entries = require(entryFilePath);
        return entries;
    }
    // Handle missing entry file case (optional)
    return {};
};

// const entries = {
//     %%FILE_NAME%%: './src/TypeScript/%%FILE_NAME%%.ts',
// }

/**
 * Add Aliases below and in tsconfig.json paths. Ensure to use absolute path or path.resolve(__dirname,<RELATIVE PATH>)
 */
const aliases = {
    helpers: path.resolve(__dirname, 'src/TypeScript/helpers'),
    definitions: path.resolve( __dirname, 'src/TypeScript/definitions'),
    services: path.resolve(__dirname, 'src/TypeScript/services'),
}
/**
 * Main Webpack Configuration, change with care
 */
module.exports = {
    // entry: entries,
    entry: getEntries(),
    mode: 'production',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: '/node_modules/',
            },
        ],
    },
    optimization: {
        minimize: false,
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    //alias: aliases,
    },
    plugins: [
    // Copy the SuiteScript JSDoc to the top of the script
        new webpack.BannerPlugin({
            banner: (data) => {
                const filename = data.chunk.entryModule.resource
                const contents = fs.readFileSync(filename, 'UTF-8')
                const comments = contents.match(/\/\*[\s\S]*?\*\//)
                return (comments && comments.length) ? comments[0] : ''
            },
            raw: true,
        }),
    ],
    output: {
        path: outFolder,
        filename: '[name].js',
        libraryTarget: 'amd',
    },
    externals: [/^N\//],
}
