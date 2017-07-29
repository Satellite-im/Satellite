const path = require('path');
const config = require('../config');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

exports.assetsPath = function assetsPath(_path) {
  const assetsSubDirectory = process.env.NODE_ENV === 'production'
    ? config.build.assetsSubDirectory
    : config.dev.assetsSubDirectory;
  return path.posix.join(assetsSubDirectory, _path);
};

exports.cssLoaders = function cssLoaders(options) {
  const opts = Object.assign({}, options);

  const cssLoader = {
    loader: 'css-loader',
    options: {
      minimize: process.env.NODE_ENV === 'production',
      sourceMap: opts.sourceMap,
    },
  };

  // generate loader string to be used with extract text plugin
  function generateLoaders(loader, loaderOptions) {
    const loaders = [cssLoader];
    if (loader) {
      loaders.push({
        loader: `${loader}-loader`,
        options: Object.assign({}, loaderOptions, {
          sourceMap: opts.sourceMap,
        }),
      });
    }

    // Extract CSS when that option is specified
    // (which is the case during production build)
    if (opts.extract) {
      return ExtractTextPlugin.extract({
        use: loaders,
        fallback: 'vue-style-loader',
      });
    }
    return ['vue-style-loader'].concat(loaders);
  }

  // https://vue-loader.vuejs.org/en/configurations/extract-css.html
  return {
    css: generateLoaders(),
    postcss: generateLoaders(),
    less: generateLoaders('less'),
    sass: generateLoaders('sass', { indentedSyntax: true }),
    scss: generateLoaders('sass'),
    stylus: generateLoaders('stylus'),
    styl: generateLoaders('stylus'),
  };
};

// Generate loaders for standalone style files (outside of .vue)
exports.styleLoaders = function styleLoaders(options) {
  const output = [];
  const loaders = exports.cssLoaders(options);
  Object.keys(loaders).forEach((extension) => {
    const loader = loaders[extension];
    output.push({
      test: new RegExp(`\\.${extension}$`),
      use: loader,
    });
  });

  return output;
};
