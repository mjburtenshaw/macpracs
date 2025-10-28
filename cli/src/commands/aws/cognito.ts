/**
 * AWS Cognito commands
 * Hierarchical structure: macpracs aws cognito user-pools <operation>
 */

import { Command } from 'commander';
import inquirer from 'inquirer';
import ora from 'ora';
import chalk from 'chalk';
import {
  createLogger,
  CommandOptions,
  ensureAWSCredentials,
  getAWSProfiles,
  listUserPools,
  listUsers,
  deleteUser,
  deleteUsers,
  describeUserPool,
  listUserPoolClients,
  describeUserPoolClient,
  copyToClipboard,
  AWS_REGIONS,
} from '../../lib';

export function registerCognitoCommands(aws: Command): void {
  const cognito = aws.command('cognito').description('Cognito operations');

  const userPools = cognito
    .command('user-pools')
    .description('User pool operations (describe-pool, list-clients, describe-client, list-users, delete-user)');

  registerDescribePoolCommand(userPools);
  registerListClientsCommand(userPools);
  registerDescribeClientCommand(userPools);
  registerListUsersCommand(userPools);
  registerDeleteUserCommand(userPools);
}

// macpracs aws cognito user-pools describe-pool [options]
function registerDescribePoolCommand(userPools: Command): void {
  userPools
    .command('describe-pool')
    .description('Describe a Cognito User Pool')
    .option('--user-pool-id <id>', 'User Pool ID')
    .option('-p, --profile <profile>', 'AWS CLI profile')
    .option('-r, --region <region>', 'AWS region')
    .option(
      '-f, --format <format>',
      'Output format (text or json)',
      'json'
    )
    .action(async (options: any) => {
      const globalOpts = userPools.parent?.parent?.parent?.opts() as CommandOptions;
      const logger = createLogger(globalOpts?.verbose, globalOpts?.quiet);

      try {
        const config = await gatherDescribePoolConfiguration(options, logger);

        // Ensure AWS credentials are valid
        const credentialsValid = await ensureAWSCredentials(config.profile);
        if (!credentialsValid) {
          logger.error('Failed to authenticate with AWS');
          process.exit(1);
        }

        // Fetch user pool details
        const spinner = ora('Fetching user pool details...').start();
        const pool = await describeUserPool(config.userPoolId, config.profile, config.region);
        spinner.stop();

        // Display based on format
        if (config.format === 'json') {
          console.log(JSON.stringify(pool, null, 2));
        } else {
          // Format as markdown
          displayUserPoolMarkdown(pool);
        }

        logger.success('User pool described');
      } catch (error) {
        logger.error('Failed to describe user pool');
        if (error instanceof Error) {
          console.error(chalk.red(`\nError: ${error.message}\n`));
        }
        process.exit(1);
      }
    });
}

// macpracs aws cognito user-pools list-clients [options]
function registerListClientsCommand(userPools: Command): void {
  userPools
    .command('list-clients')
    .description('List app clients in a Cognito User Pool')
    .option('--user-pool-id <id>', 'User Pool ID')
    .option('-p, --profile <profile>', 'AWS CLI profile')
    .option('-r, --region <region>', 'AWS region')
    .option(
      '-f, --format <format>',
      'Output format (text or json)',
      'json'
    )
    .action(async (options: any) => {
      const globalOpts = userPools.parent?.parent?.parent?.opts() as CommandOptions;
      const logger = createLogger(globalOpts?.verbose, globalOpts?.quiet);

      try {
        const config = await gatherListClientsConfiguration(options, logger);

        // Ensure AWS credentials are valid
        const credentialsValid = await ensureAWSCredentials(config.profile);
        if (!credentialsValid) {
          logger.error('Failed to authenticate with AWS');
          process.exit(1);
        }

        // Fetch app clients
        const spinner = ora('Fetching app clients...').start();
        const clients = await listUserPoolClients(config.userPoolId, config.profile, config.region);
        spinner.stop();

        if (clients.length === 0) {
          console.log(chalk.yellow('\nNo app clients found in this user pool\n'));
          return;
        }

        // Display based on format
        if (config.format === 'json') {
          console.log(JSON.stringify(clients, null, 2));
        } else {
          // Format as text
          console.log(chalk.bold(`\nFound ${clients.length} app client(s):\n`));
          clients.forEach((client) => {
            console.log(`${chalk.cyan(client.clientName)}`);
            console.log(`  ${chalk.gray('Client ID:')} ${chalk.white(client.clientId)}`);
            console.log();
          });
        }

        logger.success('App clients listed');
      } catch (error) {
        logger.error('Failed to list app clients');
        if (error instanceof Error) {
          console.error(chalk.red(`\nError: ${error.message}\n`));
        }
        process.exit(1);
      }
    });
}

