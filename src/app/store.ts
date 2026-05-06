import { Product, Order, User } from "./types";

const PRODUCTS_KEY = "genz2026_products";
const ORDERS_KEY = "genz2026_orders";
const CATEGORIES_KEY = "genz2026_categories";
const USERS_KEY = "genz2026_users";
const SESSION_KEY = "genz2026_session";

export const defaultUsers: User[] = [
  { id: "1", username: "BienvenueSweetHome", role: "admin" },
  { id: "2", username: "BSHWorker", role: "worker" },
];

export const defaultCategories = ["Electronics", "Accessories", "Clothing", "Food", "Other"];

export const defaultProducts: Product[] = [
  { id: "1", name: "Wireless Earbuds Pro", sku: "WEP-001", category: "Electronics", buyingPrice: 55.99, price: 79.99, quantity: 150 },
  { id: "2", name: "Smart Watch Ultra", sku: "SWU-002", category: "Electronics", buyingPrice: 219.99, price: 299.99, quantity: 45 },
  { id: "3", name: "Mechanical Keyboard", sku: "MKB-003", category: "Electronics", buyingPrice: 99.99, price: 149.99, quantity: 80 },
  { id: "4", name: "USB-C Hub 7-in-1", sku: "UCH-004", category: "Accessories", buyingPrice: 29.99, price: 49.99, quantity: 200 },
  { id: "5", name: "Laptop Stand Aluminum", sku: "LSA-005", category: "Accessories", buyingPrice: 24.99, price: 39.99, quantity: 120 },
  { id: "6", name: "Webcam 4K HDR", sku: "W4K-006", category: "Electronics", buyingPrice: 79.99, price: 119.99, quantity: 8 },
  { id: "7", name: "Desk Mat XXL", sku: "DMX-007", category: "Accessories", buyingPrice: 16.99, price: 29.99, quantity: 300 },
  { id: "8", name: "Portable Charger 20K", sku: "PC2-008", category: "Electronics", buyingPrice: 39.99, price: 59.99, quantity: 5 },
  { id: "9", name: "Bluetooth Speaker Mini", sku: "BSM-009", category: "Electronics", buyingPrice: 22.99, price: 34.99, quantity: 90 },
  { id: "10", name: "Cable Organizer Kit", sku: "COK-010", category: "Accessories", buyingPrice: 9.99, price: 19.99, quantity: 400 },
];

export const defaultOrders: Order[] = [];

export function loadProducts(): Product[] {
  if (typeof window === "undefined") return defaultProducts;
  const stored = localStorage.getItem(PRODUCTS_KEY);
  if (!stored) {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(defaultProducts));
    return defaultProducts;
  }
  return JSON.parse(stored);
}

export function saveProducts(products: Product[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
}

export function loadOrders(): Order[] {
  if (typeof window === "undefined") return defaultOrders;
  const stored = localStorage.getItem(ORDERS_KEY);
  if (!stored) {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(defaultOrders));
    return defaultOrders;
  }
  return JSON.parse(stored);
}

export function saveOrders(orders: Order[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

export function loadCategories(): string[] {
  if (typeof window === "undefined") return defaultCategories;
  const stored = localStorage.getItem(CATEGORIES_KEY);
  if (!stored) {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(defaultCategories));
    return defaultCategories;
  }
  return JSON.parse(stored);
}

export function saveCategories(categories: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
}

export function loadUsers(): User[] {
  if (typeof window === "undefined") return defaultUsers;
  const stored = localStorage.getItem(USERS_KEY);
  if (!stored) {
    localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
    return defaultUsers;
  }
  const users = JSON.parse(stored);
  // Migrate old users to new credentials
  const migrated = users.map((u: User) => {
    if (u.username === "admin") return { ...u, username: "BienvenueSweetHome" };
    if (u.username === "worker") return { ...u, username: "BSHWorker" };
    if (u.username === "BHS!") return { ...u, username: "BSHWorker" };
    return u;
  });
  if (JSON.stringify(migrated) !== JSON.stringify(users)) {
    localStorage.setItem(USERS_KEY, JSON.stringify(migrated));
  }
  return migrated;
}

export function login(username: string, password: string): User | null {
  const users = loadUsers();
  const user = users.find(u => u.username === username);
  // Simple password check - in production use proper hashing
  if (user && ((username === "BienvenueSweetHome" && password === "Bi!En123") || (username === "BSHWorker" && password === "Worker!@BSH"))) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return user;
  }
  return null;
}

export function logout(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(SESSION_KEY);
  if (!stored) return null;
  return JSON.parse(stored);
}
