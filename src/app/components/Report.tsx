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
        .glass { background: white !important; border: none !important; color: black !important; box-shadow: none !important; }
        .neon-glow-purple, .neon-glow-green, .neon-glow-cyan, .neon-glow-pink { box-shadow: none !important; }
        .gradient-text { background: none !important; -webkit-text-fill-color: black !important; }
        body { background: white !important; }
        .text-white\\/40, .text-white\\/30, .text-white\\/20, .text-white\\/50, .text-white\\/60, .text-white\\/70, .text-white\\/80 { color: #333 !important; }
        .text-neon-purple, .text-neon-green, .text-neon-cyan, .text-neon-pink { color: #000 !important; }
        .bg-white\\/5 { background: #f5f5f5 !important; }
        .border-white\\/5, .border-white\\/10 { border-color: #ddd !important; }
        button { display: none !important; }
        .print-header { display: block !important; text-align: center; margin-bottom: 30px; }
        .print-header img { max-width: 150px; height: auto; filter: brightness(0); }
        .print-header h1 { font-size: 24px; font-weight: bold; margin: 10px 0; }
        .report-summary, .stock-note, .screen-only { display: none !important; }
        .report-table { width: 100% !important; border-collapse: collapse !important; font-size: 11px !important; }
        .report-table th, .report-table td { border: 1px solid #999 !important; padding: 7px !important; color: #000 !important; }
        .report-table th { background: #eaeaea !important; font-weight: bold !important; text-align: left !important; }
        .report-table td.number, .report-table th.number { text-align: right !important; }
        .report-table tfoot td { font-weight: bold !important; background: #f2f2f2 !important; }
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
      const buyingPrice = product?.buyingPrice || 0;
      const existing = acc[item.productId] || {
        productName: item.productName,
        quantity: 0,
        benefits: 0,
        revenue: 0,
        stockLeft: product?.quantity || 0,
      };
      existing.quantity += item.quantity;
      existing.revenue += item.total;
      existing.benefits += (item.price - buyingPrice) * item.quantity;
      existing.stockLeft = product?.quantity || 0;
      acc[item.productId] = existing;
    });
    return acc;
  }, {} as Record<string, { productName: string; quantity: number; benefits: number; revenue: number; stockLeft: number }>));
  const totalQuantity = reportRows.reduce((sum, row) => sum + row.quantity, 0);
  const totalBenefits = reportRows.reduce((sum, row) => sum + row.benefits, 0);
  const totalRevenue = reportRows.reduce((sum, row) => sum + row.revenue, 0);

  return (
    <div className="animate-fade-in-up space-y-6">
      <div className="print-header">
        <img src="/logo.png" alt="Logo" />
        <h1>BIENVENUE SWEET HOME</h1>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Report</h1>
          <p className="text-white/40 text-sm mt-1">Daily sales and stock reports</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm text-white/60">Date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm"
          />
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-neon-green to-neon-cyan text-white font-medium text-sm hover:opacity-90 transition-opacity cursor-pointer"
          >
            🖨️ Print PDF
          </button>
        </div>
      </div>

      <div className="glass p-6">
        <h2 className="text-lg font-semibold text-white/80 mb-4">Sales Report for {selectedDate}</h2>
        {reportRows.length === 0 ? (
          <div className="text-center py-12 text-white/30">No sales found for this date</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full report-table">
              <thead>
                <tr className="text-white/30 text-xs border-b border-white/5">
                  <th className="text-left py-3 px-4">Product Name</th>
                  <th className="text-right py-3 px-4 number">Quantity</th>
                  <th className="text-right py-3 px-4 number">Benefits</th>
                  <th className="text-right py-3 px-4 number">Revenue</th>
                  <th className="text-right py-3 px-4 number">Stock Left</th>
                </tr>
              </thead>
              <tbody>
                {reportRows.map((row) => (
                  <tr key={row.productName} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 text-white/70">{row.productName}</td>
                    <td className="py-3 px-4 text-right text-white/70 number">{row.quantity}</td>
                    <td className="py-3 px-4 text-right text-neon-purple font-medium number">Ar {row.benefits.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right text-neon-green font-medium number">Ar {row.revenue.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right text-white/70 number">{row.stockLeft}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="py-3 px-4 text-white/80">Total</td>
                  <td className="py-3 px-4 text-right text-white/80 number">{totalQuantity}</td>
                  <td className="py-3 px-4 text-right text-neon-purple number">Ar {totalBenefits.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right text-neon-green number">Ar {totalRevenue.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right text-white/80 number">-</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      <div className="glass p-6 stock-note">
        <h2 className="text-lg font-semibold text-white/80 mb-4">Stock Arrivals</h2>
        <div className="text-white/50 text-sm">
          <p>Stock Left uses the current inventory quantity, including old stock and any newly added stock.</p>
        </div>
      </div>
    </div>
  );
}
