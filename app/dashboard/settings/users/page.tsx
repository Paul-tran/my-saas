"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter } from "next/navigation";
import {
  AppUser,
  AdminUserUpdate,
  fetchAllUsers,
  updateUser,
  deleteUser,
  fetchRoles,
  fetchProjects,
  addProjectMember,
} from "@/lib/models/users";

// ─── helpers ────────────────────────────────────────────────────────────────

function initials(u: AppUser) {
  return `${u.first_name?.[0] ?? ""}${u.last_name?.[0] ?? ""}`.toUpperCase() || u.email[0].toUpperCase();
}

function Avatar({ user }: { user: AppUser }) {
  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  if (user.avatar_key) {
    return (
      <img
        src={`${API}/api/v1/auth/me/avatar-url?key=${encodeURIComponent(user.avatar_key)}`}
        alt={initials(user)}
        className="w-9 h-9 rounded-full object-cover"
      />
    );
  }
  return (
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
      style={{ background: "linear-gradient(135deg,#835500,#f5a623)" }}
    >
      {initials(user)}
    </div>
  );
}

function Badge({ active }: { active: boolean }) {
  return (
    <span
      className="text-xs font-medium px-2 py-0.5 rounded-full"
      style={
        active
          ? { background: "rgba(0,101,138,0.1)", color: "#004d6a" }
          : { background: "rgba(186,26,26,0.08)", color: "#93000a" }
      }
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

// ─── Edit modal ─────────────────────────────────────────────────────────────

interface EditModalProps {
  user: AppUser;
  onClose: () => void;
  onSaved: (u: AppUser) => void;
}

function EditModal({ user, onClose, onSaved }: EditModalProps) {
  const [form, setForm] = useState<AdminUserUpdate>({
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    is_active: user.is_active,
    is_admin: user.is_admin,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const updated = await updateUser(user.id, form);
      onSaved(updated);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4">
      <div
        className="bg-white rounded-2xl w-full max-w-md p-8"
        style={{ boxShadow: "0 20px 40px rgba(25,28,29,0.1)" }}
      >
        <h2
          className="font-bold mb-6"
          style={{ fontFamily: "var(--font-manrope)", fontSize: "1.25rem", color: "#191c1d" }}
        >
          Edit User
        </h2>

        <div className="space-y-4">
          {(["first_name", "last_name", "email"] as const).map((field) => (
            <div key={field}>
              <label
                className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
                style={{ color: "#524534" }}
              >
                {field.replace("_", " ")}
              </label>
              <input
                type={field === "email" ? "email" : "text"}
                value={(form[field] as string) ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                className="w-full bg-transparent text-sm py-2 outline-none"
                style={{ borderBottom: "1.5px solid #d7c3ae", color: "#191c1d" }}
                onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#835500")}
                onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#d7c3ae")}
              />
            </div>
          ))}

          <div className="flex gap-6 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_active ?? true}
                onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                className="w-4 h-4 accent-[#835500]"
              />
              <span className="text-sm" style={{ color: "#191c1d" }}>Active</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_admin ?? false}
                onChange={(e) => setForm((f) => ({ ...f, is_admin: e.target.checked }))}
                className="w-4 h-4 accent-[#835500]"
              />
              <span className="text-sm" style={{ color: "#191c1d" }}>Admin</span>
            </label>
          </div>
        </div>

        {error && (
          <p className="mt-4 text-xs px-3 py-2 rounded-lg" style={{ background: "#ffdad6", color: "#93000a" }}>
            {error}
          </p>
        )}

        <div className="flex gap-3 mt-8">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium"
            style={{ border: "1.5px solid #d7c3ae", color: "#524534" }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#835500,#f5a623)" }}
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Assign to project modal ─────────────────────────────────────────────────

interface AssignModalProps {
  user: AppUser;
  onClose: () => void;
}

function AssignModal({ user, onClose }: AssignModalProps) {
  const [projects, setProjects] = useState<{ id: number; name: string }[]>([]);
  const [roles, setRoles] = useState<{ id: number; name: string }[]>([]);
  const [projectId, setProjectId] = useState<number | "">("");
  const [roleId, setRoleId] = useState<number | "">("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProjects().then(setProjects).catch(() => {});
    fetchRoles().then(setRoles).catch(() => {});
  }, []);

  async function handleAssign() {
    if (!projectId || !roleId) return;
    setSaving(true);
    setError("");
    try {
      await addProjectMember(Number(projectId), user.id, Number(roleId));
      setSuccess(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  const selectStyle = {
    background: "transparent",
    borderBottom: "1.5px solid #d7c3ae",
    color: "#191c1d",
    outline: "none",
    fontSize: "0.875rem",
    padding: "0.5rem 0",
    width: "100%",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4">
      <div
        className="bg-white rounded-2xl w-full max-w-md p-8"
        style={{ boxShadow: "0 20px 40px rgba(25,28,29,0.1)" }}
      >
        <h2
          className="font-bold mb-2"
          style={{ fontFamily: "var(--font-manrope)", fontSize: "1.25rem", color: "#191c1d" }}
        >
          Assign to Project
        </h2>
        <p className="text-sm mb-6" style={{ color: "#857462" }}>
          {user.first_name || user.email} · {user.email}
        </p>

        {success ? (
          <div className="text-center py-6">
            <div
              className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-3"
              style={{ background: "rgba(0,101,138,0.1)" }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00658a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="font-medium" style={{ color: "#191c1d" }}>User assigned successfully</p>
            <button onClick={onClose} className="mt-4 text-sm font-medium" style={{ color: "#835500" }}>
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "#524534" }}>
                  Project
                </label>
                <select value={projectId} onChange={(e) => setProjectId(Number(e.target.value))} style={selectStyle}>
                  <option value="">Select a project…</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "#524534" }}>
                  Role
                </label>
                <select value={roleId} onChange={(e) => setRoleId(Number(e.target.value))} style={selectStyle}>
                  <option value="">Select a role…</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {error && (
              <p className="mt-4 text-xs px-3 py-2 rounded-lg" style={{ background: "#ffdad6", color: "#93000a" }}>
                {error}
              </p>
            )}

            <div className="flex gap-3 mt-8">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium"
                style={{ border: "1.5px solid #d7c3ae", color: "#524534" }}
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={saving || !projectId || !roleId}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,#835500,#f5a623)" }}
              >
                {saving ? "Assigning…" : "Assign"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Delete confirm modal ────────────────────────────────────────────────────

function DeleteModal({ user, onClose, onDeleted }: { user: AppUser; onClose: () => void; onDeleted: () => void }) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteUser(user.id);
      onDeleted();
    } catch (e: any) {
      setError(e.message);
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4">
      <div
        className="bg-white rounded-2xl w-full max-w-sm p-8 text-center"
        style={{ boxShadow: "0 20px 40px rgba(25,28,29,0.1)" }}
      >
        <div
          className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-4"
          style={{ background: "#ffdad6" }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#93000a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4h6v2" />
          </svg>
        </div>
        <h3
          className="font-bold mb-2"
          style={{ fontFamily: "var(--font-manrope)", fontSize: "1.125rem", color: "#191c1d" }}
        >
          Delete User
        </h3>
        <p className="text-sm mb-1" style={{ color: "#524534" }}>
          <span className="font-semibold">{user.first_name} {user.last_name}</span>
        </p>
        <p className="text-xs mb-6" style={{ color: "#857462" }}>
          {user.email} · This action cannot be undone.
        </p>

        {error && (
          <p className="mb-4 text-xs px-3 py-2 rounded-lg" style={{ background: "#ffdad6", color: "#93000a" }}>
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium"
            style={{ border: "1.5px solid #d7c3ae", color: "#524534" }}
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: "#ba1a1a" }}
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function UsersAdminPage() {
  const { user: me, loading: authLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editTarget, setEditTarget] = useState<AppUser | null>(null);
  const [assignTarget, setAssignTarget] = useState<AppUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AppUser | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!me?.is_admin) {
      router.replace("/dashboard");
      return;
    }
    fetchAllUsers()
      .then(setUsers)
      .finally(() => setLoading(false));
  }, [me, authLoading, router]);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.email.toLowerCase().includes(q) ||
      u.first_name.toLowerCase().includes(q) ||
      u.last_name.toLowerCase().includes(q)
    );
  });

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 rounded-full border-2 border-[#835500] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1
          className="font-bold mb-1"
          style={{ fontFamily: "var(--font-manrope)", fontSize: "1.75rem", color: "#191c1d" }}
        >
          User Management
        </h1>
        <p className="text-sm" style={{ color: "#857462" }}>
          {users.length} user{users.length !== 1 ? "s" : ""} · Admins can edit profiles and assign project roles
        </p>
      </div>

      {/* Search */}
      <div className="mb-6 relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2"
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#857462"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm outline-none"
          style={{
            background: "#ffffff",
            border: "1.5px solid #edeeef",
            color: "#191c1d",
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "#835500")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "#edeeef")}
        />
      </div>

      {/* Table */}
      <div
        className="bg-white rounded-2xl overflow-hidden"
        style={{ boxShadow: "0 4px 20px rgba(25,28,29,0.05)" }}
      >
        {/* Table header */}
        <div
          className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 px-6 py-3 text-xs font-semibold uppercase tracking-wide"
          style={{ background: "#f3f4f5", color: "#524534" }}
        >
          <span>User</span>
          <span />
          <span>Status</span>
          <span>Role</span>
          <span>Actions</span>
        </div>

        {filtered.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm" style={{ color: "#857462" }}>
            {search ? "No users match your search." : "No users found."}
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "#f3f4f5" }}>
            {filtered.map((u) => (
              <div
                key={u.id}
                className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 items-center px-6 py-4"
              >
                {/* Avatar */}
                <Avatar user={u} />

                {/* Name + email */}
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "#191c1d" }}>
                    {u.first_name || u.last_name
                      ? `${u.first_name} ${u.last_name}`.trim()
                      : "—"}
                    {u.is_admin && (
                      <span
                        className="ml-2 text-xs font-medium px-1.5 py-0.5 rounded"
                        style={{ background: "rgba(131,85,0,0.1)", color: "#835500" }}
                      >
                        Admin
                      </span>
                    )}
                  </p>
                  <p className="text-xs truncate mt-0.5" style={{ color: "#857462" }}>{u.email}</p>
                </div>

                {/* Status badge */}
                <Badge active={u.is_active} />

                {/* Joined */}
                <span className="text-xs whitespace-nowrap" style={{ color: "#857462" }}>
                  {new Date(u.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  {/* Edit */}
                  <button
                    onClick={() => setEditTarget(u)}
                    className="p-2 rounded-lg transition-colors"
                    style={{ color: "#524534" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f4f5")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    title="Edit profile"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>

                  {/* Assign to project */}
                  <button
                    onClick={() => setAssignTarget(u)}
                    className="p-2 rounded-lg transition-colors"
                    style={{ color: "#524534" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f4f5")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    title="Assign to project"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <line x1="19" y1="8" x2="19" y2="14" />
                      <line x1="16" y1="11" x2="22" y2="11" />
                    </svg>
                  </button>

                  {/* Delete */}
                  {u.id !== me?.id && (
                    <button
                      onClick={() => setDeleteTarget(u)}
                      className="p-2 rounded-lg transition-colors"
                      style={{ color: "#ba1a1a" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#ffdad6")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      title="Delete user"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        <path d="M10 11v6M14 11v6" />
                        <path d="M9 6V4h6v2" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {editTarget && (
        <EditModal
          user={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={(updated) => {
            setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
            setEditTarget(null);
          }}
        />
      )}
      {assignTarget && (
        <AssignModal user={assignTarget} onClose={() => setAssignTarget(null)} />
      )}
      {deleteTarget && (
        <DeleteModal
          user={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => {
            setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
            setDeleteTarget(null);
          }}
        />
      )}
    </div>
  );
}
