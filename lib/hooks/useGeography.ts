"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Site, Location, GeoUnit, Partition,
  fetchSites, createSite, updateSite, deleteSite,
  fetchLocations, createLocation, deleteLocation,
  fetchUnits, createUnit, deleteUnit,
  fetchPartitions, createPartition, deletePartition,
} from "../models/geography";

export function useGeography() {

  const [sites, setSites] = useState<Site[]>([]);
  // Keyed by parent ID, caches child records
  const [locations, setLocations] = useState<Record<number, Location[]>>({});
  const [units, setUnits] = useState<Record<number, GeoUnit[]>>({});
  const [partitions, setPartitions] = useState<Record<number, Partition[]>>({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setSites(await fetchSites());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Lazy loaders
  async function loadLocations(siteId: number) {
    if (locations[siteId]) return;
    try {
      const data = await fetchLocations(siteId, "");
      setLocations((prev) => ({ ...prev, [siteId]: data }));
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function loadUnits(locationId: number) {
    if (units[locationId]) return;
    try {
      const data = await fetchUnits(locationId, "");
      setUnits((prev) => ({ ...prev, [locationId]: data }));
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function loadPartitions(unitId: number) {
    if (partitions[unitId]) return;
    try {
      const data = await fetchPartitions(unitId, "");
      setPartitions((prev) => ({ ...prev, [unitId]: data }));
    } catch (e: any) {
      setError(e.message);
    }
  }

  // --- Site CRUD ---
  async function handleCreateSite(name: string, code: string, address?: string) {
    const site = await createSite({ name, code, address }, "");
    setSites((prev) => [...prev, site]);
  }

  async function handleDeleteSite(id: number) {
    await deleteSite(id, "");
    setSites((prev) => prev.filter((s) => s.id !== id));
    setLocations((prev) => { const n = { ...prev }; delete n[id]; return n; });
  }

  // --- Location CRUD ---
  async function handleCreateLocation(siteId: number, name: string, code?: string) {
    const loc = await createLocation({ site_id: siteId, name, code }, "");
    setLocations((prev) => ({ ...prev, [siteId]: [...(prev[siteId] ?? []), loc] }));
  }

  async function handleDeleteLocation(id: number, siteId: number) {
    await deleteLocation(id, "");
    setLocations((prev) => ({
      ...prev,
      [siteId]: (prev[siteId] ?? []).filter((l) => l.id !== id),
    }));
    setUnits((prev) => { const n = { ...prev }; delete n[id]; return n; });
  }

  // --- Unit CRUD ---
  async function handleCreateUnit(locationId: number, name: string, code?: string) {
    const unit = await createUnit({ location_id: locationId, name, code }, "");
    setUnits((prev) => ({ ...prev, [locationId]: [...(prev[locationId] ?? []), unit] }));
  }

  async function handleDeleteUnit(id: number, locationId: number) {
    await deleteUnit(id, "");
    setUnits((prev) => ({
      ...prev,
      [locationId]: (prev[locationId] ?? []).filter((u) => u.id !== id),
    }));
    setPartitions((prev) => { const n = { ...prev }; delete n[id]; return n; });
  }

  // --- Partition CRUD ---
  async function handleCreatePartition(unitId: number, name: string, code?: string) {
    const part = await createPartition({ unit_id: unitId, name, code }, "");
    setPartitions((prev) => ({ ...prev, [unitId]: [...(prev[unitId] ?? []), part] }));
  }

  async function handleDeletePartition(id: number, unitId: number) {
    await deletePartition(id, "");
    setPartitions((prev) => ({
      ...prev,
      [unitId]: (prev[unitId] ?? []).filter((p) => p.id !== id),
    }));
  }

  return {
    sites, locations, units, partitions,
    loading, error,
    loadLocations, loadUnits, loadPartitions,
    handleCreateSite, handleDeleteSite,
    handleCreateLocation, handleDeleteLocation,
    handleCreateUnit, handleDeleteUnit,
    handleCreatePartition, handleDeletePartition,
  };
}
