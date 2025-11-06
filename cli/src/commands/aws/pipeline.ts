/**
 * AWS CodePipeline commands
 * Hierarchical structure: macpracs aws pipeline <operation>
 */

import { Command } from 'commander';
import path from 'path';
import inquirer from 'inquirer';
import ora from 'ora';
import chalk from 'chalk';
import {
  execScript,
  createLogger,
  CommandOptions,
  ensureAWSCredentials,
  getAWSProfiles,
  listPipelines,
  getPipelineExecution,
  listPipelineExecutions,
  getLatestPipelineExecution,
  PipelineExecution,
  AWS_REGIONS,
  PipelineListOptions,
  PipelineStatusOptions,
  PipelineDescribeOptions,
  Logger,
} from '../../lib';

const SCRIPT_PATH = path.join(__dirname, '../../../../scripts/aws-pipeline-watch.sh');

export function registerPipelineCommands(aws: Command): void {
  const pipeline = aws
    .command('pipeline')
    .description('CodePipeline operations (watch, retry, list, describe)');

  registerWatchCommand(pipeline);
  registerRetryCommand(pipeline);
  registerListCommand(pipeline);
  registerDescribeCommand(pipeline);
}

// macpracs aws pipeline watch <name> [options]
function registerWatchCommand(pipeline: Command): void {
  pipeline
    .command('watch <name>')
    .description('Watch CodePipeline execution status in real-time')
    .option('-p, --profile <profile>', 'AWS CLI profile')
    .option('-r, --region <region>', 'AWS region', 'us-east-1')
    .action(async (name: string, options: PipelineStatusOptions) => {
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
    .action(async (name: string, options: PipelineStatusOptions) => {
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
    .action(async (options: PipelineListOptions) => {
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

// macpracs aws pipeline describe [options]
function registerDescribeCommand(pipeline: Command): void {
  pipeline
    .command('describe')
    .description('Inspect pipeline execution details (commit, status, stages, etc.)')
    .option('--execution-id <id>', 'Execution ID to inspect ("latest", "unknown" for wizard, or specific ID)')
    .option('--pipeline <name>', 'Pipeline name')
    .option('--detail <level>', 'Detail level: summary, detailed, full', 'summary')
    .option('--format <format>', 'Output format: json, md', 'json')
    .option('-p, --profile <profile>', 'AWS CLI profile')
    .option('-r, --region <region>', 'AWS region', 'us-east-1')
    .action(async (options: PipelineDescribeOptions) => {
      const globalOpts = pipeline.parent?.parent?.opts() as CommandOptions;
      const logger = createLogger(globalOpts?.verbose, globalOpts?.quiet);

      try {
        const config = await gatherDescribeConfiguration(options, logger);
        const execution = await getPipelineExecution(
          config.pipelineName!,
          config.executionId,
          config.profile,
          config.region
        );

        const output = formatPipelineOutput(execution, config.detail, config.format);
        console.log(output);

        // Print tip with fully qualified command if in wizard mode
        if (config.wasWizard && process.stdout.isTTY) {
          const detailFlag = config.detail !== 'summary' ? ` --detail ${config.detail}` : '';
          const formatFlag = config.format !== 'json' ? ` --format ${config.format}` : '';
          console.log(
            chalk.gray(
              `\n💡 Tip: macpracs aws pipeline describe --execution-id ${config.executionId} --pipeline ${config.pipelineName} --profile ${config.profile} --region ${config.region}${detailFlag}${formatFlag}\n`
            )
          );
        }
      } catch (error) {
        logger.error('Failed to describe pipeline execution');
        if (error instanceof Error) {
          console.error(chalk.red(`\nError details: ${error.message}`));
          if (globalOpts?.verbose && error.stack) {
            console.error(chalk.gray('\nStack trace:'));
            console.error(chalk.gray(error.stack));
          }
        }
        process.exit(1);
      }
    });
}

// Helper types and functions for describe command

interface DescribeConfig {
  executionId: string;
  pipelineName: string | null;
  profile: string;
  region: string;
  detail: 'summary' | 'detailed' | 'full';
  format: 'json' | 'md';
  wasWizard: boolean;
}

async function gatherDescribeConfiguration(options: PipelineDescribeOptions, _logger: Logger): Promise<DescribeConfig> {
  let executionId = options.executionId;
  let pipelineName = options.pipeline;
  let profile = options.profile;
  let region = options.region || 'us-east-1';
  let detail = options.detail || 'summary';
  let format = options.format || 'json';
  let wasWizard = false;

  // If execution-id is 'latest', we need the pipeline name
  if (executionId === 'latest') {
    if (!pipelineName) {
      wasWizard = true;
      console.log(chalk.blue('\n🚀 CodePipeline Describe - Latest Execution\n'));

      if (!profile) {
        const profiles = getAWSProfiles();
        const { selectedProfile } = await inquirer.prompt([
          {
            type: 'list',
            name: 'selectedProfile',
            message: 'Select AWS profile:',
            choices: profiles.map((p) => ({
              name: p.isDefault ? `${p.name} (default)` : p.name,
              value: p.name,
            })),
            default: process.env.AWS_PROFILE || 'default',
          },
        ]);
        profile = selectedProfile;
      }

      if (!region) {
        const { selectedRegion } = await inquirer.prompt([
          {
            type: 'list',
            name: 'selectedRegion',
            message: 'Select AWS region:',
            choices: AWS_REGIONS,
            default: 'us-east-1',
          },
        ]);
        region = selectedRegion;
      }

      const credentialsSpinner = ora('Checking AWS credentials...').start();
      const credentialsValid = await ensureAWSCredentials(profile!);
      credentialsSpinner.stop();

      if (!credentialsValid) {
        throw new Error('Unable to proceed without valid credentials');
      }

      const pipelinesSpinner = ora('Fetching pipelines...').start();
      const pipelines = await listPipelines(profile!, region!);
      pipelinesSpinner.stop();

      if (pipelines.length === 0) {
        throw new Error(`No pipelines found in ${region}`);
      }

      const { selectedPipeline } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selectedPipeline',
          message: 'Select pipeline:',
          choices: pipelines,
        },
      ]);
      pipelineName = selectedPipeline;
    }

    // Get the latest execution ID
    const spinner = ora('Fetching latest execution...').start();
    executionId = await getLatestPipelineExecution(pipelineName!, profile!, region!);
    spinner.stop();

    if (wasWizard) {
      const { selectedDetail } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selectedDetail',
          message: 'Select detail level:',
          choices: [
            { name: 'Summary (status, commits, times)', value: 'summary' },
            { name: 'Detailed (+ stages)', value: 'detailed' },
            { name: 'Full (+ actions, artifacts)', value: 'full' },
          ],
          default: 'summary',
        },
      ]);
      detail = selectedDetail;

      const { selectedFormat } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selectedFormat',
          message: 'Select output format:',
          choices: [
            { name: 'Markdown (human-readable)', value: 'md' },
            { name: 'JSON (machine-readable)', value: 'json' },
          ],
          default: 'md',
        },
      ]);
      format = selectedFormat;
    }

    return { executionId, pipelineName, profile: profile!, region, detail, format, wasWizard };
  }

  // If execution-id is 'unknown' or not provided, launch full wizard
  if (!executionId || executionId === 'unknown') {
    wasWizard = true;
    console.log(chalk.blue('\n🚀 CodePipeline Describe\n'));

    if (!profile) {
      const profiles = getAWSProfiles();
      const { selectedProfile } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selectedProfile',
          message: 'Select AWS profile:',
          choices: profiles.map((p) => ({
            name: p.isDefault ? `${p.name} (default)` : p.name,
            value: p.name,
          })),
          default: process.env.AWS_PROFILE || 'default',
        },
      ]);
      profile = selectedProfile;
    }

    if (!region) {
      const { selectedRegion } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selectedRegion',
          message: 'Select AWS region:',
          choices: AWS_REGIONS,
          default: 'us-east-1',
        },
      ]);
      region = selectedRegion;
    }

    const credentialsSpinner = ora('Checking AWS credentials...').start();
    const credentialsValid = await ensureAWSCredentials(profile!);
    credentialsSpinner.stop();

    if (!credentialsValid) {
      throw new Error('Unable to proceed without valid credentials');
    }

    if (!pipelineName) {
      const pipelinesSpinner = ora('Fetching pipelines...').start();
      const pipelines = await listPipelines(profile!, region!);
      pipelinesSpinner.stop();

      if (pipelines.length === 0) {
        throw new Error(`No pipelines found in ${region}`);
      }

      const { selectedPipeline } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selectedPipeline',
          message: 'Select pipeline:',
          choices: pipelines,
        },
      ]);
      pipelineName = selectedPipeline;
    }

    const executionsSpinner = ora('Fetching executions...').start();
    const executions = await listPipelineExecutions(pipelineName!, profile!, region!);
    executionsSpinner.stop();

    if (executions.length === 0) {
      throw new Error(`No executions found for pipeline ${pipelineName}`);
    }

    const { selectedExecution } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedExecution',
        message: 'Select execution to describe:',
        choices: executions.map((e) => {
          const statusEmoji = e.status === 'Succeeded' ? '✅' : e.status === 'Failed' ? '❌' : '⏳';
          const commits = e.sourceRevisions?.map(sr => sr.revisionId.substring(0, 7)).join(', ') || 'N/A';
          const time = e.startTime ? new Date(e.startTime).toLocaleString() : 'N/A';
          return {
            name: `${statusEmoji} [${e.status}] ${e.pipelineExecutionId.substring(0, 8)} - ${commits} - ${time}`,
            value: e.pipelineExecutionId,
          };
        }),
      },
    ]);
    executionId = selectedExecution;

    const { selectedDetail } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedDetail',
        message: 'Select detail level:',
        choices: [
          { name: 'Summary (status, commits, times)', value: 'summary' },
          { name: 'Detailed (+ stages)', value: 'detailed' },
          { name: 'Full (+ actions, artifacts)', value: 'full' },
        ],
        default: 'summary',
      },
    ]);
    detail = selectedDetail;

    const { selectedFormat } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedFormat',
        message: 'Select output format:',
        choices: [
          { name: 'Markdown (human-readable)', value: 'md' },
          { name: 'JSON (machine-readable)', value: 'json' },
        ],
        default: 'md',
      },
    ]);
    format = selectedFormat;

    return { executionId: executionId!, pipelineName, profile: profile!, region, detail, format, wasWizard };
  }

  // Specific execution ID provided, need pipeline name
  if (!pipelineName) {
    throw new Error('Pipeline name is required when specifying an execution ID');
  }

  if (!profile) {
    const profiles = getAWSProfiles();
    const { selectedProfile } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedProfile',
        message: 'Select AWS profile:',
        choices: profiles.map((p) => ({
          name: p.isDefault ? `${p.name} (default)` : p.name,
          value: p.name,
        })),
        default: process.env.AWS_PROFILE || 'default',
      },
    ]);
    profile = selectedProfile;
  }

  const spinner = ora('Checking AWS credentials...').start();
  const credentialsValid = await ensureAWSCredentials(profile!);
  spinner.stop();

  if (!credentialsValid) {
    throw new Error('Unable to proceed without valid credentials');
  }

  return { executionId, pipelineName, profile: profile!, region, detail, format, wasWizard };
}

