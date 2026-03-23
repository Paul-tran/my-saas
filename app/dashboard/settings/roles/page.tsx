"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter } from "next/navigation";
import {
  Role,
  fetchRoles,
  createRole,
  renameRole,
  deleteRole,
  fetchRolePermissions,
  saveRolePermissions,
} from "@/lib/models/roles";
import { AppUser, fetchAllUsers, updateUser } from "@/lib/models/users";

// ─── Permission matrix definition ────────────────────────────────────────────

const MODULES: { key: string; label: string; icon: string; actions: string[] }[] = [
  { key: "documents",    label: "Documents",       icon: "folder_open",    actions: ["view", "upload", "edit", "delete"] },
  { key: "assets",       label: "Assets",          icon: "construction",   actions: ["view", "create", "edit", "delete"] },
  { key: "work_orders",  label: "Work Orders",     icon: "assignment",     actions: ["view", "create", "edit", "delete"] },
  { key: "commissioning",label: "Commissioning",   icon: "verified",       actions: ["view", "create", "edit"] },
  { key: "billing",      label: "Billing",         icon: "credit_card",    actions: ["view"] },
  { key: "geography",    label: "Geography",       icon: "location_on",    actions: ["view", "manage"] },
  { key: "systems",      label: "Systems",         icon: "account_tree",   actions: ["view", "manage"] },
  { key: "users",        label: "Users & Roles",   icon: "group",          actions: ["view", "manage"] },
];

const ALL_ACTIONS = ["view", "upload", "create", "edit", "delete", "manage"];

type PermMatrix = Record<string, Record<string, boolean>>; // module → action → allowed

function buildMatrix(perms: { module: string; action: string; allowed: boolean }[]): PermMatrix {
  const m: PermMatrix = {};
  for (const mod of MODULES) {
    m[mod.key] = {};
    for (const act of mod.actions) m[mod.key][act] = false;
  }
  for (const p of perms) {
    if (m[p.module]) m[p.module][p.action] = p.allowed;
  }
  return m;
}

function flattenMatrix(matrix: PermMatrix) {
  const entries: { module: string; action: string; allowed: boolean }[] = [];
  for (const [mod, actions] of Object.entries(matrix)) {
    for (const [act, allowed] of Object.entries(actions)) {
      entries.push({ module: mod, action: act, allowed });
    }
  }
  return entries;
}

// ─── Delete confirm modal ─────────────────────────────────────────────────────

