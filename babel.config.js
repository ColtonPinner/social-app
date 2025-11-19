module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['module-resolver', {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
        alias: {
          '@mobile': './mobile',
          '@mobile/components': './mobile/components',
          '@mobile/screens': './mobile/screens',
          '@mobile/navigation': './mobile/navigation',
          '@mobile/context': './mobile/context',
          '@mobile/lib': './mobile/lib',
          '@mobile/utils': './mobile/utils',
          '@mobile/theme': './mobile/theme'
        }
      }],
      'react-native-reanimated/plugin'
    ]
  };
};
