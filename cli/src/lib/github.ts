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
