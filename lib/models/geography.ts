import { apiFetch } from "../api";

export type Site = {
  id: number;
  name: string;
  code: string;
  address: string | null;
  created_at: string;
  updated_at: string;
};

export type Location = {
  id: number;
  site_id: number;
  name: string;
  code: string | null;
  is_na: boolean;
  created_at: string;
};

export type GeoUnit = {
  id: number;
  location_id: number;
  name: string;
  code: string | null;
  is_na: boolean;
  created_at: string;
};

export type Partition = {
  id: number;
  unit_id: number;
  name: string;
  code: string | null;
  is_na: boolean;
  created_at: string;
};

// --- Sites ---

export async function fetchSites(token: string): Promise<Site[]> {
  return apiFetch("/api/v1/geography/sites", token);
}

export async function fetchSite(id: number, token: string): Promise<Site> {
  return apiFetch(`/api/v1/geography/sites/${id}`, token);
}

export async function fetchLocation(id: number, token: string): Promise<Location> {
  return apiFetch(`/api/v1/geography/locations/${id}`, token);
}

export async function fetchUnit(id: number, token: string): Promise<GeoUnit> {
  return apiFetch(`/api/v1/geography/units/${id}`, token);
}

export async function fetchPartition(id: number, token: string): Promise<Partition> {
  return apiFetch(`/api/v1/geography/partitions/${id}`, token);
}

export async function createSite(
  data: { name: string; code: string; address?: string },
  token: string
): Promise<Site> {
  return apiFetch("/api/v1/geography/sites", token, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateSite(
  id: number,
  data: { name?: string; code?: string; address?: string },
  token: string
): Promise<Site> {
  return apiFetch(`/api/v1/geography/sites/${id}`, token, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteSite(id: number, token: string): Promise<void> {
  return apiFetch(`/api/v1/geography/sites/${id}`, token, { method: "DELETE" });
}

// --- Locations ---

export async function fetchLocations(siteId: number, token: string): Promise<Location[]> {
  return apiFetch(`/api/v1/geography/sites/${siteId}/locations`, token);
}

export async function createLocation(
  data: { site_id: number; name: string; code?: string },
  token: string
): Promise<Location> {
  return apiFetch("/api/v1/geography/locations", token, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteLocation(id: number, token: string): Promise<void> {
  return apiFetch(`/api/v1/geography/locations/${id}`, token, { method: "DELETE" });
}

// --- Units ---

export async function fetchUnits(locationId: number, token: string): Promise<GeoUnit[]> {
  return apiFetch(`/api/v1/geography/locations/${locationId}/units`, token);
}

export async function createUnit(
  data: { location_id: number; name: string; code?: string },
  token: string
): Promise<GeoUnit> {
  return apiFetch("/api/v1/geography/units", token, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteUnit(id: number, token: string): Promise<void> {
  return apiFetch(`/api/v1/geography/units/${id}`, token, { method: "DELETE" });
}

// --- Partitions ---

export async function fetchPartitions(unitId: number, token: string): Promise<Partition[]> {
  return apiFetch(`/api/v1/geography/units/${unitId}/partitions`, token);
}

export async function createPartition(
  data: { unit_id: number; name: string; code?: string },
  token: string
): Promise<Partition> {
  return apiFetch("/api/v1/geography/partitions", token, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deletePartition(id: number, token: string): Promise<void> {
  return apiFetch(`/api/v1/geography/partitions/${id}`, token, { method: "DELETE" });
}
