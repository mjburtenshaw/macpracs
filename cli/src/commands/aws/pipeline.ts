/**
 * AWS CodePipeline commands
 * Hierarchical structure: macpracs aws pipeline <operation>
 */

import { Command } from 'commander';
import path from 'path';
import { execScript, createLogger, CommandOptions } from '../../lib';

const SCRIPT_PATH = path.join(__dirname, '../../../../scripts/aws-pipeline-watch.sh');

export function registerPipelineCommands(aws: Command): void {
  const pipeline = aws
    .command('pipeline')
    .description('CodePipeline operations (watch, retry, list)');

  registerWatchCommand(pipeline);
  registerRetryCommand(pipeline);
  registerListCommand(pipeline);
}

// macpracs aws pipeline watch <name> [options]
function registerWatchCommand(pipeline: Command): void {
  pipeline
    .command('watch <name>')
    .description('Watch CodePipeline execution status in real-time')
    .option('-p, --profile <profile>', 'AWS CLI profile')
    .option('-r, --region <region>', 'AWS region', 'us-east-1')
    .action(async (name: string, options: any) => {
      const globalOpts = pipeline.parent?.parent?.opts() as CommandOptions;
      const logger = createLogger(globalOpts?.verbose, globalOpts?.quiet);

      const args = ['pipeline', name];
      if (options.profile) args.push(options.profile);
      if (options.region) args.push(options.region);

      logger.info(`Watching pipeline: ${name}`);

      try {
        const result = await execScript(SCRIPT_PATH, args, {
          captureOutput: false,
        });

        if (result.exitCode !== 0) {
          logger.error(`Pipeline watch failed with exit code ${result.exitCode}`);
          process.exit(result.exitCode);
        }

        logger.success('Pipeline watch completed');
      } catch (error) {
        logger.error('Failed to execute pipeline watch', error as Error);
        process.exit(1);
      }
    });
}

// macpracs aws pipeline retry <name> [options]
function registerRetryCommand(pipeline: Command): void {
  pipeline
    .command('retry <name>')
    .description('Retry a pipeline execution')
    .option('-p, --profile <profile>', 'AWS CLI profile')
    .option('-r, --region <region>', 'AWS region', 'us-east-1')
    .action(async (name: string, options: any) => {
      const globalOpts = pipeline.parent?.parent?.opts() as CommandOptions;
      const logger = createLogger(globalOpts?.verbose, globalOpts?.quiet);

      const args = ['retry-pipeline', name];
      if (options.profile) args.push(options.profile);
      if (options.region) args.push(options.region);

      logger.info(`Retrying pipeline: ${name}`);

      try {
        const result = await execScript(SCRIPT_PATH, args, {
          captureOutput: false,
        });

        if (result.exitCode !== 0) {
          logger.error(`Retry pipeline failed with exit code ${result.exitCode}`);
          process.exit(result.exitCode);
        }

        logger.success('Pipeline retry initiated');
      } catch (error) {
        logger.error('Failed to retry pipeline', error as Error);
        process.exit(1);
      }
    });
}

// macpracs aws pipeline list [options]
function registerListCommand(pipeline: Command): void {
  pipeline
    .command('list')
    .description('List all CodePipelines in the region')
    .option('-p, --profile <profile>', 'AWS CLI profile')
    .option('-r, --region <region>', 'AWS region', 'us-east-1')
    .action(async (options: any) => {
      const globalOpts = pipeline.parent?.parent?.opts() as CommandOptions;
      const logger = createLogger(globalOpts?.verbose, globalOpts?.quiet);

      const args = ['list-pipelines'];
      if (options.profile) args.push(options.profile);
      if (options.region) args.push(options.region);

      logger.info('Listing pipelines...');

      try {
        const result = await execScript(SCRIPT_PATH, args, {
          captureOutput: false,
        });

        if (result.exitCode !== 0) {
          logger.error(`List pipelines failed with exit code ${result.exitCode}`);
          process.exit(result.exitCode);
        }

        logger.success('Pipelines listed');
      } catch (error) {
        logger.error('Failed to list pipelines', error as Error);
        process.exit(1);
      }
    });
}
