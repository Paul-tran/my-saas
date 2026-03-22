import Link from "next/link";

const links = [
  { href: "/dashboard", key: "dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/dashboard/documents", key: "documents", label: "Documents", icon: "folder_open" },
  { href: "/dashboard/assets", key: "assets", label: "Assets", icon: "construction" },
  { href: "/dashboard/commissioning", key: "commissioning", label: "Commissioning", icon: "verified" },
  { href: "/dashboard/work-orders", key: "work-orders", label: "Work Orders", icon: "assignment" },
  { href: "/dashboard/settings/geography", key: "geography", label: "Geography", icon: "location_on" },
  { href: "/dashboard/settings/systems", key: "systems", label: "Systems", icon: "account_tree" },
  { href: "/dashboard/billing", key: "billing", label: "Billing", icon: "payments" },
  { href: "/dashboard/settings/work-order-types", key: "settings", label: "Settings", icon: "settings" },
];

export default function Sidebar({ active }: { active: string }) {
  return (
    <aside style={{
      width: "256px",
      minWidth: "256px",
      background: "#f3f4f5",
      display: "flex",
      flexDirection: "column",
      padding: "24px 16px",
      height: "100vh",
      position: "sticky",
      top: 0,
      overflowY: "auto",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@400,0&display=swap" rel="stylesheet" />

      {/* Logo */}
      <div style={{ padding: "8px 16px", marginBottom: "32px" }}>
        <h1 style={{ fontFamily: "var(--font-manrope, Manrope, sans-serif)", fontSize: "22px", fontWeight: 800, color: "#191c1d", margin: 0, letterSpacing: "-0.03em" }}>
          ConstructIQ
        </h1>
        <p style={{ fontSize: "10px", fontWeight: 700, color: "#835500", textTransform: "uppercase", letterSpacing: "0.2em", margin: "2px 0 0" }}>
          Blueprint Precision
        </p>
      </div>

      {/* Nav */}
      <nav style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
        {links.map((link) => {
          const isActive = active === link.key;
          return (
            <Link
              key={link.key}
              href={link.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 16px",
                borderRadius: "8px",
                fontSize: "14px",
                fontFamily: "var(--font-manrope, Manrope, sans-serif)",
                fontWeight: isActive ? 600 : 400,
                textDecoration: "none",
                background: isActive ? "#f5a623" : "transparent",
                color: isActive ? "#ffffff" : "#524534",
                transition: "all 0.15s ease",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>{link.icon}</span>
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom CTA */}
      <div style={{ marginTop: "24px", padding: "16px", background: "#ffffff", borderRadius: "12px" }}>
        <a
          href="/dashboard/work-orders/new"
          style={{
            display: "block",
            width: "100%",
            background: "linear-gradient(135deg, #835500, #f5a623)",
            color: "#ffffff",
            padding: "12px",
            borderRadius: "8px",
            fontWeight: 700,
            fontSize: "11px",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            textAlign: "center",
            textDecoration: "none",
          }}
        >
          New Work Order
        </a>
      </div>
    </aside>
  );
}
