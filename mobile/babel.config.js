module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo', 'nativewind/babel'],
    plugins: [
      ["transform-define", {
        "process.env.EXPO_ROUTER_APP_ROOT": "../../app",
        "process.env.EXPO_ROUTER_IMPORT_MODE": "sync"
      }],
      "react-native-reanimated/plugin",
      [
        "module-resolver",
        {
          alias: {
            "react-native-maps": "@teovilla/react-native-web-maps",
          },
        },
      ],
    ],
  };
};
