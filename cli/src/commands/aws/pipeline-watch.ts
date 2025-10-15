/**
 * AWS pipeline-watch commands
 * Wraps the aws-pipeline-watch.sh script for monitoring CodePipeline and CodeBuild
 */

import { Command } from 'commander';
import path from 'path';
import { execScript, createLogger, CommandOptions } from '../../lib';

const SCRIPT_PATH = path.join(__dirname, '../../../../scripts/aws-pipeline-watch.sh');

export function registerPipelineWatchCommands(aws: Command): void {
  // macpracs aws pipeline-watch pipeline <name> [options]
  aws
    .command('pipeline-watch-pipeline <name>')
    .description('Watch CodePipeline execution status')
    .option('-p, --profile <profile>', 'AWS CLI profile')
    .option('-r, --region <region>', 'AWS region', 'us-east-1')
    .action(async (name: string, options: any) => {
      const globalOpts = aws.parent?.opts() as CommandOptions;
      const logger = createLogger(globalOpts?.verbose, globalOpts?.quiet);

      const args = ['pipeline', name];
      if (options.profile) args.push(options.profile);
      if (options.region) args.push(options.region);

      logger.info(`Watching pipeline: ${name}`);

      try {
        const result = await execScript(SCRIPT_PATH, args, {
          captureOutput: false, // Let bash script handle its own output
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

  // macpracs aws pipeline-watch build <name> [options]
  aws
    .command('pipeline-watch-build <name>')
    .description('Watch CodeBuild project status')
    .option('-p, --profile <profile>', 'AWS CLI profile')
    .option('-r, --region <region>', 'AWS region', 'us-east-1')
    .action(async (name: string, options: any) => {
      const globalOpts = aws.parent?.opts() as CommandOptions;
      const logger = createLogger(globalOpts?.verbose, globalOpts?.quiet);

      const args = ['build', name];
      if (options.profile) args.push(options.profile);
      if (options.region) args.push(options.region);

      logger.info(`Watching build: ${name}`);

      try {
        const result = await execScript(SCRIPT_PATH, args, {
          captureOutput: false,
        });

        if (result.exitCode !== 0) {
          logger.error(`Build watch failed with exit code ${result.exitCode}`);
          process.exit(result.exitCode);
        }

        logger.success('Build watch completed');
      } catch (error) {
        logger.error('Failed to execute build watch', error as Error);
        process.exit(1);
      }
    });

  // macpracs aws pipeline-watch logs <name> [options]
  aws
    .command('pipeline-watch-logs <name>')
    .description('Stream CodeBuild logs in real-time')
    .option('-p, --profile <profile>', 'AWS CLI profile')
    .option('-r, --region <region>', 'AWS region', 'us-east-1')
    .action(async (name: string, options: any) => {
      const globalOpts = aws.parent?.opts() as CommandOptions;
      const logger = createLogger(globalOpts?.verbose, globalOpts?.quiet);

      const args = ['logs', name];
      if (options.profile) args.push(options.profile);
      if (options.region) args.push(options.region);

      logger.info(`Streaming logs for: ${name}`);

      try {
        const result = await execScript(SCRIPT_PATH, args, {
          captureOutput: false,
        });

        if (result.exitCode !== 0) {
          logger.error(`Log streaming failed with exit code ${result.exitCode}`);
          process.exit(result.exitCode);
        }

        logger.success('Log streaming completed');
      } catch (error) {
        logger.error('Failed to stream logs', error as Error);
        process.exit(1);
      }
    });

  // macpracs aws list-pipelines [options]
  aws
    .command('list-pipelines')
    .description('List all CodePipelines in the region')
    .option('-p, --profile <profile>', 'AWS CLI profile')
    .option('-r, --region <region>', 'AWS region', 'us-east-1')
    .action(async (options: any) => {
      const globalOpts = aws.parent?.opts() as CommandOptions;
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

  // macpracs aws list-builds [options]
  aws
    .command('list-builds')
    .description('List all CodeBuild projects in the region')
    .option('-p, --profile <profile>', 'AWS CLI profile')
    .option('-r, --region <region>', 'AWS region', 'us-east-1')
    .action(async (options: any) => {
      const globalOpts = aws.parent?.opts() as CommandOptions;
      const logger = createLogger(globalOpts?.verbose, globalOpts?.quiet);

      const args = ['list-builds'];
      if (options.profile) args.push(options.profile);
      if (options.region) args.push(options.region);

      logger.info('Listing build projects...');

      try {
        const result = await execScript(SCRIPT_PATH, args, {
          captureOutput: false,
        });

        if (result.exitCode !== 0) {
          logger.error(`List builds failed with exit code ${result.exitCode}`);
          process.exit(result.exitCode);
        }

        logger.success('Build projects listed');
      } catch (error) {
        logger.error('Failed to list build projects', error as Error);
        process.exit(1);
      }
    });

  // macpracs aws retry-build <project-name> <build-id> [options]
  aws
    .command('retry-build <project-name> <build-id>')
    .description('Retry a failed CodeBuild job')
    .option('-p, --profile <profile>', 'AWS CLI profile')
    .option('-r, --region <region>', 'AWS region', 'us-east-1')
    .action(async (projectName: string, buildId: string, options: any) => {
      const globalOpts = aws.parent?.opts() as CommandOptions;
      const logger = createLogger(globalOpts?.verbose, globalOpts?.quiet);

      const args = ['retry-build', projectName, buildId];
      if (options.profile) args.push(options.profile);
      if (options.region) args.push(options.region);

      logger.info(`Retrying build: ${buildId}`);

      try {
        const result = await execScript(SCRIPT_PATH, args, {
          captureOutput: false,
        });

        if (result.exitCode !== 0) {
          logger.error(`Retry build failed with exit code ${result.exitCode}`);
          process.exit(result.exitCode);
        }

        logger.success('Build retry initiated');
      } catch (error) {
        logger.error('Failed to retry build', error as Error);
        process.exit(1);
      }
    });

  // macpracs aws retry-pipeline <name> [options]
  aws
    .command('retry-pipeline <name>')
    .description('Retry a pipeline execution')
    .option('-p, --profile <profile>', 'AWS CLI profile')
    .option('-r, --region <region>', 'AWS region', 'us-east-1')
    .action(async (name: string, options: any) => {
      const globalOpts = aws.parent?.opts() as CommandOptions;
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
