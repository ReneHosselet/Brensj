const CopyWebpackPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCSSExtractPlugin = require('mini-css-extract-plugin')
const path = require('path')

module.exports = {
    entry: {
        main: __dirname + "/src/script.js",
      },
    output:
    {
        filename: '[name].js',
        path: __dirname + "/export",
    },
    devtool: 'source-map',
    plugins:
        [
            new CopyWebpackPlugin({
                patterns: [
                    { from: path.resolve(__dirname, './static') }
                ]
            }),
            new HtmlWebpackPlugin({
                template: path.resolve(__dirname, './src/index.html'),
                minify: true
            }),
            new MiniCSSExtractPlugin()
        ],
    optimization: {
        moduleIds: 'named',
        minimize: false,
    },
    module:
    {
        rules:
            [
                // HTML
                {
                    test: /\.(html)$/,
                    use: ['html-loader']
                },

                // JS
                /*
                {
                    test: /\.js$/,
                    exclude: /node_modules/,
                    use:
                        [
                            'babel-loader'
                        ]
                },
                */

                // CSS
                {
                    test: /\.css$/,
                    use:
                        [
                            MiniCSSExtractPlugin.loader,
                            'css-loader'
                        ]
                },

                // Images
                {
                    test: /\.(jpg|png|gif|svg)$/,
                    use:
                        [
                            {
                                loader: 'file-loader',
                                /*
                                options:
                                {
                                    outputPath: 'assets/images/'
                                }
                                */
                            }
                        ]
                },

                {
                    test: /\.(glb)$/,
                    use: ["file-loader"],
                },

                // Fonts
                /*
                {
                    test: /\.(ttf|eot|woff|woff2)$/,
                    use:
                        [
                            {
                                loader: 'file-loader',
                                options:
                                {
                                    outputPath: 'assets/fonts/'
                                }
                            }
                        ]
                }
                */
            ]
    }
}
