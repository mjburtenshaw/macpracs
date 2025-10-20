/**
 * GitHub command registration
 * Creates the main github command and registers all sub-commands
 */

import { Command } from 'commander';
import { registerPRActivityCommand } from './pr-activity';

export function registerGitHubCommands(program: Command): void {
  // Create the main github command
  const github = program
    .command('github')
    .description('GitHub operations (PRs, issues, repos)');

  // Register all GitHub sub-commands
  registerPRActivityCommand(github);
}
