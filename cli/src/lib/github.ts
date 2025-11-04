/**
 * GitHub utilities for fetching repository information
 */

import { execSync } from 'child_process';

export interface PullRequest {
  number: number;
  title: string;
  state: string;
  author: string;
  updatedAt: string;
}

export interface WorkflowStep {
  name: string;
  status: string;
  conclusion: string | null;
  number: number;
  started_at: string | null;
  completed_at: string | null;
}

export interface WorkflowJob {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  started_at: string;
  completed_at: string | null;
  steps: WorkflowStep[];
}

export interface WorkflowRun {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  html_url: string;
  head_sha: string;
  head_branch: string;
  event: string;
  created_at: string;
  updated_at: string;
  run_started_at: string | null;
  workflow_id: number;
  display_title: string;
}

export interface Repository {
  nameWithOwner: string;
  name: string;
  owner: string;
  private?: boolean;
  archived?: boolean;
}

export interface GitHubAccount {
  username: string;
  hostname: string;
  isActive: boolean;
}

/**
 * Get list of pull requests for a repository
 * @param repo - Optional repository in owner/repo format (defaults to current repo)
 * @param state - Optional state filter: 'open', 'closed', 'merged', 'all' (defaults to 'all')
 */
export async function listPullRequests(
  repo?: string,
  state: 'open' | 'closed' | 'merged' | 'all' = 'all'
): Promise<PullRequest[]> {
  try {
    const repoArg = repo ? `--repo ${repo}` : '';
    const stateArg = `--state ${state}`;

    const cmd = `gh pr list ${repoArg} ${stateArg} --json number,title,state,author,updatedAt --limit 50`;
    const output = execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
    const result = JSON.parse(output);

    return result.map((pr: any) => ({
      number: pr.number,
      title: pr.title,
      state: pr.state,
      author: pr.author?.login || 'unknown',
      updatedAt: pr.updatedAt,
    }));
  } catch (error: any) {
    const stderr = error.stderr?.toString() || error.message;

    // Check for common errors
    if (stderr.includes('not a git repository')) {
      throw new Error('Not in a git repository. Please specify a repository with --repo owner/repo');
    }
    if (stderr.includes('Could not resolve to a Repository')) {
      throw new Error(`Repository not found: ${repo}`);
    }
    if (stderr.includes('gh: command not found')) {
      throw new Error('GitHub CLI (gh) is not installed. Install with: brew install gh');
    }
    if (stderr.includes('not logged into')) {
      throw new Error('Not authenticated with GitHub. Run: gh auth login');
    }

    throw new Error(`Failed to list pull requests: ${stderr}`);
  }
}

/**
 * Get list of repositories the user has access to (with push permission)
 * Uses GitHub API to get all repos: owned, collaborator, and organization member repos
 */
export async function listUserRepos(): Promise<Repository[]> {
  try {
    // Use GitHub API to get all repos with push access
    // affiliation=owner,collaborator,organization_member gets all accessible repos
    const cmd = 'gh api user/repos --paginate -X GET -f affiliation=owner,collaborator,organization_member -f per_page=100 --jq \'.[] | select(.permissions.push == true) | {nameWithOwner: .full_name, name: .name, owner: .owner.login, private: .private, archived: .archived}\'';
    const output = execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });

    // Parse NDJSON (newline-delimited JSON)
    const repos = output
      .trim()
      .split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line));

    return repos.map((repo: any) => ({
      nameWithOwner: repo.nameWithOwner,
      name: repo.name,
      owner: repo.owner,
      private: repo.private,
      archived: repo.archived,
    }));
  } catch (error: any) {
    const stderr = error.stderr?.toString() || error.message;

    if (stderr.includes('gh: command not found')) {
      throw new Error('GitHub CLI (gh) is not installed. Install with: brew install gh');
    }
    if (stderr.includes('not logged into')) {
      throw new Error('Not authenticated with GitHub. Run: gh auth login');
    }

    throw new Error(`Failed to list repositories: ${stderr}`);
  }
}

/**
 * Get current repository from git directory
 */
export async function getCurrentRepo(): Promise<string | null> {
  try {
    const cmd = 'gh repo view --json nameWithOwner -q .nameWithOwner';
    const output = execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
    return output.trim();
  } catch (error) {
    return null;
  }
}

/**
 * Get list of authenticated GitHub accounts
 * Parses the output of `gh auth status` to find all logged-in accounts
 */
