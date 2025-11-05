/**
 * GitHub Actions commands
 * Hierarchical structure: macpracs github actions <operation>
 */

import { Command } from 'commander';
import path from 'path';
import ora from 'ora';
import chalk from 'chalk';
import inquirer from 'inquirer';
import {
  execScript,
  createLogger,
  CommandOptions,
  getCurrentRepo,
  listWorkflowRuns,
  rerunFailedJobs as rerunFailedJobsLib,
  cancelWorkflowRun as cancelWorkflowRunLib,
  getGitHubAccounts,
  ensureGitHubAuth,
  GitHubActionsWatchOptions,
  GitHubActionsListOptions,
} from '../../lib';

const WATCH_SCRIPT_PATH = path.join(__dirname, '../../../../scripts/github-actions-watch.sh');
const LIST_SCRIPT_PATH = path.join(__dirname, '../../../../scripts/github-actions-list.sh');
const DESCRIBE_SCRIPT_PATH = path.join(__dirname, '../../../../scripts/github-actions-describe.sh');

export function registerActionsCommands(github: Command): void {
  const actions = github
    .command('actions')
    .description('GitHub Actions operations (watch, list, describe, rerun, cancel)');

  registerWatchCommand(actions);
  registerListCommand(actions);
  registerDescribeCommand(actions);
  registerRerunCommand(actions);
  registerCancelCommand(actions);
}

// Helper function to select/auto-select GitHub account (follows AWS profile pattern)
async function selectGitHubAccount(
  specifiedUser?: string,
  specifiedHostname?: string
): Promise<{ username: string; hostname: string }> {
  const hostname = specifiedHostname || 'github.com';

  // If user specified, use it
  if (specifiedUser) {
    await ensureGitHubAuth(specifiedUser, hostname);
    return { username: specifiedUser, hostname };
  }

  // Get available accounts
  const accounts = getGitHubAccounts();

  if (accounts.length === 0) {
    throw new Error('No GitHub accounts found. Run: gh auth login');
  }

  // Filter by hostname if specified
  const filteredAccounts = hostname === 'github.com'
    ? accounts.filter(a => a.hostname === hostname)
    : accounts.filter(a => a.hostname === hostname);

  if (filteredAccounts.length === 0) {
    throw new Error(`No accounts found for hostname ${hostname}`);
  }

  // Auto-select if only one account
  if (filteredAccounts.length === 1) {
    const account = filteredAccounts[0];
    console.log(chalk.gray(`Using GitHub account: ${account.username}@${account.hostname}`));
    await ensureGitHubAuth(account.username, account.hostname);
    return { username: account.username, hostname: account.hostname };
  }

  // Prompt for selection if multiple accounts
  const { selectedAccount } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selectedAccount',
      message: 'Select GitHub account:',
      choices: filteredAccounts.map(a => ({
        name: a.isActive ? `${a.username}@${a.hostname} (active)` : `${a.username}@${a.hostname}`,
        value: a,
      })),
    },
  ]);

  await ensureGitHubAuth(selectedAccount.username, selectedAccount.hostname);
  return { username: selectedAccount.username, hostname: selectedAccount.hostname };
}

// macpracs github actions watch [options]
function registerWatchCommand(actions: Command): void {
  actions
    .command('watch')
    .description('Watch GitHub Actions workflow run in real-time')
    .option('-r, --repo <owner/repo>', 'Repository (defaults to current repo)')
    .option('--run-id <id>', 'Workflow run ID to watch')
    .option('-b, --branch <branch>', 'Branch to filter runs')
    .option('-w, --workflow <name>', 'Workflow name or ID to filter runs')
    .option('-u, --user <username>', 'GitHub account username')
    .option('--hostname <hostname>', 'GitHub hostname (for GHE)', 'github.com')
    .action(async (options: GitHubActionsWatchOptions) => {
      const globalOpts = actions.parent?.parent?.opts() as CommandOptions;
      const logger = createLogger(globalOpts?.verbose, globalOpts?.quiet);

      try {
        // Select GitHub account
        await selectGitHubAccount(options.user, options.hostname);

        let repo = options.repo;

        if (!repo) {
          repo = await getCurrentRepo();
          if (!repo) {
            logger.error('Not in a git repository. Please specify --repo owner/repo');
            process.exit(1);
          }
        }

        const args = [repo];

        if (options.runId) {
          args.push(options.runId);
        } else {
          // Get latest run if no run ID specified
          const spinner = ora('Fetching latest workflow run...').start();
          const runs = await listWorkflowRuns(repo, {
            branch: options.branch,
            workflow: options.workflow,
            limit: 1,
          });
          spinner.stop();

          if (runs.length === 0) {
            logger.error('No workflow runs found');
            process.exit(1);
          }

          args.push(runs[0].id.toString());
          logger.info(`Watching run #${runs[0].id}: ${runs[0].display_title}`);
        }

        const result = await execScript(WATCH_SCRIPT_PATH, args, {
          captureOutput: false,
        });

        if (result.exitCode !== 0) {
          logger.error(`Actions watch failed with exit code ${result.exitCode}`);
          process.exit(result.exitCode);
        }

        logger.success('Actions watch completed');
      } catch (error) {
        logger.error('Failed to execute actions watch', error as Error);
        process.exit(1);
      }
    });
}

