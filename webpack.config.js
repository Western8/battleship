const path = require('path');
const { merge } = require('webpack-merge');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

const baseConfig = {
    entry: path.resolve(__dirname, './index.ts'),
    mode: 'development',
    module: {
        rules: [
            {
                test: /\.ts$/i,
                use: {
                    loader: 'ts-loader',
                    options: {
                        compilerOptions: {
                            noEmit: false,
                        },
                    },
                },
                exclude: /node_modules/
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    target: 'node',
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, 'dist'),
        // assetModuleFilename: 'assets/[name][ext]',
        publicPath: '/',
    },
    plugins: [
        new CleanWebpackPlugin(),
    ],
    externals: {
        bufferutil: "bufferutil",
        "utf-8-validate": "utf-8-validate",
      }
};

module.exports = ({ mode }) => {
    const isProductionMode = mode === 'prod';
    const envConfig = isProductionMode ? require('./webpack.prod.config') : require('./webpack.dev.config');

    return merge(baseConfig, envConfig);
};
