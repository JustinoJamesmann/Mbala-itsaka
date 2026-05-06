"use client";

import { Product, User } from "../types";
import { useState, useEffect, useRef } from "react";

export default function Inventory({ products, setProducts, currentUser }: { products: Product[]; setProducts: (p: Product[]) => void; currentUser: User }) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [showStockModal, setShowStockModal] = useState(false);
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
          <p className="text-white/40 text-sm mt-1">Manage your products and stock levels</p>
        </div>
        <div className="flex gap-2">
          {currentUser.role === "admin" && (
            <>
              <button
                onClick={() => setShowStockModal(true)}
                className="px-4 py-2.5 rounded-xl bg-neon-red/20 border border-neon-red/30 text-neon-red font-medium text-sm hover:bg-neon-red/30 transition-colors cursor-pointer"
              >
                📦 Add Stock
              </button>
              <button
                onClick={() => setShowCategoryModal(true)}
                className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 font-medium text-sm hover:bg-white/10 transition-colors cursor-pointer"
              >
                📁 Categories
              </button>
              <button
                onClick={() => { setEditingProduct(null); setShowForm(true); }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-neon-purple to-neon-cyan text-white font-medium text-sm hover:opacity-90 transition-opacity cursor-pointer neon-glow-purple"
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
          <div className="text-xs text-white/40">Products</div>
        </div>
        <div className="glass p-4 text-center">
          <div className="text-2xl font-bold text-neon-green">{totalUnits}</div>
          <div className="text-xs text-white/40">Total Units</div>
        </div>
        <div className="glass p-4 text-center">
          <div className="text-2xl font-bold text-neon-purple">{lowStockCount}</div>
          <div className="text-xs text-white/40">Low Stock</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <input
          type="text"
          placeholder="Search products or SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px]"
        />
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
              <tr className="text-white/30 text-xs border-b border-white/5">
                <th className="text-left py-3 px-4">Product</th>
                <th className="text-left py-3 px-4">SKU</th>
                <th className="text-left py-3 px-4">Category</th>
                <th className="text-left py-3 px-4">Dimension</th>
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
                  <tr key={product.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                          {product.image ? (
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-lg text-white/30">📦</span>
                          )}
                        </div>
                        <span className="text-white/80 font-medium">{product.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-neon-cyan font-mono text-xs">{product.sku}</td>
                    <td className="py-3 px-4 text-white/50">{product.category}</td>
                    <td className="py-3 px-4 text-white/50">
                      {product.widthCm && product.heightCm ? `${product.widthCm}Cm X ${product.heightCm}Cm` : "-"}
                    </td>
                    {currentUser.role === "admin" && (
                      <td className="py-3 px-4 text-right text-white/50">Ar {(product.buyingPrice || 0).toFixed(2)}</td>
                    )}
                    <td className="py-3 px-4 text-right text-white/70">Ar {product.price.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={isLow ? "text-neon-orange font-bold" : "text-white/70"}>
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
                            <button onClick={() => handleEdit(product)} className="text-white/40 hover:text-neon-cyan transition-colors cursor-pointer text-xs">✏️</button>
                            <button onClick={() => handleDelete(product.id)} className="text-white/40 hover:text-neon-pink transition-colors cursor-pointer text-xs">🗑️</button>
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
          <div className="text-center py-12 text-white/30">No products found</div>
        )}
        <div className="px-4 py-3 border-t border-white/5 flex justify-between text-xs text-white/30">
          <span>{filtered.length} products</span>
          <span>Total value: <span className="text-neon-green">Ar {totalValue.toFixed(2)}</span></span>
        </div>
      </div>

      {/* Category Management Modal */}
      {showCategoryModal && (
        <CategoryModal
          categories={categories}
          setCategories={setCategories}
          onClose={() => setShowCategoryModal(false)}
        />
      )}
      {/* Stock Arrival Modal */}
      {showStockModal && (
        <StockModal
          products={products}
          setProducts={setProducts}
          onClose={() => setShowStockModal(false)}
        />
      )}
    </div>
  );
}

function ProductForm({ product, categories, onSave, onClose }: { product: Product | null; categories: string[]; onSave: (p: Omit<Product, "id"> & { id?: string }) => void; onClose: () => void }) {
  const [form, setForm] = useState({
    name: product?.name || "",
    sku: product?.sku || "",
    category: product?.category || (categories[0] || ""),
    buyingPrice: product?.buyingPrice?.toString() || "",
    price: product?.price?.toString() || "",
    quantity: product?.quantity?.toString() || "",
    image: product?.image || "",
    widthCm: product?.widthCm?.toString() || "",
    heightCm: product?.heightCm?.toString() || "",
  });
  const [showDropdown, setShowDropdown] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      ...form,
      buyingPrice: parseFloat(form.buyingPrice) || 0,
      price: parseFloat(form.price) || 0,
      quantity: parseInt(form.quantity) || 0,
      widthCm: parseFloat(form.widthCm) || undefined,
      heightCm: parseFloat(form.heightCm) || undefined,
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
          <p className="text-white/40 text-sm mt-1">{product ? "Update product details and pricing" : "Create a new product in inventory"}</p>
        </div>
        <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm hover:bg-white/10 transition-colors cursor-pointer">
          ← Back to Inventory
        </button>
      </div>

      <div className="glass p-8 w-full neon-glow-purple bg-[#0a0a1a]">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="text-center">
            <label className="text-xs text-white/40 mb-1 block">Product Name</label>
            <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Product name" className="w-full" />
          </div>
          <div className="text-center">
            <label className="text-xs text-white/40 mb-1 block">SKU</label>
            <input type="text" required value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="SKU-001" className="w-full" />
          </div>
          <div className="text-center">
            <label className="text-xs text-white/40 mb-1 block">Product Image</label>
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-xl bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                {form.image ? (
                  <img src={form.image} alt="Product preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl text-white/30">📦</span>
                )}
              </div>
              <input type="file" accept="image/*" onChange={handleImageImport} className="w-full" />
            </div>
          </div>
          <div className="text-center">
            <label className="text-xs text-white/40 mb-1 block">Buying Price (Ar)</label>
            <input type="number" step="0.01" required value={form.buyingPrice} onChange={(e) => setForm({ ...form, buyingPrice: e.target.value })} placeholder="Buying price" className="w-full" />
          </div>
          <div className="text-center">
            <label className="text-xs text-white/40 mb-1 block">Selling Price (Ar)</label>
            <input type="number" step="0.01" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="Selling price" className="w-full" />
          </div>
          <div className="text-center relative">
            <label className="text-xs text-white/40 mb-1 block">Category</label>
            <button
              type="button"
              onClick={() => setShowDropdown(!showDropdown)}
              className="w-full mt-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 text-left hover:bg-white/10 transition-colors cursor-pointer flex items-center justify-between"
            >
              <span>{form.category}</span>
              <span className="text-white/40">{showDropdown ? "▲" : "▼"}</span>
            </button>
            {showDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a2e] border border-white/10 rounded-xl overflow-hidden z-50 max-h-48 overflow-y-auto">
                {categories.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => { setForm({ ...form, category: c }); setShowDropdown(false); }}
                    className={`w-full px-4 py-3 text-left text-sm transition-colors cursor-pointer ${
                      form.category === c
                        ? "bg-gradient-to-r from-neon-purple/20 to-neon-cyan/20 text-neon-purple"
                        : "text-white/70 hover:bg-white/5"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="text-center">
            <label className="text-xs text-white/40 mb-1 block">Quantity</label>
            <input type="number" required value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} placeholder="Quantity" className="w-full" />
          </div>
          <div className="lg:col-span-2">
            <label className="text-xs text-white/40 mb-2 block text-center">Dimension</label>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <input type="number" min="0" step="0.01" value={form.widthCm} onChange={(e) => setForm({ ...form, widthCm: e.target.value })} placeholder="Width" className="w-full text-center" />
              <span className="text-white/50 text-sm font-medium">Cm X</span>
              <input type="number" min="0" step="0.01" value={form.heightCm} onChange={(e) => setForm({ ...form, heightCm: e.target.value })} placeholder="Height" className="w-full text-center" />
            </div>
            <div className="text-center text-xs text-white/30 mt-2">
              {form.widthCm || form.heightCm ? `${form.widthCm || "..."}Cm X ${form.heightCm || "..."}Cm` : "Width Cm X Height Cm"}
            </div>
          </div>
          <div className="flex gap-3 pt-2 lg:col-span-2">
            <button type="submit" className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-neon-purple to-neon-cyan text-white font-medium text-sm hover:opacity-90 transition-opacity cursor-pointer">
              {product ? "Update" : "Create"} Product
            </button>
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm hover:bg-white/10 transition-colors cursor-pointer">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CategoryModal({ categories, setCategories, onClose }: { categories: string[]; setCategories: (c: string[]) => void; onClose: () => void }) {
  const [newCategory, setNewCategory] = useState("");

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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50" onClick={onClose}>
      <div className="glass p-8 w-full max-w-md neon-glow-cyan bg-[#0a0a1a]" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold gradient-text mb-6">Manage Categories</h2>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="New category name"
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <button onClick={handleAdd} className="px-4 py-2 rounded-xl bg-neon-cyan/20 text-neon-cyan text-sm hover:bg-neon-cyan/30 transition-colors cursor-pointer">
            Add
          </button>
        </div>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {categories.map(c => (
            <div key={c} className="flex items-center justify-between bg-white/5 rounded-xl p-3">
              <span className="text-white/70">{c}</span>
              {categories.length > 1 && (
                <button onClick={() => handleDelete(c)} className="text-white/30 hover:text-neon-pink transition-colors cursor-pointer text-xs">✕</button>
              )}
            </div>
          ))}
        </div>
        <button onClick={onClose} className="w-full mt-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm hover:bg-white/10 transition-colors cursor-pointer">
          Close
        </button>
      </div>
    </div>
  );
}

function StockModal({ products, setProducts, onClose }: { products: Product[]; setProducts: (p: Product[]) => void; onClose: () => void }) {
  const [productSearch, setProductSearch] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantityToAdd, setQuantityToAdd] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.sku.toLowerCase().includes(productSearch.toLowerCase())
  );

  function handleAddStock() {
    const parsedQuantity = parseInt(quantityToAdd) || 0;
    if (!selectedProductId || parsedQuantity <= 0) return;
    setProducts(products.map(p =>
      p.id === selectedProductId
        ? { ...p, quantity: p.quantity + parsedQuantity }
        : p
    ));
    setSelectedProductId("");
    setProductSearch("");
    setQuantityToAdd("");
    setShowDropdown(false);
  }

  const selectedProduct = products.find(p => p.id === selectedProductId);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50" onClick={onClose}>
      <div className="glass p-8 w-full max-w-lg neon-glow-red bg-[#0a0a1a]" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold gradient-text mb-6">Add Stock Arrival</h2>
        <div className="space-y-4">
          <div className="relative">
            <label className="text-xs text-white/40 mb-1 block">Search Product</label>
            <input
              type="text"
              placeholder="Search product name or SKU..."
              value={productSearch}
              onChange={(e) => { setProductSearch(e.target.value); setShowDropdown(true); }}
              onFocus={() => setShowDropdown(true)}
            />
            {showDropdown && filteredProducts.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a2e] border border-white/10 rounded-xl overflow-hidden z-50 max-h-48 overflow-y-auto">
                {filteredProducts.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => { setSelectedProductId(p.id); setProductSearch(p.name); setShowDropdown(false); }}
                    className="w-full px-4 py-3 text-left text-sm text-white/70 hover:bg-white/5 cursor-pointer"
                  >
                    {p.name} ({p.sku}) — {p.quantity} in stock
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedProduct && (
            <div className="bg-white/5 rounded-xl p-4">
              <div className="text-sm text-white/70 font-medium">{selectedProduct.name}</div>
              <div className="text-xs text-white/40">SKU: {selectedProduct.sku}</div>
              <div className="text-xs text-white/40 mt-1">Current stock: {selectedProduct.quantity}</div>
            </div>
          )}

          <div>
            <label className="text-xs text-white/40 mb-1 block">Quantity to Add</label>
            <input
              type="number"
              min={1}
              value={quantityToAdd}
              onChange={(e) => setQuantityToAdd(e.target.value)}
              placeholder="Quantity"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleAddStock}
              disabled={!selectedProductId || (parseInt(quantityToAdd) || 0) <= 0}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-neon-red to-neon-orange text-white font-medium text-sm hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Add Stock
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm hover:bg-white/10 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
