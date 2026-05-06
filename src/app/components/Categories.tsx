"use client";

import { useState, useEffect } from "react";

export default function Categories({ onNavigate }: { onNavigate: (page: any) => void }) {
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState("");

  useEffect(() => {
    async function loadCategories() {
      const response = await fetch("/api/categories");
      const data = await response.json();
      setCategories(data.categories || []);
    }
    loadCategories();
  }, []);

  useEffect(() => {
    async function saveCategories() {
      if (categories.length > 0) {
        await fetch("/api/categories", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ categories }),
        });
      }
    }
    saveCategories();
  }, [categories]);

  function handleAdd() {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      setCategories([...categories, newCategory.trim()]);
      setNewCategory("");
    }
  }

  function handleDelete(category: string) {
    if (categories.length <= 1) return;
    setCategories(categories.filter(c => c !== category));
  }

  return (
    <div className="animate-fade-in-up space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Categories</h1>
          <p className="text-[#8fa3ad]/95 text-sm mt-1">Manage your product categories</p>
        </div>
        <button
          onClick={() => onNavigate("inventory")}
          className="px-4 py-2.5 rounded-xl bg-[#d14b4b]/8 border border-[#1f2a30] text-[#e6f1f5]/80 text-sm hover:bg-[#d14b4b]/10 transition-colors cursor-pointer"
        >
          ← Back to Inventory
        </button>
      </div>

      <div className="glass p-6 neon-glow-cyan bg-[#0a0a1a]">
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="New category name"
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className="flex-1"
          />
          <button onClick={handleAdd} className="px-4 py-2 rounded-xl bg-neon-cyan/20 text-neon-cyan text-sm hover:bg-neon-cyan/30 transition-colors cursor-pointer">
            Add
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {categories.map(c => (
            <div key={c} className="flex items-center justify-between bg-[#d14b4b]/8 rounded-xl p-4">
              <span className="text-[#e6f1f5]/85 font-medium">{c}</span>
              {categories.length > 1 && (
                <button onClick={() => handleDelete(c)} className="text-[#8fa3ad]/80 hover:text-neon-pink transition-colors cursor-pointer text-sm">✕</button>
              )}
            </div>
          ))}
        </div>

        {categories.length === 0 && (
          <div className="text-center py-12 text-[#8fa3ad]/80">
            No categories yet. Add your first category above.
          </div>
        )}
      </div>
    </div>
  );
}
