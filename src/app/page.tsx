"use client";

import { Product, Order, Page, User } from "./types";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import Inventory from "./components/Inventory";
import Sales from "./components/Sales";
import Report from "./components/Report";
import { useState, useEffect } from "react";

export default function Home() {
  const [page, setPage] = useState<Page>("dashboard");
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    async function bootstrap() {
      try {
        const response = await fetch("/api/bootstrap");
        const data = await response.json();
        setCurrentUser(data.user);
        setProducts(data.products || []);
        setOrders(data.orders || []);
      } finally {
        setLoaded(true);
      }
    }
    bootstrap();
  }, []);

  async function refreshData() {
    setDataLoading(true);
    const [productsResponse, ordersResponse] = await Promise.all([
      fetch("/api/products"),
      fetch("/api/orders"),
    ]);
    const productsData = await productsResponse.json();
    const ordersData = await ordersResponse.json();
    setProducts(productsData.products || []);
    setOrders(ordersData.orders || []);
    setDataLoading(false);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: loginUsername, password: loginPassword }),
    });
    const data = await response.json();
    if (response.ok && data.user) {
      setCurrentUser(data.user);
      setLoginError("");
      setLoginUsername("");
      setLoginPassword("");
      refreshData();
    } else {
      setLoginError(data.error || "Invalid username or password");
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setCurrentUser(null);
    setProducts([]);
    setOrders([]);
  }

  async function handleSetProducts(nextProducts: Product[]) {
    const previousProducts = products;
    setProducts(nextProducts);

    const deleted = previousProducts.find(product => !nextProducts.some(next => next.id === product.id));
    const created = nextProducts.find(product => !previousProducts.some(previous => previous.id === product.id));
    const updated = nextProducts.find(product => {
      const previous = previousProducts.find(p => p.id === product.id);
      return previous && JSON.stringify(previous) !== JSON.stringify(product);
    });

    if (deleted) {
      await fetch("/api/products", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: deleted.id }) });
    } else if (created) {
      await fetch("/api/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(created) });
    } else if (updated) {
      await fetch("/api/products", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updated) });
    }
    await refreshData();
  }

  async function handleSetOrders(nextOrders: Order[]) {
    const previousOrders = orders;
    setOrders(nextOrders);

    const deleted = previousOrders.find(order => !nextOrders.some(next => next.id === order.id));
    const created = nextOrders.find(order => !previousOrders.some(previous => previous.id === order.id));
    const updated = nextOrders.find(order => {
      const previous = previousOrders.find(o => o.id === order.id);
      return previous && previous.status !== order.status;
    });

    if (deleted) {
      await fetch("/api/orders", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: deleted.id }) });
    } else if (created) {
      const { id, ...orderPayload } = created;
      await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(orderPayload) });
    } else if (updated) {
      await fetch("/api/orders", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: updated.id, status: updated.status }) });
    }
    await refreshData();
  }

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0e1619' }}>
        <div className="text-center">
          <div className="text-4xl font-bold gradient-text mb-2">⚡ BIENVENUE SWEET HOME</div>
          <div className="text-sm text-white/40 animate-pulse-neon">Loading...</div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0e1619' }}>
        <div className="glass p-8 w-full max-w-md bg-[#0e1619]">
          <h1 className="text-3xl font-bold gradient-text mb-6 text-center">⚡ BIENVENUE SWEET HOME</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs text-white/40 mb-1 block">Email</label>
              <input
                type="email"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1 block">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors cursor-pointer"
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>
            {loginError && (
              <div className="text-neon-red text-sm text-center">{loginError}</div>
            )}
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-neon-purple to-neon-cyan text-white font-medium text-sm hover:opacity-90 transition-opacity cursor-pointer"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#0e1619' }}>
      <Sidebar currentPage={page} onNavigate={setPage} currentUser={currentUser} onLogout={handleLogout} />
      <main className="flex-1 ml-64 p-6 overflow-auto min-h-screen">
        {dataLoading && (
          <div className="fixed top-4 right-4 z-50 glass px-4 py-2 text-xs text-white/60">
            Loading data...
          </div>
        )}
        {page === "dashboard" && <Dashboard products={products} orders={orders} onNavigate={setPage} />}
        {page === "inventory" && <Inventory products={products} setProducts={handleSetProducts} currentUser={currentUser} />}
        {page === "sales" && <Sales orders={orders} setOrders={handleSetOrders} products={products} setProducts={handleSetProducts} currentUser={currentUser} />}
        {page === "report" && <Report orders={orders} products={products} currentUser={currentUser} />}
      </main>
    </div>
  );
}
