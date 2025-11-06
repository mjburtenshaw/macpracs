/**
 * AWS utilities for reading profiles and fetching resources
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { execSync } from 'child_process';
import chalk from 'chalk';

export interface AWSProfile {
  name: string;
  isDefault?: boolean;
}

/**
 * Read AWS profiles from ~/.aws/config
 */
export function getAWSProfiles(): AWSProfile[] {
  const configPath = join(homedir(), '.aws', 'config');

  if (!existsSync(configPath)) {
    return [{ name: 'default', isDefault: true }];
  }

  try {
    const configContent = readFileSync(configPath, 'utf-8');
    const profiles: AWSProfile[] = [];

    // Parse profile names from [profile name] or [default] sections
    // Skip [sso-session ...] sections
    const profileRegex = /^\[(?:profile\s+)?([^\]]+)\]/gm;
    let match;

    while ((match = profileRegex.exec(configContent)) !== null) {
      const fullMatch = match[0];
      const name = match[1].trim();

      // Skip sso-session sections
      if (fullMatch.startsWith('[sso-session')) {
        continue;
      }

      profiles.push({
        name,
        isDefault: name === 'default',
      });
    }

    // If no profiles found, add default
    if (profiles.length === 0) {
      profiles.push({ name: 'default', isDefault: true });
    }

    return profiles;
  } catch (error) {
    console.error('Failed to read AWS config:', error);
    return [{ name: 'default', isDefault: true }];
  }
}

/**
 * Check if AWS credentials are valid and refresh via SSO login if needed
 * Returns true if credentials are valid/refreshed, false if login failed
 */
