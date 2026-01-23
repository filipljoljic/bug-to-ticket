"use client";

import { useState } from "react";

export function BrokenSubmitButton() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [clickCount, setClickCount] = useState(0);

  const handleSubmit = async () => {
    if (status === "submitting") {
      return;
    }

    setClickCount((prev) => prev + 1);
    setStatus("submitting");

    try {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      
      setStatus("success");
      
      setTimeout(() => {
        window.location.href = "/confirmation";
      }, 1000);
    } catch (error) {
      setStatus("error");
    }
  };

  const resetStatus = () => {
    setStatus("idle");
  };

  if (status === "success") {
    return (
      <div className="space-y-4">
        <h3 className="font-medium text-gray-900">Order Submission</h3>
        <div className="text-green-600 text-sm">
          Order submitted successfully! Redirecting to confirmation page...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-900">Order Submission</h3>
      <p className="text-sm text-gray-600">
        Click the button to submit your order.
      </p>
      
      <div className="flex items-center gap-4">
        <button
          onClick={handleSubmit}
          disabled={status === "submitting"}
          className={`px-6 py-2 text-white rounded-lg transition-colors ${
            status === "submitting" 
              ? "bg-gray-400 cursor-not-allowed" 
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {status === "submitting" ? "Submitting..." : "Submit Order"}
        </button>
        
        {status === "submitting" && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm text-gray-600">Processing...</span>
          </div>
        )}
      </div>

      {status === "error" && (
        <div className="space-y-2">
          <p className="text-red-600 text-sm">
            Something went wrong. Please try again.
          </p>
          <button
            onClick={resetStatus}
            className="px-4 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            Try Again
          </button>
        </div>
      )}

      <div className="text-xs text-gray-400 mt-4">
        Component: src/components/broken/BrokenSubmitButton.tsx
      </div>
    </div>
  );
}