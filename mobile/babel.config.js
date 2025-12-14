module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo', 'nativewind/babel'],
    plugins: [
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
