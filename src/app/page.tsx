"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ReportsList from "@/components/ReportsList";

interface Report {
  id: string;
  title: string | null;
  status: string;
  createdAt: string;
  _count: {
    messages: number;
  };
  draft: { id: string } | null;
}

export default function HomePage() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const fetchReports = async () => {
    try {
      const res = await fetch("/api/reports");
      const data = await res.json();
      setReports(data);
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleCreateReport = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/reports", { method: "POST" });
      const report = await res.json();
      router.push(`/reports/${report.id}`);
    } catch (error) {
      console.error("Error creating report:", error);
      setCreating(false);
    }
  };

  const handleDeleteReport = async (id: string) => {
    if (!confirm("Are you sure you want to delete this report?")) return;

    try {
      await fetch(`/api/reports/${id}`, { method: "DELETE" });
      setReports(reports.filter((r) => r.id !== id));
    } catch (error) {
      console.error("Error deleting report:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Bug-to-Ticket Copilot
            </h1>
            <p className="text-gray-600 mt-1">
              Turn messy bug reports into structured tickets
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/playground"
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
            >
              Component Playground
            </Link>
            <button
              onClick={handleCreateReport}
              disabled={creating}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {creating ? "Creating..." : "+ New Report"}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading reports...</p>
          </div>
        ) : (
          <ReportsList reports={reports} onDelete={handleDeleteReport} />
        )}
      </div>
    </div>
  );
}
