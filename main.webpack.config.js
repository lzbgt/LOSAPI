var path = require('path');
var ClosureCompilerPlugin = require('webpack-closure-compiler');

var appName = 'main';
var plugins = [];
var outputFile = 'mainjs';

var env = process.env.debug;

if (!env) {
  plugins.push(new ClosureCompilerPlugin({
    language_in: 'ECMASCRIPT6',
    language_out: 'ECMASCRIPT5',
    compilation_level: 'SIMPLE'
  }));
  outputFile += '.min.js';
} else {
  outputFile += '.js';
}

module.exports = {
  entry: path.join(__dirname, appName) + '.js',
  output: {
    path: __dirname,
    filename: outputFile
  },
  module: {
    loaders: [{
      test: /\.js$/,
      loader: "babel",
      exclude: /(node_modules|bower_components)/
    }, ]
  },
  plugins: plugins,
};