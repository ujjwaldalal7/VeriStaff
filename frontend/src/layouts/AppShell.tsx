import { useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";

import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />

      {/* Main area */}
      <div className="lg:pl-64">
        <Navbar />

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setSidebarOpen((value) => !value)}
          className="fixed bottom-5 left-5 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 lg:hidden"
          aria-label={
            sidebarOpen
              ? "Close navigation"
              : "Open navigation"
          }
        >
          {sidebarOpen ? (
            <X size={22} />
          ) : (
            <Menu size={22} />
          )}
        </button>

        <main className="min-h-[calc(100vh-73px)]">
          {children}
        </main>
      </div>
    </div>
  );
}