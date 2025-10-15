/**
 * Secret file management for passwords and credentials
 *
 * Discovers and reads secret files from ~/.secrets directory
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, relative } from 'path';
import { homedir } from 'os';

const SECRETS_DIR = join(homedir(), '.secrets');

/**
 * Recursively list all files in a directory
 */
function listFilesRecursive(dir: string, baseDir: string = dir): string[] {
  if (!existsSync(dir)) {
    return [];
  }

  let files: string[] = [];

  try {
    const items = readdirSync(dir);

    for (const item of items) {
      const fullPath = join(dir, item);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        // Recursively scan subdirectories
        files = files.concat(listFilesRecursive(fullPath, baseDir));
      } else if (stat.isFile()) {
        // Store relative path from base directory
        const relativePath = relative(baseDir, fullPath);
        files.push(relativePath);
      }
    }
  } catch (error) {
    console.error(`Failed to list files in ${dir}:`, error);
  }

  return files;
}

/**
 * List all secret files in ~/.secrets (recursive)
 */
export function listSecretFiles(): string[] {
  if (!existsSync(SECRETS_DIR)) {
    return [];
  }

  return listFilesRecursive(SECRETS_DIR);
}

/**
 * Read a secret file's content
 * @param filename - Relative path from ~/.secrets (e.g., "mango-amqp-password" or "aws/key")
 */
export function readSecret(filename: string): string {
  const secretPath = join(SECRETS_DIR, filename);

  if (!existsSync(secretPath)) {
    throw new Error(`Secret file not found: ${secretPath}`);
  }

  try {
    // Read and trim any whitespace/newlines
    return readFileSync(secretPath, 'utf-8').trim();
  } catch (error: any) {
    throw new Error(`Failed to read secret file ${secretPath}: ${error.message}`);
  }
}

/**
 * Get the secrets directory path
 */
export function getSecretsDir(): string {
  return SECRETS_DIR;
}

/**
 * Check if secrets directory exists
 */
export function secretsExist(): boolean {
  return existsSync(SECRETS_DIR);
}
