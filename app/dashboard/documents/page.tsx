"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import Sidebar from "../../components/Sidebar";
import ErrorBanner from "../../components/ErrorBanner";
import { useDocuments } from "../../../lib/hooks/useDocuments";

export default function Documents() {
  const { documents, loading, uploading, error, handleUpload, openDocument, handleDelete } = useDocuments();

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar active="documents" />

      <main className="flex-1 px-8 py-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Documents</h2>
          <label className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium cursor-pointer">
            {uploading ? "Uploading..." : "+ Upload Document"}
            <input
              type="file"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(file);
              }}
            />
          </label>
        </div>

        {error && <ErrorBanner message={error} />}

        {loading ? (
          <div className="flex justify-center mt-24">
            <p className="text-gray-400">Loading...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-24 text-center">
            <p className="text-5xl">📄</p>
            <h3 className="mt-4 text-lg font-bold text-gray-800">No documents yet</h3>
            <p className="mt-2 text-gray-500">Upload your first document to get started.</p>
          </div>
        ) : (
          <div className="mt-8 bg-white rounded-xl shadow-sm">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between px-6 py-4 border-b border-gray-100"
              >
                <Link
                  href={`/dashboard/documents/${doc.id}`}
                  className="text-blue-600 font-medium hover:underline"
                >
                  {doc.name}
                </Link>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                    {doc.status}
                  </span>
                  <p className="text-gray-400 text-sm">
                    {new Date(doc.created_at).toLocaleDateString()}
                  </p>
                  <button
                    onClick={() => {
                      if (confirm(`Delete "${doc.name}"?`)) handleDelete(doc.id);
                    }}
                    className="text-xs text-red-500 hover:text-red-700 font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