export async function ensureAWSCredentials(profile: string): Promise<boolean> {
  const testCmd = `aws sts get-caller-identity --profile ${profile}`;

  try {
    // Test credentials with a simple AWS call
    execSync(testCmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
    return true; // Credentials are valid
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    const stderr = error.stderr?.toString() || '';

    // Check if it's an SSO token error
    if (stderr.includes('Token has expired') || stderr.includes('sso')) {
      console.log(chalk.yellow('\n⚠️  AWS SSO session has expired'));
      console.log(chalk.blue('Opening browser to refresh session...\n'));

      // Run interactive SSO login - browser will auto-open
      try {
        execSync(`aws sso login --profile ${profile}`, { stdio: 'inherit' });

        // Verify credentials after login
        execSync(testCmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
        console.log(chalk.green('✓ Session refreshed\n'));
        return true;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (loginError: any) {
        console.log(chalk.red('✗ Login failed\n'));
        return false;
      }
    }

    // Some other error - re-throw
    throw error;
  }
}

/**
 * Get list of CodePipelines in a region
 */
export async function listPipelines(profile: string, region: string): Promise<string[]> {
  try {
    const cmd = `aws codepipeline list-pipelines --region ${region} --profile ${profile} --output json`;
    const output = execSync(cmd, { encoding: 'utf-8' });
    const result = JSON.parse(output);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return result.pipelines?.map((p: any) => p.name) || [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    const stderr = error.stderr?.toString() || error.message;
    throw new Error(`Failed to list pipelines: ${stderr}`);
  }
}

/**
 * Get list of CodeBuild projects in a region
 */
export async function listBuildProjects(profile: string, region: string): Promise<string[]> {
  try {
    const cmd = `aws codebuild list-projects --region ${region} --profile ${profile} --output json`;
    const output = execSync(cmd, { encoding: 'utf-8' });
    const result = JSON.parse(output);
    return result.projects || [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    const stderr = error.stderr?.toString() || error.message;
    throw new Error(`Failed to list build projects: ${stderr}`);
  }
}

/**
 * Get list of ECS clusters in a region
 */
export async function listECSClusters(profile: string, region: string): Promise<string[]> {
  try {
    const cmd = `aws ecs list-clusters --region ${region} --profile ${profile} --output json`;
    const output = execSync(cmd, { encoding: 'utf-8' });
    const result = JSON.parse(output);
    // Extract cluster names from ARNs (arn:aws:ecs:region:account:cluster/name)
    return (
      result.clusterArns?.map((arn: string) => {
        const parts = arn.split('/');
        return parts[parts.length - 1];
      }) || []
    );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    // Re-throw with better error message
    const stderr = error.stderr?.toString() || error.message;
    throw new Error(`Failed to list ECS clusters: ${stderr}`);
  }
}

/**
 * Get list of ECS services in a cluster
 */
export async function listECSServices(
  cluster: string,
  profile: string,
  region: string
): Promise<string[]> {
  try {
    const cmd = `aws ecs list-services --cluster ${cluster} --region ${region} --profile ${profile} --output json`;
    const output = execSync(cmd, { encoding: 'utf-8' });
    const result = JSON.parse(output);
    // Extract service names from ARNs
    return (
      result.serviceArns?.map((arn: string) => {
        const parts = arn.split('/');
        return parts[parts.length - 1];
      }) || []
    );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    const stderr = error.stderr?.toString() || error.message;
    throw new Error(`Failed to list ECS services: ${stderr}`);
  }
}

/**
 * Get list of RDS instances in a region
 */
export async function listRDSInstances(profile: string, region: string): Promise<string[]> {
  try {
    const cmd = `aws rds describe-db-instances --region ${region} --profile ${profile} --output json`;
    const output = execSync(cmd, { encoding: 'utf-8' });
    const result = JSON.parse(output);
    // Extract DB instance identifiers
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return result.DBInstances?.map((db: any) => db.DBInstanceIdentifier) || [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    const stderr = error.stderr?.toString() || error.message;
    throw new Error(`Failed to list RDS instances: ${stderr}`);
  }
}

export interface EC2Instance {
  id: string;
  name: string;
}

export interface BuildInfo {
  id: string;
  status: string;
  sourceVersion: string;
  startTime: string;
  initiatedBy?: string;
}

export interface BuildPhase {
  phaseType: string;
  phaseStatus: string;
  startTime?: string;
  endTime?: string;
  durationInSeconds?: number;
  contexts?: Array<{ statusCode?: string; message?: string }>;
}

export interface BuildDetails {
  id: string;
  arn: string;
  projectName: string;
  buildNumber: number;
  buildStatus: string;
  sourceVersion: string;
  resolvedSourceVersion?: string;
  initiator?: string;
  startTime: string;
  endTime?: string;
  currentPhase?: string;
  phases?: BuildPhase[];
  source?: {
    type: string;
    location: string;
    gitCloneDepth?: number;
    buildspec?: string;
  };
  artifacts?: {
    location?: string;
    sha256sum?: string;
    md5sum?: string;
  };
  environment?: {
    type: string;
    image: string;
    computeType: string;
    environmentVariables?: Array<{ name: string; value: string; type: string }>;
    privilegedMode?: boolean;
  };
  logs?: {
    groupName?: string;
    streamName?: string;
    deepLink?: string;
  };
  networkInterface?: {
    subnetId?: string;
    networkInterfaceId?: string;
  };
  timeoutInMinutes?: number;
  buildComplete?: boolean;
  queuedTimeoutInMinutes?: number;
}

/**
 * Get list of running EC2 instances in a region
 */
export async function listEC2Instances(
  profile: string,
  region: string
): Promise<EC2Instance[]> {
  try {
    const cmd = `aws ec2 describe-instances --region ${region} --profile ${profile} --filters "Name=instance-state-name,Values=running" --output json`;
    const output = execSync(cmd, { encoding: 'utf-8' });
    const result = JSON.parse(output);

    const instances: EC2Instance[] = [];

    // Parse through reservations and instances
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    result.Reservations?.forEach((reservation: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      reservation.Instances?.forEach((instance: any) => {
        const instanceId = instance.InstanceId;
        // Get the Name tag if it exists
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const nameTag = instance.Tags?.find((tag: any) => tag.Key === 'Name');
        const name = nameTag?.Value || 'N/A';

        instances.push({
          id: instanceId,
          name: name,
        });
      });
    });

    return instances;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    const stderr = error.stderr?.toString() || error.message;
    throw new Error(`Failed to list EC2 instances: ${stderr}`);
  }
}

/**
 * Get list of failed builds for a CodeBuild project
 */
export async function listFailedBuilds(
  projectName: string,
  profile: string,
  region: string
): Promise<BuildInfo[]> {
  try {
    // Get recent build IDs for the project
    const listCmd = `aws codebuild list-builds-for-project --project-name ${projectName} --region ${region} --profile ${profile} --max-items 20 --output json`;
    const listOutput = execSync(listCmd, { encoding: 'utf-8' });
    const listResult = JSON.parse(listOutput);

    const buildIds = listResult.ids || [];
    if (buildIds.length === 0) {
      return [];
    }

    // Get build details
    const detailsCmd = `aws codebuild batch-get-builds --ids ${buildIds.join(' ')} --region ${region} --profile ${profile} --output json`;
    const detailsOutput = execSync(detailsCmd, { encoding: 'utf-8' });
    const detailsResult = JSON.parse(detailsOutput);

    // Filter for failed builds that can be retried (not from CodePipeline)
    const failedBuilds: BuildInfo[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    detailsResult.builds?.forEach((build: any) => {
      if (build.buildStatus === 'FAILED') {
        const initiatedBy = build.initiatedBy || '';

        // Skip builds initiated by CodePipeline - they can only be retried through the pipeline
        if (initiatedBy.includes('codepipeline')) {
          return;
        }

        // Also skip if source version is an S3 ARN (indicates pipeline artifacts)
        const sourceVersion = build.sourceVersion || 'N/A';
        if (sourceVersion.startsWith('arn:aws:s3:')) {
          return;
        }

        failedBuilds.push({
          id: build.id,
          status: build.buildStatus,
          sourceVersion: sourceVersion,
          startTime: build.startTime || 'N/A',
          initiatedBy: initiatedBy,
        });
      }
    });

    return failedBuilds;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    const stderr = error.stderr?.toString() || error.message;
    throw new Error(`Failed to list failed builds: ${stderr}`);
  }
}

/**
 * Get list of completed builds for a CodeBuild project
 * @param statusFilter - Optional filter: 'FAILED', 'SUCCEEDED', 'STOPPED', or undefined for all
 */
export async function listCompletedBuilds(
  projectName: string,
  profile: string,
  region: string,
  statusFilter?: 'FAILED' | 'SUCCEEDED' | 'STOPPED'
): Promise<BuildInfo[]> {
  try {
    // Get recent build IDs for the project
    const listCmd = `aws codebuild list-builds-for-project --project-name ${projectName} --region ${region} --profile ${profile} --max-items 20 --output json`;
    const listOutput = execSync(listCmd, { encoding: 'utf-8' });
    const listResult = JSON.parse(listOutput);

    const buildIds = listResult.ids || [];
    if (buildIds.length === 0) {
      return [];
    }

    // Get build details
    const detailsCmd = `aws codebuild batch-get-builds --ids ${buildIds.join(' ')} --region ${region} --profile ${profile} --output json`;
    const detailsOutput = execSync(detailsCmd, { encoding: 'utf-8' });
    const detailsResult = JSON.parse(detailsOutput);

    // Filter for completed builds based on status filter
    const completedBuilds: BuildInfo[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    detailsResult.builds?.forEach((build: any) => {
      const buildStatus = build.buildStatus;

      // Only include completed builds (not IN_PROGRESS)
      if (buildStatus === 'IN_PROGRESS') {
        return;
      }

      // Apply status filter if provided
      if (statusFilter && buildStatus !== statusFilter) {
        return;
      }

      const initiatedBy = build.initiatedBy || '';
      const sourceVersion = build.sourceVersion || 'N/A';

      completedBuilds.push({
        id: build.id,
        status: buildStatus,
        sourceVersion: sourceVersion,
        startTime: build.startTime || 'N/A',
        initiatedBy: initiatedBy,
      });
    });

    return completedBuilds;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    const stderr = error.stderr?.toString() || error.message;
    throw new Error(`Failed to list completed builds: ${stderr}`);
  }
}

export interface SourceRevision {
  revisionId: string;
  revisionSummary?: string;
  revisionUrl?: string;
}

export interface PipelineActionExecution {
  actionExecutionId?: string;
  status?: string;
  summary?: string;
  lastStatusChange?: string;
  token?: string;
  lastUpdatedBy?: string;
  externalExecutionId?: string;
  externalExecutionUrl?: string;
  percentComplete?: number;
  errorDetails?: {
    code?: string;
    message?: string;
  };
}

export interface PipelineStageExecution {
  pipelineExecutionId: string;
  stageName: string;
  status: string;
  actionStates?: Array<{
    actionName: string;
    currentRevision?: SourceRevision;
    latestExecution?: PipelineActionExecution;
    entityUrl?: string;
  }>;
}

export interface PipelineExecution {
  pipelineExecutionId: string;
  pipelineName: string;
  pipelineVersion: number;
  status: string;
  statusSummary?: string;
  artifactRevisions?: Array<{
    name: string;
    revisionId: string;
    revisionChangeIdentifier?: string;
    revisionSummary?: string;
    created?: string;
    revisionUrl?: string;
  }>;
  trigger?: {
    triggerType: string;
    triggerDetail?: string;
  };
  stageStates?: PipelineStageExecution[];
}

export interface PipelineExecutionSummary {
  pipelineExecutionId: string;
  status: string;
  startTime?: string;
  lastUpdateTime?: string;
  sourceRevisions?: Array<{
    actionName: string;
    revisionId: string;
    revisionSummary?: string;
    revisionUrl?: string;
  }>;
  trigger?: {
    triggerType: string;
    triggerDetail?: string;
  };
}

/**
 * Get detailed information about a specific build
 */
export async function getBuildDetails(
  buildId: string,
  profile: string,
  region: string
): Promise<BuildDetails> {
  try {
    const cmd = `aws codebuild batch-get-builds --ids ${buildId} --region ${region} --profile ${profile} --output json`;
    const output = execSync(cmd, { encoding: 'utf-8' });
    const result = JSON.parse(output);

    if (!result.builds || result.builds.length === 0) {
      throw new Error(`No build found with ID: ${buildId}`);
    }

    const build = result.builds[0];

    return {
      id: build.id,
      arn: build.arn,
      projectName: build.projectName || 'N/A',
      buildNumber: build.buildNumber || 0,
      buildStatus: build.buildStatus || 'UNKNOWN',
      sourceVersion: build.sourceVersion || 'N/A',
      resolvedSourceVersion: build.resolvedSourceVersion,
      initiator: build.initiator,
      startTime: build.startTime || 'N/A',
      endTime: build.endTime,
      currentPhase: build.currentPhase,
      phases: build.phases,
      source: build.source,
      artifacts: build.artifacts,
      environment: build.environment,
      logs: build.logs,
      networkInterface: build.networkInterface,
      timeoutInMinutes: build.timeoutInMinutes,
      buildComplete: build.buildComplete,
      queuedTimeoutInMinutes: build.queuedTimeoutInMinutes,
    };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    const stderr = error.stderr?.toString() || error.message;
    throw new Error(`Failed to get build details: ${stderr}`);
  }
}

/**
 * Get the latest build for a project
 */
export async function getLatestBuild(
  projectName: string,
  profile: string,
  region: string
): Promise<string> {
  try {
    const listCmd = `aws codebuild list-builds-for-project --project-name ${projectName} --region ${region} --profile ${profile} --max-items 1 --output json`;
    const listOutput = execSync(listCmd, { encoding: 'utf-8' });
    const listResult = JSON.parse(listOutput);

    const buildIds = listResult.ids || [];
    if (buildIds.length === 0) {
      throw new Error(`No builds found for project: ${projectName}`);
    }

    return buildIds[0];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    const stderr = error.stderr?.toString() || error.message;
    throw new Error(`Failed to get latest build: ${stderr}`);
  }
}

/**
 * Get detailed information about a pipeline execution
 */
export async function getPipelineExecution(
  pipelineName: string,
  executionId: string,
  profile: string,
  region: string
): Promise<PipelineExecution> {
  try {
    const cmd = `aws codepipeline get-pipeline-execution --pipeline-name ${pipelineName} --pipeline-execution-id ${executionId} --region ${region} --profile ${profile} --output json`;
    const output = execSync(cmd, { encoding: 'utf-8' });
    const result = JSON.parse(output);

    if (!result.pipelineExecution) {
      throw new Error(`No execution found with ID: ${executionId}`);
    }

    const execution = result.pipelineExecution;

    // Also get pipeline state to include stage and action details
    const stateCmd = `aws codepipeline get-pipeline-state --name ${pipelineName} --region ${region} --profile ${profile} --output json`;
    const stateOutput = execSync(stateCmd, { encoding: 'utf-8' });
    const stateResult = JSON.parse(stateOutput);

    return {
      pipelineExecutionId: execution.pipelineExecutionId,
      pipelineName: execution.pipelineName || pipelineName,
      pipelineVersion: execution.pipelineVersion || 0,
      status: execution.status || 'UNKNOWN',
      statusSummary: execution.statusSummary,
      artifactRevisions: execution.artifactRevisions,
      trigger: execution.trigger,
      stageStates: stateResult.stageStates,
    };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    const stderr = error.stderr?.toString() || error.message;
    throw new Error(`Failed to get pipeline execution: ${stderr}`);
  }
}

/**
 * List recent pipeline executions
 */
export async function listPipelineExecutions(
  pipelineName: string,
  profile: string,
  region: string,
  maxResults: number = 20
): Promise<PipelineExecutionSummary[]> {
  try {
    const cmd = `aws codepipeline list-pipeline-executions --pipeline-name ${pipelineName} --region ${region} --profile ${profile} --max-items ${maxResults} --output json`;
    const output = execSync(cmd, { encoding: 'utf-8' });
    const result = JSON.parse(output);

    const summaries: PipelineExecutionSummary[] = [];

    if (result.pipelineExecutionSummaries) {
      for (const summary of result.pipelineExecutionSummaries) {
        summaries.push({
          pipelineExecutionId: summary.pipelineExecutionId,
          status: summary.status || 'UNKNOWN',
          startTime: summary.startTime,
          lastUpdateTime: summary.lastUpdateTime,
          sourceRevisions: summary.sourceRevisions,
          trigger: summary.trigger,
        });
      }
    }

    return summaries;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    const stderr = error.stderr?.toString() || error.message;
    throw new Error(`Failed to list pipeline executions: ${stderr}`);
  }
}

/**
 * Get the latest pipeline execution
 */
export async function getLatestPipelineExecution(
  pipelineName: string,
  profile: string,
  region: string
): Promise<string> {
  try {
    const executions = await listPipelineExecutions(pipelineName, profile, region, 1);

    if (executions.length === 0) {
      throw new Error(`No executions found for pipeline: ${pipelineName}`);
    }

    return executions[0].pipelineExecutionId;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    const stderr = error.message || String(error);
    throw new Error(`Failed to get latest pipeline execution: ${stderr}`);
  }
}

/**
 * Cognito User Pool interface
 */
export interface UserPool {
  id: string;
  name: string;
  status?: string;
  creationDate?: string;
}

/**
 * Cognito User interface
 */
export interface CognitoUser {
  username: string;
  email?: string;
  status: string;
  enabled: boolean;
  userCreateDate: string;
  userLastModifiedDate?: string;
}

/**
 * Get list of Cognito User Pools in a region
 */
export async function listUserPools(profile: string, region: string): Promise<UserPool[]> {
  try {
    const cmd = `aws cognito-idp list-user-pools --max-results 60 --region ${region} --profile ${profile} --output json`;
    const output = execSync(cmd, { encoding: 'utf-8' });
    const result = JSON.parse(output);

    return (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      result.UserPools?.map((pool: any) => ({
        id: pool.Id,
        name: pool.Name,
        status: pool.Status,
        creationDate: pool.CreationDate,
      })) || []
    );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    const stderr = error.stderr?.toString() || error.message;
    throw new Error(`Failed to list user pools: ${stderr}`);
  }
}

/**
 * Get list of users in a Cognito User Pool
 * @param statusFilter - Optional filter: 'CONFIRMED', 'UNCONFIRMED', 'ARCHIVED', 'COMPROMISED', 'UNKNOWN', 'RESET_REQUIRED', 'FORCE_CHANGE_PASSWORD'
 */
export async function listUsers(
  userPoolId: string,
  profile: string,
  region: string,
  statusFilter?: string
): Promise<CognitoUser[]> {
  try {
    let cmd = `aws cognito-idp list-users --user-pool-id ${userPoolId} --region ${region} --profile ${profile} --output json`;

    // Add filter if provided
    if (statusFilter) {
      cmd += ` --filter "status = \\"${statusFilter}\\""`;
    }

    const output = execSync(cmd, { encoding: 'utf-8' });
    const result = JSON.parse(output);

    return (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      result.Users?.map((user: any) => {
        // Extract email from UserAttributes
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const emailAttr = user.Attributes?.find((attr: any) => attr.Name === 'email');

        return {
          username: user.Username,
          email: emailAttr?.Value,
          status: user.UserStatus,
          enabled: user.Enabled !== false,
          userCreateDate: user.UserCreateDate,
          userLastModifiedDate: user.UserLastModifiedDate,
        };
      }) || []
    );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    const stderr = error.stderr?.toString() || error.message;
    throw new Error(`Failed to list users: ${stderr}`);
  }
}

/**
 * Delete a user from a Cognito User Pool
 */
export async function deleteUser(
  userPoolId: string,
  username: string,
  profile: string,
  region: string
): Promise<void> {
  try {
    const cmd = `aws cognito-idp admin-delete-user --user-pool-id ${userPoolId} --username ${username} --region ${region} --profile ${profile}`;
    execSync(cmd, { encoding: 'utf-8' });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    const stderr = error.stderr?.toString() || error.message;
    throw new Error(`Failed to delete user ${username}: ${stderr}`);
  }
}

/**
 * Delete multiple users from a Cognito User Pool
 * Returns array of failed deletions (empty if all succeeded)
 */
export async function deleteUsers(
  userPoolId: string,
  usernames: string[],
  profile: string,
  region: string
): Promise<Array<{ username: string; error: string }>> {
  const failures: Array<{ username: string; error: string }> = [];

  for (const username of usernames) {
    try {
      await deleteUser(userPoolId, username, profile, region);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      failures.push({
        username,
        error: error.message || String(error),
      });
    }
  }

  return failures;
}

/**
 * User Pool Details interface
 */
export interface UserPoolDetails {
  Id: string;
  Name: string;
  Status?: string;
  CreationDate?: string;
  LastModifiedDate?: string;
  Policies?: {
    PasswordPolicy?: {
      MinimumLength?: number;
      RequireUppercase?: boolean;
      RequireLowercase?: boolean;
      RequireNumbers?: boolean;
      RequireSymbols?: boolean;
      TemporaryPasswordValidityDays?: number;
    };
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  LambdaConfig?: any;
  AutoVerifiedAttributes?: string[];
  AliasAttributes?: string[];
  UsernameAttributes?: string[];
  SmsVerificationMessage?: string;
  EmailVerificationMessage?: string;
  EmailVerificationSubject?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  VerificationMessageTemplate?: any;
  SmsAuthenticationMessage?: string;
  MfaConfiguration?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  DeviceConfiguration?: any;
  EstimatedNumberOfUsers?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  EmailConfiguration?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  SmsConfiguration?: any;
  UserPoolTags?: Record<string, string>;
  SmsConfigurationFailure?: string;
  EmailConfigurationFailure?: string;
  Domain?: string;
  CustomDomain?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  AdminCreateUserConfig?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  SchemaAttributes?: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  UserPoolAddOns?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  UsernameConfiguration?: any;
  Arn?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  AccountRecoverySetting?: any;
}

/**
 * Get detailed information about a Cognito User Pool
 */
export async function describeUserPool(
  userPoolId: string,
  profile: string,
  region: string
): Promise<UserPoolDetails> {
  try {
    const cmd = `aws cognito-idp describe-user-pool --user-pool-id ${userPoolId} --region ${region} --profile ${profile} --output json`;
    const output = execSync(cmd, { encoding: 'utf-8' });
    const result = JSON.parse(output);

    if (!result.UserPool) {
      throw new Error(`No user pool found with ID: ${userPoolId}`);
    }

    return result.UserPool;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    const stderr = error.stderr?.toString() || error.message;
    throw new Error(`Failed to describe user pool: ${stderr}`);
  }
}

/**
 * User Pool Client interface (basic info for listing)
 */
export interface UserPoolClient {
  clientId: string;
  clientName: string;
}

/**
 * User Pool Client Details interface (full configuration)
 */
export interface UserPoolClientDetails {
  ClientId: string;
  ClientName: string;
  UserPoolId: string;
  ClientSecret?: string;
  RefreshTokenValidity?: number;
  AccessTokenValidity?: number;
  IdTokenValidity?: number;
  TokenValidityUnits?: {
    AccessToken?: string;
    IdToken?: string;
    RefreshToken?: string;
  };
  ReadAttributes?: string[];
  WriteAttributes?: string[];
  ExplicitAuthFlows?: string[];
  SupportedIdentityProviders?: string[];
  CallbackURLs?: string[];
  LogoutURLs?: string[];
  DefaultRedirectURI?: string;
  AllowedOAuthFlows?: string[];
  AllowedOAuthScopes?: string[];
  AllowedOAuthFlowsUserPoolClient?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  AnalyticsConfiguration?: any;
  PreventUserExistenceErrors?: string;
  EnableTokenRevocation?: boolean;
  EnablePropagateAdditionalUserContextData?: boolean;
  CreationDate?: string;
  LastModifiedDate?: string;
}

/**
 * List app clients for a Cognito User Pool
 */
export async function listUserPoolClients(
  userPoolId: string,
  profile: string,
  region: string
): Promise<UserPoolClient[]> {
  try {
    const cmd = `aws cognito-idp list-user-pool-clients --user-pool-id ${userPoolId} --max-results 60 --region ${region} --profile ${profile} --output json`;
    const output = execSync(cmd, { encoding: 'utf-8' });
    const result = JSON.parse(output);

    return (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      result.UserPoolClients?.map((client: any) => ({
        clientId: client.ClientId,
        clientName: client.ClientName,
      })) || []
    );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    const stderr = error.stderr?.toString() || error.message;
    throw new Error(`Failed to list user pool clients: ${stderr}`);
  }
}

/**
 * Get detailed information about a User Pool Client
 */
export async function describeUserPoolClient(
  userPoolId: string,
  clientId: string,
  profile: string,
  region: string
): Promise<UserPoolClientDetails> {
  try {
    const cmd = `aws cognito-idp describe-user-pool-client --user-pool-id ${userPoolId} --client-id ${clientId} --region ${region} --profile ${profile} --output json`;
    const output = execSync(cmd, { encoding: 'utf-8' });
    const result = JSON.parse(output);

    if (!result.UserPoolClient) {
      throw new Error(`No client found with ID: ${clientId}`);
    }

    return result.UserPoolClient;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    const stderr = error.stderr?.toString() || error.message;
    throw new Error(`Failed to describe user pool client: ${stderr}`);
  }
}

/**
 * Copy text to clipboard (macOS pbcopy)
 */
export function copyToClipboard(text: string): void {
  try {
    execSync('pbcopy', { input: text, encoding: 'utf-8' });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    throw new Error(`Failed to copy to clipboard: ${error.message}`);
  }
}

/**
 * Common AWS regions
 */
export const AWS_REGIONS = [
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'eu-west-1',
  'eu-west-2',
  'eu-central-1',
  'ap-northeast-1',
  'ap-southeast-1',
  'ap-southeast-2',
];
