/**
 * GitHub login command
 * Switch between authenticated GitHub accounts
 */

import { Command } from 'commander';
import inquirer from 'inquirer';
import {
  getGitHubAccounts,
  switchGitHubAccount,
  getGitHubAccountConfig,
  updateGitConfig,
  getCurrentGitConfig,
  type GitHubAccount,
} from '../../lib/github';
import { createLogger, type CommandOptions, GitHubLoginOptions } from '../../lib';

export function registerLoginCommand(github: Command): void {
  // macpracs github login [username] [options]
  github
    .command('login [username]')
    .description('Switch between authenticated GitHub accounts')
    .option('-H, --hostname <hostname>', 'GitHub hostname (defaults to github.com)', 'github.com')
    .action(async (username: string | undefined, options: GitHubLoginOptions) => {
      const globalOpts = github.parent?.opts() as CommandOptions;
      const logger = createLogger(globalOpts?.verbose, globalOpts?.quiet);

      try {
        // Get list of authenticated accounts
        const accounts = getGitHubAccounts();

        if (accounts.length === 0) {
          logger.error('No authenticated GitHub accounts found. Run: gh auth login');
          process.exit(1);
        }

        let selectedAccount: GitHubAccount;

        // Interactive mode - prompt for account selection
        if (!username) {
          if (accounts.length === 1) {
            // Only one account, use it automatically
            selectedAccount = accounts[0];
            logger.info(`Only one account found: ${selectedAccount.username}`);
          } else {
            // Multiple accounts, prompt for selection
            const choices = accounts.map((account) => ({
              name: `${account.username}@${account.hostname}${account.isActive ? ' (active)' : ''}`,
              value: account,
            }));

            const answers = await inquirer.prompt([
              {
                type: 'list',
                name: 'account',
                message: 'Select GitHub account:',
                choices,
              },
            ]);

            selectedAccount = answers.account;
          }
        } else {
          // Direct mode - find account by username
          const hostname = options.hostname || 'github.com';
          const account = accounts.find((a) => a.username === username && a.hostname === hostname);

          if (!account) {
            logger.error(
              `Account '${username}@${hostname}' not found. Available accounts: ${accounts
                .map((a) => `${a.username}@${a.hostname}`)
                .join(', ')}`
            );
            process.exit(1);
          }

          selectedAccount = account;
        }

        // Check if already active
        if (selectedAccount.isActive) {
          logger.log(`Already logged in as ${selectedAccount.username}@${selectedAccount.hostname}`);

          // Even if already active, update git config if we have stored configuration
          const accountConfig = getGitHubAccountConfig(
            selectedAccount.username,
            selectedAccount.hostname
          );

          if (accountConfig) {
            // Update git config to match stored configuration
            updateGitConfig(accountConfig.name, accountConfig.email);
            logger.log(`Git config: ${accountConfig.name} <${accountConfig.email}>`);
          } else {
            // No stored config, just show current git config
            const currentGitConfig = getCurrentGitConfig();
            if (currentGitConfig) {
              logger.log(`Git config: ${currentGitConfig.name} <${currentGitConfig.email}>`);
            }
          }

          return;
        }

        // Switch gh CLI account
        logger.info(
          `Switching to ${selectedAccount.username}@${selectedAccount.hostname}...`
        );
        await switchGitHubAccount(selectedAccount.username, selectedAccount.hostname);

        // Update git config if account configuration exists
        const accountConfig = getGitHubAccountConfig(
          selectedAccount.username,
          selectedAccount.hostname
        );

        if (accountConfig) {
          logger.info('Updating git config...');
          updateGitConfig(accountConfig.name, accountConfig.email);
          logger.success(
            `Logged in as ${selectedAccount.username}@${selectedAccount.hostname}`
          );
          logger.log(`Git config: ${accountConfig.name} <${accountConfig.email}>`);
        } else {
          logger.success(
            `Logged in as ${selectedAccount.username}@${selectedAccount.hostname}`
          );
          logger.warn(
            `No account configuration found. Git config not updated. Add config with: macpracs github accounts add`
          );

          // Show current git config
          const currentGitConfig = getCurrentGitConfig();
          if (currentGitConfig) {
            logger.log(`Current git config: ${currentGitConfig.name} <${currentGitConfig.email}>`);
          }
        }
      } catch (error) {
        logger.error('Failed to switch GitHub account', error as Error);
        process.exit(1);
      }
    });
}
