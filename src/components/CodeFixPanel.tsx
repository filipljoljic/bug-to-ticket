"use client";

import { useState, useEffect } from "react";

interface FixResult {
  componentPath: string;
  componentName: string;
  originalCode: string;
  fixedCode: string;
  applied: boolean;
}

interface PRInfo {
  number: number;
  title: string;
  head: string;
  url: string;
}

interface GitHubResult {
  success: boolean;
  commit: { sha: string; url: string; message: string };
  pr: PRInfo;
  message: string;
}

interface CodeFixPanelProps {
  reportId: string;
  hasDraft: boolean;
  onFixApplied: () => void;
}

export default function CodeFixPanel({
  reportId,
  hasDraft,
  onFixApplied,
}: CodeFixPanelProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [fixResult, setFixResult] = useState<FixResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDiff, setShowDiff] = useState(true);

  // GitHub integration state
  const [applyMode, setApplyMode] = useState<"local" | "github">("local");
  const [githubToken, setGithubToken] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [openPRs, setOpenPRs] = useState<PRInfo[]>([]);
  const [selectedPR, setSelectedPR] = useState<number | "new">("new");
  const [isLoadingPRs, setIsLoadingPRs] = useState(false);
  const [githubResult, setGithubResult] = useState<GitHubResult | null>(null);
  const [repoInfo, setRepoInfo] = useState<{ owner: string; repo: string } | null>(null);

  // Load GitHub token from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("github_token");
    const savedRepo = localStorage.getItem("github_repo");
    if (savedToken) setGithubToken(savedToken);
    if (savedRepo) setRepoUrl(savedRepo);
  }, []);

  // Save token and repo to localStorage when changed
  useEffect(() => {
    if (githubToken) localStorage.setItem("github_token", githubToken);
  }, [githubToken]);

  useEffect(() => {
    if (repoUrl) localStorage.setItem("github_repo", repoUrl);
  }, [repoUrl]);

  const handleGenerateFix = async () => {
    setIsGenerating(true);
    setError(null);
    setFixResult(null);
    setGithubResult(null);

    try {
      const res = await fetch(`/api/reports/${reportId}/fix`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate fix");
      }

      const result = await res.json();
      setFixResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate fix");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLoadPRs = async () => {
    if (!githubToken || !repoUrl) {
      setError("GitHub token and repository URL are required");
      return;
    }

    setIsLoadingPRs(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/reports/${reportId}/fix-github?repo=${encodeURIComponent(repoUrl)}`,
        {
          headers: { "x-github-token": githubToken },
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to load PRs");
      }

      const data = await res.json();
      setOpenPRs(data.prs);
      setRepoInfo({ owner: data.owner, repo: data.repo });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load PRs");
    } finally {
      setIsLoadingPRs(false);
    }
  };

  const handleApplyFix = async () => {
    if (!fixResult) return;

    if (applyMode === "local") {
      await applyFixLocally();
    } else {
      await applyFixToGitHub();
    }
  };

  const applyFixLocally = async () => {
    if (!fixResult) return;

    setIsApplying(true);
    setError(null);

    try {
      const res = await fetch(`/api/reports/${reportId}/fix`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          componentPath: fixResult.componentPath,
          fixedCode: fixResult.fixedCode,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to apply fix");
      }

      setFixResult({ ...fixResult, applied: true });
      onFixApplied();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to apply fix");
    } finally {
      setIsApplying(false);
    }
  };

  const applyFixToGitHub = async () => {
    if (!fixResult || !repoInfo) return;

    if (!githubToken) {
      setError("GitHub token is required");
      return;
    }

    setIsApplying(true);
    setError(null);

    try {
      const res = await fetch(`/api/reports/${reportId}/fix-github`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-github-token": githubToken,
        },
        body: JSON.stringify({
          owner: repoInfo.owner,
          repo: repoInfo.repo,
          prNumber: selectedPR === "new" ? undefined : selectedPR,
          createNewPR: selectedPR === "new",
          componentPath: fixResult.componentPath,
          fixedCode: fixResult.fixedCode,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to apply fix to GitHub");
      }

      const result: GitHubResult = await res.json();
      setGithubResult(result);
      setFixResult({ ...fixResult, applied: true });
      onFixApplied();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to apply fix to GitHub");
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">AI Code Fixer</h2>
          <p className="text-sm text-gray-500">
            {fixResult?.applied
              ? "Fix has been applied!"
              : fixResult
              ? "Review the fix below"
              : "Generate a fix for the bug"}
          </p>
        </div>
        {!fixResult && (
          <button
            onClick={handleGenerateFix}
            disabled={isGenerating || !hasDraft}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Analyzing...
              </>
            ) : (
              <>
                <span>🔧</span>
                Fix Bug with AI
              </>
            )}
          </button>
        )}
      </div>

      <div className="p-4">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {!fixResult && !isGenerating && (
          <div className="text-center py-8 text-gray-500">
            <p>Click &quot;Fix Bug with AI&quot; to analyze the ticket and generate a code fix.</p>
            {!hasDraft && (
              <p className="text-sm mt-2 text-orange-600">
                Generate a ticket draft first by describing the bug.
              </p>
            )}
          </div>
        )}

        {isGenerating && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-600">AI is analyzing the bug and generating a fix...</p>
            <p className="text-sm text-gray-400 mt-2">This may take a few seconds</p>
          </div>
        )}

        {fixResult && (
          <div className="space-y-4">
            {/* File info */}
            <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
              <div>
                <span className="text-sm font-medium text-gray-700">Component: </span>
                <span className="text-sm text-gray-900">{fixResult.componentName}</span>
              </div>
              <code className="text-xs bg-gray-200 px-2 py-1 rounded">
                {fixResult.componentPath}
              </code>
            </div>

            {/* GitHub success message */}
            {githubResult && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                <div className="flex items-center gap-2 font-medium">
                  <span>✓</span>
                  {githubResult.message}
                </div>
                <div className="mt-2 text-sm space-y-1">
                  <p>
                    <span className="font-medium">PR:</span>{" "}
                    <a
                      href={githubResult.pr.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-800 underline hover:text-green-900"
                    >
                      #{githubResult.pr.number} - {githubResult.pr.title}
                    </a>
                  </p>
                  <p>
                    <span className="font-medium">Commit:</span>{" "}
                    <a
                      href={githubResult.commit.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-green-800 underline hover:text-green-900"
                    >
                      {githubResult.commit.sha.substring(0, 7)}
                    </a>
                  </p>
                </div>
              </div>
            )}

            {/* Local applied status */}
            {fixResult.applied && !githubResult && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
                <span>✓</span>
                Fix has been applied locally! Refresh the playground to see the changes.
              </div>
            )}

            {/* Toggle buttons for code view */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowDiff(true)}
                className={`px-3 py-1.5 text-sm rounded-lg ${
                  showDiff
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Fixed Code
              </button>
              <button
                onClick={() => setShowDiff(false)}
                className={`px-3 py-1.5 text-sm rounded-lg ${
                  !showDiff
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Original Code
              </button>
            </div>

            {/* Code display */}
            <div className="relative">
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm max-h-96">
                <code>{showDiff ? fixResult.fixedCode : fixResult.originalCode}</code>
              </pre>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    showDiff ? fixResult.fixedCode : fixResult.originalCode
                  );
                }}
                className="absolute top-2 right-2 px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded hover:bg-gray-600"
              >
                Copy
              </button>
            </div>

            {/* Apply fix section */}
            {!fixResult.applied && (
              <div className="border-t border-gray-200 pt-4 mt-4 space-y-4">
                {/* Apply mode toggle */}
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-700">Apply to:</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setApplyMode("local")}
                      className={`px-3 py-1.5 text-sm rounded-lg ${
                        applyMode === "local"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      Local Files
                    </button>
                    <button
                      onClick={() => setApplyMode("github")}
                      className={`px-3 py-1.5 text-sm rounded-lg ${
                        applyMode === "github"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      GitHub PR
                    </button>
                  </div>
                </div>

                {/* GitHub configuration */}
                {applyMode === "github" && (
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        GitHub Personal Access Token
                      </label>
                      <input
                        type="password"
                        value={githubToken}
                        onChange={(e) => setGithubToken(e.target.value)}
                        placeholder="ghp_xxxxxxxxxxxx"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Needs repo scope.{" "}
                        <a
                          href="https://github.com/settings/tokens/new?scopes=repo"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Create token
                        </a>
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Repository URL
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={repoUrl}
                          onChange={(e) => setRepoUrl(e.target.value)}
                          placeholder="https://github.com/owner/repo or owner/repo"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                          onClick={handleLoadPRs}
                          disabled={isLoadingPRs || !githubToken || !repoUrl}
                          className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center gap-2"
                        >
                          {isLoadingPRs ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Loading...
                            </>
                          ) : (
                            "Load PRs"
                          )}
                        </button>
                      </div>
                    </div>

                    {repoInfo && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Target PR
                        </label>
                        <select
                          value={selectedPR}
                          onChange={(e) =>
                            setSelectedPR(
                              e.target.value === "new" ? "new" : parseInt(e.target.value, 10)
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="new">Create new PR</option>
                          {openPRs.map((pr) => (
                            <option key={pr.number} value={pr.number}>
                              #{pr.number} - {pr.title} ({pr.head})
                            </option>
                          ))}
                        </select>
                        {openPRs.length === 0 && (
                          <p className="mt-1 text-xs text-gray-500">
                            No open PRs found. A new PR will be created.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setFixResult(null);
                      setGithubResult(null);
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApplyFix}
                    disabled={isApplying || (applyMode === "github" && !repoInfo)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isApplying ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Applying...
                      </>
                    ) : (
                      <>
                        <span>✓</span>
                        {applyMode === "local"
                          ? "Apply Fix Locally"
                          : selectedPR === "new"
                          ? "Create PR with Fix"
                          : "Push to PR"}
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