// macpracs github actions list [options]
function registerListCommand(actions: Command): void {
  actions
    .command('list')
    .description('List workflow runs for a repository')
    .option('-r, --repo <owner/repo>', 'Repository (defaults to current repo)')
    .option('-b, --branch <branch>', 'Filter by branch')
    .option('-w, --workflow <name>', 'Filter by workflow name or ID')
    .option('-s, --status <status>', 'Filter by status (queued, in_progress, completed)')
    .option('-l, --limit <number>', 'Limit number of results', '20')
    .option('-u, --user <username>', 'GitHub account username')
    .option('--hostname <hostname>', 'GitHub hostname (for GHE)', 'github.com')
    .action(async (options: GitHubActionsListOptions) => {
      const globalOpts = actions.parent?.parent?.opts() as CommandOptions;
      const logger = createLogger(globalOpts?.verbose, globalOpts?.quiet);

      try {
        // Select GitHub account
        await selectGitHubAccount(options.user, options.hostname);

        let repo = options.repo;

        if (!repo) {
          repo = await getCurrentRepo();
          if (!repo) {
            logger.error('Not in a git repository. Please specify --repo owner/repo');
            process.exit(1);
          }
        }

        const args = [repo];
        if (options.branch) args.push('--branch', options.branch);
        if (options.workflow) args.push('--workflow', options.workflow);
        if (options.status) args.push('--status', options.status);
        if (options.limit) args.push('--limit', options.limit);

        const result = await execScript(LIST_SCRIPT_PATH, args, {
          captureOutput: false,
        });

        if (result.exitCode !== 0) {
          logger.error(`Actions list failed with exit code ${result.exitCode}`);
          process.exit(result.exitCode);
        }
      } catch (error) {
        logger.error('Failed to list workflow runs', error as Error);
        process.exit(1);
      }
    });
}

// macpracs github actions describe <run-id> [options]
function registerDescribeCommand(actions: Command): void {
  actions
    .command('describe <run-id>')
    .description('Get detailed information about a workflow run')
    .option('-r, --repo <owner/repo>', 'Repository (defaults to current repo)')
    .option('-u, --user <username>', 'GitHub account username')
    .option('--hostname <hostname>', 'GitHub hostname (for GHE)', 'github.com')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .action(async (runId: string, options: any) => {
      const globalOpts = actions.parent?.parent?.opts() as CommandOptions;
      const logger = createLogger(globalOpts?.verbose, globalOpts?.quiet);

      try {
        // Select GitHub account
        await selectGitHubAccount(options.user, options.hostname);

        let repo = options.repo;

        if (!repo) {
          repo = await getCurrentRepo();
          if (!repo) {
            logger.error('Not in a git repository. Please specify --repo owner/repo');
            process.exit(1);
          }
        }

        const args = [repo, runId];

        const result = await execScript(DESCRIBE_SCRIPT_PATH, args, {
          captureOutput: false,
        });

        if (result.exitCode !== 0) {
          logger.error(`Actions describe failed with exit code ${result.exitCode}`);
          process.exit(result.exitCode);
        }
      } catch (error) {
        logger.error('Failed to describe workflow run', error as Error);
        process.exit(1);
      }
    });
}

// macpracs github actions rerun <run-id> [options]
function registerRerunCommand(actions: Command): void {
  actions
    .command('rerun <run-id>')
    .description('Rerun failed jobs for a workflow run')
    .option('-r, --repo <owner/repo>', 'Repository (defaults to current repo)')
    .option('-u, --user <username>', 'GitHub account username')
    .option('--hostname <hostname>', 'GitHub hostname (for GHE)', 'github.com')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .action(async (runId: string, options: any) => {
      const globalOpts = actions.parent?.parent?.opts() as CommandOptions;
      const logger = createLogger(globalOpts?.verbose, globalOpts?.quiet);

      try {
        // Select GitHub account
        await selectGitHubAccount(options.user, options.hostname);

        let repo = options.repo;

        if (!repo) {
          repo = await getCurrentRepo();
          if (!repo) {
            logger.error('Not in a git repository. Please specify --repo owner/repo');
            process.exit(1);
          }
        }

        const spinner = ora(`Rerunning failed jobs for run ${runId}...`).start();

        await rerunFailedJobsLib(repo, parseInt(runId, 10));

        spinner.succeed(`Rerun initiated for workflow run ${runId}`);

        console.log(chalk.gray(`\n💡 Tip: Watch the rerun with: macpracs github actions watch --repo ${repo} --run-id ${runId}\n`));
      } catch (error) {
        logger.error('Failed to rerun workflow', error as Error);
        process.exit(1);
      }
    });
}

// macpracs github actions cancel <run-id> [options]
function registerCancelCommand(actions: Command): void {
  actions
    .command('cancel <run-id>')
    .description('Cancel an in-progress workflow run')
    .option('-r, --repo <owner/repo>', 'Repository (defaults to current repo)')
    .option('-u, --user <username>', 'GitHub account username')
    .option('--hostname <hostname>', 'GitHub hostname (for GHE)', 'github.com')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .action(async (runId: string, options: any) => {
      const globalOpts = actions.parent?.parent?.opts() as CommandOptions;
      const logger = createLogger(globalOpts?.verbose, globalOpts?.quiet);

      try {
        // Select GitHub account
        await selectGitHubAccount(options.user, options.hostname);

        let repo = options.repo;

        if (!repo) {
          repo = await getCurrentRepo();
          if (!repo) {
            logger.error('Not in a git repository. Please specify --repo owner/repo');
            process.exit(1);
          }
        }

        const spinner = ora(`Cancelling workflow run ${runId}...`).start();

        await cancelWorkflowRunLib(repo, parseInt(runId, 10));

        spinner.succeed(`Workflow run ${runId} cancelled`);
      } catch (error) {
        logger.error('Failed to cancel workflow run', error as Error);
        process.exit(1);
      }
    });
}
