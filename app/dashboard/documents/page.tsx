"use client";

import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import { supabase } from "../../../lib/supabase";

type Document = {
  id: number;
  name: string;
  url: string;
  uploaded_at: string;
};

export default function Documents() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState(false);

  async function fetchDocuments() {
    const { data, error } = await supabase.from("documents").select("*");
    if (!error && data) setDocuments(data);
  }

  useEffect(() => {
    fetchDocuments();
  }, []);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    const fileName = `${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(fileName, file);

    if (uploadError) {
      alert("Upload failed: " + uploadError.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("documents")
      .getPublicUrl(fileName);

    await supabase.from("documents").insert({
      name: file.name,
      url: urlData.publicUrl,
      uploaded_at: new Date().toISOString(),
    });

    await fetchDocuments();
    setUploading(false);
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar active="documents" />

      <main className="flex-1 px-8 py-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Documents</h2>
          <label className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium cursor-pointer">
            {uploading ? "Uploading..." : "+ Upload Document"}
            <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
        </div>

        {documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-24 text-center">
            <p className="text-5xl">📄</p>
            <h3 className="mt-4 text-lg font-bold text-gray-800">No documents yet</h3>
            <p className="mt-2 text-gray-500">Upload your first document to get started.</p>
          </div>
        ) : (
          <div className="mt-8 bg-white rounded-xl shadow-sm">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <a href={doc.url} target="_blank" className="text-blue-600 font-medium hover:underline">
                  {doc.name}
                </a>
                <p className="text-gray-400 text-sm">{new Date(doc.uploaded_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}