function formatPipelineOutput(
  execution: PipelineExecution,
  detail: 'summary' | 'detailed' | 'full',
  format: 'json' | 'md'
): string {
  if (format === 'json') {
    return formatAsJson(execution, detail);
  } else {
    return formatAsMarkdown(execution, detail);
  }
}

function formatAsJson(execution: PipelineExecution, detail: 'summary' | 'detailed' | 'full'): string {
  if (detail === 'summary') {
    return JSON.stringify(
      {
        pipelineExecutionId: execution.pipelineExecutionId,
        pipelineName: execution.pipelineName,
        status: execution.status,
        artifactRevisions: execution.artifactRevisions,
        trigger: execution.trigger,
      },
      null,
      2
    );
  } else if (detail === 'detailed') {
    return JSON.stringify(
      {
        pipelineExecutionId: execution.pipelineExecutionId,
        pipelineName: execution.pipelineName,
        pipelineVersion: execution.pipelineVersion,
        status: execution.status,
        statusSummary: execution.statusSummary,
        artifactRevisions: execution.artifactRevisions,
        trigger: execution.trigger,
        stages: execution.stageStates?.map(stage => ({
          stageName: stage.stageName,
          status: stage.status,
        })),
      },
      null,
      2
    );
  } else {
    // full
    return JSON.stringify(execution, null, 2);
  }
}