// macpracs aws cognito user-pools describe-client [options]
function registerDescribeClientCommand(userPools: Command): void {
  userPools
    .command('describe-client')
    .description('Describe a Cognito User Pool app client')
    .option('--user-pool-id <id>', 'User Pool ID')
    .option('--client-id <id>', 'Client ID')
    .option('-p, --profile <profile>', 'AWS CLI profile')
    .option('-r, --region <region>', 'AWS region')
    .option(
      '-f, --format <format>',
      'Output format (text or json)',
      'json'
    )
    .option('-c, --copy', 'Copy Client ID to clipboard', false)
    .action(async (options: any) => {
      const globalOpts = userPools.parent?.parent?.parent?.opts() as CommandOptions;
      const logger = createLogger(globalOpts?.verbose, globalOpts?.quiet);

      try {
        const config = await gatherDescribeClientConfiguration(options, logger);

        // Ensure AWS credentials are valid
        const credentialsValid = await ensureAWSCredentials(config.profile);
        if (!credentialsValid) {
          logger.error('Failed to authenticate with AWS');
          process.exit(1);
        }

        // Fetch client details
        const spinner = ora('Fetching client details...').start();
        const client = await describeUserPoolClient(
          config.userPoolId,
          config.clientId,
          config.profile,
          config.region
        );
        spinner.stop();

        // Display based on format
        if (config.format === 'json') {
          console.log(JSON.stringify(client, null, 2));
        } else {
          // Format as markdown
          displayClientMarkdown(client);
        }

        // Copy to clipboard if requested
        if (config.copy) {
          copyToClipboard(client.ClientId);
          console.log(chalk.green('✓ Client ID copied to clipboard\n'));
        }

        logger.success('Client described');
      } catch (error) {
        logger.error('Failed to describe client');
        if (error instanceof Error) {
          console.error(chalk.red(`\nError: ${error.message}\n`));
        }
        process.exit(1);
      }
    });
}

// macpracs aws cognito user-pools list-users [options]
function registerListUsersCommand(userPools: Command): void {
  userPools
    .command('list-users')
    .description('List users in a Cognito User Pool')
    .option('--user-pool-id <id>', 'User Pool ID')
    .option('--status <status>', 'Filter by status (CONFIRMED, UNCONFIRMED, etc.)')
    .option('-p, --profile <profile>', 'AWS CLI profile')
    .option('-r, --region <region>', 'AWS region')
    .action(async (options: any) => {
      const globalOpts = userPools.parent?.parent?.parent?.opts() as CommandOptions;
      const logger = createLogger(globalOpts?.verbose, globalOpts?.quiet);

      try {
        const config = await gatherListUsersConfiguration(options, logger);

        // Ensure AWS credentials are valid
        const credentialsValid = await ensureAWSCredentials(config.profile);
        if (!credentialsValid) {
          logger.error('Failed to authenticate with AWS');
          process.exit(1);
        }

        // Fetch and display users
        const spinner = ora('Fetching users...').start();
        const users = await listUsers(
          config.userPoolId,
          config.profile,
          config.region,
          config.statusFilter
        );
        spinner.stop();

        if (users.length === 0) {
          console.log(
            chalk.yellow(
              `\nNo users found${config.statusFilter ? ` with status ${config.statusFilter}` : ''}\n`
            )
          );
          return;
        }

        // Display users with full details
        console.log(chalk.bold(`\nFound ${users.length} user(s):\n`));
        users.forEach((user) => {
          const email = user.email || 'N/A';
          const date = new Date(user.userCreateDate).toLocaleString();
          console.log(
            `${chalk.cyan(email)} | ${chalk.white(user.username)} | ${getStatusColor(user.status)} | Created: ${chalk.gray(date)}`
          );
        });
        console.log(); // Empty line at the end

        logger.success('Users listed');
      } catch (error) {
        logger.error('Failed to list users');
        if (error instanceof Error) {
          console.error(chalk.red(`\nError: ${error.message}\n`));
        }
        process.exit(1);
      }
    });
}

