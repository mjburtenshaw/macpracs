/**
 * Type definitions for CLI command options
 *
 * This file contains concrete types for all command options to replace `any` types
 * and provide better type safety and autocomplete throughout the CLI.
 */

/**
 * Base AWS command options
 */
export interface BaseAWSOptions {
  profile: string | null;
  region: string | null;
}

/**
 * CodeBuild command options
 */
export interface CodeBuildLogsOptions extends BaseAWSOptions {
  buildId: string | null;
  project: string | null;
  status: string | null;
  grep: string | null;
  copy: boolean | null;
}

export interface CodeBuildListOptions extends BaseAWSOptions {
  project: string | null;
  status: string | null;
  limit: number | null;
}

export interface CodeBuildDescribeOptions extends BaseAWSOptions {
  buildId: string | null;
  project: string | null;
  detail: 'summary' | 'detailed' | 'full' | null;
  format: 'json' | 'md' | null;
}

/**
 * Cognito command options
 */
export interface CognitoDescribePoolOptions extends BaseAWSOptions {
  userPoolId: string | null;
  format: 'text' | 'json' | null;
}

export interface CognitoListClientsOptions extends BaseAWSOptions {
  userPoolId: string | null;
  format: 'text' | 'json' | null;
}

export interface CognitoDescribeClientOptions extends BaseAWSOptions {
  userPoolId: string | null;
  clientId: string | null;
  format: 'text' | 'json' | null;
  copy: boolean | null;
}

export interface CognitoListUsersOptions extends BaseAWSOptions {
  userPoolId: string | null;
  status: string | null;
}

export interface CognitoDeleteUserOptions extends BaseAWSOptions {
  userPoolId: string | null;
  username: string | null;
}

/**
 * ECS command options
 */
export interface ECSListClustersOptions extends BaseAWSOptions {
  // No additional options beyond base
}

export interface ECSListServicesOptions extends BaseAWSOptions {
  cluster: string | null;
}

export interface ECSRestartServiceOptions extends BaseAWSOptions {
  cluster: string | null;
  service: string | null;
}

export interface ECSDescribeTasksOptions extends BaseAWSOptions {
  cluster: string | null;
  service: string | null;
}

/**
 * Pipeline command options
 */
export interface PipelineListOptions extends BaseAWSOptions {
  // No additional options beyond base
}

export interface PipelineStatusOptions extends BaseAWSOptions {
  pipeline: string | null;
}

export interface PipelineLogsOptions extends BaseAWSOptions {
  pipeline: string | null;
  stage: string | null;
  action: string | null;
}

export interface PipelineDescribeOptions extends BaseAWSOptions {
  executionId: string | null;
  pipeline: string | null;
  detail: 'summary' | 'detailed' | 'full' | null;
  format: 'json' | 'md' | null;
}

/**
 * SSO command options
 */
export interface SSOLoginOptions {
  profile: string | null;
}

/**
 * GitHub command options
 */
export interface GitHubAccountListOptions {
  // No options
}

export interface GitHubAccountAddOptions {
  username: string | null;
  hostname: string | null;
  name: string | null;
  email: string | null;
}

export interface GitHubAccountRemoveOptions {
  username: string | null;
  hostname: string | null;
}

export interface GitHubActionsWatchOptions {
  runId: string | null;
  branch: string | null;
  workflow: string | null;
  repo: string | null;
  user: string | null;
  hostname: string | null;
}

export interface GitHubActionsListOptions {
  branch: string | null;
  workflow: string | null;
  status: string | null;
  limit: string | null;
  repo: string | null;
  user: string | null;
  hostname: string | null;
}

export interface GitHubActionsDescribeOptions {
  runId: string | null;
  repo: string | null;
}

export interface GitHubActionsRerunOptions {
  runId: string | null;
  repo: string | null;
}

export interface GitHubActionsCancelOptions {
  runId: string | null;
  repo: string | null;
}

export interface GitHubAuthOptions {
  web: boolean | null;
  withToken: boolean | null;
  hostname: string | null;
}

export interface GitHubLoginOptions {
  username: string | null;
  hostname: string | null;
}

/**
 * MQ command options
 */
export interface MQPublishOptions {
  context: string;
  environment: string;
  eventType: string;
  password: string | null;
  secretFile: string | null;
  customPayload: string | null;
}
