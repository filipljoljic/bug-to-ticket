import { Octokit } from "@octokit/rest";

export interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
}

export interface CommitResult {
  sha: string;
  url: string;
  message: string;
}

export interface PRInfo {
  number: number;
  title: string;
  head: string; // branch name
  url: string;
}

/**
 * Create an Octokit instance with the provided token
 */
export function createOctokit(token: string): Octokit {
  return new Octokit({ auth: token });
}

/**
 * Get the default branch of a repository
 */
export async function getDefaultBranch(
  octokit: Octokit,
  owner: string,
  repo: string
): Promise<string> {
  const { data } = await octokit.repos.get({ owner, repo });
  return data.default_branch;
}

/**
 * Get information about a PR by number
 */
export async function getPRInfo(
  octokit: Octokit,
  owner: string,
  repo: string,
  prNumber: number
): Promise<PRInfo> {
  const { data } = await octokit.pulls.get({
    owner,
    repo,
    pull_number: prNumber,
  });

  return {
    number: data.number,
    title: data.title,
    head: data.head.ref,
    url: data.html_url,
  };
}

/**
 * List open PRs in a repository
 */
export async function listOpenPRs(
  octokit: Octokit,
  owner: string,
  repo: string
): Promise<PRInfo[]> {
  const { data } = await octokit.pulls.list({
    owner,
    repo,
    state: "open",
    per_page: 20,
  });

  return data.map((pr) => ({
    number: pr.number,
    title: pr.title,
    head: pr.head.ref,
    url: pr.html_url,
  }));
}

/**
 * Get file content from a specific branch
 */
export async function getFileContent(
  octokit: Octokit,
  owner: string,
  repo: string,
  path: string,
  branch: string
): Promise<{ content: string; sha: string } | null> {
  try {
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path,
      ref: branch,
    });

    if ("content" in data && data.type === "file") {
      const content = Buffer.from(data.content, "base64").toString("utf-8");
      return { content, sha: data.sha };
    }
    return null;
  } catch (error) {
    // File doesn't exist
    if ((error as { status?: number }).status === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Create or update a file in a repository
 */
export async function createOrUpdateFile(
  octokit: Octokit,
  owner: string,
  repo: string,
  path: string,
  content: string,
  message: string,
  branch: string,
  existingFileSha?: string
): Promise<CommitResult> {
  const { data } = await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    message,
    content: Buffer.from(content).toString("base64"),
    branch,
    sha: existingFileSha,
  });

  return {
    sha: data.commit.sha || "",
    url: data.commit.html_url || "",
    message: data.commit.message || message,
  };
}

/**
 * Create a new branch from the default branch
 */
export async function createBranch(
  octokit: Octokit,
  owner: string,
  repo: string,
  branchName: string,
  fromBranch?: string
): Promise<string> {
  // Get the SHA of the branch to branch from
  const sourceBranch = fromBranch || (await getDefaultBranch(octokit, owner, repo));
  
  const { data: refData } = await octokit.git.getRef({
    owner,
    repo,
    ref: `heads/${sourceBranch}`,
  });

  // Create the new branch
  await octokit.git.createRef({
    owner,
    repo,
    ref: `refs/heads/${branchName}`,
    sha: refData.object.sha,
  });

  return branchName;
}

/**
 * Create a pull request
 */
export async function createPR(
  octokit: Octokit,
  owner: string,
  repo: string,
  title: string,
  head: string,
  base: string,
  body?: string
): Promise<PRInfo> {
  const { data } = await octokit.pulls.create({
    owner,
    repo,
    title,
    head,
    base,
    body,
  });

  return {
    number: data.number,
    title: data.title,
    head: data.head.ref,
    url: data.html_url,
  };
}

/**
 * Apply a code fix to a GitHub PR branch
 * This is the main function that combines all the operations
 */
export async function applyFixToPR(
  token: string,
  owner: string,
  repo: string,
  prNumber: number,
  filePath: string,
  fixedCode: string,
  commitMessage: string
): Promise<{ commit: CommitResult; pr: PRInfo }> {
  const octokit = createOctokit(token);

  // Get PR info to find the branch
  const prInfo = await getPRInfo(octokit, owner, repo, prNumber);

  // Get current file content (if exists) to get SHA for update
  const existingFile = await getFileContent(
    octokit,
    owner,
    repo,
    filePath,
    prInfo.head
  );

  // Create or update the file
  const commit = await createOrUpdateFile(
    octokit,
    owner,
    repo,
    filePath,
    fixedCode,
    commitMessage,
    prInfo.head,
    existingFile?.sha
  );

  return { commit, pr: prInfo };
}

/**
 * Create a new PR with the fix
 */
export async function createPRWithFix(
  token: string,
  owner: string,
  repo: string,
  filePath: string,
  fixedCode: string,
  prTitle: string,
  prBody: string,
  commitMessage: string,
  branchName?: string
): Promise<{ commit: CommitResult; pr: PRInfo }> {
  const octokit = createOctokit(token);

  // Get default branch
  const defaultBranch = await getDefaultBranch(octokit, owner, repo);

  // Create a unique branch name if not provided
  const targetBranch =
    branchName || `fix/${Date.now()}-${filePath.split("/").pop()?.replace(".tsx", "")}`;

  // Create the new branch
  await createBranch(octokit, owner, repo, targetBranch, defaultBranch);

  // Get existing file SHA (if exists)
  const existingFile = await getFileContent(
    octokit,
    owner,
    repo,
    filePath,
    targetBranch
  );

  // Commit the fix
  const commit = await createOrUpdateFile(
    octokit,
    owner,
    repo,
    filePath,
    fixedCode,
    commitMessage,
    targetBranch,
    existingFile?.sha
  );

  // Create the PR
  const pr = await createPR(
    octokit,
    owner,
    repo,
    prTitle,
    targetBranch,
    defaultBranch,
    prBody
  );

  return { commit, pr };
}

/**
 * Parse a GitHub URL to extract owner and repo
 * Supports formats:
 * - https://github.com/owner/repo
 * - https://github.com/owner/repo/pull/123
 * - owner/repo
 */
export function parseGitHubUrl(url: string): {
  owner: string;
  repo: string;
  prNumber?: number;
} | null {
  // Try full URL format
  const urlMatch = url.match(
    /github\.com\/([^/]+)\/([^/]+)(?:\/pull\/(\d+))?/
  );
  if (urlMatch) {
    return {
      owner: urlMatch[1],
      repo: urlMatch[2].replace(".git", ""),
      prNumber: urlMatch[3] ? parseInt(urlMatch[3], 10) : undefined,
    };
  }

  // Try owner/repo format
  const shortMatch = url.match(/^([^/]+)\/([^/]+)$/);
  if (shortMatch) {
    return {
      owner: shortMatch[1],
      repo: shortMatch[2],
    };
  }

  return null;
}
