import Link from "next/link";

export default function Home() {
  return (
    <main style={{ fontFamily: "'DM Sans', sans-serif", background: "#0a0a0a", minHeight: "100vh", color: "#fff" }}>

      {/* Google Font */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=DM+Serif+Display&display=swap');`}</style>

      {/* Navbar */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px 48px", borderBottom: "1px solid #222" }}>
        <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: "22px", color: "#fff", letterSpacing: "-0.5px" }}>ConstructIQ</span>
        <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
          <Link href="/pricing" style={{ color: "#888", fontSize: "14px", textDecoration: "none" }}>Pricing</Link>
          <Link href="/sign-in" style={{ color: "#888", fontSize: "14px", textDecoration: "none" }}>Sign In</Link>
          <Link href="/sign-up" style={{ background: "#f5a623", color: "#000", padding: "10px 20px", borderRadius: "6px", fontSize: "14px", fontWeight: "700", textDecoration: "none" }}>
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding: "120px 48px", maxWidth: "900px" }}>
        <div style={{ display: "inline-block", background: "#1a1a1a", border: "1px solid #333", borderRadius: "100px", padding: "6px 16px", marginBottom: "32px" }}>
          <span style={{ color: "#f5a623", fontSize: "12px", fontWeight: "700", letterSpacing: "1px", textTransform: "uppercase" }}>Built for Construction</span>
        </div>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "72px", lineHeight: "1.05", letterSpacing: "-2px", marginBottom: "24px", color: "#fff" }}>
          Manage Projects.<br />
          <span style={{ color: "#f5a623" }}>Without the chaos.</span>
        </h1>
        <p style={{ color: "#888", fontSize: "20px", lineHeight: "1.6", maxWidth: "560px", marginBottom: "48px" }}>
          Document control, asset tracking, and commissioning — all in one place built specifically for construction teams.
        </p>
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <Link href="/sign-up" style={{ background: "#f5a623", color: "#000", padding: "16px 32px", borderRadius: "6px", fontSize: "16px", fontWeight: "700", textDecoration: "none" }}>
            Start Free Trial
          </Link>
          <Link href="/pricing" style={{ color: "#888", fontSize: "16px", textDecoration: "none" }}>
            View Pricing →
          </Link>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: "80px 48px", borderTop: "1px solid #222" }}>
        <p style={{ color: "#f5a623", fontSize: "12px", fontWeight: "700", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "48px" }}>Core Features</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "2px", background: "#222" }}>
          {[
            { icon: "📄", title: "Document Control", desc: "Manage drawings, submittals, and RFIs in one place. Never lose track of a revision again." },
            { icon: "🏗️", title: "Asset Management", desc: "Track equipment and assets across your entire project site in real time." },
            { icon: "✅", title: "Commissioning", desc: "Streamline inspections, checklists, and sign-offs with a clear audit trail." },
          ].map((f) => (
            <div key={f.title} style={{ background: "#0a0a0a", padding: "48px 40px" }}>
              <span style={{ fontSize: "32px" }}>{f.icon}</span>
              <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "24px", margin: "16px 0 12px", color: "#fff" }}>{f.title}</h3>
              <p style={{ color: "#666", fontSize: "15px", lineHeight: "1.6" }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "120px 48px", textAlign: "center", borderTop: "1px solid #222" }}>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "56px", letterSpacing: "-1px", marginBottom: "24px" }}>
          Ready to take control?
        </h2>
        <p style={{ color: "#888", fontSize: "18px", marginBottom: "40px" }}>Join construction teams already using ConstructIQ.</p>
        <Link href="/sign-up" style={{ background: "#f5a623", color: "#000", padding: "16px 40px", borderRadius: "6px", fontSize: "16px", fontWeight: "700", textDecoration: "none" }}>
          Get Started Free
        </Link>
      </section>

      {/* Footer */}
      <footer style={{ padding: "32px 48px", borderTop: "1px solid #222", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: "'DM Serif Display', serif", color: "#444" }}>ConstructIQ</span>
        <span style={{ color: "#444", fontSize: "13px" }}>© 2026 ConstructIQ. All rights reserved.</span>
      </footer>

    </main>
  );
}