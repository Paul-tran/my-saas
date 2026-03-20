"use client";

import { useEffect, useRef, useState } from "react";
import { useDrawingViewer } from "../../../../lib/hooks/useDrawingViewer";
import Sidebar from "../../../components/Sidebar";
import { Pin } from "../../../../lib/models/drawings";

const PIN_COLOR: Record<string, string> = {
  pending: "bg-amber-400 border-amber-600",
  confirmed: "bg-green-500 border-green-700",
  dismissed: "bg-gray-400 border-gray-600",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed — asset created",
  dismissed: "Dismissed",
};

export default function DrawingViewer({ documentId }: { documentId: number }) {
  const {
    document,
    pdfUrl,
    pinsForPage,
    selectedPin,
    selectedPinId,
    currentPage,
    analyzing,
    loading,
    error,
    setSelectedPinId,
    setCurrentPage,
    handleAnalyze,
    handleConfirm,
    handleDismiss,
  } = useDrawingViewer(documentId);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const [numPages, setNumPages] = useState(0);
  const [canvasDims, setCanvasDims] = useState({ width: 0, height: 0 });
  const [siteId, setSiteId] = useState("1");
  const [scale, setScale] = useState(1.5);
  const pdfDocRef = useRef<any>(null);
  const renderTaskRef = useRef<any>(null);

  // Load and render PDF whenever url, page, or scale changes
  useEffect(() => {
    if (!pdfUrl) return;

    let cancelled = false;

    async function loadPdf() {
      // Cancel any in-progress render before starting a new one
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }

      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

      if (!pdfDocRef.current) {
        pdfDocRef.current = await pdfjsLib.getDocument(pdfUrl!).promise;
        if (!cancelled) setNumPages(pdfDocRef.current.numPages);
      }

      if (cancelled) return;

      const page = await pdfDocRef.current.getPage(currentPage);
      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current;
      if (!canvas || cancelled) return;

      canvas.width = viewport.width;
      canvas.height = viewport.height;
      if (!cancelled) setCanvasDims({ width: viewport.width, height: viewport.height });

      const task = page.render({ canvasContext: canvas.getContext("2d")!, viewport });
      renderTaskRef.current = task;
      try {
        await task.promise;
      } catch (e: any) {
        if (e?.name !== "RenderingCancelledException") throw e;
      } finally {
        renderTaskRef.current = null;
      }
    }

    loadPdf();
    return () => {
      cancelled = true;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }
    };
  }, [pdfUrl, currentPage, scale]);

  // Intercept Ctrl+wheel globally — must be on window with passive:false to
  // beat the browser's own zoom handler, only act when cursor is over the viewer.
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      if (!viewerRef.current?.contains(e.target as Node)) return;
      e.preventDefault();
      setScale((s) =>
        Math.min(4, Math.max(0.5, parseFloat((s + (e.deltaY < 0 ? 0.15 : -0.15)).toFixed(2))))
      );
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, []);

  // Drag-to-pan: track pointer drag and scroll the viewer container
  const dragState = useRef<{ startX: number; startY: number; scrollX: number; scrollY: number } | null>(null);
  const isDragging = useRef(false);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    const el = viewerRef.current!;
    dragState.current = { startX: e.clientX, startY: e.clientY, scrollX: el.scrollLeft, scrollY: el.scrollTop };
    isDragging.current = false;
    el.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragState.current) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    if (!isDragging.current && Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
    isDragging.current = true;
    const el = viewerRef.current!;
    el.style.cursor = "grabbing";
    el.scrollLeft = dragState.current.scrollX - dx;
    el.scrollTop  = dragState.current.scrollY - dy;
  }

  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    dragState.current = null;
    isDragging.current = false;
    const el = viewerRef.current!;
    el.releasePointerCapture(e.pointerId);
    el.style.cursor = "grab";
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar active="documents" />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-gray-400">Loading document...</p>
        </main>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar active="documents" />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-red-500">{error || "Document not found"}</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar active="documents" />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{document.name}</h2>
            <p className="text-xs text-gray-400">
              {document.category} · {document.status} · {document.version}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Zoom controls */}
            <div className="flex items-center gap-1 border border-gray-200 rounded-lg overflow-hidden text-sm">
              <button
                onClick={() => setScale((s) => Math.max(0.5, +(s - 0.25).toFixed(2)))}
                className="px-3 py-1.5 hover:bg-gray-100 text-gray-700 font-medium"
                title="Zoom out"
              >−</button>
              <span className="px-2 py-1.5 text-gray-500 min-w-[52px] text-center select-none">
                {Math.round(scale * 100)}%
              </span>
              <button
                onClick={() => setScale((s) => Math.min(4, +(s + 0.25).toFixed(2)))}
                className="px-3 py-1.5 hover:bg-gray-100 text-gray-700 font-medium"
                title="Zoom in"
              >+</button>
            </div>

            {/* Page navigation */}
            {numPages > 1 && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-2 py-1 border rounded disabled:opacity-30"
                >
                  ‹
                </button>
                <span>Page {currentPage} of {numPages}</span>
                <button
                  onClick={() => setCurrentPage(Math.min(numPages, currentPage + 1))}
                  disabled={currentPage === numPages}
                  className="px-2 py-1 border rounded disabled:opacity-30"
                >
                  ›
                </button>
              </div>
            )}

            {/* Analyze button — only for approved docs */}
            {document.status === "approved" ? (
              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {analyzing ? "Analyzing..." : "Analyze This Page"}
              </button>
            ) : (
              <span className="text-xs text-gray-400 bg-gray-100 px-3 py-2 rounded-lg">
                Approve document to enable AI analysis
              </span>
            )}
          </div>
        </div>

        {/* Viewer + side panel */}
        <div className="flex flex-1 overflow-hidden">
          {/* PDF canvas with pin overlay */}
          <div
            ref={viewerRef}
            className="flex-1 overflow-auto bg-gray-200 select-none"
            style={{ cursor: "grab" }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            {/* Inner wrapper: width:max-content lets it grow wider than the
                viewport (enabling horizontal scroll); min-height:100% + flex
                centres the canvas vertically when small and expands to enable
                vertical scroll when the canvas is taller than the viewport. */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "max-content", minWidth: "100%", minHeight: "100%", padding: "24px", boxSizing: "border-box" }}>
            <div ref={containerRef} className="relative inline-block shadow-lg">
              <canvas ref={canvasRef} className="block" />

              {/* Pins overlay */}
              {canvasDims.width > 0 && pinsForPage.map((pin) => (
                <button
                  key={pin.id}
                  onClick={() => { if (!isDragging.current) setSelectedPinId(pin.id === selectedPinId ? null : pin.id); }}
                  style={{
                    position: "absolute",
                    left: `${pin.x_percent}%`,
                    top: `${pin.y_percent}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                  className={`w-5 h-5 rounded-full border-2 shadow-md cursor-pointer transition-transform hover:scale-125 z-10 ${PIN_COLOR[pin.status] || PIN_COLOR.pending} ${pin.id === selectedPinId ? "scale-125 ring-2 ring-white" : ""}`}
                  title={pin.tag}
                />
              ))}
            </div>
            </div>
          </div>

          {/* Side panel */}
          <div className="w-72 bg-white border-l border-gray-200 overflow-y-auto flex flex-col">
            {selectedPin ? (
              <PinPanel
                pin={selectedPin}
                siteId={siteId}
                onSiteIdChange={setSiteId}
                onConfirm={() => handleConfirm(selectedPin.id, Number(siteId))}
                onDismiss={() => handleDismiss(selectedPin.id)}
                onClose={() => setSelectedPinId(null)}
              />
            ) : (
              <PinList pins={pinsForPage} onSelect={setSelectedPinId} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function PinPanel({
  pin,
  siteId,
  onSiteIdChange,
  onConfirm,
  onDismiss,
  onClose,
}: {
  pin: Pin;
  siteId: string;
  onSiteIdChange: (v: string) => void;
  onConfirm: () => void;
  onDismiss: () => void;
  onClose: () => void;
}) {
  return (
    <div className="p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-900">{pin.tag}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
      </div>

      <div className="text-sm text-gray-600 space-y-2">
        {pin.asset_type && (
          <p><span className="font-medium text-gray-800">Type:</span> {pin.asset_type}</p>
        )}
        {pin.description && (
          <p><span className="font-medium text-gray-800">Description:</span> {pin.description}</p>
        )}
        <p>
          <span className="font-medium text-gray-800">Status:</span>{" "}
          <span className={pin.status === "confirmed" ? "text-green-600" : pin.status === "dismissed" ? "text-gray-400" : "text-amber-500"}>
            {STATUS_LABEL[pin.status]}
          </span>
        </p>
        <p className="text-xs text-gray-400">
          Position: {pin.x_percent.toFixed(1)}% × {pin.y_percent.toFixed(1)}%
        </p>
      </div>

      {pin.status === "pending" && (
        <div className="flex flex-col gap-3 pt-2 border-t border-gray-100">
          <label className="text-xs font-medium text-gray-600">
            Site ID
            <input
              type="number"
              value={siteId}
              onChange={(e) => onSiteIdChange(e.target.value)}
              className="mt-1 block w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </label>
          <button
            onClick={onConfirm}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700"
          >
            Confirm — Create Asset
          </button>
          <button
            onClick={onDismiss}
            className="border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}

function PinList({ pins, onSelect }: { pins: Pin[]; onSelect: (id: number) => void }) {
  const pending = pins.filter((p) => p.status === "pending");
  const confirmed = pins.filter((p) => p.status === "confirmed");

  return (
    <div className="p-4 flex flex-col gap-4">
      <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
        Detected Assets
      </h3>

      {pins.length === 0 && (
        <p className="text-sm text-gray-400 mt-4 text-center">
          No assets detected yet.<br />Click "Analyze This Page" to start.
        </p>
      )}

      {pending.length > 0 && (
        <div>
          <p className="text-xs font-medium text-amber-600 mb-2">
            Pending Review ({pending.length})
          </p>
          {pending.map((pin) => (
            <button
              key={pin.id}
              onClick={() => onSelect(pin.id)}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-amber-50 text-sm mb-1 flex items-center gap-2"
            >
              <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
              <span className="font-medium">{pin.tag}</span>
              <span className="text-gray-400 text-xs">{pin.asset_type}</span>
            </button>
          ))}
        </div>
      )}

      {confirmed.length > 0 && (
        <div>
          <p className="text-xs font-medium text-green-600 mb-2">
            Confirmed ({confirmed.length})
          </p>
          {confirmed.map((pin) => (
            <div
              key={pin.id}
              className="px-3 py-2 text-sm mb-1 flex items-center gap-2 text-gray-500"
            >
              <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
              <span>{pin.tag}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
