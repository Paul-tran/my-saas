import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Proxy route: GET /api/file?key=...
 * Fetches a presigned URL from the backend, then streams the file to the browser.
 * This avoids MinIO CORS issues in development.
 */
export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;
  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const key = req.nextUrl.searchParams.get("key");
  if (!key) {
    return NextResponse.json({ error: "Missing key param" }, { status: 400 });
  }

  // Get presigned URL from backend
  const urlRes = await fetch(
    `${API_URL}/api/v1/files/url?file_key=${encodeURIComponent(key)}`,
    { headers: { Cookie: `access_token=${accessToken}` } }
  );
  if (!urlRes.ok) {
    return NextResponse.json({ error: "Could not get file URL" }, { status: 502 });
  }
  const { url } = await urlRes.json();

  // Fetch the actual file server-side (no CORS)
  const fileRes = await fetch(url);
  if (!fileRes.ok) {
    return NextResponse.json({ error: "File fetch failed" }, { status: 502 });
  }

  const contentType = fileRes.headers.get("content-type") || "application/octet-stream";
  const body = await fileRes.arrayBuffer();

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
