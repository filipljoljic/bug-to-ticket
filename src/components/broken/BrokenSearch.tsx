"use client";

import { useState } from "react";

/**
 * BROKEN COMPONENT: Search Box
 * 
 * Bugs:
 * 1. Special characters cause a crash (unescaped regex)
 * 2. Search is case-sensitive when it shouldn't be
 * 3. Empty search shows no results instead of all results
 * 4. Results don't update immediately (stale closure)
 */

const ITEMS = [
  { id: 1, name: "Apple iPhone 15", category: "Electronics" },
  { id: 2, name: "Samsung Galaxy S24", category: "Electronics" },
  { id: 3, name: "Sony Headphones", category: "Electronics" },
  { id: 4, name: "Apple MacBook Pro", category: "Computers" },
  { id: 5, name: "Dell XPS 15", category: "Computers" },
  { id: 6, name: "Nike Air Max", category: "Shoes" },
  { id: 7, name: "Adidas Ultraboost", category: "Shoes" },
  { id: 8, name: "The Great Gatsby (Book)", category: "Books" },
];

export function BrokenSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(ITEMS);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = (value: string) => {
    setQuery(value);
    setError(null);

    // BUG: Empty search shows nothing instead of all items
    if (!value) {
      setResults([]);
      return;
    }

    try {
      // BUG: Unescaped regex causes crash on special characters like ( ) [ ] etc.
      const regex = new RegExp(value); // Should escape special chars!
      
      // BUG: Case-sensitive search
      const filtered = ITEMS.filter((item) => 
        regex.test(item.name) // Should use 'i' flag for case-insensitive
      );

      // BUG: Using stale 'query' value instead of 'value'
      console.log(`Searching for: ${query}`); // This logs the OLD value
      
      setResults(filtered);
    } catch {
      setError("Search error occurred");
      setResults([]);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-900">Product Search</h3>
      <p className="text-sm text-gray-600">
        Search for products in our catalog.
      </p>

      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search products..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
        {query && (
          <button
            onClick={() => handleSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>

      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}

      <div className="text-sm text-gray-500">
        {results.length} results {query && `for "${query}"`}
      </div>

      <div className="space-y-2 max-h-48 overflow-y-auto">
        {results.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No results found</p>
        ) : (
          results.map((item) => (
            <div
              key={item.id}
              className="p-3 bg-gray-50 rounded-lg flex justify-between"
            >
              <span className="text-gray-900">{item.name}</span>
              <span className="text-gray-500 text-sm">{item.category}</span>
            </div>
          ))
        )}
      </div>

      <div className="text-xs text-gray-400">
        Try searching: &quot;apple&quot; vs &quot;Apple&quot;, or type &quot;(&quot; to see a bug
      </div>

      <div className="text-xs text-gray-400">
        Component: src/components/broken/BrokenSearch.tsx
      </div>
    </div>
  );
}
