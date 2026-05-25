import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { displayName, name, version } = require('../package.json') as {
  displayName: string;
  name: string;
  version: string;
};

/**
 * This is the name of the platform that users will use to register the plugin in the Homebridge config.json
 */
export const PLATFORM_NAME = 'knx-weather';

/**
 * This must match the name of your plugin as defined the package.json
 */
export const PLUGIN_NAME = name;
export const PLUGIN_DISPLAY_NAME = displayName;
export const PLUGIN_VERSION = version;
