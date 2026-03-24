"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { useState } from "react";

const MAIN_NAV = [
  { href: "/dashboard", label: "Overview", icon: "dashboard", exact: true },
  { href: "/dashboard/documents", label: "Document Control", icon: "folder_open" },
  { href: "/dashboard/assets", label: "Assets", icon: "construction" },
  { href: "/dashboard/work-orders", label: "Work Orders", icon: "assignment" },
  { href: "/dashboard/commissioning", label: "Commissioning", icon: "verified" },
  { href: "/dashboard/preventive-maintenance", label: "Preventive Maintenance", icon: "event_repeat" },
];

const BOTTOM_NAV = [
  { href: "/dashboard/settings/geography", label: "Settings", icon: "settings" },
];

function isActive(href: string, pathname: string, exact?: boolean) {
  if (exact) return pathname === href;
  // Settings group
  if (href === "/dashboard/settings/geography") return pathname.startsWith("/dashboard/settings");
  return pathname.startsWith(href);
}

interface NavItemProps {
  href: string;
  label: string;
  icon: string;
  active: boolean;
  collapsed: boolean;
  onClick?: () => void;
}

function NavItem({ href, label, icon, active, collapsed, onClick }: NavItemProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      title={collapsed ? label : undefined}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "10px 18px",
        borderRadius: "10px",
        textDecoration: "none",
        background: active ? "rgba(131,85,0,0.1)" : "transparent",
        color: active ? "#835500" : "#524534",
        fontWeight: active ? 600 : 400,
        fontSize: "13px",
        fontFamily: "var(--font-manrope, Manrope, sans-serif)",
        whiteSpace: "nowrap",
        overflow: "hidden",
        transition: "background 0.15s, color 0.15s",
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = "#f3f4f5";
          e.currentTarget.style.color = "#191c1d";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "#524534";
        }
      }}
    >
      <span
        className="material-symbols-outlined"
        style={{ fontSize: "20px", flexShrink: 0, color: active ? "#835500" : "currentColor" }}
      >
        {icon}
      </span>
      <span style={{ opacity: collapsed ? 0 : 1, transition: "opacity 0.15s" }}>
        {label}
      </span>
      {active && (
        <span
          style={{
            position: "absolute",
            left: 0,
            top: "50%",
            transform: "translateY(-50%)",
            width: "3px",
            height: "20px",
            borderRadius: "0 2px 2px 0",
            background: "#835500",
          }}
        />
      )}
    </Link>
  );
}

