const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Root of the monorepo
const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "..");

// Explicitly define watchFolders to ONLY include:
// 1. The mobile package itself
// 2. The root node_modules (for hoisted dependencies)
// This prevents Metro from trying to watch the 'web' folder and its changing .next artifacts
config.watchFolders = [
  projectRoot,
  path.resolve(monorepoRoot, "node_modules"),
];

// Fix blockList for Windows to correctly ignore the sibling web/.next folder
// This prevents "ENOENT" errors when the web build deletes/recreates files
const webBuildPath = path.resolve(__dirname, "../web/.next");
// Escape backslashes for the RegExp
const webBuildPathRegex = new RegExp(
  `${webBuildPath.replace(/\\/g, "\\\\")}.*`
);

config.resolver.blockList = [webBuildPathRegex];

// Custom resolver to alias react-native-maps on web
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === "web" && moduleName === "react-native-maps") {
    return context.resolveRequest(
      context,
      "@teovilla/react-native-web-maps",
      platform
    );
  }
  // Ensure we call the default resolver for everything else
  return context.resolveRequest(context, moduleName, platform);
};

// Force Metro to resolve 'react' and 'react-dom' to the root node_modules
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  "react": path.resolve(monorepoRoot, "node_modules", "react"),
  "react-dom": path.resolve(monorepoRoot, "node_modules", "react-dom"),
};

module.exports = withNativeWind(config, { input: "./global.css" });