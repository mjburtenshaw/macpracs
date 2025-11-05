/**
 * GitHub authentication command
 * Authenticate new GitHub accounts via gh CLI
 */

import { Command } from 'commander';
import inquirer from 'inquirer';
import { execSync } from 'child_process';
import {
  getGitHubAccounts,
  saveGitHubAccountConfig,
  getCurrentGitConfig,
  type GitHubAccountConfig,
} from '../../lib/github';
import { createLogger, type CommandOptions, GitHubAuthOptions } from '../../lib';

export function registerAuthCommand(github: Command): void {
  // macpracs github auth [options]
  github
    .command('auth')
    .description('Authenticate a new GitHub account')
    .option('-w, --web', 'Authenticate via web browser (default)', true)
    .option('-t, --with-token', 'Authenticate with a token from stdin')
    .option('-H, --hostname <hostname>', 'GitHub hostname for enterprise (defaults to github.com)')
    .action(async (options: GitHubAuthOptions) => {
      const globalOpts = github.parent?.opts() as CommandOptions;
      const logger = createLogger(globalOpts?.verbose, globalOpts?.quiet);

      try {
        // Get accounts before authentication
        const accountsBefore = getGitHubAccounts();
        const usernamesBefore = new Set(
          accountsBefore.map((a) => `${a.username}@${a.hostname}`)
        );

        logger.log('\n🔑 Authenticating with GitHub...\n');

        // Build gh auth login command
        let authCmd = 'gh auth login';

        if (options.withToken) {
          authCmd += ' --with-token';
        } else {
          authCmd += ' --web';
        }

        if (options.hostname) {
          authCmd += ` --hostname ${options.hostname}`;
        }

        // Run gh auth login interactively
        try {
          execSync(authCmd, { stdio: 'inherit' });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
          logger.error('Authentication failed');
          process.exit(1);
        }

        logger.log('');
        logger.success('Authentication successful!\n');

        // Get accounts after authentication to detect new account
        const accountsAfter = getGitHubAccounts();
        const newAccounts = accountsAfter.filter(
          (a) => !usernamesBefore.has(`${a.username}@${a.hostname}`)
        );

        if (newAccounts.length === 0) {
          logger.warn('No new account detected. You may have re-authenticated an existing account.');
          return;
        }

        // Get the newly added account
        const newAccount = newAccounts[0];
        logger.log(`New account detected: ${newAccount.username}@${newAccount.hostname}\n`);

        // Ask if user wants to configure account details
        const { configure } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'configure',
            message: 'Would you like to configure git user details for this account?',
            default: true,
          },
        ]);

        if (!configure) {
          logger.log('\nYou can configure this account later with:');
          logger.log(`  macpracs github accounts add ${newAccount.username}\n`);
          return;
        }

        // Get current git config as defaults
        const currentGitConfig = getCurrentGitConfig();

        // Prompt for name and email
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'name',
            message: 'Git user name:',
            default: currentGitConfig?.name || '',
            validate: (input: string) => {
              if (!input.trim()) {
                return 'Name is required';
              }
              return true;
            },
          },
          {
            type: 'input',
            name: 'email',
            message: 'Git user email:',
            default: currentGitConfig?.email || '',
            validate: (input: string) => {
              if (!input.trim()) {
                return 'Email is required';
              }
              if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.trim())) {
                return 'Invalid email format';
              }
              return true;
            },
          },
        ]);

        // Save account configuration
        const accountConfig: GitHubAccountConfig = {
          username: newAccount.username,
          hostname: newAccount.hostname,
          name: answers.name,
          email: answers.email,
        };

        saveGitHubAccountConfig(accountConfig);

        logger.success(
          `Account configuration saved for ${newAccount.username}@${newAccount.hostname}`
        );
        logger.log(`  Name:  ${answers.name}`);
        logger.log(`  Email: ${answers.email}\n`);
        logger.log('Switch to this account with:');
        logger.log(`  macpracs github login ${newAccount.username}\n`);
      } catch (error) {
        logger.error('Authentication failed', error as Error);
        process.exit(1);
      }
    });
}
