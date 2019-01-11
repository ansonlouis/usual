// webpack.config.js
//

(function(){

    var webpack = require('webpack');
    var HtmlWebpackPlugin = require('html-webpack-plugin');
    var ScriptExtHtmlWebpackPlugin = require('script-ext-html-webpack-plugin');

    var _root = __dirname + "/";
    var paths = {
        root : _root,
        src : _root + "src",
        build : _root + "build"
    };


    module.exports = {

        mode : 'development',

        entry : {
            "bundle" : paths.root + "test/test.js",
        },

        output : {
            path: paths.root + "test",
            filename: "[name].js"
        },

        resolve : {
            modules : [
              paths.root + "/node_modules"
            ],
            alias : {
              "usual" : paths.root + "/package"
            }
        },

        module : {
          rules: [{
            test: /test\.js$/,
            use: 'mocha-loader',
            exclude: /node_modules/,
          }]
        },

        plugins : [

        ],

        devServer : {
          contentBase : './test',
          index : 'index.html'
        },

        devtool : "cheap-module-source-map",
        watch : true

    };

})();
