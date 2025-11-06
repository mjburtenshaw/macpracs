/**
 * Message Queue event publisher commands
 */

import { Command } from 'commander';
import {
  createLogger,
  CommandOptions,
  MQPublishOptions,
  publishEvent,
  loadContext,
  readSecret,
  findContextsWithMQ,
} from '../../lib';

export function registerPublishEventCommands(mq: Command): void {
  mq.command('publish')
    .description('Publish a test event to RabbitMQ')
    .requiredOption('-c, --context <name>', 'Context name (e.g., mango, halo)')
    .requiredOption('-e, --environment <env>', 'Target environment')
    .requiredOption('-t, --event-type <type>', 'Event type')
    .option('-p, --password <password>', 'AMQP password (or use --secret-file)')
    .option('-s, --secret-file <path>', 'Path to secret file (relative to ~/.secrets/)')
    .option('--custom-payload <path>', 'Path to custom JSON payload file')
    .action(async (options: MQPublishOptions) => {
      const globalOpts = mq.parent?.opts() as CommandOptions;
      const logger = createLogger(globalOpts?.verbose, globalOpts?.quiet);

      try {
        // Load context
        const context = loadContext(options.context);

        // Get password from secret file if specified
        let password = options.password;
        if (options.secretFile && !password) {
          password = readSecret(options.secretFile);
        }

        await publishEvent({
          context,
          environment: options.environment,
          eventType: options.eventType,
          password: password ?? undefined,
          customPayload: options.customPayload ?? undefined,
          verbose: globalOpts?.verbose,
        });
      } catch (error) {
        logger.error('Failed to publish event', error as Error);
        process.exit(1);
      }
    });

  // Add a list command to show available contexts
  mq.command('list-contexts')
    .description('List available MQ contexts')
    .action(() => {
      const contexts = findContextsWithMQ();

      if (contexts.length === 0) {
        console.log('No MQ contexts found');
        return;
      }

      console.log('\nAvailable MQ contexts:\n');
      for (const ctx of contexts) {
        const description = ctx.description ? ` - ${ctx.description}` : '';
        console.log(`  • ${ctx.name}${description}`);
      }
      console.log('');
    });
}
