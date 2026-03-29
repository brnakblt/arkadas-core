const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../');

// Get the default Expo config
const config = getDefaultConfig(projectRoot);

// Watch the workspace root so that module resolution works in a monorepo
config.watchFolders = [workspaceRoot];

// Let Metro know where to resolve packages
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

const newBlockList = [
  new RegExp(`^${path.resolve(workspaceRoot, 'strapi/dist').replace(/[/\\]/g, '[/\\\\]')}/.*`),
  new RegExp(`^${path.resolve(workspaceRoot, 'strapi/build').replace(/[/\\]/g, '[/\\\\]')}/.*`),
  new RegExp(`^${path.resolve(workspaceRoot, 'web/.next').replace(/[/\\]/g, '[/\\\\]')}/.*`),
  new RegExp(`^${path.resolve(workspaceRoot, 'api').replace(/[/\\]/g, '[/\\\\]')}/.*`),
  new RegExp(`^${path.resolve(workspaceRoot, 'infra_data').replace(/[/\\]/g, '[/\\\\]')}/.*`),
  new RegExp(`^${path.resolve(workspaceRoot, 'backups').replace(/[/\\]/g, '[/\\\\]')}/.*`),
];

if (Array.isArray(config.resolver.blockList)) {
  config.resolver.blockList.push(...newBlockList);
} else if (config.resolver.blockList instanceof RegExp) {
  config.resolver.blockList = new RegExp(
    `(?:${config.resolver.blockList.source})|(?:${newBlockList.map(r => r.source).join('|')})`
  );
} else {
  config.resolver.blockList = new RegExp(
    `(?:${newBlockList.map(r => r.source).join('|')})`
  );
}

module.exports = config;
