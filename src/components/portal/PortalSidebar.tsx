"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@heroui/react";

function DashboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}

function FileTextIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14,2 14,8 20,8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

function NairaSignIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 3L17 21" /><path d="M7 21L17 3" /><path d="M3 8h18" /><path d="M3 16h18" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  );
}

const navItems = [
  { label: "Dashboard", href: "/borrower/dashboard", icon: DashboardIcon },
  { label: "My Mortgages", href: "/borrower/mortgages", icon: FileTextIcon },
  { label: "My Payments", href: "/borrower/payments", icon: NairaSignIcon },
  { label: "Profile", href: "/borrower/profile", icon: UserIcon },
];

interface PortalSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  firstName?: string;
  lastName?: string;
}

export default function PortalSidebar({
  collapsed,
  onToggle,
  firstName = "Borrower",
  lastName = "",
}: PortalSidebarProps) {
  const pathname = usePathname();

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="h-screen bg-gradient-to-b from-emerald-900 to-emerald-800 text-white flex flex-col border-r border-emerald-700 overflow-hidden"
    >
      {/* Logo / Brand */}
      <div className="flex items-center h-16 px-4 border-b border-emerald-700">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-lg">M</span>
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="font-semibold text-lg whitespace-nowrap overflow-hidden"
              >
                Borrower Portal
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/borrower/dashboard" && pathname.startsWith(item.href + "/"));
          const Icon = item.icon;

          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer group",
                  isActive
                    ? "bg-emerald-600/30 text-emerald-300"
                    : "text-emerald-200/70 hover:bg-emerald-700/50 hover:text-white"
                )}
              >
                <Icon className={cn("w-5 h-5 flex-shrink-0", isActive ? "text-emerald-300" : "text-emerald-200/70 group-hover:text-white")} />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      className="text-sm font-medium whitespace-nowrap overflow-hidden"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {isActive && (
                  <motion.div
                    layoutId="portal-sidebar-indicator"
                    className="absolute left-0 w-1 h-8 bg-emerald-400 rounded-r-full"
                  />
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User Info */}
      <div className="border-t border-emerald-700 p-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-medium">
              {firstName.charAt(0).toUpperCase()}
            </span>
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="min-w-0"
              >
                <p className="text-sm font-medium text-white truncate">{firstName} {lastName}</p>
                <p className="text-xs text-emerald-300 truncate">Borrower</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Collapse Toggle */}
      <div className="p-2 border-t border-emerald-700">
        <Button
          onPress={onToggle}
          variant="ghost"
          className="w-full text-emerald-200/70 hover:text-white hover:bg-emerald-700/50"
          size="sm"
        >
          {collapsed ? "→" : "←"}
        </Button>
      </div>
    </motion.aside>
  );
}
