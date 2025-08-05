const path = require('path');
const webpack = require('webpack');
const Dotenv = require('dotenv-webpack');

module.exports = {
  mode: 'development',
  entry: './src/index.tsx',
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'bundle.js'
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
              '@babel/preset-react',
              ['@babel/preset-typescript', { allowNamespaces: true }]
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
        test: /\.js$/,
        include: /node_modules\/@sentry/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
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
      'pdfjs-dist': path.resolve(__dirname, 'node_modules/pdfjs-dist'),
      // Fix Sentry ESM module resolution issues
      'process/browser': require.resolve('process/browser.js')
    },
    fallback: {
      "process": require.resolve("process/browser"),
      "buffer": require.resolve("buffer"),
      "util": require.resolve("util"),
      "os": false,
      "path": false,
      "fs": false
    }
  },
  devServer: {
    static: {
      directory: __dirname + '/public',
    },
    port: 8080,
    hot: true,
    open: true,
    // Development-friendly headers (minimal security for local dev)
    headers: {
      'X-Content-Type-Options': 'nosniff'
    }
  },
  plugins: [
    new webpack.ProvidePlugin({
      process: 'process/browser',
    }),
    new Dotenv(),
    // Fix Sentry ESM module resolution issues
    new webpack.NormalModuleReplacementPlugin(
      /process\/browser$/,
      'process/browser.js'
    )
  ],
};