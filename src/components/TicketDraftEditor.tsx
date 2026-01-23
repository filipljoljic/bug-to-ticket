"use client";

import { useState, useEffect } from "react";
import type { TicketDraftFields } from "@/lib/schemas";

interface TicketDraftEditorProps {
  draft: TicketDraftFields | null;
  onUpdate: (fields: TicketDraftFields) => void;
  onGenerate: () => void;
  onExport: () => void;
  isGenerating: boolean;
  hasMessages: boolean;
}

const severityOptions = ["low", "medium", "high", "critical"] as const;

export default function TicketDraftEditor({
  draft,
  onUpdate,
  onGenerate,
  onExport,
  isGenerating,
  hasMessages,
}: TicketDraftEditorProps) {
  const [localDraft, setLocalDraft] = useState<TicketDraftFields | null>(draft);

  useEffect(() => {
    setLocalDraft(draft);
  }, [draft]);

  const handleChange = (
    field: keyof TicketDraftFields,
    value: string | string[] | number | { [key: string]: string | null }
  ) => {
    if (!localDraft) return;

    const updated = { ...localDraft, [field]: value };
    setLocalDraft(updated);
    onUpdate(updated);
  };

  const handleEnvChange = (
    field: keyof TicketDraftFields["environment"],
    value: string
  ) => {
    if (!localDraft) return;

    const updated = {
      ...localDraft,
      environment: {
        ...localDraft.environment,
        [field]: value || null,
      },
    };
    setLocalDraft(updated);
    onUpdate(updated);
  };

  const handleStepChange = (index: number, value: string) => {
    if (!localDraft) return;

    const newSteps = [...localDraft.repro_steps];
    newSteps[index] = value;
    handleChange("repro_steps", newSteps);
  };

  const addStep = () => {
    if (!localDraft) return;
    handleChange("repro_steps", [...localDraft.repro_steps, ""]);
  };

  const removeStep = (index: number) => {
    if (!localDraft) return;
    const newSteps = localDraft.repro_steps.filter((_, i) => i !== index);
    handleChange("repro_steps", newSteps);
  };

  return (
    <div className="bg-white rounded-lg shadow h-full flex flex-col">
      <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Ticket Draft</h2>
          <p className="text-sm text-gray-500">
            {isGenerating ? "AI is analyzing..." : draft ? "Auto-updated from chat" : "Send a message to generate"}
          </p>
        </div>
        <div className="flex space-x-2">
          {isGenerating && (
            <div className="flex items-center text-purple-600 text-sm">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mr-2"></div>
              Updating...
            </div>
          )}
          {draft && !isGenerating && (
            <>
              <button
                onClick={onGenerate}
                disabled={isGenerating || !hasMessages}
                className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Regenerate
              </button>
              <button
                onClick={onExport}
                className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Export .docx
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!localDraft ? (
          <div className="text-center py-12 text-gray-500">
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p>AI is generating ticket draft...</p>
              </>
            ) : (
              <>
                <p>No draft yet.</p>
                <p className="text-sm mt-2">
                  Send a message describing the bug - the ticket will be generated automatically.
                </p>
              </>
            )}
          </div>
        ) : (
          <>
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                value={localDraft.title}
                onChange={(e) => handleChange("title", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Summary */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Summary
              </label>
              <textarea
                value={localDraft.summary}
                onChange={(e) => handleChange("summary", e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Expected vs Actual */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expected Behavior
                </label>
                <textarea
                  value={localDraft.expected_behavior}
                  onChange={(e) =>
                    handleChange("expected_behavior", e.target.value)
                  }
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Actual Behavior
                </label>
                <textarea
                  value={localDraft.actual_behavior}
                  onChange={(e) =>
                    handleChange("actual_behavior", e.target.value)
                  }
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Repro Steps */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Steps to Reproduce
              </label>
              <div className="space-y-2">
                {localDraft.repro_steps.map((step, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500 w-6">
                      {index + 1}.
                    </span>
                    <input
                      type="text"
                      value={step}
                      onChange={(e) => handleStepChange(index, e.target.value)}
                      className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => removeStep(index)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  onClick={addStep}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  + Add Step
                </button>
              </div>
            </div>

            {/* Environment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Environment
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">OS</label>
                  <input
                    type="text"
                    value={localDraft.environment.os || ""}
                    onChange={(e) => handleEnvChange("os", e.target.value)}
                    placeholder="e.g., macOS 14.0"
                    className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Browser
                  </label>
                  <input
                    type="text"
                    value={localDraft.environment.browser || ""}
                    onChange={(e) => handleEnvChange("browser", e.target.value)}
                    placeholder="e.g., Chrome 120"
                    className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Device
                  </label>
                  <input
                    type="text"
                    value={localDraft.environment.device || ""}
                    onChange={(e) => handleEnvChange("device", e.target.value)}
                    placeholder="e.g., MacBook Pro"
                    className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    App Version
                  </label>
                  <input
                    type="text"
                    value={localDraft.environment.app_version || ""}
                    onChange={(e) =>
                      handleEnvChange("app_version", e.target.value)
                    }
                    placeholder="e.g., 2.1.0"
                    className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Severity & Confidence */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Severity
                </label>
                <select
                  value={localDraft.severity}
                  onChange={(e) =>
                    handleChange(
                      "severity",
                      e.target.value as (typeof severityOptions)[number]
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {severityOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt.charAt(0).toUpperCase() + opt.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confidence: {Math.round(localDraft.confidence * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={localDraft.confidence}
                  onChange={(e) =>
                    handleChange("confidence", parseFloat(e.target.value))
                  }
                  className="w-full"
                />
              </div>
            </div>

            {/* Suspected Component */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Suspected Component
              </label>
              <input
                type="text"
                value={localDraft.suspected_component || ""}
                onChange={(e) =>
                  handleChange("suspected_component", e.target.value || null)
                }
                placeholder="e.g., Authentication, Payment, UI"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
