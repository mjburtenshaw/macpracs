/**
 * Register all MQ (Message Queue) commands
 */

import { Command } from 'commander';
import { registerPublishEventCommands } from './publish-event';

/**
 * Register all MQ commands under the 'mq' command
 */
export function registerMQCommands(program: Command): void {
  const mq = program
    .command('mq')
    .description('Message Queue operations (publish events, monitor queues)');

  registerPublishEventCommands(mq);
}
