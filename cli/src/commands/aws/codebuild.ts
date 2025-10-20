/**
 * AWS CodeBuild commands
 * Hierarchical structure: macpracs aws codebuild <operation>
 */

import { Command } from 'commander';
import path from 'path';
import inquirer from 'inquirer';
import ora from 'ora';
import chalk from 'chalk';
import { spawn } from 'child_process';
import {
  execScript,
  createLogger,
  CommandOptions,
  ensureAWSCredentials,
  getAWSProfiles,
  listBuildProjects,
  listCompletedBuilds,
  AWS_REGIONS,
} from '../../lib';

const SCRIPT_PATH = path.join(__dirname, '../../../../scripts/aws-pipeline-watch.sh');

export function registerCodeBuildCommands(aws: Command): void {
  const codebuild = aws
    .command('codebuild')
    .description('CodeBuild operations (logs, watch, list, retry)');

  registerLogsCommand(codebuild);
  registerWatchCommand(codebuild);
  registerStreamCommand(codebuild);
  registerListCommand(codebuild);
  registerRetryCommand(codebuild);
}

// macpracs aws codebuild logs [options]
function registerLogsCommand(codebuild: Command): void {
  codebuild
    .command('logs')
    .description('View completed build logs with optional filtering and clipboard copy')
    .option('--build-id <id>', 'Build ID to view logs for')
    .option('--project <name>', 'CodeBuild project name')
    .option('--status <status>', 'Filter builds by status (FAILED, SUCCEEDED, STOPPED, all)', 'FAILED')
    .option('--grep <pattern>', 'Filter logs with grep pattern')
    .option('--copy', 'Copy output to clipboard (pbcopy)')
    .option('-p, --profile <profile>', 'AWS CLI profile')
    .option('-r, --region <region>', 'AWS region', 'us-east-1')
    .action(async (options: any) => {
      const globalOpts = codebuild.parent?.parent?.opts() as CommandOptions;
      const logger = createLogger(globalOpts?.verbose, globalOpts?.quiet);

      try {
        const config = await gatherLogsConfiguration(options, logger);
        await executeWithPiping(config, logger);
      } catch (error) {
        logger.error('Failed to view build logs');
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

// macpracs aws codebuild watch <name> [options]
function registerWatchCommand(codebuild: Command): void {
  codebuild
    .command('watch <name>')
    .description('Watch CodeBuild project status in real-time')
    .option('-p, --profile <profile>', 'AWS CLI profile')
    .option('-r, --region <region>', 'AWS region', 'us-east-1')
    .action(async (name: string, options: any) => {
      const globalOpts = codebuild.parent?.parent?.opts() as CommandOptions;
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
}

// macpracs aws codebuild stream <name> [options]
function registerStreamCommand(codebuild: Command): void {
  codebuild
    .command('stream <name>')
    .description('Stream CodeBuild logs in real-time (tail -f style)')
    .option('-p, --profile <profile>', 'AWS CLI profile')
    .option('-r, --region <region>', 'AWS region', 'us-east-1')
    .action(async (name: string, options: any) => {
      const globalOpts = codebuild.parent?.parent?.opts() as CommandOptions;
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
}

// macpracs aws codebuild list [options]
function registerListCommand(codebuild: Command): void {
  codebuild
    .command('list')
    .description('List all CodeBuild projects in the region')
    .option('-p, --profile <profile>', 'AWS CLI profile')
    .option('-r, --region <region>', 'AWS region', 'us-east-1')
    .action(async (options: any) => {
      const globalOpts = codebuild.parent?.parent?.opts() as CommandOptions;
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
}

// macpracs aws codebuild retry <project-name> <build-id> [options]
function registerRetryCommand(codebuild: Command): void {
  codebuild
    .command('retry <project-name> <build-id>')
    .description('Retry a failed CodeBuild job')
    .option('-p, --profile <profile>', 'AWS CLI profile')
    .option('-r, --region <region>', 'AWS region', 'us-east-1')
    .action(async (projectName: string, buildId: string, options: any) => {
      const globalOpts = codebuild.parent?.parent?.opts() as CommandOptions;
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
}

// Helper functions for logs command (copied from codebuild-logs.ts)

interface LogsConfig {
  buildId: string;
  profile: string;
  region: string;
  grepPattern?: string;
  copyToClipboard: boolean;
}

async function gatherLogsConfiguration(options: any, logger: any): Promise<LogsConfig> {
  let buildId = options.buildId;
  let profile = options.profile;
  let region = options.region || 'us-east-1';
  let grepPattern = options.grep;
  let copyToClipboard = options.copy || false;

  if (buildId) {
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
    const credentialsValid = await ensureAWSCredentials(profile);
    spinner.stop();

    if (!credentialsValid) {
      throw new Error('Unable to proceed without valid credentials');
    }

    if (!grepPattern && !options.grep) {
      const { useGrep } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'useGrep',
          message: 'Filter logs with grep?',
          default: false,
        },
      ]);

      if (useGrep) {
        const { pattern } = await inquirer.prompt([
          {
            type: 'input',
            name: 'pattern',
            message: 'Enter grep pattern:',
            validate: (input: string) => (input.trim() ? true : 'Pattern is required'),
          },
        ]);
        grepPattern = pattern;
      }
    }

    if (!copyToClipboard && !options.copy) {
      const { copy } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'copy',
          message: 'Copy output to clipboard?',
          default: false,
        },
      ]);
      copyToClipboard = copy;
    }

    return { buildId, profile, region, grepPattern, copyToClipboard };
  }

  // Full wizard mode
  console.log(chalk.blue('\n🔍 CodeBuild Logs Viewer\n'));

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
  const credentialsValid = await ensureAWSCredentials(profile);
  credentialsSpinner.stop();

  if (!credentialsValid) {
    throw new Error('Unable to proceed without valid credentials');
  }

  let projectName = options.project;
  if (!projectName) {
    const projectsSpinner = ora('Fetching CodeBuild projects...').start();
    const projects = await listBuildProjects(profile, region);
    projectsSpinner.stop();

    if (projects.length === 0) {
      throw new Error(`No CodeBuild projects found in ${region}`);
    }

    const { selectedProject } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedProject',
        message: 'Select CodeBuild project:',
        choices: projects,
      },
    ]);
    projectName = selectedProject;
  }

  const statusFilter = options.status || 'FAILED';
  const { selectedStatus } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selectedStatus',
      message: 'Filter builds by status:',
      choices: [
        { name: 'Failed builds only', value: 'FAILED' },
        { name: 'All completed builds', value: 'all' },
        { name: 'Succeeded builds only', value: 'SUCCEEDED' },
        { name: 'Stopped builds only', value: 'STOPPED' },
      ],
      default: statusFilter,
    },
  ]);

  const buildsSpinner = ora('Fetching builds...').start();
  const filter = selectedStatus === 'all' ? undefined : selectedStatus;
  const builds = await listCompletedBuilds(projectName, profile, region, filter);
  buildsSpinner.stop();

  if (builds.length === 0) {
    const filterText = filter ? `${filter.toLowerCase()} ` : '';
    throw new Error(`No ${filterText}builds found for project ${projectName}`);
  }

  const { selectedBuild } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selectedBuild',
      message: 'Select build to view logs:',
      choices: builds.map((b) => ({
        name: `[${b.status}] ${b.id.split(':').pop()} - ${b.sourceVersion} - ${new Date(b.startTime).toLocaleString()}`,
        value: b.id,
      })),
    },
  ]);
  buildId = selectedBuild;

  const { useGrep } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'useGrep',
      message: 'Filter logs with grep?',
      default: false,
    },
  ]);

  if (useGrep) {
    const { pattern } = await inquirer.prompt([
      {
        type: 'input',
        name: 'pattern',
        message: 'Enter grep pattern:',
        validate: (input: string) => (input.trim() ? true : 'Pattern is required'),
      },
    ]);
    grepPattern = pattern;
  }

  const { copy } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'copy',
      message: 'Copy output to clipboard?',
      default: false,
    },
  ]);
  copyToClipboard = copy;

  return { buildId, profile, region, grepPattern, copyToClipboard };
}

