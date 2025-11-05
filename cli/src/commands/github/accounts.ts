/**
 * GitHub accounts management commands
 * Manage GitHub account configurations (name, email) for login automation
 */

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import {
  loadGitHubAccountsConfig,
  saveGitHubAccountConfig,
  removeGitHubAccountConfig,
  getGitHubAccounts,
  getCurrentGitConfig,
  type GitHubAccountConfig,
} from '../../lib/github';
import { createLogger, type CommandOptions } from '../../lib';

export function registerAccountsCommands(github: Command): void {
  // Create accounts subcommand group
  const accounts = github
    .command('accounts')
    .description('Manage GitHub account configurations');

  // macpracs github accounts list
  accounts
    .command('list')
    .description('List configured GitHub accounts')
    .action(async () => {
      const globalOpts = github.parent?.opts() as CommandOptions;
      const logger = createLogger(globalOpts?.verbose, globalOpts?.quiet);

      try {
        const accountsMap = loadGitHubAccountsConfig();

        if (accountsMap.size === 0) {
          logger.log('No GitHub accounts configured.');
          logger.log('\nAdd an account with: macpracs github accounts add');
          return;
        }

        logger.log(chalk.bold('\nConfigured GitHub Accounts:\n'));

        const accounts = Array.from(accountsMap.values());
        for (const account of accounts) {
          logger.log(chalk.cyan(`  ${account.username}@${account.hostname}`));
          logger.log(chalk.gray(`    Name:  ${account.name}`));
          logger.log(chalk.gray(`    Email: ${account.email}`));
          logger.log('');
        }

        logger.log(
          chalk.gray(
            `Total: ${accounts.length} account${accounts.length === 1 ? '' : 's'}`
          )
        );
      } catch (error) {
        logger.error('Failed to list accounts', error as Error);
        process.exit(1);
      }
    });

  // macpracs github accounts add [username]
  accounts
    .command('add [username]')
    .description('Add or update a GitHub account configuration')
    .option('-H, --hostname <hostname>', 'GitHub hostname (defaults to github.com)', 'github.com')
    .option('-n, --name <name>', 'Git user name')
    .option('-e, --email <email>', 'Git user email')
    .action(async (username: string | undefined, options: any) => {
      const globalOpts = github.parent?.opts() as CommandOptions;
      const logger = createLogger(globalOpts?.verbose, globalOpts?.quiet);

      try {
        // Get authenticated accounts
        const ghAccounts = getGitHubAccounts();

        if (ghAccounts.length === 0) {
          logger.error('No authenticated GitHub accounts found. Run: gh auth login');
          process.exit(1);
        }

        let selectedUsername: string;
        let hostname: string = options.hostname || 'github.com';

        // If username not provided, prompt for selection
        if (!username) {
          const choices = ghAccounts.map((account) => ({
            name: `${account.username}@${account.hostname}${account.isActive ? ' (active)' : ''}`,
            value: { username: account.username, hostname: account.hostname },
          }));

          const answers = await inquirer.prompt([
            {
              type: 'list',
              name: 'account',
              message: 'Select GitHub account to configure:',
              choices,
            },
          ]);

          selectedUsername = answers.account.username;
          hostname = answers.account.hostname;
        } else {
          // Validate username exists in gh CLI
          const account = ghAccounts.find(
            (a) => a.username === username && a.hostname === hostname
          );

          if (!account) {
            logger.error(
              `Account '${username}@${hostname}' not found in gh CLI. Run: gh auth login`
            );
            process.exit(1);
          }

          selectedUsername = username;
        }

        // Get current git config as defaults
        const currentGitConfig = getCurrentGitConfig();

        // Prompt for name and email if not provided via options
        let name = options.name;
        let email = options.email;

        if (!name || !email) {
          const answers = await inquirer.prompt([
            {
              type: 'input',
              name: 'name',
              message: 'Git user name:',
              default: currentGitConfig?.name || '',
              when: !name,
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
              when: !email,
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

          name = name || answers.name;
          email = email || answers.email;
        }

        // Save account configuration
        const accountConfig: GitHubAccountConfig = {
          username: selectedUsername,
          hostname,
          name,
          email,
        };

        saveGitHubAccountConfig(accountConfig);

        logger.success(
          `Account configuration saved for ${selectedUsername}@${hostname}`
        );
        logger.log(chalk.gray(`  Name:  ${name}`));
        logger.log(chalk.gray(`  Email: ${email}`));
        logger.log('');
        logger.log('Use this account with: macpracs github login ' + selectedUsername);
      } catch (error) {
        logger.error('Failed to add account', error as Error);
        process.exit(1);
      }
    });

  // macpracs github accounts remove <username>
  accounts
    .command('remove <username>')
    .description('Remove a GitHub account configuration')
    .option('-H, --hostname <hostname>', 'GitHub hostname (defaults to github.com)', 'github.com')
    .action(async (username: string, options: any) => {
      const globalOpts = github.parent?.opts() as CommandOptions;
      const logger = createLogger(globalOpts?.verbose, globalOpts?.quiet);

      try {
        const hostname = options.hostname || 'github.com';
        const accountsMap = loadGitHubAccountsConfig();
        const key = `${username}@${hostname}`;

        if (!accountsMap.has(key)) {
          logger.error(
            `Account configuration for '${username}@${hostname}' not found.`
          );
          logger.log('\nList configured accounts with: macpracs github accounts list');
          process.exit(1);
        }

        // Confirm deletion
        const answers = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: `Remove account configuration for ${username}@${hostname}?`,
            default: false,
          },
        ]);

        if (!answers.confirm) {
          logger.log('Cancelled');
          return;
        }

        removeGitHubAccountConfig(username, hostname);
        logger.success(`Account configuration removed for ${username}@${hostname}`);
      } catch (error) {
        logger.error('Failed to remove account', error as Error);
        process.exit(1);
      }
    });
}
