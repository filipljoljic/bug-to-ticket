"use client";

import { useState } from "react";

/**
 * BROKEN COMPONENT: Submit Button
 * 
 * Bugs:
 * 1. Clicking causes a 5-second freeze (blocking main thread)
 * 2. Shows "Submitting..." but never completes
 * 3. Double-click causes multiple submissions
 * 4. No loading state feedback
 */
export function BrokenSubmitButton() {
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [clickCount, setClickCount] = useState(0);

  const handleSubmit = () => {
    setClickCount((prev) => prev + 1);
    setStatus("submitting");

    // BUG: Blocking the main thread instead of using async
    const start = Date.now();
    while (Date.now() - start < 3000) {
      // Intentionally blocking for 3 seconds
    }

    // BUG: Never sets status back to idle or success
    // BUG: No actual submission happens
    
    // Randomly show error sometimes
    if (Math.random() > 0.5) {
      setStatus("error");
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-900">Order Submission</h3>
      <p className="text-sm text-gray-600">
        Click the button to submit your order.
      </p>
      
      <div className="flex items-center gap-4">
        <button
          onClick={handleSubmit}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          {status === "submitting" ? "Submitting..." : "Submit Order"}
        </button>
        
        {clickCount > 1 && (
          <span className="text-sm text-orange-600">
            Clicked {clickCount} times
          </span>
        )}
      </div>

      {status === "error" && (
        <p className="text-red-600 text-sm">
          Something went wrong. Please try again.
        </p>
      )}

      <div className="text-xs text-gray-400 mt-4">
        Component: src/components/broken/BrokenSubmitButton.tsx
      </div>
    </div>
  );
}
