"use client";

import { useState } from "react";
import Link from "next/link";

// Import broken components
import { BrokenSubmitButton } from "@/components/broken/BrokenSubmitButton";
import { BrokenForm } from "@/components/broken/BrokenForm";
import { BrokenCounter } from "@/components/broken/BrokenCounter";
import { BrokenModal } from "@/components/broken/BrokenModal";
import { BrokenSearch } from "@/components/broken/BrokenSearch";

export default function PlaygroundPage() {
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);

  const components = [
    {
      id: "submit-button",
      name: "Submit Button",
      description: "Button that freezes the page on click",
      component: <BrokenSubmitButton />,
    },
    {
      id: "form",
      name: "Contact Form",
      description: "Form that loses data and shows wrong errors",
      component: <BrokenForm />,
    },
    {
      id: "counter",
      name: "Counter",
      description: "Counter that goes negative and displays NaN",
      component: <BrokenCounter />,
    },
    {
      id: "modal",
      name: "Modal Dialog",
      description: "Modal that can't be closed and traps focus",
      component: <BrokenModal />,
    },
    {
      id: "search",
      name: "Search Box",
      description: "Search that returns wrong results and crashes on special characters",
      component: <BrokenSearch />,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Component Playground
            </h1>
            <p className="text-gray-600 mt-1">
              Test these intentionally broken components and report bugs
            </p>
          </div>
          <Link
            href="/"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            ← Back to Reports
          </Link>
        </div>

        {/* Instructions */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
          <h2 className="font-semibold text-amber-800 mb-2">How to use</h2>
          <ol className="list-decimal list-inside text-amber-700 space-y-1 text-sm">
            <li>Select a component below and interact with it</li>
            <li>Notice the bugs and unexpected behaviors</li>
            <li>Go to <Link href="/" className="underline">Reports</Link> and create a new bug report</li>
            <li>Describe what you experienced - the AI will extract ticket details</li>
            <li>Use the AI Fixer to automatically fix the broken component</li>
          </ol>
        </div>

        {/* Component Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {components.map((comp) => (
            <button
              key={comp.id}
              onClick={() => setSelectedComponent(comp.id)}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                selectedComponent === comp.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <h3 className="font-semibold text-gray-900">{comp.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{comp.description}</p>
              <span className="inline-block mt-2 text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                Has bugs
              </span>
            </button>
          ))}
        </div>

        {/* Selected Component Preview */}
        {selectedComponent && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Testing: {components.find((c) => c.id === selectedComponent)?.name}
              </h2>
              <button
                onClick={() => setSelectedComponent(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>
            <div className="border border-dashed border-gray-300 rounded-lg p-6 bg-gray-50">
              {components.find((c) => c.id === selectedComponent)?.component}
            </div>
            <p className="mt-4 text-sm text-gray-500">
              Interact with the component above. When you find a bug, 
              <Link href="/" className="text-blue-600 hover:underline ml-1">
                create a bug report
              </Link>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