// macpracs aws cognito user-pools delete-user [options]
function registerDeleteUserCommand(userPools: Command): void {
  userPools
    .command('delete-user')
    .description('Delete user(s) from a Cognito User Pool')
    .option('--user-pool-id <id>', 'User Pool ID')
    .option('--username <username>', 'Username to delete')
    .option('-p, --profile <profile>', 'AWS CLI profile')
    .option('-r, --region <region>', 'AWS region')
    .action(async (options: any) => {
      const globalOpts = userPools.parent?.parent?.parent?.opts() as CommandOptions;
      const logger = createLogger(globalOpts?.verbose, globalOpts?.quiet);

      try {
        const config = await gatherDeleteUserConfiguration(options, logger);

        // Ensure AWS credentials are valid
        const credentialsValid = await ensureAWSCredentials(config.profile);
        if (!credentialsValid) {
          logger.error('Failed to authenticate with AWS');
          process.exit(1);
        }

        // Execute deletion(s)
        if (config.usernames.length === 1) {
          // Single user deletion
          const spinner = ora(`Deleting user ${config.usernames[0]}...`).start();
          await deleteUser(config.userPoolId, config.usernames[0], config.profile, config.region);
          spinner.stop();
          console.log(chalk.green(`\n✓ User ${config.usernames[0]} deleted successfully\n`));
        } else {
          // Bulk deletion
          console.log(chalk.blue(`\nDeleting ${config.usernames.length} users...\n`));
          const failures = await deleteUsers(
            config.userPoolId,
            config.usernames,
            config.profile,
            config.region
          );

          const successCount = config.usernames.length - failures.length;
          if (failures.length === 0) {
            console.log(chalk.green(`\n✓ All ${successCount} users deleted successfully\n`));
          } else {
            console.log(
              chalk.yellow(`\n⚠ ${successCount} users deleted, ${failures.length} failed:\n`)
            );
            failures.forEach((f) => {
              console.log(chalk.red(`  × ${f.username}: ${f.error}`));
            });
            console.log();
          }
        }

        logger.success('Delete operation completed');
      } catch (error) {
        logger.error('Failed to delete user(s)');
        if (error instanceof Error) {
          console.error(chalk.red(`\nError: ${error.message}\n`));
        }
        process.exit(1);
      }
    });
}

// Helper function to gather list-users configuration
async function gatherListUsersConfiguration(
  options: any,
  logger: any
): Promise<{ userPoolId: string; profile: string; region: string; statusFilter?: string }> {
  let { userPoolId, profile, region, status: statusFilter } = options;

  // Select profile if not provided
  if (!profile) {
    const profiles = getAWSProfiles();
    const defaultProfile = profiles.find((p) => p.isDefault);

    if (profiles.length === 1) {
      profile = profiles[0].name;
      logger.info(`Using AWS profile: ${profile}`);
    } else {
      const answer = await inquirer.prompt([
        {
          type: 'list',
          name: 'profile',
          message: 'Select AWS profile:',
          choices: profiles.map((p) => ({
            name: p.isDefault ? `${p.name} (default)` : p.name,
            value: p.name,
          })),
          default: defaultProfile?.name,
        },
      ]);
      profile = answer.profile;
    }
  }

  // Select region if not provided
  if (!region) {
    const answer = await inquirer.prompt([
      {
        type: 'list',
        name: 'region',
        message: 'Select AWS region:',
        choices: AWS_REGIONS,
        default: 'us-east-1',
      },
    ]);
    region = answer.region;
  }

  // Select user pool if not provided
  if (!userPoolId) {
    const spinner = ora('Fetching user pools...').start();
    const pools = await listUserPools(profile, region);
    spinner.stop();

    if (pools.length === 0) {
      throw new Error('No user pools found in this region');
    }

    const answer = await inquirer.prompt([
      {
        type: 'list',
        name: 'userPoolId',
        message: 'Select User Pool:',
        choices: pools.map((pool) => ({
          name: `${pool.name} (${pool.id})`,
          value: pool.id,
        })),
      },
    ]);
    userPoolId = answer.userPoolId;
  }

  // Select status filter if not provided
  if (!statusFilter) {
    const answer = await inquirer.prompt([
      {
        type: 'list',
        name: 'statusFilter',
        message: 'Filter by status:',
        choices: [
          { name: 'All users', value: undefined },
          { name: 'CONFIRMED', value: 'CONFIRMED' },
          { name: 'UNCONFIRMED', value: 'UNCONFIRMED' },
          { name: 'ARCHIVED', value: 'ARCHIVED' },
          { name: 'COMPROMISED', value: 'COMPROMISED' },
          { name: 'UNKNOWN', value: 'UNKNOWN' },
          { name: 'RESET_REQUIRED', value: 'RESET_REQUIRED' },
          { name: 'FORCE_CHANGE_PASSWORD', value: 'FORCE_CHANGE_PASSWORD' },
        ],
      },
    ]);
    statusFilter = answer.statusFilter;
  }

  return { userPoolId, profile, region, statusFilter };
}

