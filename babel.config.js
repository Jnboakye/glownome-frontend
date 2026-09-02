module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      // jsxImportSource is what lets NativeWind turn className into styles.
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    // Required by react-native-reanimated 4, which NativeWind pulls in.
    // Must stay last in the plugin list.
    plugins: ['react-native-worklets/plugin'],
  };
};
