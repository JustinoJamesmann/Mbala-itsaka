"use client";

import { Product, User, Page } from "../types";
import { useState, useEffect, useRef } from "react";

export default function Inventory({ products, setProducts, currentUser, onNavigate }: { products: Product[]; setProducts: (p: Product[]) => void; currentUser: User; onNavigate: (page: Page) => void }) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const categoriesLoaded = useRef(false);
  const skipNextCategorySave = useRef(true);

  useEffect(() => {
    async function loadCategories() {
      const response = await fetch("/api/categories");
      const data = await response.json();
      setCategories(data.categories || []);
      categoriesLoaded.current = true;
    }
    loadCategories();
  }, []);

  useEffect(() => {
    async function saveCategories() {
      if (!categoriesLoaded.current) return;
      if (skipNextCategorySave.current) {
        skipNextCategorySave.current = false;
        return;
      }
      if (categoriesLoaded.current && categories.length > 0 && currentUser.role === "admin") {
        await fetch("/api/categories", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ categories }),
        });
      }
    }
    saveCategories();
  }, [categories, currentUser.role]);

  const filterCategories = ["all", ...categories];

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === "all" || p.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const totalValue = filtered.reduce((sum, p) => sum + p.price * p.quantity, 0);
  const totalUnits = filtered.reduce((sum, p) => sum + p.quantity, 0);
  const lowStockCount = filtered.filter(p => p.quantity > 0 && p.quantity <= 5).length;

  function handleSave(product: Omit<Product, "id"> & { id?: string }) {
    if (product.id) {
      setProducts(products.map(p => p.id === product.id ? product as Product : p));
    } else {
      const newProduct = { ...product, id: Date.now().toString() } as Product;
      setProducts([...products, newProduct]);
    }
    setShowForm(false);
    setEditingProduct(null);
  }

  function handleDelete(id: string) {
    if (confirm("Delete this product?")) {
      setProducts(products.filter(p => p.id !== id));
    }
  }

  function handleEdit(product: Product) {
    setEditingProduct(product);
    setShowForm(true);
  }

  if (showForm) {
    return (
      <ProductForm
        product={editingProduct}
        categories={categories}
        onSave={handleSave}
        onClose={() => { setShowForm(false); setEditingProduct(null); }}
      />
    );
  }

  return (
    <div className="animate-fade-in-up space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Inventory</h1>
          <p className="text-[#8fa3ad]/95 text-sm mt-1">Manage your products and stock levels</p>
        </div>
        <div className="flex gap-2">
          {currentUser.role === "admin" && (
            <>
              <button
                onClick={() => onNavigate("stock")}
                className="px-4 py-2.5 rounded-xl bg-neon-red/20 border border-neon-red/30 text-neon-red font-medium text-sm hover:bg-neon-red/30 transition-colors cursor-pointer"
              >
                📦 Add Stock
              </button>
              <button
                onClick={() => onNavigate("categories")}
                className="px-4 py-2.5 rounded-xl bg-[#d14b4b]/8 border border-[#1f2a30] text-[#e6f1f5]/80 font-medium text-sm hover:bg-[#d14b4b]/10 transition-colors cursor-pointer"
              >
                📁 Categories
              </button>
              <button
                onClick={() => { setEditingProduct(null); setShowForm(true); }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-neon-purple to-neon-cyan text-[#e6f1f5] font-medium text-sm hover:opacity-90 transition-opacity cursor-pointer neon-glow-purple"
              >
                + Add Product
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass p-4 text-center">
          <div className="text-2xl font-bold text-neon-cyan">{filtered.length}</div>
          <div className="text-xs text-[#8fa3ad]/95">Products</div>
        </div>
        <div className="glass p-4 text-center">
          <div className="text-2xl font-bold text-neon-green">{totalUnits}</div>
          <div className="text-xs text-[#8fa3ad]/95">Total Units</div>
        </div>
        <div className="glass p-4 text-center">
          <div className="text-2xl font-bold text-neon-purple">{lowStockCount}</div>
          <div className="text-xs text-[#8fa3ad]/95">Low Stock</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-12 py-4 text-base w-full"
          />
          <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8fa3ad]/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-40">
          {filterCategories.map(c => (
            <option key={c} value={c}>{c === "all" ? "All Categories" : c}</option>
          ))}
        </select>
      </div>

      {/* Product Table */}
      <div className="glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[#8fa3ad]/80 text-xs border-b border-[#1f2a30]">
                <th className="text-left py-3 px-4">Product</th>
                <th className="text-left py-3 px-4">SKU</th>
                <th className="text-left py-3 px-4">Category</th>
                {currentUser.role === "admin" && <th className="text-right py-3 px-4">Buying Price</th>}
                <th className="text-right py-3 px-4">Selling Price</th>
                <th className="text-right py-3 px-4">Stock</th>
                <th className="text-center py-3 px-4">Status</th>
                <th className="text-center py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => {
                const isLow = product.quantity > 0 && product.quantity <= 5;
                return (
                  <tr key={product.id} className="border-b border-[#1f2a30] hover:bg-[#d14b4b]/8 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-[#d14b4b]/8 border border-[#1f2a30] overflow-hidden flex items-center justify-center shrink-0">
                          {product.image ? (
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-lg text-[#8fa3ad]/80">📦</span>
                          )}
                        </div>
                        <span className="text-[#e6f1f5]/90 font-medium">{product.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-neon-cyan font-mono text-xs">{product.sku}</td>
                    <td className="py-3 px-4 text-[#8fa3ad]">{product.category}</td>
                    <td className="py-3 px-4 text-right text-[#e6f1f5]/85">Ar {product.price.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={isLow ? "text-neon-orange font-bold" : "text-[#e6f1f5]/85"}>
                        {product.quantity}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {isLow ? (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-red-500/20 text-red-400 border border-red-500/30">Low</span>
                      ) : (
                        <span className="badge-delivered px-2 py-0.5 rounded-full text-xs">OK</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {currentUser.role === "admin" && (
                          <>
                            <button onClick={() => handleEdit(product)} className="text-[#8fa3ad]/95 hover:text-neon-cyan transition-colors cursor-pointer text-xs">✏️</button>
                            <button onClick={() => handleDelete(product.id)} className="text-[#8fa3ad]/95 hover:text-neon-pink transition-colors cursor-pointer text-xs">🗑️</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-[#8fa3ad]/80">No products found</div>
        )}
        <div className="px-4 py-3 border-t border-[#1f2a30] flex justify-between text-xs text-[#8fa3ad]/80">
          <span>{filtered.length} products</span>
          <span>Total value: <span className="text-neon-green">Ar {totalValue.toFixed(2)}</span></span>
        </div>
      </div>

    </div>
  );
}

function ProductForm({ product, categories, onSave, onClose }: { product: Product | null; categories: string[]; onSave: (p: Omit<Product, "id"> & { id?: string }) => void; onClose: () => void }) {
  const [form, setForm] = useState({
    name: product?.name || "",
    sku: product?.sku || "",
    category: product?.category || (categories[0] || ""),
    price: product?.price?.toString() || "",
    quantity: product?.quantity?.toString() || "",
    image: product?.image || "",
  });
  const [showDropdown, setShowDropdown] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      ...form,
      price: parseFloat(form.price) || 0,
      quantity: parseInt(form.quantity) || 0,
      id: product?.id,
    });
  }

  function handleImageImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setForm(current => ({ ...current, image: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="animate-fade-in-up space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">{product ? "Edit Product" : "Add Product"}</h1>
          <p className="text-[#8fa3ad]/95 text-sm mt-1">{product ? "Update product details and pricing" : "Create a new product in inventory"}</p>
        </div>
        <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl bg-[#d14b4b]/8 border border-[#1f2a30] text-[#e6f1f5]/80 text-sm hover:bg-[#d14b4b]/10 transition-colors cursor-pointer">
          ← Back to Inventory
        </button>
      </div>

      <div className="glass p-8 w-full neon-glow-purple bg-[#0a0a1a]">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="text-center">
            <label className="text-xs text-[#8fa3ad]/95 mb-1 block">Product Name</label>
            <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Product name" className="w-full" />
          </div>
          <div className="text-center">
            <label className="text-xs text-[#8fa3ad]/95 mb-1 block">SKU</label>
            <input type="text" required value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="SKU-001" className="w-full" />
          </div>
          <div className="text-center">
            <label className="text-xs text-[#8fa3ad]/95 mb-1 block">Product Image</label>
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-xl bg-[#d14b4b]/8 border border-[#1f2a30] overflow-hidden flex items-center justify-center shrink-0">
                {form.image ? (
                  <img src={form.image} alt="Product preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl text-[#8fa3ad]/80">📦</span>
                )}
              </div>
              <input type="file" accept="image/*" onChange={handleImageImport} className="w-full" />
            </div>
          </div>
          <div className="text-center">
            <label className="text-xs text-[#8fa3ad]/95 mb-1 block">Selling Price (Ar)</label>
            <input type="number" step="0.01" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="Selling price" className="w-full" />
          </div>
          <div className="text-center relative">
            <label className="text-xs text-[#8fa3ad]/95 mb-1 block">Category</label>
            <button
              type="button"
              onClick={() => setShowDropdown(!showDropdown)}
              className="w-full mt-2 px-4 py-3 rounded-xl bg-[#d14b4b]/8 border border-[#1f2a30] text-[#e6f1f5]/85 text-left hover:bg-[#d14b4b]/10 transition-colors cursor-pointer flex items-center justify-between"
            >
              <span>{form.category}</span>
              <span className="text-[#8fa3ad]/95">{showDropdown ? "▲" : "▼"}</span>
            </button>
            {showDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#0d1518] border border-[#1f2a30] rounded-xl overflow-hidden z-50 max-h-48 overflow-y-auto">
                {categories.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => { setForm({ ...form, category: c }); setShowDropdown(false); }}
                    className={`w-full px-4 py-3 text-left text-sm transition-colors cursor-pointer ${
                      form.category === c
                        ? "bg-gradient-to-r from-neon-purple/20 to-neon-cyan/20 text-neon-purple"
                        : "text-[#e6f1f5]/85 hover:bg-[#d14b4b]/8"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="text-center">
            <label className="text-xs text-[#8fa3ad]/95 mb-1 block">Quantity</label>
            <input type="number" required value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} placeholder="Quantity" className="w-full" />
          </div>
          <div className="flex gap-3 pt-2 lg:col-span-2">
            <button type="submit" className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-neon-purple to-neon-cyan text-[#e6f1f5] font-medium text-sm hover:opacity-90 transition-opacity cursor-pointer">
              {product ? "Update" : "Create"} Product
            </button>
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-[#d14b4b]/8 border border-[#1f2a30] text-[#e6f1f5]/80 text-sm hover:bg-[#d14b4b]/10 transition-colors cursor-pointer">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