// Helper function to gather delete-user configuration
async function gatherDeleteUserConfiguration(
  options: any,
  logger: any
): Promise<{ userPoolId: string; usernames: string[]; profile: string; region: string }> {
  let { userPoolId, profile, region } = options;
  const { username } = options;

  // Select profile if not provided
  if (!profile) {
    const profiles = getAWSProfiles();
    const defaultProfile = profiles.find((p) => p.isDefault);

    if (profiles.length === 1) {
      profile = profiles[0].name;
      logger.info(`Using AWS profile: ${profile}`);
    } else {
      const answer = await inquirer.prompt([
        {
          type: 'list',
          name: 'profile',
          message: 'Select AWS profile:',
          choices: profiles.map((p) => ({
            name: p.isDefault ? `${p.name} (default)` : p.name,
            value: p.name,
          })),
          default: defaultProfile?.name,
        },
      ]);
      profile = answer.profile;
    }
  }

  // Select region if not provided
  if (!region) {
    const answer = await inquirer.prompt([
      {
        type: 'list',
        name: 'region',
        message: 'Select AWS region:',
        choices: AWS_REGIONS,
        default: 'us-east-1',
      },
    ]);
    region = answer.region;
  }

  // Select user pool if not provided
  if (!userPoolId) {
    const spinner = ora('Fetching user pools...').start();
    const pools = await listUserPools(profile, region);
    spinner.stop();

    if (pools.length === 0) {
      throw new Error('No user pools found in this region');
    }

    const answer = await inquirer.prompt([
      {
        type: 'list',
        name: 'userPoolId',
        message: 'Select User Pool:',
        choices: pools.map((pool) => ({
          name: `${pool.name} (${pool.id})`,
          value: pool.id,
        })),
      },
    ]);
    userPoolId = answer.userPoolId;
  }

  // Select user(s) if not provided
  let usernames: string[] = [];
  if (username) {
    usernames = [username];
  } else {
    // First, ask for status filter
    const filterAnswer = await inquirer.prompt([
      {
        type: 'list',
        name: 'statusFilter',
        message: 'Filter users by status:',
        choices: [
          { name: 'All users', value: undefined },
          { name: 'CONFIRMED', value: 'CONFIRMED' },
          { name: 'UNCONFIRMED', value: 'UNCONFIRMED' },
          { name: 'ARCHIVED', value: 'ARCHIVED' },
          { name: 'COMPROMISED', value: 'COMPROMISED' },
          { name: 'UNKNOWN', value: 'UNKNOWN' },
          { name: 'RESET_REQUIRED', value: 'RESET_REQUIRED' },
          { name: 'FORCE_CHANGE_PASSWORD', value: 'FORCE_CHANGE_PASSWORD' },
        ],
      },
    ]);

    // Fetch users
    const spinner = ora('Fetching users...').start();
    const users = await listUsers(userPoolId, profile, region, filterAnswer.statusFilter);
    spinner.stop();

    if (users.length === 0) {
      throw new Error(
        `No users found${filterAnswer.statusFilter ? ` with status ${filterAnswer.statusFilter}` : ''}`
      );
    }

    // Select users (multi-select)
    const answer = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'usernames',
        message: 'Select user(s) to delete (use space to select, enter to confirm):',
        choices: users.map((user) => {
          const email = user.email || 'N/A';
          const date = new Date(user.userCreateDate).toLocaleDateString();
          return {
            name: `${email} | ${user.username} | ${user.status} | Created: ${date}`,
            value: user.username,
          };
        }),
        validate: (input: string[]) => {
          if (input.length === 0) {
            return 'Please select at least one user';
          }
          return true;
        },
      },
    ]);
    usernames = answer.usernames;

    // Confirmation prompt
    const confirmAnswer = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmed',
        message: chalk.yellow(
          `Are you sure you want to delete ${usernames.length} user(s)? This action cannot be undone.`
        ),
        default: false,
      },
    ]);

    if (!confirmAnswer.confirmed) {
      console.log(chalk.blue('\nDeletion cancelled\n'));
      process.exit(0);
    }
  }

  return { userPoolId, usernames, profile, region };
}

