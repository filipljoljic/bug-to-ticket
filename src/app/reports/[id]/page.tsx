"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import ChatPanel from "@/components/ChatPanel";
import TicketDraftEditor from "@/components/TicketDraftEditor";
import MissingInfoPanel from "@/components/MissingInfoPanel";
import CodeFixPanel from "@/components/CodeFixPanel";
import type { TicketDraftFields } from "@/lib/schemas";

interface Message {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}

interface Report {
  id: string;
  title: string | null;
  status: string;
  messages: Message[];
  draft: {
    id: string;
    fields: string;
  } | null;
}

export default function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [report, setReport] = useState<Report | null>(null);
  const [draft, setDraft] = useState<TicketDraftFields | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    try {
      const res = await fetch(`/api/reports/${id}`);
      if (!res.ok) {
        if (res.status === 404) {
          router.push("/");
          return;
        }
        throw new Error("Failed to fetch report");
      }
      const data = await res.json();
      setReport(data);
      if (data.draft) {
        setDraft(JSON.parse(data.draft.fields));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleSendMessage = async (content: string) => {
    try {
      const res = await fetch(`/api/reports/${id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "user", content }),
      });

      if (!res.ok) throw new Error("Failed to send message");

      const message = await res.json();
      setReport((prev) =>
        prev ? { ...prev, messages: [...prev.messages, message] } : null
      );

      // Auto-generate ticket after each message
      await handleGenerateDraft();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    }
  };

  const handleGenerateDraft = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/reports/${id}/generate`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate draft");
      }

      const data = await res.json();
      setDraft(data.fields);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate draft");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdateDraft = async (fields: TicketDraftFields) => {
    setDraft(fields);
    // Debounced save could be implemented here
    try {
      await fetch(`/api/reports/${id}/generate`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
    } catch (err) {
      console.error("Failed to save draft:", err);
    }
  };

  const handleExport = async () => {
    try {
      const res = await fetch(`/api/reports/${id}/export`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to export");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        res.headers.get("Content-Disposition")?.match(/filename="(.+)"/)?.[1] ||
        "ticket.docx";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to export");
    }
  };

  const handleCopyQuestion = (question: string) => {
    navigator.clipboard.writeText(question);
    // Could add a toast notification here
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading report...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Report not found</p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-[1600px] mx-auto px-4 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push("/")}
              className="text-gray-600 hover:text-gray-900"
            >
              ← Back
            </button>
            <h1 className="text-xl font-semibold text-gray-900">
              {report.title || "New Bug Report"}
            </h1>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
            <button
              onClick={() => setError(null)}
              className="float-right text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-120px)]">
          {/* Left: Chat */}
          <div className="h-full">
            <ChatPanel
              messages={report.messages}
              onSendMessage={handleSendMessage}
              isLoading={isGenerating}
            />
          </div>

          {/* Middle: Draft Editor + Missing Info */}
          <div className="h-full flex flex-col space-y-4">
            <div className="flex-1 min-h-0">
              <TicketDraftEditor
                draft={draft}
                onUpdate={handleUpdateDraft}
                onGenerate={handleGenerateDraft}
                onExport={handleExport}
                isGenerating={isGenerating}
                hasMessages={report.messages.length > 0}
              />
            </div>
            {draft && draft.missing_info_questions.length > 0 && (
              <MissingInfoPanel
                questions={draft.missing_info_questions}
                onCopyQuestion={handleCopyQuestion}
              />
            )}
          </div>

          {/* Right: AI Code Fixer */}
          <div className="h-full overflow-y-auto">
            <CodeFixPanel
              reportId={id}
              hasDraft={!!draft}
              onFixApplied={() => {
                // Could trigger a refresh or show success notification
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
