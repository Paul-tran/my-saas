"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";

const TABS = [
  { href: "/dashboard/settings/geography", label: "Geography", icon: "location_on" },
  { href: "/dashboard/settings/systems", label: "Systems", icon: "account_tree" },
  { href: "/dashboard/settings/work-order-types", label: "Work Order Types", icon: "build" },
];

const ADMIN_TABS = [
  { href: "/dashboard/settings/users", label: "Users", icon: "group" },
  { href: "/dashboard/settings/roles", label: "Roles & Permissions", icon: "admin_panel_settings" },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();

  const allTabs = user?.is_admin ? [...TABS, ...ADMIN_TABS] : TABS;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Settings header */}
      <div
        style={{
          background: "#ffffff",
          borderBottom: "1px solid rgba(215,195,174,0.2)",
          padding: "0 32px",
          flexShrink: 0,
        }}
      >
        <div style={{ paddingTop: "24px", paddingBottom: "0", marginBottom: "0" }}>
          <p
            style={{
              margin: "0 0 4px",
              fontSize: "10px",
              fontWeight: 700,
              color: "#835500",
              textTransform: "uppercase",
              letterSpacing: "0.3em",
            }}
          >
            Configuration
          </p>
          <h1
            style={{
              fontFamily: "var(--font-manrope, Manrope, sans-serif)",
              fontSize: "1.75rem",
              fontWeight: 800,
              color: "#191c1d",
              margin: "0 0 20px",
              letterSpacing: "-0.03em",
            }}
          >
            Settings
          </h1>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "4px" }}>
          {allTabs.map((tab) => {
            const active = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "10px 16px",
                  fontSize: "13px",
                  fontWeight: active ? 600 : 400,
                  fontFamily: "var(--font-manrope, Manrope, sans-serif)",
                  color: active ? "#835500" : "#524534",
                  textDecoration: "none",
                  borderBottom: active ? "2px solid #835500" : "2px solid transparent",
                  marginBottom: "-1px",
                  transition: "color 0.15s, border-color 0.15s",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.color = "#191c1d";
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.color = "#524534";
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "16px" }}
                >
                  {tab.icon}
                </span>
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Page content */}
      <div style={{ flex: 1, overflow: "auto" }}>
        {children}
      </div>
    </div>
  );
}
