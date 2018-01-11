const path = require('path');

module.exports = {
    context: path.resolve(__dirname, "src"),
    entry: "./app.js",
    output: {
        path: path.resolve(__dirname, 'docs'),
        filename: "bundle.js"
    },
    devServer: {
        contentBase: path.resolve(__dirname, 'docs'),
        publicPath: '/',
        port: 8080,
        watchContentBase: true
    },
    devtool: "inline-source-map"
};