async function executeWithPiping(config: LogsConfig, logger: any): Promise<void> {
  console.log(chalk.blue('\nFetching build logs...\n'));

  const args = ['view-build-logs', config.buildId, config.profile, config.region];

  const commands: Array<{ cmd: string; args: string[] }> = [
    { cmd: SCRIPT_PATH, args },
  ];

  if (config.grepPattern) {
    commands.push({ cmd: 'grep', args: [config.grepPattern] });
  }

  if (config.copyToClipboard) {
    commands.push({ cmd: 'pbcopy', args: [] });
  }

  await executePipeline(commands, logger);

  if (config.copyToClipboard) {
    logger.success('\nLogs copied to clipboard!');
  }

  if (process.stdout.isTTY) {
    const grepFlag = config.grepPattern ? ` --grep "${config.grepPattern}"` : '';
    const copyFlag = config.copyToClipboard ? ' --copy' : '';
    console.log(
      chalk.gray(
        `\n💡 Tip: macpracs aws codebuild logs --build-id ${config.buildId} --profile ${config.profile} --region ${config.region}${grepFlag}${copyFlag}\n`
      )
    );
  }
}

async function executePipeline(
  commands: Array<{ cmd: string; args: string[] }>,
  logger: any
): Promise<void> {
  return new Promise((resolve, reject) => {
    const processes: any[] = [];
    const stderrOutputs: Map<number, string> = new Map();

    // Phase 1: Create all processes
    for (let i = 0; i < commands.length; i++) {
      const { cmd, args } = commands[i];
      const proc = spawn(cmd, args, {
        stdio: i === 0 ? ['inherit', 'pipe', 'pipe'] : ['pipe', 'pipe', 'pipe'],
      });

      processes.push(proc);
      stderrOutputs.set(i, '');
    }

    // Phase 2: Set up pipes and error handlers
    for (let i = 0; i < processes.length; i++) {
      const proc = processes[i];
      const { cmd, args } = commands[i];

      // Set up piping between processes
      if (i < processes.length - 1) {
        proc.stdout.pipe(processes[i + 1].stdin);
      } else if (cmd !== 'pbcopy') {
        // Last process and not pbcopy - show output
        proc.stdout.pipe(process.stdout);
      }

      // Capture stderr
      proc.stderr.on('data', (data: Buffer) => {
        const text = data.toString();
        const currentStderr = stderrOutputs.get(i) || '';
        stderrOutputs.set(i, currentStderr + text);

        // Show stderr in real-time for debugging
        if (process.stderr.isTTY) {
          process.stderr.write(chalk.gray(text));
        }
      });

      // Handle spawn errors
      proc.on('error', (error: Error) => {
        const cmdStr = `${cmd} ${args.join(' ')}`;
        reject(new Error(`Failed to execute command: ${cmdStr}\nReason: ${error.message}`));
      });

      // Handle exit on last process
      if (i === processes.length - 1) {
        proc.on('close', (code: number) => {
          if (code !== 0) {
            const cmdStr = `${cmd} ${args.join(' ')}`;
            let errorMsg = `Command failed with exit code ${code}: ${cmdStr}`;

            // Collect stderr from all processes
            const allStderr: string[] = [];
            stderrOutputs.forEach((stderr, idx) => {
              if (stderr.trim()) {
                allStderr.push(`[${commands[idx].cmd}]: ${stderr.trim()}`);
              }
            });

            if (allStderr.length > 0) {
              errorMsg += `\n\nError output:\n${allStderr.join('\n')}`;
            }

            // Show which command in the pipeline failed
            if (commands.length > 1) {
              errorMsg += `\n\nPipeline: ${commands.map(c => c.cmd).join(' | ')}`;
            }

            reject(new Error(errorMsg));
          } else {
            resolve();
          }
        });
      }
    }
  });
}