// Helper function to gather describe-pool configuration
async function gatherDescribePoolConfiguration(
  options: any,
  logger: any
): Promise<{ userPoolId: string; profile: string; region: string; format: string }> {
  let { userPoolId, profile, region, format } = options;

  // Select profile if not provided
  if (!profile) {
    const profiles = getAWSProfiles();
    const defaultProfile = profiles.find((p) => p.isDefault);

    if (profiles.length === 1) {
      profile = profiles[0].name;
      logger.info(`Using AWS profile: ${profile}`);
    } else {
      const answer = await inquirer.prompt([
        {
          type: 'list',
          name: 'profile',
          message: 'Select AWS profile:',
          choices: profiles.map((p) => ({
            name: p.isDefault ? `${p.name} (default)` : p.name,
            value: p.name,
          })),
          default: defaultProfile?.name,
        },
      ]);
      profile = answer.profile;
    }
  }

  // Select region if not provided
  if (!region) {
    const answer = await inquirer.prompt([
      {
        type: 'list',
        name: 'region',
        message: 'Select AWS region:',
        choices: AWS_REGIONS,
        default: 'us-east-1',
      },
    ]);
    region = answer.region;
  }

  // Select user pool if not provided
  if (!userPoolId) {
    const spinner = ora('Fetching user pools...').start();
    const pools = await listUserPools(profile, region);
    spinner.stop();

    if (pools.length === 0) {
      throw new Error('No user pools found in this region');
    }

    const answer = await inquirer.prompt([
      {
        type: 'list',
        name: 'userPoolId',
        message: 'Select User Pool:',
        choices: pools.map((pool) => ({
          name: `${pool.name} (${pool.id})`,
          value: pool.id,
        })),
      },
    ]);
    userPoolId = answer.userPoolId;
  }

  return { userPoolId, profile, region, format: format || 'json' };
}

