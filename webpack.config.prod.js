const path = require('path');
const webpack = require('webpack');
const Dotenv = require('dotenv-webpack');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
// --- CRITICAL FIX: Import the plugin that creates your index.html file ---
const HtmlWebpackPlugin = require('html-webpack-plugin');

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
  // Performance and timeout optimizations
  performance: {
    hints: false,
    maxEntrypointSize: 512000,
    maxAssetSize: 512000,
  },
  cache: {
    type: 'filesystem',
    buildDependencies: {
      config: [__filename],
    },
    // Vercel-specific cache optimizations
    maxMemoryGenerations: 1,
  },
  // AGGRESSIVE TIMEOUT PREVENTION FOR VERCEL
  watchOptions: {
    ignored: /node_modules/,
    poll: false,
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
      maxSize: 200000, // Prevent huge chunks that hang Vercel
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          maxSize: 200000,
        },
        reactRouter: {
          test: /[\\/]node_modules[\\/]react-router[\\/]/,
          name: 'react-router',
          chunks: 'all',
          priority: 10,
        },
      },
    },
    usedExports: true,
    minimize: true,
    minimizer: ['...'],
    // AGGRESSIVE VERCEL OPTIMIZATIONS
    sideEffects: false,
    removeAvailableModules: false,
    removeEmptyChunks: false,
    mergeDuplicateChunks: false,
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
    alias: {
      // AGGRESSIVE REACT ROUTER V7 FIXES FOR VERCEL
      'process/browser': require.resolve('process/browser.js'),
      'react-router': path.resolve(__dirname, 'node_modules/react-router/dist/production'),
    },
    fallback: {
      "process": require.resolve("process/browser.js"),
      "buffer": require.resolve("buffer"),
      "util": require.resolve("util"),
      "stream": require.resolve("stream-browserify"),
      "path": require.resolve("path-browserify"),
      "os": require.resolve("os-browserify/browser"),
      "crypto": require.resolve("crypto-browserify"),
      "fs": false,
      "net": false,
      "tls": false,
    },
    // Force ESM module resolution for React Router v7
    fullySpecified: false,
  },
  // Suppress React Router dynamic import warnings
  ignoreWarnings: [
    {
      module: /react-router/,
      message: /Critical dependency: the request of a dependency is an expression/,
    },
  ],
  plugins: [
    // --- CRITICAL FIX: Add the HtmlWebpackPlugin to your plugins array ---
    // This tells Webpack to use your public/index.html as a template
    // and inject the final JS and CSS files into it.
    new HtmlWebpackPlugin({
      template: 'public/index.html',
    }),
    new MiniCssExtractPlugin({
      filename: 'static/css/[name].[contenthash:8].css',
      chunkFilename: 'static/css/[name].[contenthash:8].chunk.css',
    }),
    new Dotenv({
      systemvars: true,  // Netlify environment variables take precedence
      silent: true,      // Don't fail if .env file is missing  
      override: false,   // Don't override Netlify's environment variables
    }),
    // Ensure critical environment variables are defined for production
    new webpack.DefinePlugin({
      'process.env.REACT_APP_SUPABASE_URL': JSON.stringify(
        process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL || 'https://adkrfpcmfvqhctlvizxw.supabase.co'
      ),
      'process.env.REACT_APP_SUPABASE_ANON_KEY': JSON.stringify(
        process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFka3JmcGNtZnZxaGN0bHZpenh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM0ODM5ODYsImV4cCI6MjA1OTA1OTk4Nn0.avFXOP9di5ehRMdqwvF38uSmyCFAXGJyjzdAe5zne6A'
      ),
      'process.env.NODE_ENV': JSON.stringify('production'),
      'process.env.REACT_APP_BUILD_MODE': JSON.stringify('saas')
    }),
    new webpack.ProvidePlugin({
      process: 'process/browser.js',
      Buffer: ['buffer', 'Buffer'],
    }),
    ...(process.argv.includes('--analyze') ? [new BundleAnalyzerPlugin()] : []),
  ],
};