export function getGitHubAccounts(): GitHubAccount[] {
  try {
    const output = execSync('gh auth status 2>&1', { encoding: 'utf-8' });
    const accounts: GitHubAccount[] = [];

    // Parse output line by line
    const lines = output.split('\n');
    let currentHostname = '';

    for (const line of lines) {
      // Extract hostname (e.g., "github.com" or "enterprise.github.com")
      if (line.trim() && !line.includes('✓') && !line.includes('-')) {
        currentHostname = line.trim();
      }

      // Extract account info from lines like:
      // "  ✓ Logged in to github.com account username (keyring)"
      const match = line.match(/✓\s+Logged in to .+ account (\S+)/);
      if (match && currentHostname) {
        const username = match[1];
        const isActive = line.includes('Active account: true') ||
                        lines.some(l => l.includes('Active account: true'));

        accounts.push({
          username,
          hostname: currentHostname,
          isActive,
        });
      }
    }

    return accounts;
  } catch (error: any) {
    const stderr = error.stderr?.toString() || error.message;

    if (stderr.includes('gh: command not found')) {
      throw new Error('GitHub CLI (gh) is not installed. Install with: brew install gh');
    }
    if (stderr.includes('not logged into') || stderr.includes('You are not logged')) {
      throw new Error('Not authenticated with GitHub. Run: gh auth login');
    }

    // If no accounts found, return empty array
    return [];
  }
}

/**
 * Switch to a specific GitHub account
 * @param username - GitHub username to switch to
 * @param hostname - Optional hostname (defaults to github.com)
 */
export async function switchGitHubAccount(username: string, hostname: string = 'github.com'): Promise<void> {
  try {
    let cmd = `gh auth switch --user ${username}`;
    if (hostname !== 'github.com') {
      cmd = `gh auth switch --hostname ${hostname} --user ${username}`;
    }

    execSync(cmd, { encoding: 'utf-8', stdio: 'inherit' });
  } catch (error: any) {
    const stderr = error.stderr?.toString() || error.message;

    if (stderr.includes('gh: command not found')) {
      throw new Error('GitHub CLI (gh) is not installed. Install with: brew install gh');
    }

    throw new Error(`Failed to switch GitHub account: ${stderr}`);
  }
}

/**
 * Ensure GitHub authentication is valid
 * If account is specified, switch to it first
 * @param account - Optional account username to use
 * @param hostname - Optional hostname (defaults to github.com)
 */
