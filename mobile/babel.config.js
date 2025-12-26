module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ["transform-define", {
        "process.env.EXPO_ROUTER_APP_ROOT": "../../app",
        "process.env.EXPO_ROUTER_IMPORT_MODE": "sync"
      }],
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
