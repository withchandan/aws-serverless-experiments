/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable no-undef */
const path = require('path');

const webpack = require('webpack');
const slsw = require('serverless-webpack');
const TerserPlugin = require('terser-webpack-plugin');
const { TsconfigPathsPlugin } = require('tsconfig-paths-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

const tsConfigFile = 'tsconfig.build.json';
const lazyImports = [
  'cache-manager',
  'class-validator',
  'class-transformer',
  '@nestjs/microservices',
  '@nestjs/websockets/socket-module',
  '@nestjs/microservices/microservices-module',
  'class-transformer/storage',
];

module.exports = (() => ({
  entry: slsw.lib.entries,
  devtool: 'source-map',
  target: 'node',
  mode: 'production',
  externalsPresets: { node: true },
  ignoreWarnings: [/^(?!CriticalDependenciesWarning$)/],
  resolve: {
    extensions: ['.ts', '.js'],
    plugins: [new TsconfigPathsPlugin({ configFile: tsConfigFile })],
  },
  module: {
    rules: [
      {
        test: /.ts?$/,
        include: [path.resolve(__dirname, 'src')],
        use: [
          {
            loader: 'ts-loader',
            options: { configFile: tsConfigFile },
          },
        ],
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new webpack.IgnorePlugin({
      checkResource(resource) {
        if (!lazyImports.includes(resource)) {
          return false;
        }
        try {
          require.resolve(resource, { paths: [process.cwd()] });
        } catch (err) {
          return true;
        }

        return false;
      },
    }),
    new ForkTsCheckerWebpackPlugin({
      typescript: { configFile: tsConfigFile },
    }),
  ],
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: { keep_classnames: true, keep_fnames: true },
      }),
    ],
  },
}))();
