/**
 * AWS ECS commands
 * Hierarchical structure: macpracs aws ecs <operation>
 */

import { Command } from 'commander';
import path from 'path';
import { execScript, createLogger, CommandOptions } from '../../lib';

const SCRIPT_PATH = path.join(__dirname, '../../../../scripts/aws-ecs-tasks.sh');

export function registerECSCommands(aws: Command): void {
  const ecs = aws
    .command('ecs')
    .description('ECS operations (tasks, logs, list-clusters, list-services)');

  registerTasksCommand(ecs);
  registerLogsCommand(ecs);
  registerListClustersCommand(ecs);
  registerListServicesCommand(ecs);
}

// macpracs aws ecs tasks <cluster> <service> [options]
function registerTasksCommand(ecs: Command): void {
  ecs
    .command('tasks <cluster> <service>')
    .description('Watch ECS task status with timestamps')
    .option('-p, --profile <profile>', 'AWS CLI profile')
    .option('-r, --region <region>', 'AWS region', 'us-east-1')
    .action(async (cluster: string, service: string, options: any) => {
      const globalOpts = ecs.parent?.parent?.opts() as CommandOptions;
      const logger = createLogger(globalOpts?.verbose, globalOpts?.quiet);

      const args = ['tasks', cluster, service];
      if (options.profile) args.push(options.profile);
      if (options.region) args.push(options.region);

      logger.info(`Watching ECS tasks: ${cluster}/${service}`);

      try {
        const result = await execScript(SCRIPT_PATH, args, {
          captureOutput: false,
        });

        if (result.exitCode !== 0) {
          logger.error(`ECS tasks watch failed with exit code ${result.exitCode}`);
          process.exit(result.exitCode);
        }

        logger.success('ECS tasks watch completed');
      } catch (error) {
        logger.error('Failed to execute ECS tasks watch', error as Error);
        process.exit(1);
      }
    });
}

// macpracs aws ecs logs <cluster> <service> [options]
function registerLogsCommand(ecs: Command): void {
  ecs
    .command('logs <cluster> <service>')
    .description('Tail CloudWatch logs for ECS service')
    .option('-p, --profile <profile>', 'AWS CLI profile')
    .option('-r, --region <region>', 'AWS region', 'us-east-1')
    .action(async (cluster: string, service: string, options: any) => {
      const globalOpts = ecs.parent?.parent?.opts() as CommandOptions;
      const logger = createLogger(globalOpts?.verbose, globalOpts?.quiet);

      const args = ['logs', cluster, service];
      if (options.profile) args.push(options.profile);
      if (options.region) args.push(options.region);

      logger.info(`Tailing logs: ${cluster}/${service}`);

      try {
        const result = await execScript(SCRIPT_PATH, args, {
          captureOutput: false,
        });

        if (result.exitCode !== 0) {
          logger.error(`ECS logs tail failed with exit code ${result.exitCode}`);
          process.exit(result.exitCode);
        }

        logger.success('ECS logs tail completed');
      } catch (error) {
        logger.error('Failed to tail ECS logs', error as Error);
        process.exit(1);
      }
    });
}

// macpracs aws ecs list-clusters [options]
function registerListClustersCommand(ecs: Command): void {
  ecs
    .command('list-clusters')
    .description('List all ECS clusters in the region')
    .option('-p, --profile <profile>', 'AWS CLI profile')
    .option('-r, --region <region>', 'AWS region', 'us-east-1')
    .action(async (options: any) => {
      const globalOpts = ecs.parent?.parent?.opts() as CommandOptions;
      const logger = createLogger(globalOpts?.verbose, globalOpts?.quiet);

      const args = ['list-clusters'];
      if (options.profile) args.push(options.profile);
      if (options.region) args.push(options.region);

      logger.info('Listing ECS clusters...');

      try {
        const result = await execScript(SCRIPT_PATH, args, {
          captureOutput: false,
        });

        if (result.exitCode !== 0) {
          logger.error(`List clusters failed with exit code ${result.exitCode}`);
          process.exit(result.exitCode);
        }

        logger.success('ECS clusters listed');
      } catch (error) {
        logger.error('Failed to list ECS clusters', error as Error);
        process.exit(1);
      }
    });
}

// macpracs aws ecs list-services <cluster> [options]
function registerListServicesCommand(ecs: Command): void {
  ecs
    .command('list-services <cluster>')
    .description('List all services in an ECS cluster')
    .option('-p, --profile <profile>', 'AWS CLI profile')
    .option('-r, --region <region>', 'AWS region', 'us-east-1')
    .action(async (cluster: string, options: any) => {
      const globalOpts = ecs.parent?.parent?.opts() as CommandOptions;
      const logger = createLogger(globalOpts?.verbose, globalOpts?.quiet);

      const args = ['list-services', cluster];
      if (options.profile) args.push(options.profile);
      if (options.region) args.push(options.region);

      logger.info(`Listing services in cluster: ${cluster}`);

      try {
        const result = await execScript(SCRIPT_PATH, args, {
          captureOutput: false,
        });

        if (result.exitCode !== 0) {
          logger.error(`List services failed with exit code ${result.exitCode}`);
          process.exit(result.exitCode);
        }

        logger.success('ECS services listed');
      } catch (error) {
        logger.error('Failed to list ECS services', error as Error);
        process.exit(1);
      }
    });
}