function formatAsMarkdown(execution: PipelineExecution, detail: 'summary' | 'detailed' | 'full'): string {
  let output = '';

  output += `# Pipeline Execution Details\n\n`;
  output += `## Summary\n\n`;
  output += `- **Execution ID**: ${execution.pipelineExecutionId}\n`;
  output += `- **Pipeline**: ${execution.pipelineName}\n`;
  output += `- **Version**: ${execution.pipelineVersion}\n`;

  // Color-code status
  const statusEmoji = execution.status === 'Succeeded' ? '✅' : execution.status === 'Failed' ? '❌' : '⏳';
  output += `- **Status**: ${statusEmoji} ${execution.status}\n`;

  if (execution.statusSummary) {
    output += `- **Status Summary**: ${execution.statusSummary}\n`;
  }

  // Display source revisions (commits) - THIS IS THE KEY INFO!
  if (execution.artifactRevisions && execution.artifactRevisions.length > 0) {
    output += `\n### 📌 Source Revisions (Commits)\n\n`;
    for (const artifact of execution.artifactRevisions) {
      output += `#### ${artifact.name}\n\n`;
      output += `- **Commit**: \`${artifact.revisionId}\`\n`;
      if (artifact.revisionSummary) {
        output += `- **Message**: ${artifact.revisionSummary}\n`;
      }
      if (artifact.revisionUrl) {
        output += `- **URL**: ${artifact.revisionUrl}\n`;
      }
      if (artifact.created) {
        output += `- **Created**: ${new Date(artifact.created).toLocaleString()}\n`;
      }
      output += `\n`;
    }
  }

  // Display trigger info
  if (execution.trigger) {
    output += `### Trigger\n\n`;
    output += `- **Type**: ${execution.trigger.triggerType}\n`;
    if (execution.trigger.triggerDetail) {
      output += `- **Detail**: ${execution.trigger.triggerDetail}\n`;
    }
    output += `\n`;
  }

  if (detail === 'summary') {
    return output;
  }

  // Detailed: Add stage information
  if (execution.stageStates && execution.stageStates.length > 0) {
    output += `## Stages\n\n`;
    output += `| Stage | Status |\n`;
    output += `|-------|--------|\n`;

    for (const stage of execution.stageStates) {
      const stageEmoji = stage.status === 'Succeeded' ? '✅' : stage.status === 'Failed' ? '❌' : '⏳';
      output += `| ${stage.stageName} | ${stageEmoji} ${stage.status} |\n`;
    }
    output += `\n`;
  }

  if (detail === 'detailed') {
    return output;
  }

  // Full: Add action details
  if (execution.stageStates && execution.stageStates.length > 0) {
    output += `## Actions\n\n`;

    for (const stage of execution.stageStates) {
      output += `### ${stage.stageName}\n\n`;

      if (stage.actionStates && stage.actionStates.length > 0) {
        for (const action of stage.actionStates) {
          const actionEmoji = action.latestExecution?.status === 'Succeeded' ? '✅' :
                             action.latestExecution?.status === 'Failed' ? '❌' : '⏳';
          output += `#### ${actionEmoji} ${action.actionName}\n\n`;

          if (action.latestExecution) {
            output += `- **Status**: ${action.latestExecution.status || 'N/A'}\n`;
            if (action.latestExecution.summary) {
              output += `- **Summary**: ${action.latestExecution.summary}\n`;
            }
            if (action.latestExecution.externalExecutionUrl) {
              output += `- **Execution URL**: ${action.latestExecution.externalExecutionUrl}\n`;
            }
            if (action.latestExecution.errorDetails) {
              output += `- **Error Code**: ${action.latestExecution.errorDetails.code}\n`;
              output += `- **Error Message**: ${action.latestExecution.errorDetails.message}\n`;
            }
          }

          if (action.currentRevision) {
            output += `- **Revision**: \`${action.currentRevision.revisionId}\`\n`;
            if (action.currentRevision.revisionSummary) {
              output += `- **Revision Summary**: ${action.currentRevision.revisionSummary}\n`;
            }
          }

          output += `\n`;
        }
      }
    }
  }

  return output;
}
