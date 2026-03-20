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
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);
  return <DrawingViewer documentId={Number(id)} />;
}
