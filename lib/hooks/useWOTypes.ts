import { useState, useEffect } from "react";
import { WOType, WOTypeCreate, WOTypeUpdate, fetchWOTypes, createWOType, updateWOType, deleteWOType } from "../models/wotypes";

const PROJECT_ID = Number(process.env.NEXT_PUBLIC_DEFAULT_PROJECT_ID || 1);

export function useWOTypes() {
  const [woTypes, setWOTypes] = useState<WOType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setWOTypes(await fetchWOTypes(PROJECT_ID, ""));
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleCreate(data: WOTypeCreate) {
    try {
      const wt = await createWOType(PROJECT_ID, data, "");
      setWOTypes((prev) => [...prev, wt]);
      return wt;
    } catch (e: any) { setError(e.message); }
  }

  async function handleUpdate(typeId: number, data: WOTypeUpdate) {
    try {
      const updated = await updateWOType(typeId, data, "");
      setWOTypes((prev) => prev.map((t) => (t.id === typeId ? updated : t)));
      return updated;
    } catch (e: any) { setError(e.message); }
  }

  async function handleDelete(typeId: number) {
    try {
      await deleteWOType(typeId, "");
      setWOTypes((prev) => prev.filter((t) => t.id !== typeId));
    } catch (e: any) { setError(e.message); }
  }

  return { woTypes, loading, error, handleCreate, handleUpdate, handleDelete };
}