// Helper function to display user pool details in markdown format
function displayUserPoolMarkdown(pool: any): void {
  console.log(chalk.bold('\n# User Pool Details\n'));

  // Overview
  console.log(chalk.bold('## Overview\n'));
  console.log(`${chalk.cyan('Name:')} ${pool.Name}`);
  console.log(`${chalk.cyan('ID:')} ${pool.Id}`);
  if (pool.Status) {
    console.log(`${chalk.cyan('Status:')} ${pool.Status}`);
  }
  if (pool.CreationDate) {
    console.log(`${chalk.cyan('Created:')} ${new Date(pool.CreationDate).toLocaleString()}`);
  }
  if (pool.LastModifiedDate) {
    console.log(`${chalk.cyan('Modified:')} ${new Date(pool.LastModifiedDate).toLocaleString()}`);
  }
  if (pool.EstimatedNumberOfUsers !== undefined) {
    console.log(`${chalk.cyan('Estimated Users:')} ${pool.EstimatedNumberOfUsers}`);
  }
  if (pool.Arn) {
    console.log(`${chalk.cyan('ARN:')} ${pool.Arn}`);
  }

  // Password Policy
  if (pool.Policies?.PasswordPolicy) {
    console.log(chalk.bold('\n## Password Policy\n'));
    const pp = pool.Policies.PasswordPolicy;
    if (pp.MinimumLength) {
      console.log(`${chalk.cyan('Minimum Length:')} ${pp.MinimumLength}`);
    }
    console.log(`${chalk.cyan('Require Uppercase:')} ${pp.RequireUppercase ? 'Yes' : 'No'}`);
    console.log(`${chalk.cyan('Require Lowercase:')} ${pp.RequireLowercase ? 'Yes' : 'No'}`);
    console.log(`${chalk.cyan('Require Numbers:')} ${pp.RequireNumbers ? 'Yes' : 'No'}`);
    console.log(`${chalk.cyan('Require Symbols:')} ${pp.RequireSymbols ? 'Yes' : 'No'}`);
    if (pp.TemporaryPasswordValidityDays) {
      console.log(
        `${chalk.cyan('Temp Password Validity:')} ${pp.TemporaryPasswordValidityDays} days`
      );
    }
  }

  // MFA Configuration
  if (pool.MfaConfiguration) {
    console.log(chalk.bold('\n## Security\n'));
    console.log(`${chalk.cyan('MFA Configuration:')} ${pool.MfaConfiguration}`);
  }

  // Attributes
  if (pool.AutoVerifiedAttributes && pool.AutoVerifiedAttributes.length > 0) {
    console.log(chalk.bold('\n## Verification\n'));
    console.log(`${chalk.cyan('Auto Verified Attributes:')} ${pool.AutoVerifiedAttributes.join(', ')}`);
  }

  if (pool.AliasAttributes && pool.AliasAttributes.length > 0) {
    console.log(`${chalk.cyan('Alias Attributes:')} ${pool.AliasAttributes.join(', ')}`);
  }

  if (pool.UsernameAttributes && pool.UsernameAttributes.length > 0) {
    console.log(`${chalk.cyan('Username Attributes:')} ${pool.UsernameAttributes.join(', ')}`);
  }

  // Email Configuration
  if (pool.EmailConfiguration) {
    console.log(chalk.bold('\n## Email Configuration\n'));
    if (pool.EmailConfiguration.SourceArn) {
      console.log(`${chalk.cyan('Source ARN:')} ${pool.EmailConfiguration.SourceArn}`);
    }
    if (pool.EmailConfiguration.ReplyToEmailAddress) {
      console.log(
        `${chalk.cyan('Reply To:')} ${pool.EmailConfiguration.ReplyToEmailAddress}`
      );
    }
    if (pool.EmailConfiguration.EmailSendingAccount) {
      console.log(
        `${chalk.cyan('Sending Account:')} ${pool.EmailConfiguration.EmailSendingAccount}`
      );
    }
  }

  // SMS Configuration
  if (pool.SmsConfiguration) {
    console.log(chalk.bold('\n## SMS Configuration\n'));
    if (pool.SmsConfiguration.SnsCallerArn) {
      console.log(`${chalk.cyan('SNS Caller ARN:')} ${pool.SmsConfiguration.SnsCallerArn}`);
    }
    if (pool.SmsConfiguration.ExternalId) {
      console.log(`${chalk.cyan('External ID:')} ${pool.SmsConfiguration.ExternalId}`);
    }
  }

  // Lambda Triggers
  if (pool.LambdaConfig && Object.keys(pool.LambdaConfig).length > 0) {
    console.log(chalk.bold('\n## Lambda Triggers\n'));
    Object.entries(pool.LambdaConfig).forEach(([key, value]) => {
      if (value) {
        console.log(`${chalk.cyan(key + ':')} ${value}`);
      }
    });
  }

  // Tags
  if (pool.UserPoolTags && Object.keys(pool.UserPoolTags).length > 0) {
    console.log(chalk.bold('\n## Tags\n'));
    Object.entries(pool.UserPoolTags).forEach(([key, value]) => {
      console.log(`${chalk.cyan(key + ':')} ${value}`);
    });
  }

  console.log(); // Empty line at the end
}

// Helper function to gather list-clients configuration
async function gatherListClientsConfiguration(
  options: any,
  logger: any
): Promise<{ userPoolId: string; profile: string; region: string; format: string }> {
  let { userPoolId, profile, region, format } = options;

  // Select profile if not provided
  if (!profile) {
    const profiles = getAWSProfiles();
    const defaultProfile = profiles.find((p) => p.isDefault);

    if (profiles.length === 1) {
      profile = profiles[0].name;
      logger.info(`Using AWS profile: ${profile}`);
    } else {
      const answer = await inquirer.prompt([
        {
          type: 'list',
          name: 'profile',
          message: 'Select AWS profile:',
          choices: profiles.map((p) => ({
            name: p.isDefault ? `${p.name} (default)` : p.name,
            value: p.name,
          })),
          default: defaultProfile?.name,
        },
      ]);
      profile = answer.profile;
    }
  }

  // Select region if not provided
  if (!region) {
    const answer = await inquirer.prompt([
      {
        type: 'list',
        name: 'region',
        message: 'Select AWS region:',
        choices: AWS_REGIONS,
        default: 'us-east-1',
      },
    ]);
    region = answer.region;
  }

  // Select user pool if not provided
  if (!userPoolId) {
    const spinner = ora('Fetching user pools...').start();
    const pools = await listUserPools(profile, region);
    spinner.stop();

    if (pools.length === 0) {
      throw new Error('No user pools found in this region');
    }

    const answer = await inquirer.prompt([
      {
        type: 'list',
        name: 'userPoolId',
        message: 'Select User Pool:',
        choices: pools.map((pool) => ({
          name: `${pool.name} (${pool.id})`,
          value: pool.id,
        })),
      },
    ]);
    userPoolId = answer.userPoolId;
  }

  return { userPoolId, profile, region, format: format || 'json' };
}

