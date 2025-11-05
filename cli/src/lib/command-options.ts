/**
 * Type definitions for CLI command options
 *
 * This file contains concrete types for all command options to replace `any` types
 * and provide better type safety and autocomplete throughout the CLI.
 */

/**
 * Logger interface for command logging
 */
export interface Logger {
  log(message: string): void;
  info(message: string): void;
  warn(message: string): void;
  error(message: string, error?: Error): void;
  success(message: string): void;
}

/**
 * Base AWS command options
 */
export interface BaseAWSOptions {
  profile?: string;
  region?: string;
}

/**
 * CodeBuild command options
 */
export interface CodeBuildLogsOptions extends BaseAWSOptions {
  buildId?: string;
  project?: string;
  status?: string;
  grep?: string;
  copy?: boolean;
}

export interface CodeBuildListOptions extends BaseAWSOptions {
  project?: string;
  status?: string;
  limit?: number;
}

export interface CodeBuildDescribeOptions extends BaseAWSOptions {
  buildId?: string;
  project?: string;
}

/**
 * Cognito command options
 */
export interface CognitoDescribePoolOptions extends BaseAWSOptions {
  userPoolId?: string;
  format?: 'text' | 'json';
}

export interface CognitoListClientsOptions extends BaseAWSOptions {
  userPoolId?: string;
  format?: 'text' | 'json';
}

export interface CognitoDescribeClientOptions extends BaseAWSOptions {
  userPoolId?: string;
  clientId?: string;
  format?: 'text' | 'json';
  copy?: boolean;
}

export interface CognitoListUsersOptions extends BaseAWSOptions {
  userPoolId?: string;
  status?: string;
}

export interface CognitoDeleteUserOptions extends BaseAWSOptions {
  userPoolId?: string;
  username?: string;
}

/**
 * ECS command options
 */
export interface ECSListClustersOptions extends BaseAWSOptions {
  // No additional options beyond base
}

export interface ECSListServicesOptions extends BaseAWSOptions {
  cluster?: string;
}

export interface ECSRestartServiceOptions extends BaseAWSOptions {
  cluster?: string;
  service?: string;
}

export interface ECSDescribeTasksOptions extends BaseAWSOptions {
  cluster?: string;
  service?: string;
}

/**
 * Pipeline command options
 */
export interface PipelineListOptions extends BaseAWSOptions {
  // No additional options beyond base
}

export interface PipelineStatusOptions extends BaseAWSOptions {
  pipeline?: string;
}

export interface PipelineLogsOptions extends BaseAWSOptions {
  pipeline?: string;
  stage?: string;
  action?: string;
}

export interface PipelineDescribeOptions extends BaseAWSOptions {
  executionId?: string;
  pipeline?: string;
  detail?: 'summary' | 'detailed' | 'full';
  format?: 'json' | 'md';
}

/**
 * SSO command options
 */
export interface SSOLoginOptions {
  profile?: string;
}

/**
 * GitHub command options
 */
export interface GitHubAccountListOptions {
  // No options
}

export interface GitHubAccountAddOptions {
  username?: string;
  hostname?: string;
  name?: string;
  email?: string;
}

export interface GitHubAccountRemoveOptions {
  username?: string;
  hostname?: string;
}

export interface GitHubActionsWatchOptions {
  runId?: string;
  repo?: string;
}

export interface GitHubActionsListOptions {
  branch?: string;
  status?: string;
  repo?: string;
}

export interface GitHubActionsDescribeOptions {
  runId?: string;
  repo?: string;
}

export interface GitHubActionsRerunOptions {
  runId?: string;
  repo?: string;
}

export interface GitHubActionsCancelOptions {
  runId?: string;
  repo?: string;
}

export interface GitHubAuthOptions {
  hostname?: string;
}

export interface GitHubLoginOptions {
  username?: string;
  hostname?: string;
}
