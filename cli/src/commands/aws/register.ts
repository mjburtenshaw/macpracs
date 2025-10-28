/**
 * AWS command registration
 * Creates the main aws command and registers service-level sub-commands
 */

import { Command } from 'commander';
import { registerCodeBuildCommands } from './codebuild';
import { registerPipelineCommands } from './pipeline';
import { registerECSCommands } from './ecs';
import { registerSSOCommands } from './sso';
import { registerCognitoCommands } from './cognito';
import { awsWizard } from '../../wizards/aws-wizard';

export function registerAWSCommands(program: Command): void {
  // Create the main aws command
  const aws = program
    .command('aws')
    .description('AWS operations (CodeBuild, CodePipeline, ECS, SSO, Cognito)')
    .action(async () => {
      // Launch wizard when no subcommand is provided
      await awsWizard();
    });

  // Register service-level commands (hierarchical structure)
  registerCodeBuildCommands(aws);
  registerPipelineCommands(aws);
  registerECSCommands(aws);
  registerSSOCommands(aws);
  registerCognitoCommands(aws);
}