// Helper function to gather describe-client configuration
async function gatherDescribeClientConfiguration(
  options: any,
  logger: any
): Promise<{
  userPoolId: string;
  clientId: string;
  profile: string;
  region: string;
  format: string;
  copy: boolean;
}> {
  let { userPoolId, clientId, profile, region, format, copy } = options;

  // Select profile if not provided
  if (!profile) {
    const profiles = getAWSProfiles();
    const defaultProfile = profiles.find((p) => p.isDefault);

    if (profiles.length === 1) {
      profile = profiles[0].name;
      logger.info(`Using AWS profile: ${profile}`);
    } else {
      const answer = await inquirer.prompt([
        {
          type: 'list',
          name: 'profile',
          message: 'Select AWS profile:',
          choices: profiles.map((p) => ({
            name: p.isDefault ? `${p.name} (default)` : p.name,
            value: p.name,
          })),
          default: defaultProfile?.name,
        },
      ]);
      profile = answer.profile;
    }
  }

  // Select region if not provided
  if (!region) {
    const answer = await inquirer.prompt([
      {
        type: 'list',
        name: 'region',
        message: 'Select AWS region:',
        choices: AWS_REGIONS,
        default: 'us-east-1',
      },
    ]);
    region = answer.region;
  }

  // Select user pool if not provided
  if (!userPoolId) {
    const spinner = ora('Fetching user pools...').start();
    const pools = await listUserPools(profile, region);
    spinner.stop();

    if (pools.length === 0) {
      throw new Error('No user pools found in this region');
    }

    const answer = await inquirer.prompt([
      {
        type: 'list',
        name: 'userPoolId',
        message: 'Select User Pool:',
        choices: pools.map((pool) => ({
          name: `${pool.name} (${pool.id})`,
          value: pool.id,
        })),
      },
    ]);
    userPoolId = answer.userPoolId;
  }

  // Select app client if not provided
  if (!clientId) {
    const spinner = ora('Fetching app clients...').start();
    const clients = await listUserPoolClients(userPoolId, profile, region);
    spinner.stop();

    if (clients.length === 0) {
      throw new Error('No app clients found in this user pool');
    }

    const answer = await inquirer.prompt([
      {
        type: 'list',
        name: 'clientId',
        message: 'Select App Client:',
        choices: clients.map((client) => ({
          name: `${client.clientName} (${client.clientId})`,
          value: client.clientId,
        })),
      },
    ]);
    clientId = answer.clientId;
  }

  return {
    userPoolId,
    clientId,
    profile,
    region,
    format: format || 'json',
    copy: copy || false,
  };
}

