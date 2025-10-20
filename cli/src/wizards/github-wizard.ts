/**
 * GitHub operations interactive wizard
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import path from 'path';
import ora from 'ora';
import { execScript, createLogger, listPullRequests } from '../lib';

const PR_ACTIVITY_SCRIPT_PATH = path.join(__dirname, '../../../scripts/github-pr-activity.sh');

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
