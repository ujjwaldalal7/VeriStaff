import {
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  Settings,
  UserCircle,
  Users,
  X,
  ScrollText,
  WalletCards
} from "lucide-react";
import { NavLink } from "react-router-dom";

import { useAppSelector } from "../../hooks/redux";
import Logo from "../ui/Logo";

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

interface NavigationItem {
  label: string;
  path: string;
  icon: typeof LayoutDashboard;
  roles: string[];
}

const navigationItems: NavigationItem[] = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
    roles: [
      "SUPER_ADMIN",
      "HR_ADMIN",
      "MANAGER"
    ]
  },
  {
    label: "Employees",
    path: "/employees",
    icon: Users,
    roles: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER"]
  },
  {
    label: "Documents",
    path: "/documents",
    icon: FileText,
    roles: [
      "SUPER_ADMIN",
      "HR_ADMIN",
      "MANAGER",
      "EMPLOYEE"
    ]
  },
  {
    label: "Payslips",
    path: "/payslips",
    icon: WalletCards,
    roles: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"]
  },
  {
    label: "Clearances",
    path: "/clearances",
    icon: ClipboardCheck,
    roles: ["SUPER_ADMIN", "HR_ADMIN"]
  },
  {
    label: "Users & Access",
    path: "/users",
    icon: Users,
    roles: ["SUPER_ADMIN"]
  },
  {
    label: "Audit Logs",
    path: "/audit-logs",
    icon: ScrollText,
    roles: ["SUPER_ADMIN", "HR_ADMIN"]
  },
  {
    label: "Settings",
    path: "/settings",
    icon: Settings,
    roles: ["SUPER_ADMIN", "HR_ADMIN"]
  },
  {
    label: "Profile",
    path: "/profile",
    icon: UserCircle,
    roles: [
      "SUPER_ADMIN",
      "HR_ADMIN",
      "MANAGER",
      "EMPLOYEE"
    ]
  }
];

export default function Sidebar({
  mobileOpen,
  onMobileClose
}: SidebarProps) {
  const user = useAppSelector(
    (state) => state.auth.user
  );
  const tenant = useAppSelector(
    (state) => state.tenant.current
  );

  const visibleItems = navigationItems.filter(
    (item) =>
      user?.role &&
      item.roles.includes(user.role) &&
      !(user.employeeStatus === "OFFBOARDED" &&
        !["/documents", "/payslips", "/profile"].includes(item.path))
  );

  return (
    <aside
      className={[
        "fixed inset-y-0 left-0 z-50 flex w-64 flex-col",
        "border-r border-slate-200 bg-white",
        "transition-transform duration-300",
        "dark:border-slate-800 dark:bg-slate-900",
        mobileOpen
          ? "translate-x-0"
          : "-translate-x-full lg:translate-x-0"
      ].join(" ")}
    >
      {/* Logo */}
      <div className="flex h-[73px] items-center justify-between border-b border-slate-200 px-5 dark:border-slate-800">
        <Logo
          variant="full"
          size="sm"
          linkTo="/dashboard"
          logoUrl={tenant?.logoUrl}
          name={tenant?.name || "VeriStaff"}
        />

        <button
          type="button"
          onClick={onMobileClose}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 lg:hidden"
          aria-label="Close navigation"
        >
          <X size={20} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Workspace
        </p>

        <div className="space-y-1">
          {visibleItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onMobileClose}
                className={({ isActive }) =>
                  [
                    "flex items-center gap-3 rounded-lg px-3 py-2.5",
                    "text-sm font-medium transition-colors",
                    isActive
                      ? "bg-slate-100 text-slate-950 dark:bg-slate-800 dark:text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                  ].join(" ")
                }
                style={({ isActive }) =>
                  isActive
                    ? {
                        borderLeft:
                          "3px solid var(--tenant-primary-color)"
                      }
                    : undefined
                }
              >
                <Icon size={19} strokeWidth={1.8} />

                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Bottom user section */}
      <div className="border-t border-slate-200 p-4 dark:border-slate-800">
        <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60">
          <p className="mb-2 truncate text-xs font-semibold uppercase tracking-wider text-slate-400">
            {tenant?.name || "Workspace"}
          </p>

          <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
            {user?.email}
          </p>

          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {user?.role}
          </p>
        </div>
      </div>
    </aside>
  );
}
