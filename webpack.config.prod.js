const path = require('path');
const webpack = require('webpack');
const Dotenv = require('dotenv-webpack');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

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
    minimize: true,
    minimizer: [
      '...',  // Use default minimizers (Terser for JS, CssMinimizerPlugin for CSS)
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
      'pdfjs-dist': path.resolve(__dirname, 'node_modules/pdfjs-dist'),
      'process/browser': require.resolve('process/browser.js')
    },
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
    maxAssetSize: 400000,  // Increased for optimized lazy loading
    maxEntrypointSize: 400000,
    assetFilter: function(assetFilename) {
      // Don't show warnings for source maps and large vendor chunks
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