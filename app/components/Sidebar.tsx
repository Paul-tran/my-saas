import Link from "next/link";

export default function Sidebar({ active }: { active: string }) {
  const links = [
    { href: "/dashboard", label: "Dashboard", key: "dashboard", icon: "⊞" },
    { href: "/dashboard/documents", label: "Documents", key: "documents", icon: "📄" },
    { href: "/dashboard/assets", label: "Assets", key: "assets", icon: "🏗️" },
    { href: "/dashboard/commissioning", label: "Commissioning", key: "commissioning", icon: "✅" },
    { href: "/dashboard/work-orders", label: "Work Orders", key: "work-orders", icon: "🔧" },
    { href: "/dashboard/billing", label: "Billing", key: "billing", icon: "💳" },
    { href: "/dashboard/settings/geography", label: "Geography", key: "geography", icon: "📍" },
    { href: "/dashboard/settings/systems", label: "Systems", key: "systems", icon: "🏛️" },
    { href: "/dashboard/settings/work-order-types", label: "Settings", key: "settings", icon: "⚙️" },
  ];

  return (
    <aside style={{ width: "240px", background: "#0a0a0a", borderRight: "1px solid #222", padding: "32px 16px", display: "flex", flexDirection: "column" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=DM+Serif+Display&display=swap');`}</style>
      <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: "20px", color: "#fff", padding: "0 12px", marginBottom: "40px", display: "block" }}>ConstructIQ</span>
      <nav style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        {links.map((link) => (
          <Link
            key={link.key}
            href={link.href}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "10px 12px",
              borderRadius: "6px",
              fontSize: "14px",
              fontFamily: "'DM Sans', sans-serif",
              textDecoration: "none",
              background: active === link.key ? "#1a1a1a" : "transparent",
              color: active === link.key ? "#f5a623" : "#666",
              fontWeight: active === link.key ? "700" : "400",
              borderLeft: active === link.key ? "2px solid #f5a623" : "2px solid transparent",
            }}
          >
            <span>{link.icon}</span>
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}