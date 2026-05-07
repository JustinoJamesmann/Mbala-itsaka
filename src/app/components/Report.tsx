"use client";

import { Order, Product, User } from "../types";
import { useState } from "react";

export default function Report({ orders, products, currentUser }: { orders: Order[]; products: Product[]; currentUser: User }) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);

  function handlePrint() {
    window.print();
  }

  // Add print styles dynamically
  if (typeof window !== "undefined") {
    const style = document.createElement("style");
    style.innerHTML = `
      @media print {
        aside, .no-print { display: none !important; }
        main { margin-left: 0 !important; padding: 20px !important; }
        .glass { background: #0d1518 !important; border: none !important; color: #e6f1f5 !important; box-shadow: none !important; }
        .neon-glow-purple, .neon-glow-green, .neon-glow-cyan, .neon-glow-pink { box-shadow: none !important; }
        .gradient-text { background: none !important; -webkit-text-fill-color: #e6f1f5 !important; }
        body { background: #0d1518 !important; }
        .text-[#e6f1f5]\\/40, .text-[#e6f1f5]\\/30, .text-[#e6f1f5]\\/20, .text-[#e6f1f5]\\/50, .text-[#e6f1f5]\\/60, .text-[#e6f1f5]\\/70, .text-[#e6f1f5]\\/80 { color: #e6f1f5 !important; }
        .text-neon-purple, .text-neon-green, .text-neon-cyan, .text-neon-pink { color: #e6f1f5 !important; }
        .bg-\\[\\#7F2020\\]\\/5 { background: #162126 !important; }
        .border-\\[\\#C9CAAC\\]\\/40, .border-\\[\\#C9CAAC\\]\\/60 { border-color: #1f2a30 !important; }
        button { display: none !important; }
        .print-header { display: block !important; text-align: center; margin-bottom: 30px; }
        .print-header img { max-width: 150px; height: auto; filter: brightness(1); }
        .print-header h1 { font-size: 24px; font-weight: bold; margin: 10px 0; color: #e6f1f5 !important; }
        .report-summary, .stock-note, .screen-only { display: none !important; }
        .report-table { width: 100% !important; border-collapse: collapse !important; font-size: 11px !important; }
        .report-table th, .report-table td { border: 1px solid #1f2a30 !important; padding: 7px !important; color: #e6f1f5 !important; }
        .report-table th { background: #162126 !important; font-weight: bold !important; text-align: left !important; }
        .report-table td.number, .report-table th.number { text-align: right !important; }
        .report-table tfoot td { font-weight: bold !important; background: #1f2a30 !important; }
      }
      @media screen {
        .print-header { display: none !important; }
      }
    `;
    if (!document.head.querySelector('style[data-print-styles]')) {
      style.setAttribute('data-print-styles', 'true');
      document.head.appendChild(style);
    }
  }

  const filteredOrders = orders.filter(order => order.date === selectedDate && order.status !== "cancelled");
  const reportRows = Object.values(filteredOrders.reduce((acc, order) => {
    order.items.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      const existing = acc[item.productId] || {
        productName: item.productName,
        quantity: 0,
        revenue: 0,
        stockLeft: product?.quantity || 0,
      };
      existing.quantity += item.quantity;
      existing.revenue += item.total;
      existing.stockLeft = product?.quantity || 0;
      acc[item.productId] = existing;
    });
    return acc;
  }, {} as Record<string, { productName: string; quantity: number; revenue: number; stockLeft: number }>));
  const totalQuantity = reportRows.reduce((sum, row) => sum + row.quantity, 0);
  const totalRevenue = reportRows.reduce((sum, row) => sum + row.revenue, 0);

  return (
    <div className="animate-fade-in-up space-y-6">
      <div className="print-header">
        <img src="/logo.png" alt="Logo" />
        <h1>Mbala&amp;Itsaka</h1>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Report</h1>
          <p className="text-[#8fa3ad]/95 text-sm mt-1">Daily sales and stock reports</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm text-[#e6f1f5]/80">Date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 rounded-xl bg-[#d14b4b]/8 border border-[#1f2a30] text-[#e6f1f5] text-sm"
          />
          <button
            onClick={handlePrint}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-neon-pink to-neon-purple text-[#e6f1f5] font-medium text-sm hover:opacity-90 transition-opacity cursor-pointer neon-glow-pink"
          >
            🖨️ Print PDF
          </button>
        </div>
      </div>

      <div className="glass p-6">
        <h2 className="text-lg font-semibold text-[#e6f1f5]/90 mb-4">Sales Report for {selectedDate}</h2>
        {reportRows.length === 0 ? (
          <div className="text-center py-12 text-[#8fa3ad]/80">No sales found for this date</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full report-table">
              <thead>
                <tr className="text-[#8fa3ad]/80 text-xs border-b border-[#1f2a30]">
                  <th className="text-left py-3 px-4">Product Name</th>
                  <th className="text-right py-3 px-4 number">Quantity</th>
                  <th className="text-right py-3 px-4 number">Revenue</th>
                  <th className="text-right py-3 px-4 number">Stock Left</th>
                </tr>
              </thead>
              <tbody>
                {reportRows.map((row) => (
                  <tr key={row.productName} className="border-b border-[#1f2a30] hover:bg-[#d14b4b]/8 transition-colors">
                    <td className="py-3 px-4 text-[#e6f1f5]/85">{row.productName}</td>
                    <td className="py-3 px-4 text-right text-[#e6f1f5]/85 number">{row.quantity}</td>
                    <td className="py-3 px-4 text-right text-neon-green font-medium number">Ar {row.revenue.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right text-[#e6f1f5]/85 number">{row.stockLeft}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="py-3 px-4 text-[#e6f1f5]/90">Total</td>
                  <td className="py-3 px-4 text-right text-[#e6f1f5]/90 number">{totalQuantity}</td>
                  <td className="py-3 px-4 text-right text-neon-green number">Ar {totalRevenue.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right text-[#e6f1f5]/90 number">-</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      <div className="glass p-6 stock-note">
        <h2 className="text-lg font-semibold text-[#e6f1f5]/90 mb-4">Stock Arrivals</h2>
        <div className="text-[#8fa3ad] text-sm">
          <p>Stock Left uses the current inventory quantity, including old stock and any newly added stock.</p>
        </div>
      </div>
    </div>
  );
}
