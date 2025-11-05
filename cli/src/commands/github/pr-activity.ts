/**
 * GitHub PR activity commands
 * Fetches PR description and comments in LLM-optimized markdown format
 */

import { Command } from 'commander';
import path from 'path';
import { execScript, createLogger, CommandOptions } from '../../lib';

const SCRIPT_PATH = path.join(__dirname, '../../../../scripts/github-pr-activity.sh');

export function registerPRActivityCommand(github: Command): void {
  // macpracs github pr-activity <pr-number> [options]
  github
    .command('pr-activity <pr-number>')
    .description('View PR description and comments in markdown format')
    .option('-r, --repo <owner/repo>', 'Repository in owner/repo format (defaults to current repo)')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .action(async (prNumber: string, options: any) => {
      const globalOpts = github.parent?.opts() as CommandOptions;
      const logger = createLogger(globalOpts?.verbose, globalOpts?.quiet);

      const args = [prNumber];
      if (options.repo) {
        args.push(options.repo);
      }

      logger.info(`Fetching PR #${prNumber} activity...`);

      try {
        const result = await execScript(SCRIPT_PATH, args, {
          captureOutput: false, // Let bash script handle output to stdout
        });

        if (result.exitCode !== 0) {
          logger.error(`Failed to fetch PR activity with exit code ${result.exitCode}`);
          process.exit(result.exitCode);
        }

        logger.success('PR activity fetched successfully');
      } catch (error) {
        logger.error('Failed to fetch PR activity', error as Error);
        process.exit(1);
      }
    });
}
