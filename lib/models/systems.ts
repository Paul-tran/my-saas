import { apiFetch } from "../api";

export type SystemLevelConfig = {
  id: number;
  project_id: number;
  level1_name: string;
  level2_name: string;
  level3_name: string;
};

export type SystemDiscipline = {
  id: number;
  project_id: number;
  name: string;
  code: string;
};

export type SystemGroup = {
  id: number;
  discipline_id: number;
  name: string;
  code: string;
};

export type SystemSubgroup = {
  id: number;
  group_id: number;
  name: string;
  code: string;
};

// --- Level Config ---

export async function fetchSystemConfig(projectId: number, token: string): Promise<SystemLevelConfig> {
  return apiFetch(`/api/v1/projects/${projectId}/systems/config`, token);
}

export async function updateSystemConfig(
  projectId: number,
  data: Partial<Pick<SystemLevelConfig, "level1_name" | "level2_name" | "level3_name">>,
  token: string
): Promise<SystemLevelConfig> {
  return apiFetch(`/api/v1/projects/${projectId}/systems/config`, token, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// --- Disciplines (Level 1) ---

export async function fetchDisciplines(projectId: number, token: string): Promise<SystemDiscipline[]> {
  return apiFetch(`/api/v1/projects/${projectId}/systems/disciplines`, token);
}

export async function fetchDiscipline(id: number, token: string): Promise<SystemDiscipline> {
  return apiFetch(`/api/v1/systems/disciplines/${id}`, token);
}

export async function createDiscipline(
  projectId: number,
  data: { name: string; code: string },
  token: string
): Promise<SystemDiscipline> {
  return apiFetch(`/api/v1/projects/${projectId}/systems/disciplines`, token, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteDiscipline(id: number, token: string): Promise<void> {
  return apiFetch(`/api/v1/systems/disciplines/${id}`, token, { method: "DELETE" });
}

// --- Groups (Level 2) ---

export async function fetchGroups(disciplineId: number, token: string): Promise<SystemGroup[]> {
  return apiFetch(`/api/v1/systems/disciplines/${disciplineId}/groups`, token);
}

export async function fetchGroup(id: number, token: string): Promise<SystemGroup> {
  return apiFetch(`/api/v1/systems/groups/${id}`, token);
}

export async function createGroup(
  disciplineId: number,
  data: { name: string; code: string },
  token: string
): Promise<SystemGroup> {
  return apiFetch(`/api/v1/systems/disciplines/${disciplineId}/groups`, token, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteGroup(id: number, token: string): Promise<void> {
  return apiFetch(`/api/v1/systems/groups/${id}`, token, { method: "DELETE" });
}

// --- Subgroups (Level 3) ---

export async function fetchSubgroups(groupId: number, token: string): Promise<SystemSubgroup[]> {
  return apiFetch(`/api/v1/systems/groups/${groupId}/subgroups`, token);
}

export async function fetchSubgroup(id: number, token: string): Promise<SystemSubgroup> {
  return apiFetch(`/api/v1/systems/subgroups/${id}`, token);
}

export async function createSubgroup(
  groupId: number,
  data: { name: string; code: string },
  token: string
): Promise<SystemSubgroup> {
  return apiFetch(`/api/v1/systems/groups/${groupId}/subgroups`, token, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteSubgroup(id: number, token: string): Promise<void> {
  return apiFetch(`/api/v1/systems/subgroups/${id}`, token, { method: "DELETE" });
}
