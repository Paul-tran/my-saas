"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { apiFetch } from "@/lib/api";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function passwordStrength(pw: string): number {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}

const STRENGTH_LABELS = ["", "Weak", "Fair", "Good", "Strong"];
const STRENGTH_COLORS = ["", "#ba1a1a", "#f5a623", "#00658a", "#15803d"];

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();

  const [firstName, setFirstName] = useState(user?.first_name ?? "");
  const [lastName, setLastName] = useState(user?.last_name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const avatarRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const initials =
    `${user?.first_name?.[0] ?? ""}${user?.last_name?.[0] ?? ""}`.toUpperCase() ||
    user?.email?.[0]?.toUpperCase() ||
    "U";

  const strength = passwordStrength(newPassword);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      await apiFetch("/api/v1/auth/me", undefined, {
        method: "PATCH",
        body: JSON.stringify({ first_name: firstName, last_name: lastName, email }),
      });
      await refreshUser();
      setProfileMsg({ type: "ok", text: "Profile updated successfully." });
    } catch (err: any) {
      setProfileMsg({ type: "err", text: err.message });
    } finally {
      setSavingProfile(false);
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "err", text: "New passwords do not match." });
      return;
    }
    setSavingPassword(true);
    setPasswordMsg(null);
    try {
      await apiFetch("/api/v1/auth/me/change-password", undefined, {
        method: "POST",
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMsg({ type: "ok", text: "Password changed successfully." });
    } catch (err: any) {
      setPasswordMsg({ type: "err", text: err.message });
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      await fetch(`${API}/api/v1/auth/me/avatar`, {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      await refreshUser();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUploadingAvatar(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa", padding: "40px 32px", fontFamily: "var(--font-inter, Inter, sans-serif)" }}>
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@400,0&display=swap" rel="stylesheet" />

      <div style={{ maxWidth: "720px" }}>
        {/* Page header */}
        <div style={{ marginBottom: "32px" }}>
          <span style={{ fontSize: "10px", fontWeight: 700, color: "#835500", textTransform: "uppercase", letterSpacing: "0.3em", display: "block", marginBottom: "6px" }}>
            Account
          </span>
          <h1 style={{ fontFamily: "var(--font-manrope, Manrope, sans-serif)", fontSize: "1.75rem", fontWeight: 800, color: "#191c1d", margin: 0, letterSpacing: "-0.03em" }}>
            Your Profile
          </h1>
        </div>

        {/* ── Hero card ── */}
        <div style={{ background: "#fff", borderRadius: "16px", padding: "32px", marginBottom: "20px", boxShadow: "0 4px 24px rgba(25,28,29,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            {/* Avatar */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              {user?.avatar_key ? (
                <img
                  src={`${API}/api/v1/auth/me/avatar-url?key=${encodeURIComponent(user.avatar_key)}`}
                  alt={initials}
                  style={{ width: "88px", height: "88px", borderRadius: "50%", objectFit: "cover" }}
                />
              ) : (
                <div style={{
                  width: "88px", height: "88px", borderRadius: "50%",
                  background: "linear-gradient(135deg, #835500, #f5a623)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontWeight: 800, fontSize: "28px",
                  fontFamily: "var(--font-manrope, Manrope, sans-serif)",
                }}>
                  {initials}
                </div>
              )}

              {/* Camera button */}
              <button
                onClick={() => avatarRef.current?.click()}
                disabled={uploadingAvatar}
                style={{
                  position: "absolute", bottom: "2px", right: "2px",
                  width: "28px", height: "28px", borderRadius: "50%",
                  background: "#fff", border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 2px 8px rgba(25,28,29,0.15)",
                }}
              >
                {uploadingAvatar ? (
                  <div style={{ width: "12px", height: "12px", borderRadius: "50%", border: "2px solid #835500", borderTopColor: "transparent", animation: "spin 0.7s linear infinite" }} />
                ) : (
                  <span className="material-symbols-outlined" style={{ fontSize: "14px", color: "#524534" }}>photo_camera</span>
                )}
              </button>
              <input ref={avatarRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarChange} />
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ fontFamily: "var(--font-manrope, Manrope, sans-serif)", fontSize: "1.375rem", fontWeight: 800, color: "#191c1d", margin: "0 0 4px", letterSpacing: "-0.02em" }}>
                {user?.first_name || user?.last_name
                  ? `${user.first_name} ${user.last_name}`.trim()
                  : user?.email ?? "—"}
              </h2>
              <p style={{ fontSize: "13px", color: "#857462", margin: "0 0 12px" }}>{user?.email}</p>

              {/* Badges */}
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {user?.is_admin && (
                  <span style={{ fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "100px", background: "rgba(131,85,0,0.1)", color: "#835500" }}>
                    Admin
                  </span>
                )}
                <span style={{ fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "100px", background: "rgba(0,101,138,0.1)", color: "#004d6a" }}>
                  {user?.is_active ? "Active" : "Inactive"}
                </span>
              </div>

              {user?.created_at && (
                <p style={{ fontSize: "11px", color: "#857462", margin: "10px 0 0" }}>
                  Joined {new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Personal Information ── */}
        <div style={{ background: "#fff", borderRadius: "16px", padding: "32px", marginBottom: "20px", boxShadow: "0 4px 24px rgba(25,28,29,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(131,85,0,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "#835500" }}>person</span>
              </div>
              <h2 style={{ fontFamily: "var(--font-manrope, Manrope, sans-serif)", fontSize: "15px", fontWeight: 700, color: "#191c1d", margin: 0 }}>
                Personal Information
              </h2>
            </div>
          </div>

          <form onSubmit={saveProfile}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
              {[
                { label: "First name", value: firstName, set: setFirstName },
                { label: "Last name", value: lastName, set: setLastName },
              ].map(({ label, value, set }) => (
                <div key={label}>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#524534", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "8px" }}>
                    {label}
                  </label>
                  <input
                    value={value}
                    onChange={(e) => set(e.target.value)}
                    style={{ width: "100%", background: "transparent", border: "none", borderBottom: "1.5px solid #d7c3ae", color: "#191c1d", fontSize: "14px", padding: "8px 0", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
                    onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#835500")}
                    onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#d7c3ae")}
                  />
                </div>
              ))}
            </div>

            <div style={{ marginBottom: "28px" }}>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#524534", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "8px" }}>
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: "100%", background: "transparent", border: "none", borderBottom: "1.5px solid #d7c3ae", color: "#191c1d", fontSize: "14px", padding: "8px 0", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
                onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#835500")}
                onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#d7c3ae")}
              />
            </div>

            {profileMsg && (
              <div style={{ marginBottom: "20px", padding: "10px 14px", borderRadius: "8px", fontSize: "13px", background: profileMsg.type === "ok" ? "rgba(0,101,138,0.08)" : "#ffdad6", color: profileMsg.type === "ok" ? "#004d6a" : "#93000a" }}>
                {profileMsg.text}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="submit"
                disabled={savingProfile}
                style={{ background: "linear-gradient(135deg, #835500, #f5a623)", color: "#fff", border: "none", borderRadius: "8px", padding: "10px 24px", fontSize: "13px", fontWeight: 700, cursor: "pointer", opacity: savingProfile ? 0.6 : 1, fontFamily: "var(--font-manrope, Manrope, sans-serif)", letterSpacing: "0.01em" }}
              >
                {savingProfile ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </form>
        </div>

        {/* ── Security ── */}
        <div style={{ background: "#fff", borderRadius: "16px", padding: "32px", boxShadow: "0 4px 24px rgba(25,28,29,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "28px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(131,85,0,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "#835500" }}>lock</span>
            </div>
            <h2 style={{ fontFamily: "var(--font-manrope, Manrope, sans-serif)", fontSize: "15px", fontWeight: 700, color: "#191c1d", margin: 0 }}>
              Security
            </h2>
          </div>

          <form onSubmit={savePassword}>
            {/* Current password */}
            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#524534", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "8px" }}>
                Current password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  style={{ width: "100%", background: "transparent", border: "none", borderBottom: "1.5px solid #d7c3ae", color: "#191c1d", fontSize: "14px", padding: "8px 28px 8px 0", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
                  onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#835500")}
                  onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#d7c3ae")}
                />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)} style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#857462", padding: "4px", display: "flex" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>{showCurrent ? "visibility_off" : "visibility"}</span>
                </button>
              </div>
            </div>

            {/* New password */}
            <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#524534", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "8px" }}>
                New password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  style={{ width: "100%", background: "transparent", border: "none", borderBottom: "1.5px solid #d7c3ae", color: "#191c1d", fontSize: "14px", padding: "8px 28px 8px 0", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
                  onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#835500")}
                  onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#d7c3ae")}
                />
                <button type="button" onClick={() => setShowNew(!showNew)} style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#857462", padding: "4px", display: "flex" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>{showNew ? "visibility_off" : "visibility"}</span>
                </button>
              </div>

              {/* Strength bar */}
              {newPassword.length > 0 && (
                <div style={{ marginTop: "10px" }}>
                  <div style={{ display: "flex", gap: "4px", marginBottom: "5px" }}>
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} style={{ flex: 1, height: "4px", borderRadius: "2px", background: i <= strength ? STRENGTH_COLORS[strength] : "#edeeef", transition: "background 0.2s" }} />
                    ))}
                  </div>
                  <p style={{ fontSize: "11px", color: STRENGTH_COLORS[strength], fontWeight: 600, margin: 0 }}>
                    {STRENGTH_LABELS[strength]}
                  </p>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div style={{ marginBottom: "28px" }}>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#524534", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "8px" }}>
                Confirm new password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  style={{ width: "100%", background: "transparent", border: "none", borderBottom: "1.5px solid #d7c3ae", color: "#191c1d", fontSize: "14px", padding: "8px 28px 8px 0", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
                  onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#835500")}
                  onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#d7c3ae")}
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#857462", padding: "4px", display: "flex" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>{showConfirm ? "visibility_off" : "visibility"}</span>
                </button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p style={{ fontSize: "11px", color: "#ba1a1a", fontWeight: 600, margin: "6px 0 0" }}>Passwords do not match</p>
              )}
            </div>

            {passwordMsg && (
              <div style={{ marginBottom: "20px", padding: "10px 14px", borderRadius: "8px", fontSize: "13px", background: passwordMsg.type === "ok" ? "rgba(0,101,138,0.08)" : "#ffdad6", color: passwordMsg.type === "ok" ? "#004d6a" : "#93000a" }}>
                {passwordMsg.text}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="submit"
                disabled={savingPassword}
                style={{ background: "linear-gradient(135deg, #835500, #f5a623)", color: "#fff", border: "none", borderRadius: "8px", padding: "10px 24px", fontSize: "13px", fontWeight: 700, cursor: "pointer", opacity: savingPassword ? 0.6 : 1, fontFamily: "var(--font-manrope, Manrope, sans-serif)", letterSpacing: "0.01em" }}
              >
                {savingPassword ? "Saving…" : "Update Password"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
