"use client";

import { useState } from "react";

/**
 * BROKEN COMPONENT: Contact Form
 * 
 * Bugs:
 * 1. Email validation is inverted (rejects valid emails, accepts invalid)
 * 2. Form data is lost on validation error
 * 3. Success message shows even when submission fails
 * 4. Phone field allows letters but shouldn't
 */
export function BrokenForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    // BUG: Inverted email validation - rejects valid emails!
    if (formData.email.includes("@") && formData.email.includes(".")) {
      newErrors.email = "Please enter a valid email address";
    }

    // BUG: Name validation too strict
    if (formData.name.length < 10) {
      newErrors.name = "Name must be at least 10 characters";
    }

    // BUG: Clears form data on error instead of keeping it
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setFormData({ name: "", email: "", phone: "", message: "" }); // BUG!
      return;
    }

    // BUG: Shows success even though nothing actually submits
    setSubmitted(true);
    setErrors({});
  };

  if (submitted) {
    return (
      <div className="text-center py-8">
        <div className="text-green-600 text-xl mb-2">✓ Form Submitted!</div>
        <p className="text-gray-600">We&apos;ll get back to you soon.</p>
        <button
          onClick={() => setSubmitted(false)}
          className="mt-4 text-blue-600 hover:underline"
        >
          Submit another
        </button>
        <div className="text-xs text-gray-400 mt-4">
          Component: src/components/broken/BrokenForm.tsx
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="font-medium text-gray-900">Contact Form</h3>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Name
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Your name"
        />
        {errors.name && (
          <p className="text-red-500 text-sm mt-1">{errors.name}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          type="text" // BUG: Should be type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="your@email.com"
        />
        {errors.email && (
          <p className="text-red-500 text-sm mt-1">{errors.email}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Phone
        </label>
        <input
          type="text" // BUG: Allows any characters, should validate
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="123-456-7890"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Message
        </label>
        <textarea
          name="message"
          value={formData.message}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Your message..."
        />
      </div>

      <button
        type="submit"
        className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Send Message
      </button>

      <div className="text-xs text-gray-400 mt-4">
        Component: src/components/broken/BrokenForm.tsx
      </div>
    </form>
  );
}
