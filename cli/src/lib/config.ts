/**
 * Configuration management for user preferences
 *
 * Uses XDG Base Directory Specification for config storage.
 * Config files belong in XDG_CONFIG_HOME (~/.config/macpracs by default).
 * Falls back to ~/.config if XDG_CONFIG_HOME is not set.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Config } from './types';

// Use XDG_CONFIG_HOME per XDG Base Directory Specification
// Configuration files belong in XDG_CONFIG_HOME
// Falls back to ~/.config if XDG_CONFIG_HOME is not set
const XDG_CONFIG_HOME = process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config');
const CONFIG_DIR = path.join(XDG_CONFIG_HOME, 'macpracs');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

/**
 * Ensure config directory exists
 */
function ensureConfigDir(): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

/**
 * Load configuration from disk
 */
export function loadConfig(): Config {
  ensureConfigDir();

  if (!fs.existsSync(CONFIG_FILE)) {
    return {};
  }

  try {
    const content = fs.readFileSync(CONFIG_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Failed to load config, using defaults:', error);
    return {};
  }
}

/**
 * Save configuration to disk
 */
export function saveConfig(config: Config): void {
  ensureConfigDir();

  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to save config:', error);
    throw error;
  }
}

/**
 * Update a specific config value
 */
export function updateConfig(key: keyof Config, value: unknown): void {
  const config = loadConfig();
  (config[key] as unknown) = value;
  saveConfig(config);
}

/**
 * Get a specific config value
 */
export function getConfig<K extends keyof Config>(key: K): Config[K] | undefined {
  const config = loadConfig();
  return config[key];
}

/**
 * Get config file path (useful for debugging)
 */
export function getConfigPath(): string {
  return CONFIG_FILE;
}

/**
 * Reset config to defaults
 */
export function resetConfig(): void {
  if (fs.existsSync(CONFIG_FILE)) {
    fs.unlinkSync(CONFIG_FILE);
  }
}
