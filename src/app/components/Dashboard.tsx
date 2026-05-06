"use client";

import { Product, Order, Page } from "../types";
import { useState, useEffect } from "react";
import { Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
);

function formatAriary(value: number) {
  if (Math.abs(value) >= 1000000) {
    return `Ar ${(value / 1000000).toFixed(2)}M`;
  }
  return `Ar ${Math.round(value).toLocaleString("en-US")}`;
}

export default function Dashboard({ products, orders, onNavigate }: { products: Product[]; orders: Order[]; onNavigate: (p: Page) => void }) {
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [timePeriod, setTimePeriod] = useState<"daily" | "weekly" | "monthly" | "yearly">("daily");
  const totalRevenue = orders.filter(o => o.status !== "cancelled").reduce((sum, o) => sum + (o.total - (o.deliveryCost || 0)), 0);
  const totalOrders = orders.length;
  const totalValue = products.reduce((sum, p) => sum + p.price * p.quantity, 0);
  const totalBenefits = products.reduce((sum, p) => sum + (p.price - (p.buyingPrice || 0)) * p.quantity, 0);

  const statusCounts = {
    pending: orders.filter(o => o.status === "pending").length,
    confirmed: orders.filter(o => o.status === "confirmed").length,
    shipped: orders.filter(o => o.status === "shipped").length,
    delivered: orders.filter(o => o.status === "delivered").length,
    cancelled: orders.filter(o => o.status === "cancelled").length,
  };

  const categoryRevenue: Record<string, number> = {};
  orders.filter(o => o.status !== "cancelled").forEach(o => {
    o.items.forEach(item => {
      const prod = products.find(p => p.id === item.productId);
      const cat = prod?.category || "Other";
      categoryRevenue[cat] = (categoryRevenue[cat] || 0) + item.total;
    });
  });

  // Sales trend data based on time period
  const salesTrendData = (() => {
    const labels: string[] = [];
    const data: number[] = [];
    const today = new Date();

    if (timePeriod === "daily") {
      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        labels.push(date.toLocaleDateString("en-US", { month: "short", day: "numeric" }));
        const dayRevenue = orders
          .filter(o => o.status !== "cancelled" && new Date(o.date).toDateString() === date.toDateString())
          .reduce((sum, o) => sum + (o.total - (o.deliveryCost || 0)), 0);
        data.push(dayRevenue);
      }
    } else if (timePeriod === "weekly") {
      // Last 4 weeks
      for (let i = 3; i >= 0; i--) {
        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - (i * 7) - weekStart.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        labels.push(`Week ${4 - i}`);
        const weekRevenue = orders
          .filter(o => {
            const orderDate = new Date(o.date);
            return o.status !== "cancelled" && orderDate >= weekStart && orderDate <= weekEnd;
          })
          .reduce((sum, o) => sum + (o.total - (o.deliveryCost || 0)), 0);
        data.push(weekRevenue);
      }
    } else if (timePeriod === "monthly") {
      // Last 6 months
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
        labels.push(monthDate.toLocaleDateString("en-US", { month: "short" }));
        const monthRevenue = orders
          .filter(o => {
            const orderDate = new Date(o.date);
            return o.status !== "cancelled" && orderDate.getMonth() === monthDate.getMonth() && orderDate.getFullYear() === monthDate.getFullYear();
          })
          .reduce((sum, o) => sum + (o.total - (o.deliveryCost || 0)), 0);
        data.push(monthRevenue);
      }
    } else if (timePeriod === "yearly") {
      // Last 5 years
      for (let i = 4; i >= 0; i--) {
        const year = today.getFullYear() - i;
        labels.push(year.toString());
        const yearRevenue = orders
          .filter(o => {
            const orderDate = new Date(o.date);
            return o.status !== "cancelled" && orderDate.getFullYear() === year;
          })
          .reduce((sum, o) => sum + (o.total - (o.deliveryCost || 0)), 0);
        data.push(yearRevenue);
      }
    }

    return { labels, data };
  })();

  // Stock status data
  const stockInStock = products.filter(p => p.quantity > 5).length;
  const stockLowStock = products.filter(p => p.quantity > 0 && p.quantity <= 5).length;
  const stockOutOfStock = products.filter(p => p.quantity === 0).length;
  const stockTotalItems = products.length;
  const inStockPercent = stockTotalItems > 0 ? ((stockInStock / stockTotalItems) * 100).toFixed(1) : 0;
  const lowStockPercent = stockTotalItems > 0 ? ((stockLowStock / stockTotalItems) * 100).toFixed(1) : 0;
  const outOfStockPercent = stockTotalItems > 0 ? ((stockOutOfStock / stockTotalItems) * 100).toFixed(1) : 0;

  const kpis = [
    { label: "Wealth", value: formatAriary(totalValue), color: "", accent: "text-neon-orange" },
    { label: "Benefits", value: formatAriary(totalBenefits), color: "", accent: "text-neon-purple" },
    { label: "Revenue", value: formatAriary(totalRevenue), color: "", accent: "text-neon-green" },
    { label: "Order", value: totalOrders.toString(), color: "", accent: "text-neon-cyan" },
    { label: "Total Items", value: stockTotalItems.toString(), color: "", accent: "text-neon-cyan" },
  ];

  const recentOrders = [...orders].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  const topProducts = [...products].sort((a, b) => (b.price * b.quantity) - (a.price * a.quantity)).slice(0, 5);

  const stockChartData = {
    labels: ["In Stock", "Low Stock", "Out of Stock"],
    datasets: [
      {
        data: [stockInStock, stockLowStock, stockOutOfStock],
        backgroundColor: ["#4CAF50", "#FFC107", "#F44336"],
        borderWidth: 0,
        cutout: "70%",
      },
    ],
  };

  const stockChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(18, 18, 18, 0.95)",
        titleColor: "#E0E0E0",
        bodyColor: "#E0E0E0",
        borderColor: "rgba(255, 255, 255, 0.1)",
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        callbacks: {
          label: (context: any) => {
            const label = context.label || "";
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  const chartData = {
    labels: salesTrendData.labels,
    datasets: [
      {
        label: "Sales Trend",
        data: salesTrendData.data,
        borderColor: "#7ebb57",
        backgroundColor: (context: any) => {
          const { chart } = context;
          const { ctx, chartArea } = chart;
          if (!chartArea) return "rgba(126, 187, 87, 0.18)";
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, "rgba(126, 187, 87, 0.42)");
          gradient.addColorStop(0.55, "rgba(126, 187, 87, 0.14)");
          gradient.addColorStop(1, "rgba(107, 165, 87, 0)");
          return gradient;
        },
        borderWidth: 3,
        tension: 0.45,
        borderCapStyle: "round" as const,
        borderJoinStyle: "round" as const,
        fill: true,
        pointBackgroundColor: "#7ebb57",
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2,
        pointHoverBackgroundColor: "#7ebb57",
        pointHoverBorderColor: "#ffffff",
        pointHoverBorderWidth: 3,
        pointRadius: 0,
        pointHitRadius: 18,
        pointHoverRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(26, 29, 31, 0.96)",
        titleColor: "#ffffff",
        bodyColor: "#7ebb57",
        borderColor: "rgba(126, 187, 87, 0.35)",
        borderWidth: 1,
        padding: 16,
        displayColors: false,
        cornerRadius: 12,
        caretPadding: 10,
        titleFont: {
          size: 13,
          weight: "bold" as const,
        },
        bodyFont: {
          size: 14,
          weight: "bold" as const,
        },
        callbacks: {
          label: (context: any) => {
            const value = context.raw;
            if (value >= 1000000) {
              return `${(value / 1000000).toFixed(2)}M`;
            } else if (value >= 1000) {
              return `${(value / 1000).toFixed(0)}k`;
            }
            return `${value}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          color: "rgba(224, 224, 224, 0.45)",
          padding: 10,
          font: {
            size: 12,
            weight: "normal" as const,
          },
        },
      },
      y: {
        grid: {
          color: "rgba(255, 255, 255, 0.05)",
          drawBorder: false,
        },
        ticks: {
          color: "rgba(224, 224, 224, 0.45)",
          padding: 10,
          font: {
            size: 12,
            weight: "normal" as const,
          },
          callback: (value: any) => {
            if (value >= 1000000) {
              return `${(value / 1000000).toFixed(1)}M`;
            } else if (value >= 1000) {
              return `${(value / 1000).toFixed(0)}k`;
            }
            return `${value}`;
          },
        },
        beginAtZero: true,
      },
    },
    interaction: {
      intersect: false,
      mode: "index" as const,
    },
  };

  return (
    <div className="animate-fade-in-up space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">welcome back</h1>
          <div>
          <p className="mt-1"><span className="text-2xl font-bold" style={{ color: '#6ba557' }}>Bienvenue sweet home</span></p>
          <p className="text-white/40 text-xs mt-1">here&apos;s what&apos;s happening with your business today .</p>
          </div>
        </div>
        <button
            onClick={() => setShowCalendar(true)}
            className="text-xs text-white/20 hover:text-neon-purple transition-colors cursor-pointer"
          >
            {selectedDate.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className={`glass p-5 min-w-0 ${kpi.color} transition-all duration-300 hover:scale-105`}>
            <div className="text-sm font-medium text-white/60 mb-1">{kpi.label}</div>
            <div className={`text-2xl font-bold ${kpi.accent} whitespace-nowrap`}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Sales Trend Chart */}
      <div className="glass p-6" style={{ background: "#1a1d1f" }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white/80">Sales Trend</h2>
          <div className="flex gap-2">
            {(["daily", "weekly", "monthly", "yearly"] as const).map((period) => (
              <button
                key={period}
                onClick={() => setTimePeriod(period)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  timePeriod === period
                    ? "bg-[#6ba557] text-white"
                    : "bg-white/5 text-white/60 hover:bg-white/10"
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="h-72">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock Status */}
        <div className="glass p-6" style={{ background: '#121212' }}>
          <h2 className="text-lg font-bold text-[#E0E0E0] mb-6">Stock Status</h2>
          <div className="flex items-center gap-8">
            <div className="relative w-48 h-48">
              <Doughnut data={stockChartData} options={stockChartOptions} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-4xl font-bold text-[#E0E0E0]">{stockTotalItems}</div>
                <div className="text-sm text-[#E0E0E0]/70">Total Items</div>
              </div>
            </div>
            <div className="flex-1 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-3 h-3 rounded-full bg-[#4CAF50] mt-1.5"></div>
                <div>
                  <div className="text-sm font-medium text-[#E0E0E0]">In Stock</div>
                  <div className="text-xs text-[#E0E0E0]/70">{stockInStock} ({inStockPercent}%)</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-3 h-3 rounded-full bg-[#FFC107] mt-1.5"></div>
                <div>
                  <div className="text-sm font-medium text-[#E0E0E0]">Low Stock</div>
                  <div className="text-xs text-[#E0E0E0]/70">{stockLowStock} ({lowStockPercent}%)</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-3 h-3 rounded-full bg-[#F44336] mt-1.5"></div>
                <div>
                  <div className="text-sm font-medium text-[#E0E0E0]">Out of Stock</div>
                  <div className="text-xs text-[#E0E0E0]/70">{stockOutOfStock} ({outOfStockPercent}%)</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="glass p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white/80">Top Selling Products</h2>
            <button onClick={() => onNavigate("inventory")} className="text-xs text-[#6ba557] hover:text-white transition-colors cursor-pointer">View All →</button>
          </div>
          <div className="space-y-3">
            {(() => {
              const productSales: Record<string, number> = {};
              orders.filter(o => o.status !== "cancelled").forEach(o => {
                o.items.forEach(item => {
                  productSales[item.productId] = (productSales[item.productId] || 0) + item.quantity;
                });
              });
              const sortedProducts = Object.entries(productSales)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5);
              const maxSales = Math.max(...Object.values(productSales), 1);
              
              return sortedProducts.map(([productId, quantity]) => {
                const product = products.find(p => p.id === productId);
                if (!product) return null;
                return (
                  <div key={productId} className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="text-sm text-white/70 font-medium">{product.name}</div>
                      <div className="text-xs text-white/30">{product.category}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-[#6ba557]">{quantity} sold</div>
                    </div>
                  </div>
                );
              });
            })()}
            {orders.filter(o => o.status !== "cancelled").length === 0 && (
              <div className="text-center text-white/30 py-8">No sales data yet</div>
            )}
          </div>
        </div>

        {/* Order Status Breakdown */}
        <div className="glass p-6">
          <h2 className="text-lg font-semibold text-white/80 mb-4">Order Status</h2>
          <div className="space-y-3">
            {Object.entries(statusCounts).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className={`badge-${status} px-3 py-1 rounded-full text-xs capitalize`}>{status}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${totalOrders > 0 ? (count / totalOrders) * 100 : 0}%`,
                        background: status === "pending" ? "#f97316" : status === "confirmed" ? "#06b6d4" : status === "shipped" ? "#a855f7" : status === "delivered" ? "#22c55e" : "#ef4444",
                      }}
                    />
                  </div>
                  <span className="text-sm text-white/60 w-6 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Inventory Value */}
        <div className="glass p-6">
          <h2 className="text-lg font-semibold text-white/80 mb-4">Top Products by Value</h2>
          <div className="space-y-3">
            {topProducts.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3">
                <span className="text-xs text-white/30 w-4">{i + 1}</span>
                <div className="flex-1">
                  <div className="text-sm text-white/70">{p.name}</div>
                  <div className="text-xs text-white/30">{p.quantity} units × Ar {p.price}</div>
                </div>
                <span className="text-sm text-neon-green font-medium">Ar {(p.price * p.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-white/5 flex justify-between">
            <span className="text-sm text-white/40">Total Inventory Value</span>
            <span className="text-lg font-bold text-neon-green">Ar {totalValue.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="glass p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white/80">Recent Orders</h2>
          <button onClick={() => onNavigate("sales")} className="text-xs text-neon-purple hover:text-neon-cyan transition-colors cursor-pointer">View All →</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-white/30 text-xs border-b border-white/5">
                <th className="text-left py-2 px-3">Order ID</th>
                <th className="text-left py-2 px-3">Customer</th>
                <th className="text-left py-2 px-3">Items</th>
                <th className="text-left py-2 px-3">Total</th>
                <th className="text-left py-2 px-3">Status</th>
                <th className="text-left py-2 px-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-3 px-3 text-neon-cyan font-mono text-xs">{order.id}</td>
                  <td className="py-3 px-3 text-white/70">{order.customer}</td>
                  <td className="py-3 px-3 text-white/50">{order.items.length} items</td>
                  <td className="py-3 px-3 text-neon-green font-medium">Ar {order.total.toFixed(2)}</td>
                  <td className="py-3 px-3"><span className={`badge-${order.status} px-2 py-0.5 rounded-full text-xs capitalize`}>{order.status}</span></td>
                  <td className="py-3 px-3 text-white/40 text-xs">{order.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Low Stock Alert */}
      {stockLowStock > 0 && (
        <div className="glass p-6">
          <h2 className="text-lg font-semibold text-neon-orange mb-3">⚠️ Low Stock Alert</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {products.filter(p => p.quantity > 0 && p.quantity <= 5).map(p => (
              <div key={p.id} className="flex items-center justify-between bg-white/5 rounded-xl p-3">
                <div>
                  <div className="text-sm text-white/70">{p.name}</div>
                  <div className="text-xs text-white/30">{p.sku}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-neon-orange">{p.quantity}</div>
                  <div className="text-xs text-white/30">min: 5</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Calendar Modal */}
      {showCalendar && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50" onClick={() => setShowCalendar(false)}>
          <div className="glass p-6 w-full max-w-md bg-[#0e1619]" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold gradient-text mb-4">Select Date</h2>
            <Calendar
              selectedDate={selectedDate}
              onSelect={(date) => { setSelectedDate(date); setShowCalendar(false); }}
            />
            <button onClick={() => setShowCalendar(false)} className="w-full mt-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm hover:bg-white/10 transition-colors cursor-pointer">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Calendar({ selectedDate, onSelect }: { selectedDate: Date; onSelect: (date: Date) => void }) {
  const [currentMonth, setCurrentMonth] = useState(selectedDate.getMonth());
  const [currentYear, setCurrentYear] = useState(selectedDate.getFullYear());

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const selectDate = (day: number) => {
    onSelect(new Date(currentYear, currentMonth, day));
  };

  const isSelected = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    return date.toDateString() === selectedDate.toDateString();
  };

  const isToday = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    return date.toDateString() === new Date().toDateString();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} className="text-white/40 hover:text-white transition-colors cursor-pointer text-lg">◀</button>
        <div className="text-lg font-semibold text-white/80">{monthNames[currentMonth]} {currentYear}</div>
        <button onClick={nextMonth} className="text-white/40 hover:text-white transition-colors cursor-pointer text-lg">▶</button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {dayNames.map(day => (
          <div key={day} className="text-xs text-white/30 py-2">{day}</div>
        ))}
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} className="py-2"></div>
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          return (
            <button
              key={day}
              onClick={() => selectDate(day)}
              className={`py-2 rounded-lg text-sm cursor-pointer transition-colors ${
                isSelected(day)
                  ? "bg-gradient-to-r from-neon-purple to-neon-cyan text-white font-bold"
                  : isToday(day)
                  ? "bg-white/10 text-neon-cyan"
                  : "text-white/60 hover:bg-white/5"
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
