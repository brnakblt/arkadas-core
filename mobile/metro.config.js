const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);

// Enable cjs support for better compatibility with some libraries
config.resolver.sourceExts.push('cjs');

// 1. Watch all files within the monorepo
config.watchFolders = [workspaceRoot];

// 2. Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
    path.resolve(projectRoot, 'node_modules'),
    path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Force Metro to resolve (sub)dependencies from the `nodeModulesPaths`
config.resolver.disableHierarchicalLookup = true;

// 4. Exclude non-essential directories from watcher to avoid EACCES and ENOENT errors
// This includes other service build artifacts, python venvs, and docker databases
const exclusionList = require('expo/metro-config').exclusionList || require('metro-config/src/defaults/exclusionList');
config.resolver.blockList = exclusionList([
    /.*\/databases\/.*/,
    /.*\/strapi\/dist\/.*/,
    /.*\/web\/.next\/.*/,
    /.*\/ai-service\/venv\/.*/,
    /.*\/mebbis-service\/node_modules\/.*/,
]);

// 5. Workaround for inline-style-prefixer resolution issue in react-native-web
// Using resolveRequest to manually intercept and resolve ANY failing path in this package
config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (moduleName.startsWith('inline-style-prefixer/')) {
        // Construct the absolute path to the file
        // e.g., inline-style-prefixer/lib/createPrefixer -> /abs/path/to/node_modules/inline-style-prefixer/lib/createPrefixer.js
        const relativePath = moduleName.replace('inline-style-prefixer/', '');
        return {
            filePath: path.resolve(projectRoot, 'node_modules/inline-style-prefixer', relativePath + (relativePath.endsWith('.js') ? '' : '.js')),
            type: 'sourceFile',
        };
    }
    // Chain to the standard Metro resolver
    return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
