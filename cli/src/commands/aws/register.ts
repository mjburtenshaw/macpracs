/**
 * AWS command registration
 * Creates the main aws command and registers all sub-commands
 */

import { Command } from 'commander';
import { registerPipelineWatchCommands } from './pipeline-watch';
import { registerECSTasksCommands } from './ecs-tasks';

export function registerAWSCommands(program: Command): void {
  // Create the main aws command once
  const aws = program
    .command('aws')
    .description('AWS operations (pipelines, builds, logs, ECS)');

  // Register all AWS sub-commands on the same aws command object
  registerPipelineWatchCommands(aws);
  registerECSTasksCommands(aws);
}
