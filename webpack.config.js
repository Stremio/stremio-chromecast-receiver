const path = require('path');
const { execSync } = require('child_process');
const webpack = require('webpack');
const HtmlWebPackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const pachageJson = require('./package.json');

const COMMIT_HASH = execSync('git rev-parse HEAD').toString().trim();
const PUBLIC_PATH = {
    production: 'https://stremio.github.io/stremio-chromecast-receiver/',
    development: '/'
};

module.exports = (env, argv) => ({
    mode: argv.mode,
    entry: './src/index.js',
    output: {
        path: path.join(__dirname, 'build'),
        filename: `${COMMIT_HASH}/scripts/[name].js`
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            '@babel/preset-env',
                            '@babel/preset-react'
                        ],
                        plugins: [
                            '@babel/plugin-proposal-object-rest-spread'
                        ]
                    }
                }
            },
            {
                test: /\.css$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: MiniCssExtractPlugin.loader,
                        options: {
                            esModule: false
                        }
                    },
                    {
                        loader: 'css-loader',
                        options: {
                            esModule: false,
                            importLoaders: 1,
                            modules: {
                                namedExport: false,
                                localIdentName: '[local]-[hash:base64:5]'
                            }
                        }
                    },
                    {
                        loader: 'postcss-loader',
                        options: {
                            postcssOptions: {
                                plugins: [
                                    require('cssnano')({
                                        preset: [
                                            'advanced',
                                            {
                                                autoprefixer: {
                                                    add: true,
                                                    remove: true,
                                                    flexbox: false,
                                                    grid: false
                                                },
                                                cssDeclarationSorter: true,
                                                calc: false,
                                                colormin: false,
                                                convertValues: false,
                                                discardComments: {
                                                    removeAll: true,
                                                },
                                                discardOverridden: false,
                                                discardUnused: false,
                                                mergeIdents: false,
                                                normalizeDisplayValues: false,
                                                normalizePositions: false,
                                                normalizeRepeatStyle: false,
                                                normalizeUnicode: false,
                                                normalizeUrl: false,
                                                reduceIdents: false,
                                                reduceInitial: false,
                                                zindex: false
                                            }
                                        ]
                                    })
                                ]
                            }
                        }
                    }
                ]
            },
            {
                test: /\.ttf$/,
                exclude: /node_modules/,
                loader: 'file-loader',
                options: {
                    esModule: false,
                    name: '[name].[ext]',
                    outputPath: `${COMMIT_HASH}/fonts`,
                    publicPath: `${PUBLIC_PATH[argv.mode]}${COMMIT_HASH}/fonts`
                }
            },
            {
                test: /\.(png|jpe?g)$/,
                exclude: /node_modules/,
                loader: 'file-loader',
                options: {
                    esModule: false,
                    name: '[name].[ext]',
                    outputPath: `${COMMIT_HASH}/images`,
                    publicPath: `${PUBLIC_PATH[argv.mode]}${COMMIT_HASH}/images`
                }
            },
        ]
    },
    resolve: {
        extensions: ['.js', '.json', '.css'],
        alias: {
            'stremio-chromecast-receiver': path.join(__dirname, 'src')
        }
    },
    devServer: {
        host: '0.0.0.0',
        static: false,
        hot: false,
        https: true,
        liveReload: false
    },
    optimization: {
        minimize: true,
        minimizer: [
            new TerserPlugin({
                test: /\.js$/,
                extractComments: false,
                terserOptions: {
                    ecma: 5,
                    mangle: false,
                    warnings: false,
                    output: {
                        comments: false,
                        beautify: false,
                        wrap_iife: true
                    }
                }
            })
        ]
    },
    plugins: [
        new webpack.ProgressPlugin(),
        new webpack.EnvironmentPlugin({
            ...env,
            DEBUG: argv.mode !== 'production',
            VERSION: pachageJson.version,
            COMMIT_HASH
        }),
        new webpack.ProvidePlugin({
            Buffer: ['buffer', 'Buffer']
        }),
        new CleanWebpackPlugin({
            cleanOnceBeforeBuildPatterns: ['*']
        }),
        new CopyWebpackPlugin({
            patterns: [{ from: 'favicons', to: `${COMMIT_HASH}/favicons` }]
        }),
        new MiniCssExtractPlugin({
            filename: `${COMMIT_HASH}/styles/[name].css`
        }),
        new HtmlWebPackPlugin({
            template: './src/index.html',
            inject: false,
            faviconsPath: `${COMMIT_HASH}/favicons`
        })
    ]
});
