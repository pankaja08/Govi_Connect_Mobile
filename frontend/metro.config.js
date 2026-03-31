const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// The 'node:sea' error on Windows is caused by Metro trying to cache 
// Node.js internal modules with illegal characters (like ':').
// We explicitly block these prefixes to prevent Metro from attempting to cache them.

config.resolver.blockList = [
  /.*node_modules\/.*\/node_modules\/.*/, // Dedupe nodes
  /.*node:sea.*/,                         // Specifically block problematic Node internal
  /\.expo\/.*/,                           // Ignore .expo folder
];

module.exports = config;
