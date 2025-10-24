/**
 * Context management for multi-job/project configurations
 *
 * Contexts allow macpracs to support multiple jobs (Mango, Halo) or personal projects
 * with different configurations stored in XDG_CONFIG_HOME/macpracs/contexts/
 *
 * Uses XDG Base Directory Specification for config storage.
 * Falls back to ~/.config if XDG_CONFIG_HOME is not set.
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { Context } from './types';

// Use XDG_CONFIG_HOME per XDG Base Directory Specification
// Context files are configuration data
// Falls back to ~/.config if XDG_CONFIG_HOME is not set
const XDG_CONFIG_HOME = process.env.XDG_CONFIG_HOME || join(homedir(), '.config');
const CONTEXTS_DIR = join(XDG_CONFIG_HOME, 'macpracs', 'contexts');

/**
 * Ensure contexts directory exists
 */
function ensureContextsDir(): void {
  // Note: We don't auto-create this directory
  // Users should manually create it and add context files
}

/**
 * List all available context names
 */
export function listContexts(): string[] {
  if (!existsSync(CONTEXTS_DIR)) {
    return [];
  }

  try {
    const files = readdirSync(CONTEXTS_DIR);
    return files
      .filter((file) => file.endsWith('.json') && !file.endsWith('.example'))
      .map((file) => file.replace(/\.json$/, ''));
  } catch (error) {
    console.error('Failed to list contexts:', error);
    return [];
  }
}

/**
 * Load a specific context by name
 */
export function loadContext(name: string): Context {
  const contextPath = join(CONTEXTS_DIR, `${name}.json`);

  if (!existsSync(contextPath)) {
    throw new Error(`Context '${name}' not found at ${contextPath}`);
  }

  try {
    const content = readFileSync(contextPath, 'utf-8');
    const context: Context = JSON.parse(content);

    // Ensure name matches filename
    context.name = name;

    return context;
  } catch (error: any) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in context file ${contextPath}: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Find all contexts that have MQ configuration
 */
export function findContextsWithMQ(): Context[] {
  const contextNames = listContexts();
  const mqContexts: Context[] = [];

  for (const name of contextNames) {
    try {
      const context = loadContext(name);
      if (context.mq) {
        mqContexts.push(context);
      }
    } catch (error) {
      // Skip invalid contexts
      console.error(`Warning: Failed to load context '${name}':`, error);
    }
  }

  return mqContexts;
}

/**
 * Find all contexts that have AWS configuration
 */
export function findContextsWithAWS(): Context[] {
  const contextNames = listContexts();
  const awsContexts: Context[] = [];

  for (const name of contextNames) {
    try {
      const context = loadContext(name);
      if (context.aws) {
        awsContexts.push(context);
      }
    } catch (error) {
      // Skip invalid contexts
      console.error(`Warning: Failed to load context '${name}':`, error);
    }
  }

  return awsContexts;
}

/**
 * Get the contexts directory path
 */
export function getContextsDir(): string {
  return CONTEXTS_DIR;
}

/**
 * Check if contexts directory exists
 */
export function contextsExist(): boolean {
  return existsSync(CONTEXTS_DIR);
}
