"use client";

import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";

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

interface ReportsListProps {
  reports: Report[];
  onDelete: (id: string) => void;
}

export default function ReportsList({ reports, onDelete }: ReportsListProps) {
  const router = useRouter();

  if (reports.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg">No bug reports yet.</p>
        <p className="text-sm mt-2">Create one to get started!</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden bg-white shadow ring-1 ring-black ring-opacity-5 rounded-lg">
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-50">
          <tr>
            <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
              Title
            </th>
            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
              Status
            </th>
            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
              Messages
            </th>
            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
              Created
            </th>
            <th className="relative py-3.5 pl-3 pr-4">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {reports.map((report) => (
            <tr
              key={report.id}
              className="hover:bg-gray-50 cursor-pointer"
              onClick={() => router.push(`/reports/${report.id}`)}
            >
              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                {report.title || "Untitled Report"}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    report.draft
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {report.draft ? "Draft Ready" : "In Progress"}
                </span>
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                {report._count.messages}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                {formatDistanceToNow(new Date(report.createdAt), {
                  addSuffix: true,
                })}
              </td>
              <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(report.id);
                  }}
                  className="text-red-600 hover:text-red-900"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
