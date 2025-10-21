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
  getBuildDetails,
  getLatestBuild,
  BuildDetails,
  AWS_REGIONS,
} from '../../lib';

const SCRIPT_PATH = path.join(__dirname, '../../../../scripts/aws-pipeline-watch.sh');

export function registerCodeBuildCommands(aws: Command): void {
  const codebuild = aws
    .command('codebuild')
    .description('CodeBuild operations (logs, watch, list, retry, describe)');

  registerLogsCommand(codebuild);
  registerWatchCommand(codebuild);
  registerStreamCommand(codebuild);
  registerListCommand(codebuild);
  registerRetryCommand(codebuild);
  registerDescribeCommand(codebuild);
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

// macpracs aws codebuild describe [options]
function registerDescribeCommand(codebuild: Command): void {
  codebuild
    .command('describe')
    .description('Inspect build execution details (commit, status, phases, etc.)')
    .option('--build-id <id>', 'Build ID to inspect (specific ID, "latest", or "unknown" for wizard)')
    .option('--project <name>', 'CodeBuild project name')
    .option('--detail <level>', 'Detail level: summary, detailed, full', 'summary')
    .option('--format <format>', 'Output format: json, md', 'json')
    .option('-p, --profile <profile>', 'AWS CLI profile')
    .option('-r, --region <region>', 'AWS region', 'us-east-1')
    .action(async (options: any) => {
      const globalOpts = codebuild.parent?.parent?.opts() as CommandOptions;
      const logger = createLogger(globalOpts?.verbose, globalOpts?.quiet);

      try {
        const config = await gatherDescribeConfiguration(options, logger);
        const buildDetails = await getBuildDetails(config.buildId, config.profile, config.region);

        const output = formatBuildOutput(buildDetails, config.detail, config.format);
        console.log(output);

        // Print tip with fully qualified command if in wizard mode
        if (config.wasWizard && process.stdout.isTTY) {
          const detailFlag = config.detail !== 'summary' ? ` --detail ${config.detail}` : '';
          const formatFlag = config.format !== 'json' ? ` --format ${config.format}` : '';
          console.log(
            chalk.gray(
              `\n💡 Tip: macpracs aws codebuild describe --build-id ${config.buildId} --profile ${config.profile} --region ${config.region}${detailFlag}${formatFlag}\n`
            )
          );
        }
      } catch (error) {
        logger.error('Failed to describe build');
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

// Helper functions for logs command (copied from codebuild-logs.ts)

interface LogsConfig {
  buildId: string;
  profile: string;
  region: string;
  grepPattern?: string;
  copyToClipboard: boolean;
}

interface DescribeConfig {
  buildId: string;
  profile: string;
  region: string;
  detail: 'summary' | 'detailed' | 'full';
  format: 'json' | 'md';
  wasWizard: boolean;
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

    // When build-id is provided, use CLI flags for grep/copy
    // Don't prompt - let users pipe or use --grep/--copy flags
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

// Helper functions for describe command

async function gatherDescribeConfiguration(options: any, logger: any): Promise<DescribeConfig> {
  let buildId = options.buildId;
  let profile = options.profile;
  let region = options.region || 'us-east-1';
  let detail = options.detail || 'summary';
  let format = options.format || 'json';
  let wasWizard = false;

  // If build-id is 'latest', we need the project name
  if (buildId === 'latest') {
    let projectName = options.project;

    if (!projectName) {
      wasWizard = true;
      console.log(chalk.blue('\n🔍 CodeBuild Describe - Latest Build\n'));

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

    // Get the latest build ID
    const spinner = ora('Fetching latest build...').start();
    buildId = await getLatestBuild(projectName, profile, region);
    spinner.stop();

    if (wasWizard) {
      const { selectedDetail } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selectedDetail',
          message: 'Select detail level:',
          choices: [
            { name: 'Summary (status, commit, times)', value: 'summary' },
            { name: 'Detailed (+ phases)', value: 'detailed' },
            { name: 'Full (+ environment, artifacts)', value: 'full' },
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

    return { buildId, profile, region, detail, format, wasWizard };
  }

  // If build-id is 'unknown' or not provided, launch full wizard
  if (!buildId || buildId === 'unknown') {
    wasWizard = true;
    console.log(chalk.blue('\n🔍 CodeBuild Describe\n'));

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

    const buildsSpinner = ora('Fetching builds...').start();
    const builds = await listCompletedBuilds(projectName, profile, region);
    buildsSpinner.stop();

    if (builds.length === 0) {
      throw new Error(`No builds found for project ${projectName}`);
    }

    const { selectedBuild } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedBuild',
        message: 'Select build to describe:',
        choices: builds.map((b) => ({
          name: `[${b.status}] ${b.id.split(':').pop()} - ${b.sourceVersion} - ${new Date(b.startTime).toLocaleString()}`,
          value: b.id,
        })),
      },
    ]);
    buildId = selectedBuild;

    const { selectedDetail } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedDetail',
        message: 'Select detail level:',
        choices: [
          { name: 'Summary (status, commit, times)', value: 'summary' },
          { name: 'Detailed (+ phases)', value: 'detailed' },
          { name: 'Full (+ environment, artifacts)', value: 'full' },
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

    return { buildId, profile, region, detail, format, wasWizard };
  }

  // Specific build ID provided
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

  return { buildId, profile, region, detail, format, wasWizard };
}

function formatBuildOutput(
  build: BuildDetails,
  detail: 'summary' | 'detailed' | 'full',
  format: 'json' | 'md'
): string {
  if (format === 'json') {
    return formatAsJson(build, detail);
  } else {
    return formatAsMarkdown(build, detail);
  }
}

function formatAsJson(build: BuildDetails, detail: 'summary' | 'detailed' | 'full'): string {
  if (detail === 'summary') {
    const duration = build.endTime
      ? Math.round((new Date(build.endTime).getTime() - new Date(build.startTime).getTime()) / 1000)
      : null;

    return JSON.stringify(
      {
        id: build.id,
        projectName: build.projectName,
        buildNumber: build.buildNumber,
        buildStatus: build.buildStatus,
        sourceVersion: build.sourceVersion,
        resolvedSourceVersion: build.resolvedSourceVersion,
        initiator: build.initiator,
        startTime: build.startTime,
        endTime: build.endTime,
        durationSeconds: duration,
      },
      null,
      2
    );
  } else if (detail === 'detailed') {
    const duration = build.endTime
      ? Math.round((new Date(build.endTime).getTime() - new Date(build.startTime).getTime()) / 1000)
      : null;

    return JSON.stringify(
      {
        id: build.id,
        projectName: build.projectName,
        buildNumber: build.buildNumber,
        buildStatus: build.buildStatus,
        sourceVersion: build.sourceVersion,
        resolvedSourceVersion: build.resolvedSourceVersion,
        initiator: build.initiator,
        startTime: build.startTime,
        endTime: build.endTime,
        durationSeconds: duration,
        currentPhase: build.currentPhase,
        phases: build.phases,
      },
      null,
      2
    );
  } else {
    // full
    return JSON.stringify(build, null, 2);
  }
}

function formatAsMarkdown(build: BuildDetails, detail: 'summary' | 'detailed' | 'full'): string {
  let output = '';

  output += `# Build Details\n\n`;
  output += `## Summary\n\n`;
  output += `- **Build ID**: ${build.id}\n`;
  output += `- **Project**: ${build.projectName}\n`;
  output += `- **Build Number**: ${build.buildNumber}\n`;

  // Color-code status
  const statusEmoji = build.buildStatus === 'SUCCEEDED' ? '✅' : build.buildStatus === 'FAILED' ? '❌' : '⏳';
  output += `- **Status**: ${statusEmoji} ${build.buildStatus}\n`;

  output += `- **Source Version**: \`${build.sourceVersion}\`\n`;
  if (build.resolvedSourceVersion) {
    output += `- **Resolved Source Version**: \`${build.resolvedSourceVersion}\`\n`;
  }
  if (build.initiator) {
    output += `- **Initiated By**: ${build.initiator}\n`;
  }

  output += `- **Start Time**: ${new Date(build.startTime).toLocaleString()}\n`;
  if (build.endTime) {
    output += `- **End Time**: ${new Date(build.endTime).toLocaleString()}\n`;
    const duration = Math.round((new Date(build.endTime).getTime() - new Date(build.startTime).getTime()) / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    output += `- **Duration**: ${minutes}m ${seconds}s\n`;
  }

  if (detail === 'summary') {
    return output;
  }

  // Detailed: Add phases
  if (build.phases && build.phases.length > 0) {
    output += `\n## Build Phases\n\n`;
    output += `| Phase | Status | Duration | Context |\n`;
    output += `|-------|--------|----------|----------|\n`;

    for (const phase of build.phases) {
      const phaseEmoji = phase.phaseStatus === 'SUCCEEDED' ? '✅' : phase.phaseStatus === 'FAILED' ? '❌' : '⏳';
      const duration = phase.durationInSeconds ? `${phase.durationInSeconds}s` : 'N/A';
      const context = phase.contexts && phase.contexts.length > 0
        ? phase.contexts.map(c => c.message || '').join(', ')
        : '-';
      output += `| ${phase.phaseType} | ${phaseEmoji} ${phase.phaseStatus} | ${duration} | ${context} |\n`;
    }
  }

  if (detail === 'detailed') {
    return output;
  }

  // Full: Add environment, artifacts, logs, network
  if (build.environment) {
    output += `\n## Environment\n\n`;
    output += `- **Type**: ${build.environment.type}\n`;
    output += `- **Image**: ${build.environment.image}\n`;
    output += `- **Compute Type**: ${build.environment.computeType}\n`;
    if (build.environment.privilegedMode !== undefined) {
      output += `- **Privileged Mode**: ${build.environment.privilegedMode}\n`;
    }

    if (build.environment.environmentVariables && build.environment.environmentVariables.length > 0) {
      output += `\n### Environment Variables\n\n`;
      output += `| Name | Value | Type |\n`;
      output += `|------|-------|------|\n`;
      for (const env of build.environment.environmentVariables) {
        output += `| ${env.name} | ${env.value} | ${env.type} |\n`;
      }
    }
  }

  if (build.artifacts) {
    output += `\n## Artifacts\n\n`;
    if (build.artifacts.location) {
      output += `- **Location**: ${build.artifacts.location}\n`;
    }
    if (build.artifacts.sha256sum) {
      output += `- **SHA256**: \`${build.artifacts.sha256sum}\`\n`;
    }
    if (build.artifacts.md5sum) {
      output += `- **MD5**: \`${build.artifacts.md5sum}\`\n`;
    }
  }

  if (build.logs) {
    output += `\n## Logs\n\n`;
    if (build.logs.groupName) {
      output += `- **Log Group**: ${build.logs.groupName}\n`;
    }
    if (build.logs.streamName) {
      output += `- **Log Stream**: ${build.logs.streamName}\n`;
    }
    if (build.logs.deepLink) {
      output += `- **CloudWatch Link**: ${build.logs.deepLink}\n`;
    }
  }

  if (build.networkInterface) {
    output += `\n## Network Interface\n\n`;
    if (build.networkInterface.subnetId) {
      output += `- **Subnet ID**: ${build.networkInterface.subnetId}\n`;
    }
    if (build.networkInterface.networkInterfaceId) {
      output += `- **Network Interface ID**: ${build.networkInterface.networkInterfaceId}\n`;
    }
  }

  if (build.source) {
    output += `\n## Source\n\n`;
    output += `- **Type**: ${build.source.type}\n`;
    output += `- **Location**: ${build.source.location}\n`;
    if (build.source.gitCloneDepth) {
      output += `- **Git Clone Depth**: ${build.source.gitCloneDepth}\n`;
    }
    if (build.source.buildspec) {
      output += `- **Buildspec**: ${build.source.buildspec}\n`;
    }
  }

  if (build.timeoutInMinutes) {
    output += `\n## Timeouts\n\n`;
    output += `- **Timeout**: ${build.timeoutInMinutes} minutes\n`;
    if (build.queuedTimeoutInMinutes) {
      output += `- **Queued Timeout**: ${build.queuedTimeoutInMinutes} minutes\n`;
    }
  }

  return output;
}
