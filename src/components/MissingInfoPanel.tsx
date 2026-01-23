"use client";

interface MissingInfoPanelProps {
  questions: string[];
  onCopyQuestion: (question: string) => void;
}

export default function MissingInfoPanel({
  questions,
  onCopyQuestion,
}: MissingInfoPanelProps) {
  if (questions.length === 0) {
    return null;
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-amber-800 mb-2">
        Missing Information
      </h3>
      <p className="text-xs text-amber-700 mb-3">
        Click a question to copy it to your clipboard and ask the reporter.
      </p>
      <ul className="space-y-2">
        {questions.map((question, index) => (
          <li key={index}>
            <button
              onClick={() => onCopyQuestion(question)}
              className="text-left w-full text-sm text-amber-900 hover:bg-amber-100 rounded px-2 py-1.5 transition-colors"
            >
              <span className="mr-2">•</span>
              {question}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
