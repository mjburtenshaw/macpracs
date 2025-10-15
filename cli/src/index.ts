#!/usr/bin/env node

/**
 * macpracs CLI - Personal engineering practices command-line tool
 *
 * UNIX Philosophy:
 * - Silent on success (unless --verbose)
 * - Verbose on failure (unless --quiet)
 * - Chainable with pipes
 * - Proper exit codes
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { readFileSync } from 'fs';
import { join } from 'path';

// Import wizards
import { mainWizard } from './wizards';

// Import command modules
import { registerAWSCommands } from './commands/aws';
import { registerMQCommands } from './commands/mq';
// import { registerGitCommands } from './commands/git';
// import { registerTimestampCommands } from './commands/timestamp';
// import { registerProcedureCommands } from './commands/procedures';

// Read package.json for version
const packageJson = JSON.parse(
  readFileSync(join(__dirname, '../package.json'), 'utf-8')
);

const program = new Command();

program
  .name('macpracs')
  .description('Personal engineering practices CLI tool')
  .version(packageJson.version, '-v, --version', 'Output the current version')
  .option('--verbose', 'Enable verbose output')
  .option('--quiet', 'Suppress all output')
  .option('--json', 'Output in JSON format (for scripting)')
  .option('--config <path>', 'Use alternate config file')
  .helpOption('-h, --help', 'Display help for command');

// Register subcommands
registerAWSCommands(program);
registerMQCommands(program);
// registerGitCommands(program);
// registerTimestampCommands(program);
// registerProcedureCommands(program);

// If no command provided, launch interactive wizard
program.action(async () => {
  // Check if any subcommand was run
  const args = process.argv.slice(2);
  const isSubcommand = args.some((arg) =>
    ['aws', 'mq', 'git', 'timestamp', 'startup', 'shutdown', 'help', '--help', '-h'].includes(arg)
  );

  if (!isSubcommand && args.length === 0) {
    // No command given - launch wizard
    try {
      await mainWizard();
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  }
});

// Parse arguments
program.parse(process.argv);
