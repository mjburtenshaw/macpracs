/**
 * AWS operations interactive wizard
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import path from 'path';
import ora from 'ora';
import { execSync } from 'child_process';
import {
  execScript,
  createLogger,
  getAWSProfiles,
  ensureAWSCredentials,
  listPipelines,
  listBuildProjects,
  listECSClusters,
  listECSServices,
  listRDSInstances,
  listEC2Instances,
  listFailedBuilds,
  listCompletedBuilds,
  AWS_REGIONS,
} from '../lib';

const PIPELINE_SCRIPT_PATH = path.join(__dirname, '../../../scripts/aws-pipeline-watch.sh');
const ECS_SCRIPT_PATH = path.join(__dirname, '../../../scripts/aws-ecs-tasks.sh');
const SSM_SCRIPT_PATH = path.join(__dirname, '../../../scripts/aws-ssm-rds.sh');

export async function awsWizard(): Promise<void> {
  console.log(chalk.blue('\n☁️  AWS Operations\n'));

  // Step 1: Choose AWS service
  const { service } = await inquirer.prompt([
    {
      type: 'list',
      name: 'service',
      message: 'Which AWS service would you like to work with?',
      choices: [
        {
          name: '🔑 SSO Login',
          value: 'sso',
        },
        {
          name: '🚀 CodePipeline',
          value: 'codepipeline',
        },
        {
          name: '🔨 CodeBuild',
          value: 'codebuild',
        },
        {
          name: '🐳 ECS',
          value: 'ecs',
        },
        {
          name: '🔐 SSM (Systems Manager)',
          value: 'ssm',
        },
        new inquirer.Separator(),
        {
          name: '← Back to main menu',
          value: 'back',
        },
      ],
    },
  ]);

  if (service === 'back') {
    return;
  }

  // Handle SSO login separately (doesn't need region or credential check)
  if (service === 'sso') {
    await ssoLoginSubmenu();
    return;
  }

  // Step 2: Select AWS profile
  const profiles = getAWSProfiles();
  const { profile } = await inquirer.prompt([
    {
      type: 'list',
      name: 'profile',
      message: 'Select AWS profile:',
      choices: profiles.map((p) => ({
        name: p.isDefault ? `${p.name} (default)` : p.name,
        value: p.name,
      })),
      default: process.env.AWS_PROFILE || 'default',
    },
  ]);

  // Step 3: Select region
  const { region } = await inquirer.prompt([
    {
      type: 'list',
      name: 'region',
      message: 'Select AWS region:',
      choices: AWS_REGIONS,
      default: 'us-east-1',
    },
  ]);

  // Step 4: Ensure AWS credentials are valid
  const spinner = ora('Checking AWS credentials...').start();
  const credentialsValid = await ensureAWSCredentials(profile);
  spinner.stop();

  if (!credentialsValid) {
    console.log(chalk.red('Unable to proceed without valid credentials\n'));
    return;
  }

  // Route to service-specific submenu
  switch (service) {
    case 'codepipeline':
      await codePipelineSubmenu(profile, region);
      break;
    case 'codebuild':
      await codeBuildSubmenu(profile, region);
      break;
    case 'ecs':
      await ecsSubmenu(profile, region);
      break;
    case 'ssm':
      await ssmSubmenu(profile, region);
      break;
    default:
      console.log(chalk.red(`\nUnknown service: ${service}\n`));
  }
}

async function codePipelineSubmenu(profile: string, region: string): Promise<void> {
  console.log(chalk.blue('\n🚀 CodePipeline Operations\n'));

  const { operation } = await inquirer.prompt([
    {
      type: 'list',
      name: 'operation',
      message: 'What would you like to do?',
      choices: [
        {
          name: '📊 Watch pipeline execution',
          value: 'pipeline',
        },
        {
          name: '📋 Inspect pipeline execution',
          value: 'describe-pipeline',
        },
        {
          name: '🔄 Retry pipeline execution',
          value: 'retry-pipeline',
        },
        {
          name: '📋 List all pipelines',
          value: 'list-pipelines',
        },
        new inquirer.Separator(),
        {
          name: '← Back',
          value: 'back',
        },
      ],
    },
  ]);

  if (operation === 'back') {
    return;
  }

  await executeAWSOperation(operation, profile, region);
}

async function codeBuildSubmenu(profile: string, region: string): Promise<void> {
  console.log(chalk.blue('\n🔨 CodeBuild Operations\n'));

  const { operation } = await inquirer.prompt([
    {
      type: 'list',
      name: 'operation',
      message: 'What would you like to do?',
      choices: [
        {
          name: '🔨 Watch build project',
          value: 'build',
        },
        {
          name: '📝 Stream build logs',
          value: 'logs',
        },
        {
          name: '🔍 View completed build logs',
          value: 'view-build-logs',
        },
        {
          name: '📋 Inspect build details',
          value: 'describe',
        },
        {
          name: '🔄 Retry failed build',
          value: 'retry-build',
        },
        {
          name: '📋 List all build projects',
          value: 'list-builds',
        },
        new inquirer.Separator(),
        {
          name: '← Back',
          value: 'back',
        },
      ],
    },
  ]);

  if (operation === 'back') {
    return;
  }

  await executeAWSOperation(operation, profile, region);
}

async function ecsSubmenu(profile: string, region: string): Promise<void> {
  console.log(chalk.blue('\n🐳 ECS Operations\n'));

  const { operation } = await inquirer.prompt([
    {
      type: 'list',
      name: 'operation',
      message: 'What would you like to do?',
      choices: [
        {
          name: '🐳 Watch task status',
          value: 'ecs-tasks',
        },
        {
          name: '📜 Tail service logs',
          value: 'ecs-logs',
        },
        {
          name: '📋 List clusters',
          value: 'ecs-list-clusters',
        },
        {
          name: '📋 List services in cluster',
          value: 'ecs-list-services',
        },
        new inquirer.Separator(),
        {
          name: '← Back',
          value: 'back',
        },
      ],
    },
  ]);

  if (operation === 'back') {
    return;
  }

  await executeAWSOperation(operation, profile, region);
}

async function ssmSubmenu(profile: string, region: string): Promise<void> {
  console.log(chalk.blue('\n🔐 SSM Operations\n'));

  const { operation } = await inquirer.prompt([
    {
      type: 'list',
      name: 'operation',
      message: 'What would you like to do?',
      choices: [
        {
          name: '💻 Start terminal session',
          value: 'ssm-terminal',
        },
        {
          name: '🔌 Connect to RDS instance',
          value: 'ssm-rds-connect',
        },
        {
          name: '📋 List RDS instances',
          value: 'ssm-list-rds',
        },
        new inquirer.Separator(),
        {
          name: '← Back',
          value: 'back',
        },
      ],
    },
  ]);

  if (operation === 'back') {
    return;
  }

  await executeAWSOperation(operation, profile, region);
}

async function executeAWSOperation(
  operation: string,
  profile: string,
  region: string
): Promise<void> {
  // Special case: 'describe' operation uses its own built-in wizard
  if (operation === 'describe') {
    console.log(chalk.blue('\nLaunching build describe wizard...\n'));

    try {
      // Invoke the describe command with profile and region pre-filled
      // This triggers the describe command's own wizard flow
      execSync(`macpracs aws codebuild describe --profile ${profile} --region ${region}`, {
        stdio: 'inherit',
      });
      return;
    } catch (error) {
      console.error(chalk.red('\nDescribe operation failed'));
      if (error instanceof Error) {
        console.error(chalk.red(error.message));
      }
      process.exit(1);
    }
  }

  // Special case: 'describe-pipeline' operation uses its own built-in wizard
  if (operation === 'describe-pipeline') {
    console.log(chalk.blue('\nLaunching pipeline describe wizard...\n'));

    try {
      // Invoke the describe command with profile and region pre-filled
      execSync(`macpracs aws pipeline describe --profile ${profile} --region ${region}`, {
        stdio: 'inherit',
      });
      return;
    } catch (error) {
      console.error(chalk.red('\nPipeline describe operation failed'));
      if (error instanceof Error) {
        console.error(chalk.red(error.message));
      }
      process.exit(1);
    }
  }

  // For operations that need resource selection, fetch and present resource list
  let resourceName: string | undefined;
  let clusterName: string | undefined;
  let buildId: string | undefined;

  if (['pipeline', 'build', 'logs', 'retry-build', 'retry-pipeline', 'view-build-logs'].includes(operation)) {
    const spinner = ora('Fetching available resources...').start();

    try {
      let resources: string[] = [];

      if (operation === 'pipeline' || operation === 'retry-pipeline') {
        resources = await listPipelines(profile, region);
      } else {
        // build, logs, retry-build, or view-build-logs all use CodeBuild projects
        resources = await listBuildProjects(profile, region);
      }

      spinner.stop();

      if (resources.length === 0) {
        console.log(
          chalk.yellow(
            `\nNo ${operation === 'pipeline' || operation === 'retry-pipeline' ? 'pipelines' : 'build projects'} found in ${region}\n`
          )
        );
        return;
      }

      const operationName =
        operation === 'pipeline'
          ? 'CodePipeline'
          : operation === 'retry-pipeline'
            ? 'CodePipeline (to retry)'
            : operation === 'build'
              ? 'CodeBuild project'
              : operation === 'view-build-logs'
                ? 'CodeBuild project (to view logs)'
                : 'CodeBuild project (for logs)';

      const { name } = await inquirer.prompt([
        {
          type: 'list',
          name: 'name',
          message: `Select ${operationName}:`,
          choices: resources,
        },
      ]);

      resourceName = name;

      // For retry-build, fetch and select failed build
      if (operation === 'retry-build') {
        const buildsSpinner = ora('Fetching failed builds...').start();

        try {
          const failedBuilds = await listFailedBuilds(name, profile, region);
          buildsSpinner.stop();

          if (failedBuilds.length === 0) {
            console.log(chalk.yellow(`\nNo retry-able failed builds found for project ${name}`));
            console.log(chalk.gray('Note: Builds triggered by CodePipeline can only be retried through the pipeline.\n'));
            return;
          }

          const { build } = await inquirer.prompt([
            {
              type: 'list',
              name: 'build',
              message: 'Select failed build to retry:',
              choices: failedBuilds.map((b) => ({
                name: `${b.id.split(':').pop()} - ${b.sourceVersion} - ${new Date(b.startTime).toLocaleString()}`,
                value: b.id,
              })),
            },
          ]);

          buildId = build;
        } catch (buildError) {
          buildsSpinner.fail('Failed to fetch failed builds');
          console.error(chalk.red(buildError instanceof Error ? buildError.message : String(buildError)));
          return;
        }
      }

      // For view-build-logs, prompt for status filter and select build
      if (operation === 'view-build-logs') {
        // Prompt for status filter
        const { statusFilter } = await inquirer.prompt([
          {
            type: 'list',
            name: 'statusFilter',
            message: 'Filter builds by status:',
            choices: [
              { name: 'All completed builds', value: 'all' },
              { name: 'Failed builds only', value: 'FAILED' },
              { name: 'Succeeded builds only', value: 'SUCCEEDED' },
              { name: 'Stopped builds only', value: 'STOPPED' },
            ],
          },
        ]);

        const buildsSpinner = ora('Fetching builds...').start();

        try {
          const filter = statusFilter === 'all' ? undefined : statusFilter;
          const builds = await listCompletedBuilds(name, profile, region, filter);
          buildsSpinner.stop();

          if (builds.length === 0) {
            const filterText = filter ? `${filter.toLowerCase()} ` : '';
            console.log(chalk.yellow(`\nNo ${filterText}builds found for project ${name}\n`));
            return;
          }

          const { build } = await inquirer.prompt([
            {
              type: 'list',
              name: 'build',
              message: 'Select build to view logs:',
              choices: builds.map((b) => ({
                name: `[${b.status}] ${b.id.split(':').pop()} - ${b.sourceVersion} - ${new Date(b.startTime).toLocaleString()}`,
                value: b.id,
              })),
            },
          ]);

          buildId = build;
        } catch (buildError) {
          buildsSpinner.fail('Failed to fetch builds');
          console.error(chalk.red(buildError instanceof Error ? buildError.message : String(buildError)));
          return;
        }
      }
    } catch (error) {
      spinner.fail('Failed to fetch resources');
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      return;
    }
  } else if (operation === 'ecs-tasks' || operation === 'ecs-logs') {
    // For ECS tasks/logs, we need cluster first, then service
    const clusterSpinner = ora('Fetching ECS clusters...').start();

    try {
      const clusters = await listECSClusters(profile, region);
      clusterSpinner.stop();

      if (clusters.length === 0) {
        console.log(chalk.yellow(`\nNo ECS clusters found in ${region}\n`));
        return;
      }

      const { cluster } = await inquirer.prompt([
        {
          type: 'list',
          name: 'cluster',
          message: 'Select ECS cluster:',
          choices: clusters,
        },
      ]);

      clusterName = cluster;

      const serviceSpinner = ora('Fetching ECS services...').start();
      const services = await listECSServices(cluster, profile, region);
      serviceSpinner.stop();

      if (services.length === 0) {
        console.log(chalk.yellow(`\nNo services found in cluster ${cluster}\n`));
        return;
      }

      const { service } = await inquirer.prompt([
        {
          type: 'list',
          name: 'service',
          message: 'Select ECS service:',
          choices: services,
        },
      ]);

      resourceName = service;
    } catch (error) {
      clusterSpinner.fail('Failed to fetch ECS resources');
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      return;
    }
  } else if (operation === 'ecs-list-services') {
    // For listing services, we need to select a cluster
    const spinner = ora('Fetching ECS clusters...').start();

    try {
      const clusters = await listECSClusters(profile, region);
      spinner.stop();

      if (clusters.length === 0) {
        console.log(chalk.yellow(`\nNo ECS clusters found in ${region}\n`));
        return;
      }

      const { cluster } = await inquirer.prompt([
        {
          type: 'list',
          name: 'cluster',
          message: 'Select ECS cluster:',
          choices: clusters,
        },
      ]);

      clusterName = cluster;
    } catch (error) {
      spinner.fail('Failed to fetch clusters');
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      return;
    }
  } else if (operation === 'ssm-terminal') {
    // For SSM terminal session, we need to select an EC2 instance
    const spinner = ora('Fetching EC2 instances...').start();

    try {
      const instances = await listEC2Instances(profile, region);
      spinner.stop();

      if (instances.length === 0) {
        console.log(chalk.yellow(`\nNo running EC2 instances found in ${region}\n`));
        return;
      }

      const { instance } = await inquirer.prompt([
        {
          type: 'list',
          name: 'instance',
          message: 'Select EC2 instance:',
          choices: instances.map((inst) => ({
            name: `${inst.name} (${inst.id})`,
            value: inst.id,
          })),
        },
      ]);

      resourceName = instance;
    } catch (error) {
      spinner.fail('Failed to fetch EC2 instances');
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      return;
    }
  } else if (operation === 'ssm-rds-connect') {
    // For SSM RDS connection, we need to select an RDS instance
    const spinner = ora('Fetching RDS instances...').start();

    try {
      const instances = await listRDSInstances(profile, region);
      spinner.stop();

      if (instances.length === 0) {
        console.log(chalk.yellow(`\nNo RDS instances found in ${region}\n`));
        return;
      }

      const { instance } = await inquirer.prompt([
        {
          type: 'list',
          name: 'instance',
          message: 'Select RDS instance:',
          choices: instances,
        },
      ]);

      resourceName = instance;
    } catch (error) {
      spinner.fail('Failed to fetch RDS instances');
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      return;
    }
  }

  // Build arguments for bash script
  let scriptPath: string;
  let args: string[] = [];

  // Determine which script to use and build arguments
  if (operation.startsWith('ecs-')) {
    scriptPath = ECS_SCRIPT_PATH;
    // Convert operation name for ECS script
    if (operation === 'ecs-tasks') {
      args = ['tasks', clusterName!, resourceName!];
    } else if (operation === 'ecs-logs') {
      args = ['logs', clusterName!, resourceName!];
    } else if (operation === 'ecs-list-clusters') {
      args = ['list-clusters'];
    } else if (operation === 'ecs-list-services') {
      args = ['list-services', clusterName!];
    }
  } else if (operation.startsWith('ssm-')) {
    scriptPath = SSM_SCRIPT_PATH;
    // Convert operation name for SSM script
    if (operation === 'ssm-terminal') {
      args = ['terminal', resourceName!];
    } else if (operation === 'ssm-rds-connect') {
      args = ['connect', resourceName!];
    } else if (operation === 'ssm-list-rds') {
      args = ['list-instances'];
    }
  } else {
    scriptPath = PIPELINE_SCRIPT_PATH;

    if (operation === 'retry-build') {
      // For retry-build, pass project name and build ID
      args = [operation, resourceName!, buildId!];
    } else if (operation === 'view-build-logs') {
      // For view-build-logs, pass build ID
      args = [operation, buildId!];
    } else {
      args = [operation];
      if (resourceName) {
        args.push(resourceName);
      }
    }
  }

  // Add profile and region to all commands
  args.push(profile);
  args.push(region);

  // Execute the operation
  console.log(chalk.blue('\nExecuting AWS operation...\n'));

  const logger = createLogger(false, false);

  try {
    const result = await execScript(scriptPath, args, {
      captureOutput: false, // Let bash script handle its own output
    });

    if (result.exitCode !== 0) {
      logger.error(`Operation failed with exit code ${result.exitCode}`);
      process.exit(result.exitCode);
    }

    logger.success('\nOperation completed successfully');
  } catch (error) {
    logger.error('Failed to execute AWS operation', error as Error);
    process.exit(1);
  }
}

async function ssoLoginSubmenu(): Promise<void> {
  console.log(chalk.blue('\n🔑 AWS SSO Login\n'));

  // Get available profiles
  const profiles = getAWSProfiles();
  const { profile } = await inquirer.prompt([
    {
      type: 'list',
      name: 'profile',
      message: 'Select AWS profile for SSO login:',
      choices: profiles.map((p) => ({
        name: p.isDefault ? `${p.name} (default)` : p.name,
        value: p.name,
      })),
      default: process.env.AWS_PROFILE || 'default',
    },
  ]);

  const logger = createLogger(false, false);
  logger.info(`Logging in to AWS SSO with profile: ${profile}`);

  try {
    // Execute aws sso login with inherited stdio for browser interaction
    execSync(`aws sso login --profile ${profile}`, { stdio: 'inherit' });

    logger.success('\nSSO login completed successfully');
  } catch (error) {
    logger.error('SSO login failed', error as Error);
    process.exit(1);
  }
}
