/**
 * GitHub command registration
 * Creates the main github command and registers all sub-commands
 */

import { Command } from 'commander';
import { registerPRActivityCommand } from './pr-activity';
import { registerActionsCommands } from './actions';
import { registerAuthCommand } from './auth';
import { registerLoginCommand } from './login';
import { registerAccountsCommands } from './accounts';
import { githubWizard } from '../../wizards/github-wizard';

export function registerGitHubCommands(program: Command): void {
  // Create the main github command
  const github = program
    .command('github')
    .description('GitHub operations (PRs, issues, repos, Actions)')
    .action(async () => {
      // Launch wizard when called without arguments
      await githubWizard();
    });

  // Register all GitHub sub-commands
  registerAuthCommand(github);
  registerLoginCommand(github);
  registerAccountsCommands(github);
  registerPRActivityCommand(github);
  registerActionsCommands(github);
}
