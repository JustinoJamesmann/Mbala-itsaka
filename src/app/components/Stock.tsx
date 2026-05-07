"use client";

import { Product } from "../types";
import { useState } from "react";

export default function Stock({ products, setProducts, onNavigate }: { products: Product[]; setProducts: (p: Product[]) => void; onNavigate: (page: any) => void }) {
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
    <div className="animate-fade-in-up space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Add Stock Arrival</h1>
          <p className="text-[#8fa3ad]/95 text-sm mt-1">Add stock to your products</p>
        </div>
        <button
          onClick={() => onNavigate("inventory")}
          className="px-4 py-2.5 rounded-xl bg-[#d14b4b]/8 border border-[#1f2a30] text-[#e6f1f5]/80 text-sm hover:bg-[#d14b4b]/10 transition-colors cursor-pointer"
        >
          ← Back to Inventory
        </button>
      </div>

      <div className="glass p-8 neon-glow-red bg-[#0a0a1a]">
        <div className="space-y-4">
          <div className="relative">
            <label className="text-xs text-[#8fa3ad]/95 mb-1 block">Search Product</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search"
                value={productSearch}
                onChange={(e) => { setProductSearch(e.target.value); setShowDropdown(true); }}
                onFocus={() => setShowDropdown(true)}
                className="pr-12 py-4 text-base"
              />
              <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8fa3ad]/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {showDropdown && filteredProducts.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#0d1518] border border-[#1f2a30] rounded-xl overflow-hidden z-50 max-h-48 overflow-y-auto">
                {filteredProducts.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => { setSelectedProductId(p.id); setProductSearch(p.name); setShowDropdown(false); }}
                    className="w-full px-4 py-3 text-left text-sm text-[#e6f1f5]/85 hover:bg-[#d14b4b]/8 cursor-pointer"
                  >
                    {p.name} ({p.sku}) — {p.quantity} in stock
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedProduct && (
            <div className="bg-[#d14b4b]/8 rounded-xl p-4">
              <div className="text-sm text-[#e6f1f5]/85 font-medium">{selectedProduct.name}</div>
              <div className="text-xs text-[#8fa3ad]/95">SKU: {selectedProduct.sku}</div>
              <div className="text-xs text-[#8fa3ad]/95 mt-1">Current stock: {selectedProduct.quantity}</div>
            </div>
          )}

          <div>
            <label className="text-xs text-[#8fa3ad]/95 mb-1 block">Quantity to Add</label>
            <input
              type="number"
              min={1}
              value={quantityToAdd}
              onChange={(e) => setQuantityToAdd(e.target.value)}
              placeholder="Quantity"
              className="w-full"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleAddStock}
              disabled={!selectedProductId || (parseInt(quantityToAdd) || 0) <= 0}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-neon-red to-neon-orange text-[#e6f1f5] font-medium text-sm hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Add Stock
            </button>
            <button
              onClick={() => onNavigate("inventory")}
              className="flex-1 py-2.5 rounded-xl bg-[#d14b4b]/8 border border-[#1f2a30] text-[#e6f1f5]/80 text-sm hover:bg-[#d14b4b]/10 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