function DeleteRoleModal({
  role,
  onClose,
  onDeleted,
}: {
  role: Role;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handle() {
    setDeleting(true);
    try {
      await deleteRole(role.id);
      onDeleted();
    } catch (e: any) {
      setError(e.message);
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-8 text-center" style={{ boxShadow: "0 20px 40px rgba(25,28,29,0.1)" }}>
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-4" style={{ background: "#ffdad6" }}>
          <span className="material-symbols-outlined" style={{ color: "#93000a", fontSize: "22px" }}>delete</span>
        </div>
        <h3 className="font-bold mb-2" style={{ fontFamily: "var(--font-manrope)", fontSize: "1.1rem", color: "#191c1d" }}>
          Delete "{role.name}"?
        </h3>
        <p className="text-sm mb-6" style={{ color: "#857462" }}>
          Users assigned this role will lose their project access. This cannot be undone.
        </p>
        {error && <p className="text-xs mb-4 px-3 py-2 rounded-lg" style={{ background: "#ffdad6", color: "#93000a" }}>{error}</p>}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg text-sm font-medium" style={{ border: "1.5px solid #d7c3ae", color: "#524534" }}>Cancel</button>
          <button onClick={handle} disabled={deleting} className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50" style={{ background: "#ba1a1a" }}>
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function RolesPage() {
  const { user: me, loading: authLoading } = useAuth();
  const router = useRouter();

  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [matrix, setMatrix] = useState<PermMatrix>({});
  const [loadingPerms, setLoadingPerms] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // New role
  const [newRoleName, setNewRoleName] = useState("");
  const [creatingRole, setCreatingRole] = useState(false);

  // Rename
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);

  // Users tab
  const [activeTab, setActiveTab] = useState<"permissions" | "users">("permissions");
  const [allUsers, setAllUsers] = useState<AppUser[]>([]);
  const [showAssignPicker, setShowAssignPicker] = useState(false);
  const [userSearch, setUserSearch] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!me?.is_admin) { router.replace("/dashboard"); return; }
    fetchRoles()
      .then((r) => { setRoles(r); if (r.length) setSelectedId(r[0].id); })
      .finally(() => setLoading(false));
  }, [me, authLoading, router]);

  // Load permissions when selection changes
  useEffect(() => {
    if (!selectedId) return;
    setLoadingPerms(true);
    setSaveMsg(null);
    setActiveTab("permissions");
    fetchRolePermissions(selectedId)
      .then((perms) => setMatrix(buildMatrix(perms)))
      .finally(() => setLoadingPerms(false));
  }, [selectedId]);

  // Load all users once
  useEffect(() => {
    if (!me?.is_admin) return;
    fetchAllUsers().then(setAllUsers).catch(() => {});
  }, [me]);

  async function handleCreateRole(e: React.FormEvent) {
    e.preventDefault();
    if (!newRoleName.trim()) return;
    setCreatingRole(true);
    try {
      const role = await createRole(newRoleName.trim());
      setRoles((prev) => [...prev, role]);
      setSelectedId(role.id);
      setNewRoleName("");
    } finally {
      setCreatingRole(false);
    }
  }

  async function handleRename(role: Role) {
    if (!editingName.trim() || editingName === role.name) { setEditingId(null); return; }
    try {
      const updated = await renameRole(role.id, editingName.trim());
      setRoles((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    } finally {
      setEditingId(null);
    }
  }

  async function handleSavePermissions() {
    if (!selectedId) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      await saveRolePermissions(selectedId, flattenMatrix(matrix));
      setSaveMsg({ type: "ok", text: "Permissions saved." });
    } catch (e: any) {
      setSaveMsg({ type: "err", text: e.message });
    } finally {
      setSaving(false);
    }
  }

  function toggle(mod: string, action: string) {
    setMatrix((prev) => ({
      ...prev,
      [mod]: { ...prev[mod], [action]: !prev[mod]?.[action] },
    }));
    setSaveMsg(null);
  }

  function toggleAll(mod: string) {
    const modDef = MODULES.find((m) => m.key === mod)!;
    const allOn = modDef.actions.every((a) => matrix[mod]?.[a]);
    setMatrix((prev) => ({
      ...prev,
      [mod]: Object.fromEntries(modDef.actions.map((a) => [a, !allOn])),
    }));
    setSaveMsg(null);
  }

  async function handleAssignUser(user: AppUser) {
    if (!selectedId) return;
    const updated = await updateUser(user.id, { project_role_id: selectedId });
    setAllUsers((prev) => prev.map((u) => (u.id === updated.id ? { ...u, role_id: selectedId, role_name: selectedRole?.name ?? u.role_name } : u)));
    setShowAssignPicker(false);
    setUserSearch("");
  }

  async function handleRemoveUser(user: AppUser) {
    const updated = await updateUser(user.id, { project_role_id: null });
    setAllUsers((prev) => prev.map((u) => (u.id === updated.id ? { ...u, role_id: null, role_name: null } : u)));
  }

  const assignedUsers = allUsers.filter((u) => u.role_id === selectedId);
  const unassignedUsers = allUsers.filter(
    (u) => u.role_id !== selectedId &&
      (u.first_name + " " + u.last_name + " " + u.email).toLowerCase().includes(userSearch.toLowerCase())
  );

  const selectedRole = roles.find((r) => r.id === selectedId);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#835500", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <div className="px-6 py-8" style={{ fontFamily: "var(--font-inter, Inter, sans-serif)" }}>
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@400,0&display=swap" rel="stylesheet" />

      {/* Page header */}
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="font-bold mb-1" style={{ fontFamily: "var(--font-manrope)", fontSize: "1.75rem", color: "#191c1d" }}>
            Roles & Permissions
          </h1>
          <p className="text-sm" style={{ color: "#857462" }}>
            Define what each role can see and do across the platform.
          </p>
        </div>
      </div>

      <div className="flex gap-6 items-start">

        {/* ── Left: Role list ── */}
        <div className="w-64 flex-shrink-0">
          {/* New role form */}
          <form onSubmit={handleCreateRole} className="mb-4">
            <div className="flex gap-2">
              <input
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                placeholder="New role name…"
                className="flex-1 text-sm px-3 py-2 rounded-lg outline-none"
                style={{ background: "#fff", border: "1.5px solid #edeeef", color: "#191c1d" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#835500")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#edeeef")}
              />
              <button
                type="submit"
                disabled={creatingRole || !newRoleName.trim()}
                className="px-3 py-2 rounded-lg text-white text-sm font-semibold disabled:opacity-40"
                style={{ background: "linear-gradient(135deg,#835500,#f5a623)" }}
                title="Create role"
              >
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add</span>
              </button>
            </div>
          </form>

          {/* Role list */}
          <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: "0 4px 20px rgba(25,28,29,0.05)" }}>
            {roles.map((role) => (
              <div
                key={role.id}
                onClick={() => { setSelectedId(role.id); setEditingId(null); }}
                className="flex items-center gap-2 px-4 py-3 cursor-pointer group transition-colors"
                style={{
                  background: selectedId === role.id ? "rgba(131,85,0,0.06)" : "transparent",
                  borderLeft: selectedId === role.id ? "3px solid #835500" : "3px solid transparent",
                }}
              >
                {editingId === role.id ? (
                  <input
                    autoFocus
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={() => handleRename(role)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleRename(role); if (e.key === "Escape") setEditingId(null); }}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 text-sm outline-none bg-transparent"
                    style={{ borderBottom: "1.5px solid #835500", color: "#191c1d", padding: "1px 0" }}
                  />
                ) : (
                  <span className="flex-1 text-sm font-medium truncate" style={{ color: "#191c1d" }}>
                    {role.name}
                    {role.is_system_role && (
                      <span className="ml-1.5 text-xs" style={{ color: "#857462" }}>·</span>
                    )}
                  </span>
                )}

                {/* Actions — show on hover */}
                {editingId !== role.id && (
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => { setEditingId(role.id); setEditingName(role.name); }}
                      className="p-1 rounded hover:bg-black/5"
                      title="Rename"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "14px", color: "#524534" }}>edit</span>
                    </button>
                    {!role.is_system_role && (
                      <button
                        onClick={() => setDeleteTarget(role)}
                        className="p-1 rounded hover:bg-red-50"
                        title="Delete"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: "14px", color: "#ba1a1a" }}>delete</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: Permission matrix ── */}
        <div className="flex-1 min-w-0">
          {!selectedRole ? (
            <div className="flex items-center justify-center h-48 text-sm" style={{ color: "#857462" }}>
              Select or create a role to manage permissions.
            </div>
          ) : (
            <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: "0 4px 20px rgba(25,28,29,0.05)" }}>
              {/* Header */}
              <div className="px-6 pt-4 pb-0" style={{ borderBottom: "1px solid rgba(215,195,174,0.15)" }}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h2 className="font-bold" style={{ fontFamily: "var(--font-manrope)", fontSize: "1rem", color: "#191c1d" }}>
                      {selectedRole.name}
                    </h2>
                    <p className="text-xs mt-0.5" style={{ color: "#857462" }}>
                      {selectedRole.is_system_role ? "System role — name is locked" : "Custom role"}
                    </p>
                  </div>
                  {activeTab === "permissions" && (
                    <div className="flex items-center gap-3">
                      {saveMsg && (
                        <span className="text-xs font-medium" style={{ color: saveMsg.type === "ok" ? "#15803d" : "#ba1a1a" }}>
                          {saveMsg.text}
                        </span>
                      )}
                      <button
                        onClick={handleSavePermissions}
                        disabled={saving || loadingPerms}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                        style={{ background: "linear-gradient(135deg,#835500,#f5a623)" }}
                      >
                        {saving ? (
                          <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        ) : (
                          <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>save</span>
                        )}
                        Save Permissions
                      </button>
                    </div>
                  )}
                  {activeTab === "users" && (
                    <button
                      onClick={() => setShowAssignPicker(true)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
                      style={{ background: "linear-gradient(135deg,#835500,#f5a623)" }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>person_add</span>
                      Assign User
                    </button>
                  )}
                </div>
                {/* Tabs */}
                <div className="flex gap-1">
                  {(["permissions", "users"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className="px-4 py-2 text-sm font-medium capitalize transition-colors"
                      style={{
                        color: activeTab === tab ? "#835500" : "#857462",
                        borderBottom: activeTab === tab ? "2px solid #835500" : "2px solid transparent",
                      }}
                    >
                      {tab === "users" ? `Assigned Users (${assignedUsers.length})` : "Permissions"}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Assigned Users tab ── */}
              {activeTab === "users" && (
                <div className="p-6">
                  {assignedUsers.length === 0 ? (
                    <div className="text-center py-12">
                      <span className="material-symbols-outlined" style={{ fontSize: "36px", color: "#d7c3ae", display: "block", marginBottom: "8px" }}>group</span>
                      <p className="text-sm font-semibold" style={{ color: "#191c1d" }}>No users assigned</p>
                      <p className="text-xs mt-1" style={{ color: "#857462" }}>Click "Assign User" to add people to this role.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {assignedUsers.map((u) => (
                        <div key={u.id} className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: "#f8f9fa" }}>
                          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-white"
                            style={{ background: "linear-gradient(135deg,#835500,#f5a623)" }}>
                            {(u.first_name?.[0] ?? u.email[0]).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate" style={{ color: "#191c1d" }}>
                              {u.first_name || u.last_name ? `${u.first_name} ${u.last_name}`.trim() : u.email}
                            </p>
                            <p className="text-xs truncate" style={{ color: "#857462" }}>{u.email}</p>
                          </div>
                          <button
                            onClick={() => handleRemoveUser(u)}
                            className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                            title="Remove from role"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "#ba1a1a" }}>person_remove</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── Assign user picker modal ── */}
              {showAssignPicker && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4">
                  <div className="bg-white rounded-2xl w-full max-w-sm p-6" style={{ boxShadow: "0 20px 40px rgba(25,28,29,0.12)" }}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold" style={{ fontFamily: "var(--font-manrope)", fontSize: "1rem", color: "#191c1d" }}>
                        Assign to {selectedRole.name}
                      </h3>
                      <button onClick={() => { setShowAssignPicker(false); setUserSearch(""); }} className="p-1 rounded hover:bg-black/5">
                        <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "#857462" }}>close</span>
                      </button>
                    </div>
                    <input
                      autoFocus
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="Search users…"
                      className="w-full text-sm px-3 py-2 rounded-lg outline-none mb-3"
                      style={{ background: "#f3f4f5", border: "1.5px solid transparent", color: "#191c1d" }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "#835500")}
                      onBlur={(e) => (e.currentTarget.style.borderColor = "transparent")}
                    />
                    <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
                      {unassignedUsers.length === 0 && (
                        <p className="text-xs text-center py-6" style={{ color: "#857462" }}>
                          {userSearch ? "No users match your search." : "All users already have a role assigned."}
                        </p>
                      )}
                      {unassignedUsers.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => handleAssignUser(u)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors hover:bg-orange-50"
                        >
                          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
                            style={{ background: "linear-gradient(135deg,#835500,#f5a623)" }}>
                            {(u.first_name?.[0] ?? u.email[0]).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate" style={{ color: "#191c1d" }}>
                              {u.first_name || u.last_name ? `${u.first_name} ${u.last_name}`.trim() : u.email}
                            </p>
                            <p className="text-xs truncate" style={{ color: "#857462" }}>
                              {u.role_name ? `Currently: ${u.role_name}` : u.email}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Permissions tab ── */}
              {activeTab === "permissions" && (loadingPerms ? (
                <div className="flex items-center justify-center h-48">
                  <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#835500", borderTopColor: "transparent" }} />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr style={{ background: "#f3f4f5" }}>
                        <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide" style={{ color: "#524534", width: "220px" }}>
                          Module
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide" style={{ color: "#524534", width: "60px" }}>
                          All
                        </th>
                        {ALL_ACTIONS.map((action) => (
                          <th key={action} className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide capitalize" style={{ color: "#524534" }}>
                            {action}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {MODULES.map((mod, i) => {
                        const allOn = mod.actions.every((a) => matrix[mod.key]?.[a]);
                        return (
                          <tr
                            key={mod.key}
                            style={{ borderBottom: i < MODULES.length - 1 ? "1px solid rgba(215,195,174,0.1)" : "none" }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "#fafafa")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                          >
                            {/* Module label */}
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(131,85,0,0.07)" }}>
                                  <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "#835500" }}>{mod.icon}</span>
                                </div>
                                <span className="text-sm font-semibold" style={{ color: "#191c1d" }}>{mod.label}</span>
                              </div>
                            </td>

                            {/* Toggle all */}
                            <td className="px-4 py-4 text-center">
                              <button
                                onClick={() => toggleAll(mod.key)}
                                className="w-5 h-5 rounded flex items-center justify-center mx-auto transition-colors"
                                style={{ background: allOn ? "#835500" : "#f3f4f5", border: allOn ? "none" : "1.5px solid #d7c3ae" }}
                                title="Toggle all"
                              >
                                {allOn && <span className="material-symbols-outlined" style={{ fontSize: "12px", color: "#fff" }}>check</span>}
                              </button>
                            </td>

                            {/* Per-action toggles */}
                            {ALL_ACTIONS.map((action) => {
                              const applicable = mod.actions.includes(action);
                              const checked = applicable && !!matrix[mod.key]?.[action];
                              return (
                                <td key={action} className="px-4 py-4 text-center">
                                  {applicable ? (
                                    <button
                                      onClick={() => toggle(mod.key, action)}
                                      className="w-5 h-5 rounded flex items-center justify-center mx-auto transition-colors"
                                      style={{ background: checked ? "#835500" : "#f3f4f5", border: checked ? "none" : "1.5px solid #d7c3ae" }}
                                    >
                                      {checked && <span className="material-symbols-outlined" style={{ fontSize: "12px", color: "#fff" }}>check</span>}
                                    </button>
                                  ) : (
                                    <div className="w-5 h-5 mx-auto rounded" style={{ background: "#f3f4f5", opacity: 0.3 }} />
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete modal */}
      {deleteTarget && (
        <DeleteRoleModal
          role={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => {
            setRoles((prev) => prev.filter((r) => r.id !== deleteTarget.id));
            if (selectedId === deleteTarget.id) setSelectedId(roles.find((r) => r.id !== deleteTarget.id)?.id ?? null);
            setDeleteTarget(null);
          }}
        />
      )}
    </div>
  );
}
