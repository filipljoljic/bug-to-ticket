"use client";

import { useState } from "react";

export function BrokenCounter() {
  const [count, setCount] = useState(0);
  const [history, setHistory] = useState<number[]>([0]);

  const increment = () => {
    const newCount = count + 1;
    setCount(newCount);
    setHistory((prev) => [...prev, newCount]);
  };

  const decrement = () => {
    const newCount = Math.max(0, count - 1);
    setCount(newCount);
    setHistory((prev) => [...prev, newCount]);
  };

  const incrementByTen = () => {
    const newCount = count + 10;
    setCount(newCount);
    setHistory((prev) => [...prev, newCount]);
  };

  const reset = () => {
    setCount(0);
    setHistory([0]);
  };

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-900">Item Counter</h3>
      <p className="text-sm text-gray-600">
        Use this counter to track items in your cart.
      </p>

      <div className="flex items-center justify-center gap-4">
        <button
          onClick={decrement}
          className="w-10 h-10 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-bold"
        >
          -
        </button>

        <div className="text-4xl font-bold text-gray-900 w-24 text-center">
          {count}
        </div>

        <button
          onClick={increment}
          className="w-10 h-10 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 font-bold"
        >
          +
        </button>
      </div>

      <div className="flex justify-center gap-2">
        <button
          onClick={incrementByTen}
          className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm"
        >
          +10
        </button>
        <button
          onClick={reset}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
        >
          Reset
        </button>
      </div>

      {count < 0 && (
        <p className="text-orange-600 text-sm text-center">
          Warning: Count is negative!
        </p>
      )}

      {isNaN(count) && (
        <p className="text-red-600 text-sm text-center">
          Error: Count is not a number!
        </p>
      )}

      <div className="text-xs text-gray-400">
        History: {history.slice(-5).join(" → ")}
      </div>

      <div className="text-xs text-gray-400">
        Component: src/components/broken/BrokenCounter.tsx
      </div>
    </div>
  );
}