// Helper function to display client details in markdown format
function displayClientMarkdown(client: any): void {
  console.log(chalk.bold('\n# App Client Details\n'));

  // Overview
  console.log(chalk.bold('## Overview\n'));
  console.log(`${chalk.cyan('Client Name:')} ${client.ClientName}`);
  console.log(`${chalk.cyan('Client ID:')} ${chalk.bold.white(client.ClientId)}`);
  console.log(`${chalk.cyan('User Pool ID:')} ${client.UserPoolId}`);
  if (client.ClientSecret) {
    console.log(`${chalk.cyan('Client Secret:')} ${chalk.gray('[REDACTED]')}`);
  }
  if (client.CreationDate) {
    console.log(`${chalk.cyan('Created:')} ${new Date(client.CreationDate).toLocaleString()}`);
  }
  if (client.LastModifiedDate) {
    console.log(
      `${chalk.cyan('Modified:')} ${new Date(client.LastModifiedDate).toLocaleString()}`
    );
  }

  // Token Validity
  if (
    client.RefreshTokenValidity ||
    client.AccessTokenValidity ||
    client.IdTokenValidity ||
    client.TokenValidityUnits
  ) {
    console.log(chalk.bold('\n## Token Validity\n'));
    if (client.RefreshTokenValidity) {
      const unit = client.TokenValidityUnits?.RefreshToken || 'days';
      console.log(`${chalk.cyan('Refresh Token:')} ${client.RefreshTokenValidity} ${unit}`);
    }
    if (client.AccessTokenValidity) {
      const unit = client.TokenValidityUnits?.AccessToken || 'minutes';
      console.log(`${chalk.cyan('Access Token:')} ${client.AccessTokenValidity} ${unit}`);
    }
    if (client.IdTokenValidity) {
      const unit = client.TokenValidityUnits?.IdToken || 'minutes';
      console.log(`${chalk.cyan('ID Token:')} ${client.IdTokenValidity} ${unit}`);
    }
  }

  // Auth Flows
  if (client.ExplicitAuthFlows && client.ExplicitAuthFlows.length > 0) {
    console.log(chalk.bold('\n## Authentication Flows\n'));
    client.ExplicitAuthFlows.forEach((flow: string) => {
      console.log(`  • ${flow}`);
    });
  }

  // OAuth Configuration
  if (
    client.AllowedOAuthFlows ||
    client.AllowedOAuthScopes ||
    client.CallbackURLs ||
    client.LogoutURLs
  ) {
    console.log(chalk.bold('\n## OAuth Configuration\n'));
    if (client.AllowedOAuthFlowsUserPoolClient !== undefined) {
      console.log(
        `${chalk.cyan('OAuth Enabled:')} ${client.AllowedOAuthFlowsUserPoolClient ? 'Yes' : 'No'}`
      );
    }
    if (client.AllowedOAuthFlows && client.AllowedOAuthFlows.length > 0) {
      console.log(`${chalk.cyan('Allowed Flows:')} ${client.AllowedOAuthFlows.join(', ')}`);
    }
    if (client.AllowedOAuthScopes && client.AllowedOAuthScopes.length > 0) {
      console.log(`${chalk.cyan('Allowed Scopes:')} ${client.AllowedOAuthScopes.join(', ')}`);
    }
    if (client.CallbackURLs && client.CallbackURLs.length > 0) {
      console.log(`${chalk.cyan('Callback URLs:')}`);
      client.CallbackURLs.forEach((url: string) => {
        console.log(`  • ${url}`);
      });
    }
    if (client.LogoutURLs && client.LogoutURLs.length > 0) {
      console.log(`${chalk.cyan('Logout URLs:')}`);
      client.LogoutURLs.forEach((url: string) => {
        console.log(`  • ${url}`);
      });
    }
    if (client.DefaultRedirectURI) {
      console.log(`${chalk.cyan('Default Redirect URI:')} ${client.DefaultRedirectURI}`);
    }
  }

  // Identity Providers
  if (client.SupportedIdentityProviders && client.SupportedIdentityProviders.length > 0) {
    console.log(chalk.bold('\n## Identity Providers\n'));
    client.SupportedIdentityProviders.forEach((provider: string) => {
      console.log(`  • ${provider}`);
    });
  }

  // Security
  console.log(chalk.bold('\n## Security\n'));
  if (client.PreventUserExistenceErrors) {
    console.log(
      `${chalk.cyan('Prevent User Existence Errors:')} ${client.PreventUserExistenceErrors}`
    );
  }
  if (client.EnableTokenRevocation !== undefined) {
    console.log(
      `${chalk.cyan('Token Revocation:')} ${client.EnableTokenRevocation ? 'Enabled' : 'Disabled'}`
    );
  }

  // Attributes
  if (
    (client.ReadAttributes && client.ReadAttributes.length > 0) ||
    (client.WriteAttributes && client.WriteAttributes.length > 0)
  ) {
    console.log(chalk.bold('\n## Attributes\n'));
    if (client.ReadAttributes && client.ReadAttributes.length > 0) {
      console.log(
        `${chalk.cyan('Read Attributes:')} ${client.ReadAttributes.length} attributes`
      );
    }
    if (client.WriteAttributes && client.WriteAttributes.length > 0) {
      console.log(
        `${chalk.cyan('Write Attributes:')} ${client.WriteAttributes.length} attributes`
      );
    }
  }

  console.log(); // Empty line at the end
}

// Helper function to get status color
function getStatusColor(status: string): string {
  switch (status) {
    case 'CONFIRMED':
      return chalk.green(status);
    case 'UNCONFIRMED':
      return chalk.yellow(status);
    case 'ARCHIVED':
      return chalk.gray(status);
    case 'COMPROMISED':
      return chalk.red(status);
    case 'RESET_REQUIRED':
      return chalk.magenta(status);
    case 'FORCE_CHANGE_PASSWORD':
      return chalk.cyan(status);
    default:
      return chalk.white(status);
  }
}
