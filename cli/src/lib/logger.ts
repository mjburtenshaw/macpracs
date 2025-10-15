/**
 * UNIX-style logger: silent on success, verbose on failure
 */

import chalk from 'chalk';
import { LogLevel } from './types';

export class Logger {
  private level: LogLevel;

  constructor(verbose = false, quiet = false) {
    this.level = {
      silent: quiet,
      verbose: verbose && !quiet,
    };
  }

  /**
   * Log success message (only in verbose mode)
   */
  success(message: string): void {
    if (!this.level.silent && this.level.verbose) {
      console.log(chalk.green('✓'), message);
    }
  }

  /**
   * Log error message (always shown unless quiet)
   */
  error(message: string, error?: Error): void {
    if (!this.level.silent) {
      console.error(chalk.red('✗'), message);
      if (error && this.level.verbose) {
        console.error(chalk.red(error.stack || error.message));
      }
    }
  }

  /**
   * Log info message (only in verbose mode)
   */
  info(message: string): void {
    if (!this.level.silent && this.level.verbose) {
      console.log(chalk.blue('ℹ'), message);
    }
  }

  /**
   * Log warning message (only in verbose mode)
   */
  warn(message: string): void {
    if (!this.level.silent && this.level.verbose) {
      console.warn(chalk.yellow('⚠'), message);
    }
  }

  /**
   * Log raw message (respects quiet flag)
   */
  log(message: string): void {
    if (!this.level.silent) {
      console.log(message);
    }
  }

  /**
   * Output to stdout (for piping, ignores verbose/quiet)
   */
  output(data: string | Record<string, unknown>): void {
    if (typeof data === 'string') {
      console.log(data);
    } else {
      console.log(JSON.stringify(data, null, 2));
    }
  }
}

// Default logger instance
export const logger = new Logger();

// Create logger with specific options
export function createLogger(verbose = false, quiet = false): Logger {
  return new Logger(verbose, quiet);
}