export async function ensureGitHubAuth(account?: string, hostname: string = 'github.com'): Promise<boolean> {
  try {
    // If account specified, switch to it
    if (account) {
      await switchGitHubAccount(account, hostname);
    }

    // Verify authentication
    execSync('gh auth status', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
    return true;
  } catch (error: any) {
    const stderr = error.stderr?.toString() || error.message;

    if (stderr.includes('not logged into') || stderr.includes('You are not logged')) {
      console.error('Not authenticated with GitHub. Run: gh auth login');
      return false;
    }

    if (stderr.includes('gh: command not found')) {
      console.error('GitHub CLI (gh) is not installed. Install with: brew install gh');
      return false;
    }

    // If we got here, auth is valid
    return true;
  }
}

/**
 * List workflow runs for a repository
 * @param repo - Repository in owner/repo format
 * @param options - Filter options (branch, workflow, status)
 */
export async function listWorkflowRuns(
  repo: string,
  options: {
    branch?: string;
    workflow?: string;
    status?: string;
    limit?: number;
  } = {}
): Promise<WorkflowRun[]> {
  try {
    const { branch, workflow, status, limit = 20 } = options;

    let cmd = `gh api "repos/${repo}/actions/runs?per_page=${limit}`;
    if (branch) cmd += `&branch=${branch}`;
    if (workflow) cmd += `&workflow_id=${workflow}`;
    if (status) cmd += `&status=${status}`;
    cmd += '" --jq \'.workflow_runs\'';

    const output = execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
    const result = JSON.parse(output);

    return result.map((run: any) => ({
      id: run.id,
      name: run.name,
      status: run.status,
      conclusion: run.conclusion,
      html_url: run.html_url,
      head_sha: run.head_sha,
      head_branch: run.head_branch,
      event: run.event,
      created_at: run.created_at,
      updated_at: run.updated_at,
      run_started_at: run.run_started_at,
      workflow_id: run.workflow_id,
      display_title: run.display_title || run.name,
    }));
  } catch (error: any) {
    const stderr = error.stderr?.toString() || error.message;

    if (stderr.includes('gh: command not found')) {
      throw new Error('GitHub CLI (gh) is not installed. Install with: brew install gh');
    }
    if (stderr.includes('not logged into')) {
      throw new Error('Not authenticated with GitHub. Run: gh auth login');
    }
    if (stderr.includes('Not Found')) {
      throw new Error(`Repository not found: ${repo}`);
    }

    throw new Error(`Failed to list workflow runs: ${stderr}`);
  }
}

/**
 * Get details for a specific workflow run
 * @param repo - Repository in owner/repo format
 * @param runId - Workflow run ID
 */
export async function getWorkflowRun(repo: string, runId: number): Promise<WorkflowRun> {
  try {
    const cmd = `gh api "repos/${repo}/actions/runs/${runId}"`;
    const output = execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
    const run = JSON.parse(output);

    return {
      id: run.id,
      name: run.name,
      status: run.status,
      conclusion: run.conclusion,
      html_url: run.html_url,
      head_sha: run.head_sha,
      head_branch: run.head_branch,
      event: run.event,
      created_at: run.created_at,
      updated_at: run.updated_at,
      run_started_at: run.run_started_at,
      workflow_id: run.workflow_id,
      display_title: run.display_title || run.name,
    };
  } catch (error: any) {
    const stderr = error.stderr?.toString() || error.message;

    if (stderr.includes('Not Found')) {
      throw new Error(`Workflow run ${runId} not found in repository ${repo}`);
    }

    throw new Error(`Failed to get workflow run: ${stderr}`);
  }
}

/**
 * List jobs for a workflow run
 * @param repo - Repository in owner/repo format
 * @param runId - Workflow run ID
 */
export async function listWorkflowJobs(repo: string, runId: number): Promise<WorkflowJob[]> {
  try {
    const cmd = `gh api "repos/${repo}/actions/runs/${runId}/jobs" --jq '.jobs'`;
    const output = execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
    const result = JSON.parse(output);

    return result.map((job: any) => ({
      id: job.id,
      name: job.name,
      status: job.status,
      conclusion: job.conclusion,
      started_at: job.started_at,
      completed_at: job.completed_at,
      steps: (job.steps || []).map((step: any) => ({
        name: step.name,
        status: step.status,
        conclusion: step.conclusion,
        number: step.number,
        started_at: step.started_at,
        completed_at: step.completed_at,
      })),
    }));
  } catch (error: any) {
    const stderr = error.stderr?.toString() || error.message;

    if (stderr.includes('Not Found')) {
      throw new Error(`Workflow run ${runId} not found in repository ${repo}`);
    }

    throw new Error(`Failed to list workflow jobs: ${stderr}`);
  }
}

/**
 * Rerun failed jobs for a workflow run
 * @param repo - Repository in owner/repo format
 * @param runId - Workflow run ID
 */
export async function rerunFailedJobs(repo: string, runId: number): Promise<void> {
  try {
    const cmd = `gh api -X POST "repos/${repo}/actions/runs/${runId}/rerun-failed-jobs"`;
    execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
  } catch (error: any) {
    const stderr = error.stderr?.toString() || error.message;

    if (stderr.includes('Not Found')) {
      throw new Error(`Workflow run ${runId} not found in repository ${repo}`);
    }
    if (stderr.includes('no failed jobs')) {
      throw new Error(`No failed jobs to rerun in workflow run ${runId}`);
    }

    throw new Error(`Failed to rerun workflow: ${stderr}`);
  }
}

/**
 * Cancel a workflow run
 * @param repo - Repository in owner/repo format
 * @param runId - Workflow run ID
 */
export async function cancelWorkflowRun(repo: string, runId: number): Promise<void> {
  try {
    const cmd = `gh api -X POST "repos/${repo}/actions/runs/${runId}/cancel"`;
    execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
  } catch (error: any) {
    const stderr = error.stderr?.toString() || error.message;

    if (stderr.includes('Not Found')) {
      throw new Error(`Workflow run ${runId} not found in repository ${repo}`);
    }
    if (stderr.includes('Cannot cancel')) {
      throw new Error(`Cannot cancel workflow run ${runId} (may already be completed)`);
    }

    throw new Error(`Failed to cancel workflow run: ${stderr}`);
  }
}
