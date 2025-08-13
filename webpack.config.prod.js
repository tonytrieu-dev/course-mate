const path = require('path');
const webpack = require('webpack');
const Dotenv = require('dotenv-webpack');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
// --- FIX 1: Import the MiniCssExtractPlugin for production CSS handling ---
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  mode: 'production',
  entry: './src/index.tsx',
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'static/js/[name].[contenthash:8].js',
    chunkFilename: 'static/js/[name].[contenthash:8].chunk.js',
    assetModuleFilename: 'static/media/[name].[hash][ext]',
    clean: true
  },
  optimization: {
    // --- FIX 2: Replaced the complex manual chunking with webpack's modern, optimized default ---
    // This is more efficient and creates a better bundle distribution automatically.
    splitChunks: {
      chunks: 'all',
    },
    // Keep the rest of your excellent optimization settings
    usedExports: true,
    sideEffects: false,
    providedExports: true,
    mangleExports: 'size',
    removeAvailableModules: true,
    mergeDuplicateChunks: true,
    flagIncludedChunks: true,
    chunkIds: 'deterministic',
    moduleIds: 'deterministic',
    minimize: true,
    minimizer: [
      '...', // This tells webpack to use its default minimizers (TerserPlugin for JS)
      // Note: CssMinimizerPlugin will be needed if you add a CSS preprocessor
    ]
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
              ['@babel/preset-env', { targets: 'defaults' }], // Modern browsers, as you requested
              '@babel/preset-react',
              ['@babel/preset-typescript', { allowNamespaces: true }],
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
        // --- FIX 3: Replaced 'style-loader' with MiniCssExtractPlugin.loader for production ---
        // This extracts CSS into separate files for faster page loads.
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader', 'postcss-loader']
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs'],
    alias: {
      'pdfjs-dist': path.resolve(__dirname, 'node_modules/pdfjs-dist'),
      'process/browser': require.resolve('process/browser.js')
    },
    // NOTE: These polyfills are a major source of bundle bloat.
    // Long-term, investigate which dependencies require them and find modern browser alternatives.
    fallback: {
      "process": require.resolve("process/browser.js"),
      "buffer": require.resolve("buffer"),
      "util": require.resolve("util"),
      "stream": require.resolve("stream-browserify"),
      "path": require.resolve("path-browserify"),
      "os": require.resolve("os-browserify/browser"),
      "crypto": require.resolve("crypto-browserify")
    }
  },
  plugins: [
    // --- FIX 4: Added the MiniCssExtractPlugin to the plugins array ---
    new MiniCssExtractPlugin({
      filename: 'static/css/[name].[contenthash:8].css',
      chunkFilename: 'static/css/[name].[contenthash:8].chunk.css',
    }),
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
    }),
    new Dotenv(),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production')
    }),
    ...(process.argv.includes('--analyze') ? [
      new BundleAnalyzerPlugin({
        analyzerMode: 'server',
        openAnalyzer: true,
        generateStatsFile: true,
        statsFilename: 'bundle-stats.json'
      })
    ] : [])
  ],
  performance: {
    hints: 'warning',
    // --- FIX 5: Slightly adjusted asset size limits for a better warning threshold ---
    maxAssetSize: 250000,
    maxEntrypointSize: 250000,
    assetFilter: function(assetFilename) {
      return !assetFilename.endsWith('.map') && !assetFilename.includes('vendors');
    }
  },
  stats: {
    chunks: true,
    chunkModules: false,
    chunkOrigins: false,
    modules: false,
    optimizationBailout: true,
    reasons: false,
    source: false,
    usedExports: true
  }
};