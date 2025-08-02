const path = require('path');
const webpack = require('webpack');
const Dotenv = require('dotenv-webpack');

module.exports = {
  mode: 'production',
  entry: './src/index.tsx',
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: '[name].[contenthash].js',
    chunkFilename: '[name].[contenthash].chunk.js',
    clean: true
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
      minSize: 20000,
      maxSize: 250000,
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 10,
          reuseExistingChunk: true,
        },
        ui: {
          test: /[\\/]src[\\/]components[\\/]/,
          name: 'ui-components',
          chunks: 'all',
          priority: 8,
          minChunks: 2,
        },
        services: {
          test: /[\\/]src[\\/]services[\\/]/,
          name: 'services',
          chunks: 'all', 
          priority: 7,
          minChunks: 1,
        },
        utils: {
          test: /[\\/]src[\\/]utils[\\/]/,
          name: 'utils',
          chunks: 'all',
          priority: 6,
          minChunks: 2,
        },
        common: {
          name: 'common',
          minChunks: 3,
          chunks: 'all',
          priority: 5,
          enforce: true,
          reuseExistingChunk: true,
        }
      }
    },
    usedExports: true,
    sideEffects: false,
    providedExports: true,
    mangleExports: 'size',
    removeAvailableModules: true,
    mergeDuplicateChunks: true,
    flagIncludedChunks: true,
    chunkIds: 'deterministic',
    moduleIds: 'deterministic',
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx|mjs)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', {
                targets: {
                  browsers: ['last 2 versions', 'ie >= 11']
                },
                modules: false
              }],
              '@babel/preset-react',
              ['@babel/preset-typescript', { allowNamespaces: true }]
            ],
            plugins: [
              '@babel/plugin-syntax-dynamic-import'
            ]
          }
        }
      },
      {
        test: /\.mjs$/,
        include: /node_modules/,
        type: 'javascript/auto'
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader', 'postcss-loader']
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs'],
    alias: {
      'pdfjs-dist': path.resolve(__dirname, 'node_modules/pdfjs-dist')
    }
  },
  plugins: [
    new webpack.ProvidePlugin({
      process: 'process/browser',
    }),
    new Dotenv(),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production')
    })
  ],
  performance: {
    hints: 'warning',
    maxAssetSize: 300000,
    maxEntrypointSize: 300000
  }
};