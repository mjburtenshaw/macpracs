/**
 * Main interactive wizard for macpracs CLI
 * Launched when no command is provided
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import { awsWizard } from './aws-wizard';
import { mqWizard } from './mq-wizard';

export interface WizardChoice {
  name: string;
  value: string;
  description?: string;
}

export async function mainWizard(): Promise<void> {
  console.log(chalk.blue('\n🛠️  Welcome to macpracs CLI\n'));

  const { category } = await inquirer.prompt([
    {
      type: 'list',
      name: 'category',
      message: 'What would you like to do?',
      choices: [
        {
          name: '☁️  AWS',
          value: 'aws',
        },
        {
          name: '📨 Messaging',
          value: 'mq',
        },
        {
          name: '🌿 Git',
          value: 'git',
        },
        {
          name: '⏰ Timestamps',
          value: 'timestamp',
        },
        {
          name: '📋 Procedures',
          value: 'procedures',
        },
        new inquirer.Separator(),
        {
          name: '❌ Exit',
          value: 'exit',
        },
      ],
    },
  ]);

  if (category === 'exit') {
    console.log(chalk.gray('\nGoodbye! 👋\n'));
    return;
  }

  // Route to specific wizards
  switch (category) {
    case 'aws':
      await awsWizard();
      break;
    case 'mq':
      await mqWizard();
      break;
    case 'git':
      console.log(chalk.yellow('\n⚠️  Git wizard coming soon!\n'));
      // await gitWizard();
      break;
    case 'timestamp':
      console.log(chalk.yellow('\n⚠️  Timestamp wizard coming soon!\n'));
      // await timestampWizard();
      break;
    case 'procedures':
      console.log(chalk.yellow('\n⚠️  Procedures wizard coming soon!\n'));
      // await proceduresWizard();
      break;
    default:
      console.log(chalk.red(`\nUnknown category: ${category}\n`));
  }
}