function SidebarContent({
  collapsed,
  onLinkClick,
}: {
  collapsed: boolean;
  onLinkClick?: () => void;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();

  const initials =
    `${user?.first_name?.[0] ?? ""}${user?.last_name?.[0] ?? ""}`.toUpperCase() ||
    user?.email?.[0]?.toUpperCase() ||
    "U";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        padding: "16px 8px",
        position: "relative",
      }}
    >
      {/* Logo mark */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "8px 10px",
          marginBottom: "24px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            background: "linear-gradient(135deg,#835500,#f5a623)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: "18px", color: "#fff" }}
          >
            construction
          </span>
        </div>
        <span
          style={{
            fontFamily: "var(--font-manrope, Manrope, sans-serif)",
            fontWeight: 800,
            fontSize: "16px",
            color: "#191c1d",
            letterSpacing: "-0.02em",
            whiteSpace: "nowrap",
            opacity: collapsed ? 0 : 1,
            transition: "opacity 0.15s",
          }}
        >
          ConstructIQ
        </span>
      </div>

      {/* Main nav */}
      <nav style={{ display: "flex", flexDirection: "column", gap: "2px", flex: 1 }}>
        {MAIN_NAV.map((item) => (
          <div key={item.href} style={{ position: "relative" }}>
            <NavItem
              {...item}
              active={isActive(item.href, pathname, item.exact)}
              collapsed={collapsed}
              onClick={onLinkClick}
            />
          </div>
        ))}

        {/* Divider */}
        <div
          style={{
            margin: "12px 10px",
            height: "1px",
            background: "rgba(215,195,174,0.3)",
          }}
        />

        {/* Settings */}
        <div style={{ position: "relative" }}>
          <NavItem
            href="/dashboard/settings/geography"
            label="Settings"
            icon="settings"
            active={isActive("/dashboard/settings/geography", pathname)}
            collapsed={collapsed}
            onClick={onLinkClick}
          />
        </div>

        {/* Billing — admin only */}
        {user?.is_admin && (
          <div style={{ position: "relative" }}>
            <NavItem
              href="/dashboard/billing"
              label="Billing"
              icon="payments"
              active={isActive("/dashboard/billing", pathname)}
              collapsed={collapsed}
              onClick={onLinkClick}
            />
          </div>
        )}
      </nav>

      {/* Bottom: profile + logout */}
      <div
        style={{
          borderTop: "1px solid rgba(215,195,174,0.25)",
          paddingTop: "12px",
          display: "flex",
          flexDirection: "column",
          gap: "2px",
        }}
      >
        <Link
          href="/dashboard/profile"
          onClick={onLinkClick}
          title={collapsed ? `${user?.first_name || "Profile"}` : undefined}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "8px 10px",
            borderRadius: "10px",
            textDecoration: "none",
            color: "#524534",
            overflow: "hidden",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f4f5")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: "linear-gradient(135deg,#835500,#f5a623)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 700,
              fontSize: "12px",
              flexShrink: 0,
              fontFamily: "var(--font-manrope, Manrope, sans-serif)",
            }}
          >
            {initials}
          </div>
          <div
            style={{
              opacity: collapsed ? 0 : 1,
              transition: "opacity 0.15s",
              minWidth: 0,
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: "12px",
                fontWeight: 700,
                color: "#191c1d",
                fontFamily: "var(--font-manrope, Manrope, sans-serif)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {user?.first_name
                ? `${user.first_name} ${user.last_name}`.trim()
                : user?.email}
            </p>
            <p style={{ margin: 0, fontSize: "10px", color: "#857462", whiteSpace: "nowrap" }}>
              {user?.is_admin ? "Admin" : "Member"}
            </p>
          </div>
        </Link>

        <button
          onClick={() => logout()}
          title={collapsed ? "Sign out" : undefined}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "8px 10px",
            borderRadius: "10px",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#857462",
            fontSize: "13px",
            fontFamily: "var(--font-inter, Inter, sans-serif)",
            overflow: "hidden",
            textAlign: "left",
            width: "100%",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#f3f4f5";
            e.currentTarget.style.color = "#191c1d";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "#857462";
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: "18px", flexShrink: 0 }}
          >
            logout
          </span>
          <span
            style={{
              opacity: collapsed ? 0 : 1,
              transition: "opacity 0.15s",
              whiteSpace: "nowrap",
            }}
          >
            Sign out
          </span>
        </button>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hovered, setHovered] = useState(false);

  const expandedWidth = 220;
  const collapsedWidth = 64;

  return (
    <>
      {/* Google Material Symbols font */}
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@400,0&display=swap"
        rel="stylesheet"
      />

      {/* Desktop sidebar */}
      <aside
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 50,
          width: hovered ? `${expandedWidth}px` : `${collapsedWidth}px`,
          transition: "width 0.2s ease",
          background: "#ffffff",
          boxShadow: "2px 0 20px rgba(25,28,29,0.06)",
          overflow: "hidden",
          display: "none",
        }}
        className="lg-sidebar"
      >
        <SidebarContent collapsed={!hovered} />
      </aside>

      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg-sidebar-hide"
        style={{
          position: "fixed",
          top: "16px",
          left: "16px",
          zIndex: 50,
          width: "40px",
          height: "40px",
          borderRadius: "10px",
          background: "#ffffff",
          border: "none",
          boxShadow: "0 2px 12px rgba(25,28,29,0.1)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#191c1d",
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>menu</span>
      </button>

      {/* Mobile drawer backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 40,
            background: "rgba(25,28,29,0.3)",
            backdropFilter: "blur(2px)",
          }}
          className="lg-sidebar-hide"
        />
      )}

      {/* Mobile drawer */}
      <aside
        className="lg-sidebar-hide"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 50,
          width: `${expandedWidth}px`,
          background: "#ffffff",
          boxShadow: "4px 0 24px rgba(25,28,29,0.12)",
          transform: mobileOpen ? "translateX(0)" : `translateX(-${expandedWidth}px)`,
          transition: "transform 0.25s ease",
        }}
      >
        <SidebarContent collapsed={false} onLinkClick={() => setMobileOpen(false)} />
      </aside>

      {/* Responsive styles */}
      <style>{`
        @media (min-width: 1024px) {
          .lg-sidebar { display: block !important; }
          .lg-sidebar-hide { display: none !important; }
        }
      `}</style>
    </>
  );
}
