import Link from "next/link";

export default function Home() {
  return (
    <main style={{ fontFamily: "var(--font-inter, Inter, sans-serif)", background: "#f8f9fa", minHeight: "100vh", color: "#191c1d" }}>
      <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" rel="stylesheet" />

      {/* Navbar */}
      <nav style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 48px",
        height: "64px",
        background: "rgba(248,249,250,0.8)",
        backdropFilter: "blur(20px)",
        position: "sticky",
        top: 0,
        zIndex: 100,
        borderBottom: "1px solid rgba(215,195,174,0.2)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "28px", height: "28px", background: "linear-gradient(135deg, #835500, #f5a623)", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontSize: "14px", fontWeight: 800, fontFamily: "Manrope, sans-serif" }}>C</span>
          </div>
          <span style={{ fontFamily: "Manrope, sans-serif", fontSize: "18px", fontWeight: 800, color: "#191c1d", letterSpacing: "-0.03em" }}>ConstructIQ</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
          <Link href="/pricing" style={{ color: "#524534", fontSize: "14px", fontWeight: 500, textDecoration: "none" }}>Pricing</Link>
          <Link href="/sign-in" style={{ color: "#524534", fontSize: "14px", fontWeight: 500, textDecoration: "none" }}>Sign In</Link>
          <Link href="/sign-up" style={{
            background: "linear-gradient(135deg, #835500, #f5a623)",
            color: "#fff",
            padding: "10px 22px",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: 700,
            textDecoration: "none",
            fontFamily: "Manrope, sans-serif",
            letterSpacing: "0.02em",
          }}>
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding: "100px 48px 80px", maxWidth: "1100px", margin: "0 auto", position: "relative" }}>
        {/* Blueprint dot grid */}
        <div style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "radial-gradient(circle, rgba(131,85,0,0.08) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          pointerEvents: "none",
        }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(245,166,35,0.1)",
            border: "1px solid rgba(245,166,35,0.25)",
            borderRadius: "100px",
            padding: "6px 16px",
            marginBottom: "32px",
          }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#f5a623", display: "inline-block" }} />
            <span style={{ color: "#835500", fontSize: "12px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "Manrope, sans-serif" }}>Built for Construction</span>
          </div>

          <h1 style={{
            fontFamily: "Manrope, sans-serif",
            fontSize: "68px",
            lineHeight: "1.05",
            letterSpacing: "-0.04em",
            fontWeight: 800,
            marginBottom: "28px",
            color: "#191c1d",
            maxWidth: "760px",
          }}>
            Manage Projects.<br />
            <span style={{ color: "#835500" }}>Without the chaos.</span>
          </h1>

          <p style={{ color: "#524534", fontSize: "20px", lineHeight: "1.7", maxWidth: "540px", marginBottom: "48px", fontWeight: 400 }}>
            Document control, asset tracking, and commissioning — all in one place built specifically for construction teams.
          </p>

          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <Link href="/sign-up" style={{
              background: "linear-gradient(135deg, #835500, #f5a623)",
              color: "#fff",
              padding: "16px 36px",
              borderRadius: "10px",
              fontSize: "15px",
              fontWeight: 700,
              textDecoration: "none",
              fontFamily: "Manrope, sans-serif",
              boxShadow: "0 8px 24px rgba(131,85,0,0.25)",
            }}>
              Start Free Trial
            </Link>
            <Link href="/pricing" style={{
              color: "#835500",
              fontSize: "15px",
              fontWeight: 600,
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}>
              View Pricing <span style={{ fontSize: "18px" }}>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section style={{ background: "#fff", borderTop: "1px solid rgba(215,195,174,0.2)", borderBottom: "1px solid rgba(215,195,174,0.2)" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "40px 48px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0" }}>
          {[
            { value: "500+", label: "Projects Managed" },
            { value: "98%", label: "Uptime Guaranteed" },
            { value: "10×", label: "Faster Document Control" },
          ].map((stat, i) => (
            <div key={stat.label} style={{
              textAlign: "center",
              padding: "24px",
              borderRight: i < 2 ? "1px solid rgba(215,195,174,0.2)" : "none",
            }}>
              <p style={{ fontFamily: "Manrope, sans-serif", fontSize: "40px", fontWeight: 800, color: "#835500", margin: "0 0 6px", letterSpacing: "-0.04em" }}>{stat.value}</p>
              <p style={{ fontSize: "13px", color: "#857462", margin: 0, fontWeight: 500 }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: "100px 48px", maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ marginBottom: "64px" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "#835500", textTransform: "uppercase", letterSpacing: "0.25em", display: "block", marginBottom: "12px", fontFamily: "Manrope, sans-serif" }}>Core Features</span>
          <h2 style={{ fontFamily: "Manrope, sans-serif", fontSize: "44px", fontWeight: 800, color: "#191c1d", letterSpacing: "-0.03em", margin: 0, maxWidth: "560px", lineHeight: 1.1 }}>
            Everything your team needs on site
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px" }}>
          {[
            {
              icon: "folder_open",
              title: "Document Control",
              desc: "Manage drawings, submittals, and RFIs in one place. Never lose track of a revision again.",
              color: "#835500",
              bg: "rgba(245,166,35,0.08)",
            },
            {
              icon: "construction",
              title: "Asset Management",
              desc: "Track equipment and assets across your entire project site. Full lifecycle visibility from installation to commissioning.",
              color: "#00658a",
              bg: "rgba(0,101,138,0.08)",
            },
            {
              icon: "verified",
              title: "Commissioning",
              desc: "Streamline inspections, checklists, and sign-offs with a clear audit trail and digital records.",
              color: "#15803d",
              bg: "rgba(21,128,61,0.08)",
            },
          ].map((f) => (
            <div key={f.title} style={{
              background: "#fff",
              borderRadius: "16px",
              padding: "36px",
              boxShadow: "0 20px 40px rgba(25,28,29,0.05)",
            }}>
              <div style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: f.bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "24px",
              }}>
                <span className="material-symbols-outlined" style={{ color: f.color, fontSize: "24px" }}>{f.icon}</span>
              </div>
              <h3 style={{ fontFamily: "Manrope, sans-serif", fontSize: "20px", fontWeight: 700, color: "#191c1d", margin: "0 0 12px", letterSpacing: "-0.02em" }}>{f.title}</h3>
              <p style={{ color: "#524534", fontSize: "14px", lineHeight: "1.7", margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{ background: "#fff", padding: "100px 48px", borderTop: "1px solid rgba(215,195,174,0.15)", borderBottom: "1px solid rgba(215,195,174,0.15)" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ marginBottom: "64px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#835500", textTransform: "uppercase", letterSpacing: "0.25em", display: "block", marginBottom: "12px", fontFamily: "Manrope, sans-serif" }}>How It Works</span>
            <h2 style={{ fontFamily: "Manrope, sans-serif", fontSize: "44px", fontWeight: 800, color: "#191c1d", letterSpacing: "-0.03em", margin: 0, lineHeight: 1.1 }}>
              Up and running in minutes
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0" }}>
            {[
              { step: "01", title: "Set up your project", desc: "Define your geography hierarchy — sites, locations, and units — in minutes." },
              { step: "02", title: "Upload your drawings", desc: "Drag and drop your PDF drawings. ConstructIQ auto-detects assets and pins them to the drawing." },
              { step: "03", title: "Track everything", desc: "Monitor assets, work orders, and commissioning progress from a single dashboard." },
            ].map((s, i) => (
              <div key={s.step} style={{
                padding: "40px",
                borderRight: i < 2 ? "1px solid rgba(215,195,174,0.2)" : "none",
              }}>
                <span style={{ fontFamily: "Manrope, sans-serif", fontSize: "48px", fontWeight: 800, color: "rgba(245,166,35,0.3)", letterSpacing: "-0.04em", display: "block", marginBottom: "16px" }}>{s.step}</span>
                <h3 style={{ fontFamily: "Manrope, sans-serif", fontSize: "20px", fontWeight: 700, color: "#191c1d", margin: "0 0 12px", letterSpacing: "-0.02em" }}>{s.title}</h3>
                <p style={{ color: "#524534", fontSize: "14px", lineHeight: "1.7", margin: 0 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Band */}
      <section style={{ padding: "100px 48px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "radial-gradient(circle, rgba(131,85,0,0.06) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          pointerEvents: "none",
        }} />
        <div style={{ position: "relative", zIndex: 1, maxWidth: "600px", margin: "0 auto" }}>
          <h2 style={{ fontFamily: "Manrope, sans-serif", fontSize: "52px", fontWeight: 800, letterSpacing: "-0.04em", color: "#191c1d", marginBottom: "20px", lineHeight: 1.05 }}>
            Ready to take control?
          </h2>
          <p style={{ color: "#524534", fontSize: "17px", marginBottom: "40px", lineHeight: 1.6 }}>Join construction teams already using ConstructIQ to deliver projects on time.</p>
          <Link href="/sign-up" style={{
            background: "linear-gradient(135deg, #835500, #f5a623)",
            color: "#fff",
            padding: "18px 48px",
            borderRadius: "10px",
            fontSize: "16px",
            fontWeight: 700,
            textDecoration: "none",
            fontFamily: "Manrope, sans-serif",
            boxShadow: "0 12px 32px rgba(131,85,0,0.3)",
            display: "inline-block",
          }}>
            Get Started Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: "32px 48px",
        background: "#fff",
        borderTop: "1px solid rgba(215,195,174,0.2)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "22px", height: "22px", background: "linear-gradient(135deg, #835500, #f5a623)", borderRadius: "5px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontSize: "11px", fontWeight: 800, fontFamily: "Manrope, sans-serif" }}>C</span>
          </div>
          <span style={{ fontFamily: "Manrope, sans-serif", fontSize: "15px", fontWeight: 700, color: "#524534" }}>ConstructIQ</span>
        </div>
        <span style={{ color: "#857462", fontSize: "13px" }}>© 2026 ConstructIQ. All rights reserved.</span>
      </footer>
    </main>
  );
}
