import { apiFetch } from "@/lib/api";

const BASE = "/api/v1";

export interface Role {
  id: number;
  name: string;
  is_system_role: boolean;
  created_at: string;
}

export interface RolePermission {
  id: number;
  role_id: number;
  module: string;
  action: string;
  allowed: boolean;
}

export async function fetchRoles(): Promise<Role[]> {
  return apiFetch<Role[]>(`${BASE}/roles`);
}

export async function createRole(name: string): Promise<Role> {
  return apiFetch<Role>(`${BASE}/roles`, undefined, {
    method: "POST",
    body: JSON.stringify({ name, is_system_role: false }),
  });
}

export async function renameRole(roleId: number, name: string): Promise<Role> {
  return apiFetch<Role>(`${BASE}/roles/${roleId}`, undefined, {
    method: "PATCH",
    body: JSON.stringify({ name, is_system_role: false }),
  });
}

export async function deleteRole(roleId: number): Promise<void> {
  return apiFetch<void>(`${BASE}/roles/${roleId}`, undefined, { method: "DELETE" });
}

export async function fetchRolePermissions(roleId: number): Promise<RolePermission[]> {
  return apiFetch<RolePermission[]>(`${BASE}/roles/${roleId}/permissions`);
}

export async function saveRolePermissions(
  roleId: number,
  entries: { module: string; action: string; allowed: boolean }[]
): Promise<RolePermission[]> {
  return apiFetch<RolePermission[]>(`${BASE}/roles/${roleId}/permissions`, undefined, {
    method: "PUT",
    body: JSON.stringify(entries),
  });
}
