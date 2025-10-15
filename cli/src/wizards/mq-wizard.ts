/**
 * Message Queue operations interactive wizard
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import {
  publishEvent,
  findContextsWithMQ,
  getContextsDir,
  listSecretFiles,
  readSecret,
  Context,
} from '../lib';

export async function mqWizard(): Promise<void> {
  console.log(chalk.blue('\n📨 Message Queue Operations\n'));

  // Step 1: Choose operation
  const { operation } = await inquirer.prompt([
    {
      type: 'list',
      name: 'operation',
      message: 'What MQ operation would you like to perform?',
      choices: [
        {
          name: '📤 Publish test event',
          value: 'publish',
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

  // Step 2: Discover and select context
  const mqContexts = findContextsWithMQ();

  if (mqContexts.length === 0) {
    console.log(chalk.yellow('\n⚠️  No MQ contexts found'));
    console.log(chalk.gray(`Create a context file in ${getContextsDir()}/`));
    console.log(chalk.gray('Example: ~/.macpracs/contexts/mango.json\n'));
    return;
  }

  let selectedContext: Context;

  if (mqContexts.length === 1) {
    // Auto-select if only one context
    selectedContext = mqContexts[0];
    console.log(chalk.gray(`Using context: ${selectedContext.name}\n`));
  } else {
    // Prompt user to select context
    const { contextName } = await inquirer.prompt([
      {
        type: 'list',
        name: 'contextName',
        message: 'Select MQ context:',
        choices: mqContexts.map((ctx) => ({
          name: ctx.description ? `${ctx.name} (${ctx.description})` : ctx.name,
          value: ctx.name,
        })),
      },
    ]);

    selectedContext = mqContexts.find((ctx) => ctx.name === contextName)!;
  }

  // Step 3: Select environment
  const environments = Object.keys(selectedContext.mq!.environments);
  const { environment } = await inquirer.prompt([
    {
      type: 'list',
      name: 'environment',
      message: 'Select target environment:',
      choices: environments.map((env) => {
        const config = selectedContext.mq!.environments[env];
        return {
          name: `${env} (${config.region})`,
          value: env,
        };
      }),
    },
  ]);

  // Step 4: Select event type
  const eventTypes = Object.keys(selectedContext.mq!.eventTemplates);
  const { eventType } = await inquirer.prompt([
    {
      type: 'list',
      name: 'eventType',
      message: 'Select event type to publish:',
      choices: eventTypes,
    },
  ]);

  // Step 5: Get password if needed
  let password: string | undefined;
  const envConfig = selectedContext.mq!.environments[environment];
  const needsPassword = envConfig.amqpUrlTemplate.includes('{password}');

  if (needsPassword) {
    // Discover secret files from ~/.secrets
    const secretFiles = listSecretFiles();

    if (secretFiles.length === 0) {
      // No secret files found, prompt for password directly
      const { passwordInput } = await inquirer.prompt([
        {
          type: 'password',
          name: 'passwordInput',
          message: 'Enter AMQP password:',
          mask: '*',
          validate: (input: string) => {
            if (!input || input.trim() === '') {
              return 'Password is required for this environment';
            }
            return true;
          },
        },
      ]);
      password = passwordInput;
    } else {
      // Let user select from secret files
      const { useSecretFile } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'useSecretFile',
          message: 'Use password from secret file?',
          default: true,
        },
      ]);

      if (useSecretFile) {
        const { secretFile } = await inquirer.prompt([
          {
            type: 'list',
            name: 'secretFile',
            message: 'Select secret file:',
            choices: secretFiles,
          },
        ]);

        password = readSecret(secretFile);
      } else {
        const { passwordInput } = await inquirer.prompt([
          {
            type: 'password',
            name: 'passwordInput',
            message: 'Enter AMQP password:',
            mask: '*',
            validate: (input: string) => {
              if (!input || input.trim() === '') {
                return 'Password is required for this environment';
              }
              return true;
            },
          },
        ]);
        password = passwordInput;
      }
    }
  }

  // Step 5: Custom payload (optional)
  const { useCustomPayload } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'useCustomPayload',
      message: 'Use custom JSON payload file?',
      default: false,
    },
  ]);

  let customPayload: string | undefined;
  if (useCustomPayload) {
    const { payloadPath } = await inquirer.prompt([
      {
        type: 'input',
        name: 'payloadPath',
        message: 'Enter path to custom payload JSON file:',
        validate: (input: string) => {
          if (!input || input.trim() === '') {
            return 'Payload file path is required';
          }
          return true;
        },
      },
    ]);
    customPayload = payloadPath;
  }

  // Execute the publish operation
  console.log(chalk.blue('\n📤 Publishing event to message queue...\n'));

  try {
    await publishEvent({
      context: selectedContext,
      environment,
      eventType,
      password,
      customPayload,
      verbose: false,
    });

    console.log(chalk.green('\n✓ Event published successfully\n'));
  } catch (error) {
    console.error(
      chalk.red(
        `\n✗ Failed to publish event: ${error instanceof Error ? error.message : String(error)}\n`
      )
    );
    process.exit(1);
  }
}
