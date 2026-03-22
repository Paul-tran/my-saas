"use client";

export const dynamic = "force-dynamic";

import { useAuth } from "@clerk/nextjs";
import Sidebar from "../../components/Sidebar";
import { useBilling } from "../../../lib/hooks/useBilling";
import { STATUS_LABEL, STATUS_COLOR, simulateBilling } from "../../../lib/models/billing";

const DEV_SCENARIOS = ["trial", "active", "past_due", "canceled"] as const;

export default function BillingPage() {
  const { subscription, loading, redirecting, handleStartTrial, handleManage, reload } = useBilling();
  const { getToken } = useAuth();

  async function handleSimulate(scenario: typeof DEV_SCENARIOS[number]) {
    const token = await getToken();
    if (!token) return;
    await simulateBilling(scenario, token);
    reload();
  }

  return (
    <div style={{ display: "flex", height: "100vh", background: "#f8f9fa", fontFamily: "var(--font-inter, Inter, sans-serif)", overflow: "hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@400,0&display=swap" rel="stylesheet" />
      <Sidebar active="billing" />

      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "32px 40px 24px", background: "rgba(255,255,255,0.7)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(215,195,174,0.2)", flexShrink: 0 }}>
          <span style={{ fontSize: "10px", fontWeight: 700, color: "#835500", textTransform: "uppercase", letterSpacing: "0.3em", display: "block", marginBottom: "4px" }}>Account</span>
          <h1 style={{ fontFamily: "var(--font-manrope, Manrope, sans-serif)", fontSize: "32px", fontWeight: 800, color: "#191c1d", margin: 0, letterSpacing: "-0.03em" }}>Billing</h1>
          <p style={{ color: "#524534", fontSize: "13px", margin: "4px 0 0" }}>Manage your ConstructIQ subscription.</p>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: "28px 40px" }}>
          <div style={{ maxWidth: "600px" }}>

            {loading && <p style={{ color: "#857462" }}>Loading...</p>}

            {!loading && !subscription && (
              <div style={{ background: "#fff", border: "1px solid rgba(215,195,174,0.2)", borderRadius: "12px", padding: "48px 40px", textAlign: "center", boxShadow: "0 20px 40px rgba(25,28,29,0.05)" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "48px", color: "#d7c3ae", display: "block", marginBottom: "16px" }}>payments</span>
                <h2 style={{ color: "#191c1d", fontFamily: "var(--font-manrope, Manrope, sans-serif)", fontSize: "22px", fontWeight: 700, margin: "0 0 8px" }}>No active subscription</h2>
                <p style={{ color: "#524534", fontSize: "14px", margin: "0 0 28px" }}>Start your 14-day free trial — no credit card required.</p>
                <button onClick={handleStartTrial} disabled={redirecting}
                  style={{ background: "linear-gradient(135deg, #835500, #f5a623)", color: "#fff", border: "none", borderRadius: "8px", padding: "12px 32px", fontSize: "14px", fontWeight: 700, cursor: redirecting ? "not-allowed" : "pointer", opacity: redirecting ? 0.7 : 1 }}>
                  {redirecting ? "Redirecting to Stripe..." : "Start Free Trial"}
                </button>
              </div>
            )}

            {!loading && subscription && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* Status card */}
                <div style={{ background: "#fff", border: "1px solid rgba(215,195,174,0.2)", borderRadius: "12px", padding: "24px", boxShadow: "0 20px 40px rgba(25,28,29,0.05)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                    <div>
                      <p style={{ color: "#857462", fontSize: "12px", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Subscription Status</p>
                      <span style={{
                        fontSize: "12px", fontWeight: 700, padding: "4px 12px", borderRadius: "20px",
                        background: (STATUS_COLOR[subscription.status] ?? "#857462") + "22",
                        color: STATUS_COLOR[subscription.status] ?? "#857462",
                      }}>
                        {STATUS_LABEL[subscription.status] ?? subscription.status}
                      </span>
                    </div>
                    <button onClick={handleManage} disabled={redirecting}
                      style={{ background: "#f3f4f5", border: "none", color: "#524534", borderRadius: "8px", padding: "9px 16px", fontSize: "13px", fontWeight: 600, cursor: redirecting ? "not-allowed" : "pointer", opacity: redirecting ? 0.7 : 1 }}>
                      {redirecting ? "Redirecting..." : "Manage Subscription"}
                    </button>
                  </div>

                  <div style={{ borderTop: "1px solid rgba(215,195,174,0.15)", paddingTop: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
                    {[
                      { label: "Plan", value: "ConstructIQ Pro" },
                      { label: "Price", value: "$49 / user / month" },
                      { label: "Includes", value: "Documents, Assets, Commissioning, AI Analysis, Work Orders" },
                    ].map((r) => (
                      <div key={r.label} style={{ display: "flex", gap: "12px", fontSize: "13px" }}>
                        <span style={{ color: "#857462", width: "80px", flexShrink: 0 }}>{r.label}</span>
                        <span style={{ color: "#191c1d" }}>{r.value}</span>
                      </div>
                    ))}
                    {subscription.current_period_end && subscription.status === "active" && (
                      <div style={{ display: "flex", gap: "12px", fontSize: "13px" }}>
                        <span style={{ color: "#857462", width: "80px", flexShrink: 0 }}>Next bill</span>
                        <span style={{ color: "#191c1d" }}>{new Date(subscription.current_period_end).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Trial notice */}
                {subscription.status === "trialing" && subscription.trial_ends_at && (
                  <div style={{ background: "#dbeafe", border: "1px solid #bfdbfe", borderRadius: "10px", padding: "16px 20px" }}>
                    <p style={{ color: "#1d4ed8", fontSize: "13px", margin: 0 }}>
                      Your free trial ends on <strong>{new Date(subscription.trial_ends_at).toLocaleDateString()}</strong>. Add a payment method before then to keep access.
                    </p>
                  </div>
                )}

                {/* Past due warning */}
                {subscription.status === "past_due" && (
                  <div style={{ background: "#fee2e2", border: "1px solid #fecaca", borderRadius: "10px", padding: "16px 20px" }}>
                    <p style={{ color: "#dc2626", fontSize: "13px", margin: 0 }}>
                      Your last payment failed. Update your payment method to restore access.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Dev simulation panel */}
            {process.env.NODE_ENV === "development" && (
              <div style={{ marginTop: "32px", border: "1px dashed rgba(131,85,0,0.3)", borderRadius: "10px", padding: "20px", background: "rgba(245,166,35,0.05)" }}>
                <p style={{ fontSize: "11px", fontWeight: 700, color: "#835500", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 12px" }}>
                  Dev Tools — Simulate Billing State
                </p>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {DEV_SCENARIOS.map((s) => (
                    <button key={s} onClick={() => handleSimulate(s)}
                      style={{ background: "#fff", border: "1px solid rgba(131,85,0,0.3)", color: "#835500", borderRadius: "6px", padding: "6px 14px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
