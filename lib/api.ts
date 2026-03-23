const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (isRefreshing && refreshPromise) return refreshPromise;
  isRefreshing = true;
  refreshPromise = fetch(`${API_URL}/api/v1/auth/refresh`, {
    method: "POST",
    credentials: "include",
  }).then((r) => r.ok).finally(() => {
    isRefreshing = false;
    refreshPromise = null;
  });
  return refreshPromise;
}

export async function apiFetch<T>(
  path: string,
  _tokenIgnored?: string,
  options: RequestInit = {}
): Promise<T> {
  const doFetch = () =>
    fetch(`${API_URL}${path}`, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

  let res = await doFetch();

  if (res.status === 401) {
    const ok = await tryRefresh();
    if (ok) {
      res = await doFetch();
    }
  }

  if (res.status === 204) return null as T;

  const data = await res.json();
  if (!res.ok) {
    const detail = data.detail;
    if (Array.isArray(detail)) {
      throw new Error(detail.map((e: any) => `${e.loc?.slice(-1)[0]}: ${e.msg}`).join("; "));
    }
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail) || "API error");
  }
  return data;
}

export async function apiUpload<T>(
  path: string,
  _tokenIgnored?: string,
  formData?: FormData
): Promise<T> {
  const doFetch = () =>
    fetch(`${API_URL}${path}`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });

  let res = await doFetch();

  if (res.status === 401) {
    const ok = await tryRefresh();
    if (ok) res = await doFetch();
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Upload failed");
  return data;
}
