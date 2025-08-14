const path = require('path');
const webpack = require('webpack');
const Dotenv = require('dotenv-webpack');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
// --- CRITICAL FIX: Import the plugin to copy your public assets ---
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: './src/index.tsx',
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'static/js/[name].[contenthash:8].js',
    chunkFilename: 'static/js/[name].[contenthash:8].chunk.js',
    assetModuleFilename: 'static/media/[name].[hash][ext]',
    clean: true,
    publicPath: '/',
  },
  // Use Vercel/Netlify's managed cache. No need for manual cache config here.
  optimization: {
    // Rely on Webpack's battle-tested default code splitting. It's simpler and smarter.
    splitChunks: {
      chunks: 'all',
    },
    minimize: true,
    minimizer: ['...'], // Use default TerserPlugin for JS and CssMinimizerPlugin for CSS
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
              ['@babel/preset-env', { targets: 'defaults' }],
              '@babel/preset-react',
              ['@babel/preset-typescript', { allowNamespaces: true }],
            ],
          },
        },
      },
      {
        test: /\.mjs$/,
        include: /node_modules/,
        type: 'javascript/auto',
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader', 'postcss-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs'],
    // NOTE: These polyfills are a major source of bundle bloat.
    // Long-term, investigate which dependencies require them and find modern browser alternatives.
    fallback: {
      "process": require.resolve("process/browser.js"),
      "buffer": require.resolve("buffer"),
      "util": require.resolve("util"),
      "stream": require.resolve("stream-browserify"),
      "path": require.resolve("path-browserify"),
      "os": require.resolve("os-browserify/browser"),
      "crypto": require.resolve("crypto-browserify"),
      "fs": false, // Explicitly disable fs for browser
    },
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'public/index.html',
    }),
    new MiniCssExtractPlugin({
      filename: 'static/css/[name].[contenthash:8].css',
      chunkFilename: 'static/css/[name].[contenthash:8].chunk.css',
    }),
    // --- CRITICAL FIX: Add this plugin to copy your images and other public assets ---
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'public',
          globOptions: {
            // Ignore the index.html template file, as HtmlWebpackPlugin handles it
            ignore: ['**/index.html'],
          },
        },
      ],
    }),
    new webpack.ProvidePlugin({
      process: 'process/browser.js',
      Buffer: ['buffer', 'Buffer'],
    }),
    new Dotenv({
      systemvars: true,
      silent: true,
    }),
    ...(process.argv.includes('--analyze') ? [new BundleAnalyzerPlugin()] : []),
  ],
};