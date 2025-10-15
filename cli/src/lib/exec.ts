/**
 * Execute bash scripts with proper error handling and stdio preservation
 */

import { spawn, SpawnOptionsWithoutStdio } from 'child_process';
import { ExecResult } from './types';
import { Logger } from './logger';

export interface ExecOptions extends SpawnOptionsWithoutStdio {
  silent?: boolean;
  verbose?: boolean;
  captureOutput?: boolean;
}

/**
 * Execute a bash script and preserve stdio streams
 * Returns exit code and optionally captures output
 */
export function execScript(
  scriptPath: string,
  args: string[] = [],
  options: ExecOptions = {}
): Promise<ExecResult> {
  const { silent = false, verbose = false, captureOutput = true, ...spawnOptions } = options;

  const logger = new Logger(verbose, silent);

  return new Promise((resolve) => {
    logger.info(`Executing: ${scriptPath} ${args.join(' ')}`);

    const child = spawn(scriptPath, args, {
      ...spawnOptions,
      stdio: captureOutput ? 'pipe' : 'inherit',
    });

    let stdout = '';
    let stderr = '';

    if (captureOutput && child.stdout) {
      child.stdout.on('data', (data) => {
        const text = data.toString();
        stdout += text;
        if (!silent) {
          process.stdout.write(text);
        }
      });
    }

    if (captureOutput && child.stderr) {
      child.stderr.on('data', (data) => {
        const text = data.toString();
        stderr += text;
        if (!silent) {
          process.stderr.write(text);
        }
      });
    }

    child.on('error', (error) => {
      logger.error(`Failed to execute script: ${scriptPath}`, error);
      resolve({
        exitCode: 1,
        stdout,
        stderr: stderr || error.message,
      });
    });

    child.on('close', (code) => {
      const exitCode = code ?? 1;

      if (exitCode === 0) {
        logger.success(`Script completed successfully`);
      } else {
        logger.error(`Script exited with code ${exitCode}`);
      }

      resolve({
        exitCode,
        stdout,
        stderr,
      });
    });
  });
}

/**
 * Execute a simple command (not a script)
 */
export function execCommand(
  command: string,
  args: string[] = [],
  options: ExecOptions = {}
): Promise<ExecResult> {
  return execScript(command, args, options);
}
