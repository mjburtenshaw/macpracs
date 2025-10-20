/**
 * AWS SSO commands
 * Hierarchical structure: macpracs aws sso <operation>
 */

import { Command } from 'commander';
import inquirer from 'inquirer';
import { execSync } from 'child_process';
import { createLogger, getAWSProfiles, CommandOptions } from '../../lib';

export function registerSSOCommands(aws: Command): void {
  const sso = aws
    .command('sso')
    .description('SSO operations (login)');

  registerLoginCommand(sso);
}

// macpracs aws sso login [options]
function registerLoginCommand(sso: Command): void {
  sso
    .command('login')
    .description('Login to AWS SSO with profile selection')
    .option('-p, --profile <profile>', 'AWS CLI profile to use for SSO login')
    .action(async (options: any) => {
      const globalOpts = sso.parent?.parent?.opts() as CommandOptions;
      const logger = createLogger(globalOpts?.verbose, globalOpts?.quiet);

      let profile = options.profile;

      // If no profile provided, prompt for selection
      if (!profile) {
        const profiles = getAWSProfiles();

        const { selectedProfile } = await inquirer.prompt([
          {
            type: 'list',
            name: 'selectedProfile',
            message: 'Select AWS profile for SSO login:',
            choices: profiles.map((p) => ({
              name: p.isDefault ? `${p.name} (default)` : p.name,
              value: p.name,
            })),
            default: process.env.AWS_PROFILE || 'default',
          },
        ]);

        profile = selectedProfile;
      }

      logger.info(`Logging in to AWS SSO with profile: ${profile}`);

      try {
        // Execute aws sso login with inherited stdio for browser interaction
        execSync(`aws sso login --profile ${profile}`, { stdio: 'inherit' });

        logger.success('SSO login completed');
      } catch (error) {
        logger.error('SSO login failed', error as Error);
        process.exit(1);
      }
    });
}
