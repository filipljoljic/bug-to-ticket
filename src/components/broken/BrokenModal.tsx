"use client";

import { useState, useEffect } from "react";

interface BrokenModalProps {
  backdropColor?: "default" | "white" | "transparent";
}

export function BrokenModal({ backdropColor = "default" }: BrokenModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [modalCount, setModalCount] = useState(0);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const openModal = () => {
    setIsOpen(true);
    setModalCount((prev) => prev + 1);
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeModal();
    }
  };

  const getBackdropClassName = () => {
    const baseClasses = "absolute inset-0";
    switch (backdropColor) {
      case "white":
        return `${baseClasses} bg-white bg-opacity-80`;
      case "transparent":
        return `${baseClasses} bg-transparent`;
      default:
        return `${baseClasses} bg-black bg-opacity-50`;
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-900">Modal Dialog</h3>
      <p className="text-sm text-gray-600">
        Click to open a modal dialog.
      </p>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={openModal}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          Open Modal
        </button>
      </div>

      <div className="text-sm text-gray-600">
        <label className="block mb-2">Backdrop Color:</label>
        <select 
          value={backdropColor} 
          onChange={(e) => {}}
          className="border rounded px-2 py-1"
          disabled
        >
          <option value="default">Default (Dark)</option>
          <option value="white">White</option>
          <option value="transparent">Transparent</option>
        </select>
        <p className="text-xs text-gray-500 mt-1">
          Prop: backdropColor="{backdropColor}"
        </p>
      </div>

      {modalCount > 1 && (
        <p className="text-sm text-orange-600">
          Modal opened {modalCount} times this session
        </p>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50">
          <div 
            className={getBackdropClassName()}
            onClick={handleBackdropClick}
          />
          
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl p-6 w-96">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-semibold">Modal Title</h4>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <p className="text-gray-600 mb-4">
              This is the modal content. Try to close it by:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-500 mb-4">
              <li>Clicking the X button</li>
              <li>Clicking outside the modal</li>
              <li>Pressing the Escape key</li>
            </ul>
            
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="text-xs text-gray-400">
        Component: src/components/broken/BrokenModal.tsx
      </div>
    </div>
  );
}