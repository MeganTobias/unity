module.exports = {
  plugins: {
    'tailwindcss': {},
    'autoprefixer': {},
    'postcss-import': {},
    'postcss-flexbugs-fixes': {},
    'postcss-preset-env': {
      autoprefixer: {
        flexbox: 'no-2009',
      },
      stage: 3,
      features: {
        'custom-properties': false,
      },
    },
    ...(process.env.NODE_ENV === 'production'
      ? {
          '@fullhuman/postcss-purgecss': {
            content: [
              './src/pages/**/*.{js,ts,jsx,tsx}',
              './src/components/**/*.{js,ts,jsx,tsx}',
              './src/hooks/**/*.{js,ts}',
              './src/utils/**/*.{js,ts}',
            ],
            defaultExtractor: (content) => content.match(/[\w-/:]+(?<!:)/g) || [],
            safelist: [
              'html',
              'body',
              /^animate-/,
              /^transition-/,
              /^duration-/,
              /^ease-/,
              /^delay-/,
            ],
          },
          'cssnano': {
            preset: ['default', {
              discardComments: {
                removeAll: true,
              },
            }],
          },
        }
      : {}),
  },
};
