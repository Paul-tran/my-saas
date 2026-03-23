import { apiFetch } from "@/lib/api";

const BASE = "/api/v1";

export interface AppUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  avatar_key: string | null;
  is_active: boolean;
  is_verified: boolean;
  is_admin: boolean;
  created_at: string;
}

export interface AdminUserUpdate {
  first_name?: string;
  last_name?: string;
  email?: string;
  is_active?: boolean;
  is_admin?: boolean;
}

export async function fetchAllUsers(): Promise<AppUser[]> {
  return apiFetch<AppUser[]>(`${BASE}/admin/users`);
}

export async function fetchUser(userId: number): Promise<AppUser> {
  return apiFetch<AppUser>(`${BASE}/admin/users/${userId}`);
}

export async function updateUser(userId: number, data: AdminUserUpdate): Promise<AppUser> {
  return apiFetch<AppUser>(`${BASE}/admin/users/${userId}`, undefined, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteUser(userId: number): Promise<void> {
  return apiFetch<void>(`${BASE}/admin/users/${userId}`, undefined, {
    method: "DELETE",
  });
}

export async function fetchRoles() {
  return apiFetch<{ id: number; name: string; is_system_role: boolean }[]>(`${BASE}/roles`);
}

export async function fetchProjects() {
  return apiFetch<{ id: number; name: string }[]>(`${BASE}/projects`);
}

export async function addProjectMember(projectId: number, userId: number, roleId: number) {
  return apiFetch(`${BASE}/projects/${projectId}/members`, undefined, {
    method: "POST",
    body: JSON.stringify({ project_id: projectId, user_id: userId, role_id: roleId }),
  });
}
