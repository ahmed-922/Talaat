const { getDefaultConfig } = require('@expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

// Remove the custom extension push to test if it's causing the issue
// defaultConfig.resolver.sourceExts.push('cjs');

module.exports = defaultConfig;
