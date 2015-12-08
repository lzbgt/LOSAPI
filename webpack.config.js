var path = require('path');
var ClosureCompilerPlugin = require('webpack-closure-compiler');

module.exports = {
  entry: path.join(__dirname, "/leitherapi.js"),
  output: {
    path: __dirname,
    filename: "leitherapi.min.js"
  },
  module: {
    loaders: [{
        test: /\.js$/,
        loader: "babel",
        exclude: /(node_modules|bower_components)/
      },
      // {
      //   test: /\.css$/,
      //   loader: "style!css"
      // },
      // {
      //   test: /(\.jsx|\.js)$/,
      //   loader: "jshint-loader",
      //   exclude: /node_modules/
      // },
    ]
  },
  plugins: [
    new ClosureCompilerPlugin({
      language_in: 'ECMASCRIPT6',
      language_out: 'ECMASCRIPT5',
      compilation_level: 'SIMPLE'
    })
  ]
};