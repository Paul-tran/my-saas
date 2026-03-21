"use client";

export const dynamic = "force-dynamic";

import React from "react";
import dynamicImport from "next/dynamic";

// pdfjs requires browser APIs — disable SSR
const DrawingViewer = dynamicImport(() => import("./DrawingViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <p className="text-gray-400">Loading viewer...</p>
    </div>
  ),
});

export default function DocumentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { id } = React.use(params);
  const { page } = React.use(searchParams);
  return <DrawingViewer documentId={Number(id)} initialPage={page ? Number(page) : 1} />;
}
