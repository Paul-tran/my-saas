import { useState, useEffect } from "react";
import {
  WorkOrder, WorkOrderCreate, WorkOrderUpdate,
  fetchWorkOrders, createWorkOrder, updateWorkOrder, deleteWorkOrder,
} from "../models/workorders";

const PROJECT_ID = Number(process.env.NEXT_PUBLIC_DEFAULT_PROJECT_ID || 1);

export function useWorkOrders() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      setWorkOrders(await fetchWorkOrders(PROJECT_ID, ""));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(data: WorkOrderCreate) {
    try {
      const wo = await createWorkOrder(PROJECT_ID, data, "");
      setWorkOrders((prev) => [wo, ...prev]);
      return wo;
    } catch (e: any) { setError(e.message); throw e; }
  }

  async function handleUpdate(woId: number, data: WorkOrderUpdate) {
    try {
      const updated = await updateWorkOrder(woId, data, "");
      setWorkOrders((prev) => prev.map((w) => (w.id === woId ? updated : w)));
      return updated;
    } catch (e: any) { setError(e.message); }
  }

  async function handleDelete(woId: number) {
    try {
      await deleteWorkOrder(woId, "");
      setWorkOrders((prev) => prev.filter((w) => w.id !== woId));
    } catch (e: any) { setError(e.message); }
  }

  return { workOrders, loading, error, handleCreate, handleUpdate, handleDelete, reload: load };
}
