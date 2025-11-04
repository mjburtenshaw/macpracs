/**
 * GitHub operations interactive wizard
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import path from 'path';
import ora from 'ora';
import {
  execScript,
  createLogger,
  listPullRequests,
  listUserRepos,
  getCurrentRepo,
  listWorkflowRuns,
  getGitHubAccounts,
  ensureGitHubAuth,
} from '../lib';

const PR_ACTIVITY_SCRIPT_PATH = path.join(__dirname, '../../../scripts/github-pr-activity.sh');
const ACTIONS_WATCH_SCRIPT_PATH = path.join(__dirname, '../../../scripts/github-actions-watch.sh');

export async function githubWizard(): Promise<void> {
  console.log(chalk.blue('\n🐙 GitHub Operations\n'));

  // Step 1: Choose GitHub operation
  const { operation } = await inquirer.prompt([
    {
      type: 'list',
      name: 'operation',
      message: 'What would you like to do?',
      choices: [
        {
          name: '📝 View PR activity (description + comments)',
          value: 'pr-activity',
        },
        {
          name: '🔄 Watch GitHub Actions workflow run',
          value: 'actions-watch',
        },
        new inquirer.Separator(),
        {
          name: '← Back to main menu',
          value: 'back',
        },
      ],
    },
  ]);

  if (operation === 'back') {
    return;
  }

  // Route to operation-specific handler
  switch (operation) {
    case 'pr-activity':
      await prActivitySubmenu();
      break;
    case 'actions-watch':
      await actionsWatchSubmenu();
      break;
    default:
      console.log(chalk.red(`\nUnknown operation: ${operation}\n`));
  }
}

async function prActivitySubmenu(): Promise<void> {
  console.log(chalk.blue('\n📝 PR Activity\n'));

  // Step 1: Ask about repository
  const { useCustomRepo } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'useCustomRepo',
      message: 'Use a different repository? (defaults to current repo)',
      default: false,
    },
  ]);

  let repo: string | undefined;
  if (useCustomRepo) {
    const repoInput = await inquirer.prompt([
      {
        type: 'input',
        name: 'repo',
        message: 'Enter repository (owner/repo):',
        validate: (input: string) => {
          if (!input.trim()) {
            return 'Repository is required';
          }
          if (!/^[\w-]+\/[\w-]+$/.test(input.trim())) {
            return 'Repository must be in owner/repo format';
          }
          return true;
        },
      },
    ]);
    repo = repoInput.repo;
  }

  // Step 2: Ask for state filter
  const { prState } = await inquirer.prompt([
    {
      type: 'list',
      name: 'prState',
      message: 'Filter pull requests by state:',
      choices: [
        { name: 'All PRs', value: 'all' },
        { name: 'Open PRs', value: 'open' },
        { name: 'Closed PRs', value: 'closed' },
        { name: 'Merged PRs', value: 'merged' },
      ],
      default: 'all',
    },
  ]);

  // Step 3: Fetch PRs
  const spinner = ora('Fetching pull requests...').start();

  let pullRequests;
  try {
    pullRequests = await listPullRequests(repo, prState);
    spinner.stop();

    if (pullRequests.length === 0) {
      const repoText = repo || 'this repository';
      const stateText = prState === 'all' ? '' : ` ${prState}`;
      console.log(chalk.yellow(`\nNo${stateText} pull requests found in ${repoText}\n`));
      return;
    }
  } catch (error) {
    spinner.fail('Failed to fetch pull requests');
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    return;
  }

  // Step 4: Select PR from list
  const { prNumber } = await inquirer.prompt([
    {
      type: 'list',
      name: 'prNumber',
      message: 'Select pull request:',
      choices: pullRequests.map((pr) => ({
        name: `#${pr.number} - ${pr.title} - @${pr.author} - (${pr.state})`,
        value: pr.number.toString(),
      })),
    },
  ]);

  // Step 5: Fetch and display PR activity
  console.log(chalk.blue('\nFetching PR activity...\n'));

  const logger = createLogger(false, false);

  const args = [prNumber];
  if (repo) {
    args.push(repo);
  }

  try {
    const result = await execScript(PR_ACTIVITY_SCRIPT_PATH, args, {
      captureOutput: false, // Let bash script output to stdout
    });

    if (result.exitCode !== 0) {
      logger.error(`Failed to fetch PR activity with exit code ${result.exitCode}`);
      process.exit(result.exitCode);
    }

    console.log(chalk.gray(`\n💡 Tip: You can pipe this to pbcopy: macpracs github pr-activity ${prNumber}${repo ? ` --repo ${repo}` : ''} | pbcopy\n`));
  } catch (error) {
    logger.error('Failed to fetch PR activity', error as Error);
    process.exit(1);
  }
}

async function actionsWatchSubmenu(): Promise<void> {
  console.log(chalk.blue('\n🔄 GitHub Actions Watch\n'));

  // Step 1: Select GitHub account (follows AWS profile pattern)
  const accounts = getGitHubAccounts();

  if (accounts.length === 0) {
    console.log(chalk.red('\nNo GitHub accounts found. Run: gh auth login\n'));
    return;
  }

  let selectedAccount;
  if (accounts.length === 1) {
    // Auto-select if only one account
    selectedAccount = accounts[0];
    console.log(chalk.gray(`Using GitHub account: ${selectedAccount.username}@${selectedAccount.hostname}`));
  } else {
    // Prompt for selection if multiple accounts
    const result = await inquirer.prompt([
      {
        type: 'list',
        name: 'account',
        message: 'Select GitHub account:',
        choices: accounts.map(a => ({
          name: a.isActive ? `${a.username}@${a.hostname} (active)` : `${a.username}@${a.hostname}`,
          value: a,
        })),
      },
    ]);
    selectedAccount = result.account;
  }

  // Ensure authentication
  const authValid = await ensureGitHubAuth(selectedAccount.username, selectedAccount.hostname);
  if (!authValid) {
    console.log(chalk.red('\nFailed to authenticate with GitHub\n'));
    return;
  }

  // Step 2: Determine repository
  let repo: string | undefined;
  const currentRepo = await getCurrentRepo();

  if (currentRepo) {
    const { useCurrentRepo } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'useCurrentRepo',
        message: `Use current repository (${currentRepo})?`,
        default: true,
      },
    ]);

    if (useCurrentRepo) {
      repo = currentRepo;
    }
  }

  if (!repo) {
    // Fetch user repos
    const spinner = ora('Fetching repositories...').start();

    let repos;
    try {
      repos = await listUserRepos();
      spinner.stop();

      if (repos.length === 0) {
        console.log(chalk.yellow('\nNo repositories found\n'));
        return;
      }
    } catch (error) {
      spinner.fail('Failed to fetch repositories');
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      return;
    }

    // Select repo from list
    const { selectedRepo } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedRepo',
        message: 'Select repository:',
        choices: repos.map((r) => ({
          name: r.nameWithOwner,
          value: r.nameWithOwner,
        })),
      },
    ]);

    repo = selectedRepo;
  }

  // At this point, repo must be defined
  if (!repo) {
    console.log(chalk.red('\nFailed to determine repository\n'));
    return;
  }

  // Step 3: Ask for filters
  const { applyFilters } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'applyFilters',
      message: 'Filter workflow runs (branch, workflow, status)?',
      default: false,
    },
  ]);

  let branch: string | undefined;
  let workflow: string | undefined;
  let status: string | undefined;

  if (applyFilters) {
    const filters = await inquirer.prompt([
      {
        type: 'input',
        name: 'branch',
        message: 'Branch name (leave empty for all):',
      },
      {
        type: 'input',
        name: 'workflow',
        message: 'Workflow name or ID (leave empty for all):',
      },
      {
        type: 'list',
        name: 'status',
        message: 'Status filter:',
        choices: [
          { name: 'All', value: undefined },
          { name: 'Completed', value: 'completed' },
          { name: 'In Progress', value: 'in_progress' },
          { name: 'Queued', value: 'queued' },
        ],
      },
    ]);

    branch = filters.branch || undefined;
    workflow = filters.workflow || undefined;
    status = filters.status;
  }

  // Step 4: Fetch workflow runs
  const spinner = ora('Fetching workflow runs...').start();

  let workflowRuns;
  try {
    workflowRuns = await listWorkflowRuns(repo, { branch, workflow, status, limit: 20 });
    spinner.stop();

    if (workflowRuns.length === 0) {
      console.log(chalk.yellow(`\nNo workflow runs found in ${repo}\n`));
      return;
    }
  } catch (error) {
    spinner.fail('Failed to fetch workflow runs');
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    return;
  }

  // Step 5: Select workflow run
  const { runId } = await inquirer.prompt([
    {
      type: 'list',
      name: 'runId',
      message: 'Select workflow run to watch:',
      choices: workflowRuns.map((run) => {
        const statusIcon =
          run.status === 'completed'
            ? run.conclusion === 'success'
              ? '✅'
              : run.conclusion === 'failure'
              ? '❌'
              : '⚪'
            : run.status === 'in_progress'
            ? '⏳'
            : '⏸️';

        const statusText = run.status === 'completed' ? run.conclusion : run.status;
        const sha = run.head_sha.substring(0, 7);

        return {
          name: `${statusIcon} ${run.display_title} - ${run.head_branch} (${sha}) - ${statusText}`,
          value: run.id,
        };
      }),
    },
  ]);

  // Step 6: Launch watch script
  console.log(chalk.blue('\nLaunching Actions watch...\n'));

  const logger = createLogger(false, false);

  const args = [repo, runId.toString()];

  try {
    const result = await execScript(ACTIONS_WATCH_SCRIPT_PATH, args, {
      captureOutput: false, // Let bash script output to stdout
    });

    if (result.exitCode !== 0) {
      logger.error(`Failed to watch workflow run with exit code ${result.exitCode}`);
      process.exit(result.exitCode);
    }
  } catch (error) {
    logger.error('Failed to watch workflow run', error as Error);
    process.exit(1);
  }
}
