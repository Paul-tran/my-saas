import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { WOType, WOTypeCreate, WOTypeUpdate, fetchWOTypes, createWOType, updateWOType, deleteWOType } from "../models/wotypes";

const PROJECT_ID = Number(process.env.NEXT_PUBLIC_DEFAULT_PROJECT_ID || 1);

export function useWOTypes() {
  const { getToken } = useAuth();
  const [woTypes, setWOTypes] = useState<WOType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        setWOTypes(await fetchWOTypes(PROJECT_ID, token!));
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleCreate(data: WOTypeCreate) {
    try {
      const token = await getToken();
      const wt = await createWOType(PROJECT_ID, data, token!);
      setWOTypes((prev) => [...prev, wt]);
      return wt;
    } catch (e: any) { setError(e.message); }
  }

  async function handleUpdate(typeId: number, data: WOTypeUpdate) {
    try {
      const token = await getToken();
      const updated = await updateWOType(typeId, data, token!);
      setWOTypes((prev) => prev.map((t) => (t.id === typeId ? updated : t)));
      return updated;
    } catch (e: any) { setError(e.message); }
  }

  async function handleDelete(typeId: number) {
    try {
      const token = await getToken();
      await deleteWOType(typeId, token!);
      setWOTypes((prev) => prev.filter((t) => t.id !== typeId));
    } catch (e: any) { setError(e.message); }
  }

  return { woTypes, loading, error, handleCreate, handleUpdate, handleDelete };
}
