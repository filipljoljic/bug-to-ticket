"use client";

import { useState } from "react";

interface FixResult {
  componentPath: string;
  componentName: string;
  originalCode: string;
  fixedCode: string;
  applied: boolean;
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

  const handleGenerateFix = async () => {
    setIsGenerating(true);
    setError(null);
    setFixResult(null);

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

  const handleApplyFix = async () => {
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

            {/* Applied status */}
            {fixResult.applied && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
                <span>✓</span>
                Fix has been applied! Refresh the playground to see the changes.
              </div>
            )}

            {/* Toggle buttons */}
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

            {/* Apply button */}
            {!fixResult.applied && (
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setFixResult(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApplyFix}
                  disabled={isApplying}
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
                      Apply Fix
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
