import Link from "next/link";

export default function Pricing() {
  return (
    <main style={{ fontFamily: "'DM Sans', sans-serif", background: "#0a0a0a", minHeight: "100vh", color: "#fff" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=DM+Serif+Display&display=swap');`}</style>

      {/* Navbar */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px 48px", borderBottom: "1px solid #222" }}>
        <Link href="/" style={{ fontFamily: "'DM Serif Display', serif", fontSize: "22px", color: "#fff", textDecoration: "none" }}>ConstructIQ</Link>
        <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
          <Link href="/pricing" style={{ color: "#f5a623", fontSize: "14px", textDecoration: "none", fontWeight: "700" }}>Pricing</Link>
          <Link href="/sign-in" style={{ color: "#888", fontSize: "14px", textDecoration: "none" }}>Sign In</Link>
          <Link href="/sign-up" style={{ background: "#f5a623", color: "#000", padding: "10px 20px", borderRadius: "6px", fontSize: "14px", fontWeight: "700", textDecoration: "none" }}>
            Get Started
          </Link>
        </div>
      </nav>

      {/* Header */}
      <section style={{ textAlign: "center", padding: "80px 48px 48px" }}>
        <div style={{ display: "inline-block", background: "#1a1a1a", border: "1px solid #333", borderRadius: "100px", padding: "6px 16px", marginBottom: "32px" }}>
          <span style={{ color: "#f5a623", fontSize: "12px", fontWeight: "700", letterSpacing: "1px", textTransform: "uppercase" }}>Simple Pricing</span>
        </div>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "56px", letterSpacing: "-1px", marginBottom: "16px" }}>
          One plan, everything included.
        </h1>
        <p style={{ color: "#666", fontSize: "18px" }}>No hidden fees. No complicated tiers. Just ConstructIQ.</p>
      </section>

      {/* Pricing Card */}
      <section style={{ display: "flex", justifyContent: "center", padding: "0 48px 120px" }}>
        <div style={{ background: "#111", border: "1px solid #333", borderRadius: "12px", padding: "48px", maxWidth: "400px", width: "100%" }}>
          <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "28px", marginBottom: "8px" }}>Pro Plan</h3>
          <p style={{ color: "#666", fontSize: "14px", marginBottom: "32px" }}>Everything you need to manage your project.</p>
          <div style={{ marginBottom: "32px" }}>
            <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: "64px", color: "#f5a623" }}>$49</span>
            <span style={{ color: "#444", fontSize: "16px" }}>/month</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "40px" }}>
            {[
              "Document Control",
              "Asset Management",
              "Commissioning",
              "Unlimited Projects",
              "Priority Support",
            ].map((feature) => (
              <div key={feature} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ color: "#f5a623", fontWeight: "700" }}>✓</span>
                <span style={{ color: "#aaa", fontSize: "15px" }}>{feature}</span>
              </div>
            ))}
          </div>
          <Link href="/sign-up" style={{ display: "block", background: "#f5a623", color: "#000", padding: "16px", borderRadius: "6px", fontSize: "15px", fontWeight: "700", textDecoration: "none", textAlign: "center" }}>
            Get Started Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: "32px 48px", borderTop: "1px solid #222", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: "'DM Serif Display', serif", color: "#444" }}>ConstructIQ</span>
        <span style={{ color: "#444", fontSize: "13px" }}>© 2026 ConstructIQ. All rights reserved.</span>
      </footer>
    </main>
  );
}