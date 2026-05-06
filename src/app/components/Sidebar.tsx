"use client";

import { Page, User } from "../types";

const navItems: { id: Page; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "inventory", label: "Inventory" },
  { id: "sales", label: "Sales" },
  { id: "report", label: "Report" },
];

export default function Sidebar({ currentPage, onNavigate, currentUser, onLogout }: { currentPage: Page; onNavigate: (p: Page) => void; currentUser: User; onLogout: () => void }) {
  return (
    <aside className="fixed left-0 top-0 h-full w-64 flex flex-col z-50" style={{ background: 'rgba(14, 22, 24, 0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderRight: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', margin: '16px 0 16px 16px', height: 'calc(100% - 32px)' }}>
      <div className="px-6 border-b border-white/5 flex items-center justify-center">
        <img src="/logo.png" alt="Logo" className="h-48 w-auto object-contain" />
      </div>

      <nav className="flex-1 py-4">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full flex items-center gap-3 px-6 py-3 text-sm transition-all duration-200 cursor-pointer ${
              currentPage === item.id
                ? "sidebar-active text-white font-bold bg-white/10"
                : "text-white hover:bg-white/10"
            }`}
          >
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-6 border-t border-white/5 space-y-3">
        <div className="glass p-4">
          <div className="text-xs text-white/70 mb-1">Logged in as</div>
          <div className="text-sm text-white font-medium truncate normal-case" title={currentUser.username}>{currentUser.username}</div>
          <div className="text-xs text-white/80 capitalize">{currentUser.role}</div>
        </div>
        <button
          onClick={onLogout}
          className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm hover:bg-white/10 transition-colors cursor-pointer"
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}
