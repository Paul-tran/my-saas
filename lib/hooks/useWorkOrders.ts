import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  WorkOrder, WorkOrderCreate, WorkOrderUpdate,
  fetchWorkOrders, createWorkOrder, updateWorkOrder, deleteWorkOrder,
} from "../models/workorders";

const PROJECT_ID = Number(process.env.NEXT_PUBLIC_DEFAULT_PROJECT_ID || 1);

export function useWorkOrders() {
  const { getToken } = useAuth();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const token = await getToken();
      setWorkOrders(await fetchWorkOrders(PROJECT_ID, token!));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(data: WorkOrderCreate) {
    try {
      const token = await getToken();
      const wo = await createWorkOrder(PROJECT_ID, data, token!);
      setWorkOrders((prev) => [wo, ...prev]);
      return wo;
    } catch (e: any) { setError(e.message); throw e; }
  }

  async function handleUpdate(woId: number, data: WorkOrderUpdate) {
    try {
      const token = await getToken();
      const updated = await updateWorkOrder(woId, data, token!);
      setWorkOrders((prev) => prev.map((w) => (w.id === woId ? updated : w)));
      return updated;
    } catch (e: any) { setError(e.message); }
  }

  async function handleDelete(woId: number) {
    try {
      const token = await getToken();
      await deleteWorkOrder(woId, token!);
      setWorkOrders((prev) => prev.filter((w) => w.id !== woId));
    } catch (e: any) { setError(e.message); }
  }

  return { workOrders, loading, error, handleCreate, handleUpdate, handleDelete, reload: load };
}
