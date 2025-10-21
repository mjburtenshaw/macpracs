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
      } catch (loginError) {
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
    return result.pipelines?.map((p: any) => p.name) || [];
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
    return result.DBInstances?.map((db: any) => db.DBInstanceIdentifier) || [];
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
    result.Reservations?.forEach((reservation: any) => {
      reservation.Instances?.forEach((instance: any) => {
        const instanceId = instance.InstanceId;
        // Get the Name tag if it exists
        const nameTag = instance.Tags?.find((tag: any) => tag.Key === 'Name');
        const name = nameTag?.Value || 'N/A';

        instances.push({
          id: instanceId,
          name: name,
        });
      });
    });

    return instances;
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
  } catch (error: any) {
    const stderr = error.message || String(error);
    throw new Error(`Failed to get latest pipeline execution: ${stderr}`);
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
