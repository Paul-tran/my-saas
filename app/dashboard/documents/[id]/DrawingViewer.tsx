"use client";

import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useDrawingViewer } from "../../../../lib/hooks/useDrawingViewer";
import Sidebar from "../../../components/Sidebar";
import { Pin } from "../../../../lib/models/drawings";
import { Site, Location, GeoUnit, Partition, fetchSites, fetchLocations, fetchUnits, fetchPartitions } from "../../../../lib/models/geography";
import { Asset, fetchAssets } from "../../../../lib/models/assets";
import { SystemDiscipline, SystemGroup, SystemSubgroup, fetchDisciplines, fetchGroups, fetchSubgroups } from "../../../../lib/models/systems";

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

export default function DrawingViewer({ documentId, initialPage = 1 }: { documentId: number; initialPage?: number }) {
  const router = useRouter();
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
    handleCreatePin,
    pendingPlacement,
    setPendingPlacement,
    actionError,
    setActionError,
  } = useDrawingViewer(documentId, initialPage);

  const [pinMode, setPinMode] = useState(false);
  const [hoveredPinId, setHoveredPinId] = useState<number | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [locationsList, setLocationsList] = useState<Location[]>([]);
  const [unitsList, setUnitsList] = useState<GeoUnit[]>([]);
  const [partitionsList, setPartitionsList] = useState<Partition[]>([]);
  const [assetsList, setAssetsList] = useState<Asset[]>([]);
  const [parentAssetId, setParentAssetId] = useState("");

  // System hierarchy state
  const [disciplines, setDisciplines] = useState<SystemDiscipline[]>([]);
  const [groupsList, setGroupsList] = useState<SystemGroup[]>([]);
  const [subgroupsList, setSubgroupsList] = useState<SystemSubgroup[]>([]);
  const [disciplineId, setDisciplineId] = useState("");
  const [groupId, setGroupId] = useState("");
  const [subgroupId, setSubgroupId] = useState("");
  const [siteId, setSiteId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [partitionId, setPartitionId] = useState("");

  const { getToken } = useAuth();

  // Load sites and disciplines on mount
  useEffect(() => {
    const projectId = Number(process.env.NEXT_PUBLIC_DEFAULT_PROJECT_ID || 1);
    getToken().then((token) => {
      if (!token) return;
      fetchSites(token).then(setSites).catch(() => {});
      fetchDisciplines(projectId, token).then(setDisciplines).catch(() => {});
    });
  }, [getToken]);

  // Cascade: load locations + assets when site changes
  useEffect(() => {
    setLocationId(""); setUnitId(""); setPartitionId(""); setParentAssetId("");
    setLocationsList([]); setUnitsList([]); setPartitionsList([]); setAssetsList([]);
    if (!siteId) return;
    const projectId = Number(process.env.NEXT_PUBLIC_DEFAULT_PROJECT_ID || 1);
    getToken().then((token) => {
      if (!token) return;
      fetchLocations(Number(siteId), token).then(setLocationsList).catch(() => {});
      fetchAssets(projectId, token, { site_id: Number(siteId), page_size: 200 }).then(setAssetsList).catch(() => {});
    });
  }, [siteId, getToken]);

  // Cascade: load units when location changes
  useEffect(() => {
    setUnitId(""); setPartitionId("");
    setUnitsList([]); setPartitionsList([]);
    if (!locationId) return;
    getToken().then((token) => {
      if (token) fetchUnits(Number(locationId), token).then(setUnitsList).catch(() => {});
    });
  }, [locationId, getToken]);

  // Cascade: load partitions when unit changes
  useEffect(() => {
    setPartitionId(""); setPartitionsList([]);
    if (!unitId) return;
    getToken().then((token) => {
      if (token) fetchPartitions(Number(unitId), token).then(setPartitionsList).catch(() => {});
    });
  }, [unitId, getToken]);

  // Cascade: load groups when discipline changes
  useEffect(() => {
    setGroupId(""); setSubgroupId("");
    setGroupsList([]); setSubgroupsList([]);
    if (!disciplineId) return;
    getToken().then((token) => {
      if (token) fetchGroups(Number(disciplineId), token).then(setGroupsList).catch(() => {});
    });
  }, [disciplineId, getToken]);

  // Cascade: load subgroups when group changes
  useEffect(() => {
    setSubgroupId(""); setSubgroupsList([]);
    if (!groupId) return;
    getToken().then((token) => {
      if (token) fetchSubgroups(Number(groupId), token).then(setSubgroupsList).catch(() => {});
    });
  }, [groupId, getToken]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const [numPages, setNumPages] = useState(0);
  const [canvasDims, setCanvasDims] = useState({ width: 0, height: 0 });
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
    const wasDragging = isDragging.current;
    dragState.current = null;
    isDragging.current = false;
    const el = viewerRef.current!;
    el.releasePointerCapture(e.pointerId);
    el.style.cursor = pinMode ? "crosshair" : "grab";

    // Place a pin on click (not drag) when in pin mode
    if (!wasDragging && pinMode && containerRef.current && canvasDims.width > 0) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (x >= 0 && y >= 0 && x <= canvasDims.width && y <= canvasDims.height) {
        setPendingPlacement({
          x_percent: (x / canvasDims.width) * 100,
          y_percent: (y / canvasDims.height) * 100,
        });
        setSelectedPinId(null);
      }
    }
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
        {/* Action error banner */}
        {actionError && (
          <div className="flex items-center justify-between bg-red-50 border-b border-red-200 px-6 py-2 text-sm text-red-700">
            <span>{actionError}</span>
            <button onClick={() => setActionError(null)} className="ml-4 text-red-400 hover:text-red-600 font-medium">✕</button>
          </div>
        )}
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

            {/* Place Pin toggle */}
            <button
              onClick={() => { setPinMode((m) => !m); setPendingPlacement(null); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                pinMode
                  ? "bg-blue-600 text-white border-blue-700 hover:bg-blue-700"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {pinMode ? "✕ Cancel" : "📍 Place Pin"}
            </button>

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
            style={{ cursor: pinMode ? "crosshair" : "grab" }}
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

              {/* Pending placement crosshair */}
              {pendingPlacement && (
                <div
                  style={{
                    position: "absolute",
                    left: `${pendingPlacement.x_percent}%`,
                    top: `${pendingPlacement.y_percent}%`,
                    transform: "translate(-50%, -50%)",
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    background: "#3b82f6",
                    border: "2px solid #fff",
                    boxShadow: "0 0 0 2px #3b82f6",
                    zIndex: 20,
                    pointerEvents: "none",
                  }}
                />
              )}

              {/* Pins overlay */}
              {canvasDims.width > 0 && pinsForPage.map((pin) => (
                <button
                  key={pin.id}
                  onClick={() => {
                    if (isDragging.current) return;
                    if (pin.status === "confirmed" && pin.asset_id) {
                      router.push(`/dashboard/assets/${pin.asset_id}`);
                    } else {
                      setSelectedPinId(pin.id === selectedPinId ? null : pin.id);
                    }
                  }}
                  style={{
                    position: "absolute",
                    left: `${pin.x_percent}%`,
                    top: `${pin.y_percent}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                  className={`w-5 h-5 rounded-full border-2 shadow-md cursor-pointer transition-transform hover:scale-125 z-10 ${PIN_COLOR[pin.status] || PIN_COLOR.pending} ${pin.id === selectedPinId ? "scale-125 ring-2 ring-white" : ""} ${pin.id === hoveredPinId ? "scale-150 ring-4 ring-white ring-opacity-80" : ""}`}
                  title={pin.status === "confirmed" && pin.asset_id ? `${pin.tag} — view asset` : pin.tag}
                />
              ))}
            </div>
            </div>
          </div>

          {/* Side panel */}
          <div className="w-72 bg-white border-l border-gray-200 overflow-y-auto flex flex-col">
            {pendingPlacement ? (
              <NewPinForm
                onSave={async (tag, assetType, description) => {
                  await handleCreatePin(tag, assetType, description);
                  setPinMode(false);
                }}
                onCancel={() => { setPendingPlacement(null); setPinMode(false); }}
              />
            ) : selectedPin ? (
              <PinPanel
                pin={selectedPin}
                sites={sites}
                siteId={siteId} onSiteIdChange={setSiteId}
                locationsList={locationsList} locationId={locationId} onLocationIdChange={setLocationId}
                unitsList={unitsList} unitId={unitId} onUnitIdChange={setUnitId}
                partitionsList={partitionsList} partitionId={partitionId} onPartitionIdChange={setPartitionId}
                assetsList={assetsList} parentAssetId={parentAssetId} onParentAssetIdChange={setParentAssetId}
                disciplines={disciplines}
                disciplineId={disciplineId} onDisciplineIdChange={setDisciplineId}
                groupsList={groupsList} groupId={groupId} onGroupIdChange={setGroupId}
                subgroupsList={subgroupsList} subgroupId={subgroupId} onSubgroupIdChange={setSubgroupId}
                onConfirm={() => handleConfirm(
                  selectedPin.id,
                  Number(siteId),
                  locationId ? Number(locationId) : undefined,
                  unitId ? Number(unitId) : undefined,
                  partitionId ? Number(partitionId) : undefined,
                  parentAssetId ? Number(parentAssetId) : undefined,
                  subgroupId ? Number(subgroupId) : undefined,
                )}
                onDismiss={() => handleDismiss(selectedPin.id)}
                onClose={() => setSelectedPinId(null)}
              />
            ) : (
              <PinList pins={pinsForPage} onSelect={setSelectedPinId} onHover={setHoveredPinId} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function GeoSelect({
  label, value, onChange, options, placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { id: number; label: string }[];
  placeholder: string;
}) {
  return (
    <label className="text-xs font-medium text-gray-600">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 block w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.id} value={String(o.id)}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

function PinPanel({
  pin,
  sites, siteId, onSiteIdChange,
  locationsList, locationId, onLocationIdChange,
  unitsList, unitId, onUnitIdChange,
  partitionsList, partitionId, onPartitionIdChange,
  assetsList, parentAssetId, onParentAssetIdChange,
  disciplines, disciplineId, onDisciplineIdChange,
  groupsList, groupId, onGroupIdChange,
  subgroupsList, subgroupId, onSubgroupIdChange,
  onConfirm, onDismiss, onClose,
}: {
  pin: Pin;
  sites: Site[]; siteId: string; onSiteIdChange: (v: string) => void;
  locationsList: Location[]; locationId: string; onLocationIdChange: (v: string) => void;
  unitsList: GeoUnit[]; unitId: string; onUnitIdChange: (v: string) => void;
  partitionsList: Partition[]; partitionId: string; onPartitionIdChange: (v: string) => void;
  assetsList: Asset[]; parentAssetId: string; onParentAssetIdChange: (v: string) => void;
  disciplines: SystemDiscipline[]; disciplineId: string; onDisciplineIdChange: (v: string) => void;
  groupsList: SystemGroup[]; groupId: string; onGroupIdChange: (v: string) => void;
  subgroupsList: SystemSubgroup[]; subgroupId: string; onSubgroupIdChange: (v: string) => void;
  onConfirm: () => void; onDismiss: () => void; onClose: () => void;
}) {
  const router = useRouter();

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

      {pin.status === "confirmed" && pin.asset_id && (
        <button
          onClick={() => router.push(`/dashboard/assets/${pin.asset_id}`)}
          className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium text-center"
        >
          View Asset Details →
        </button>
      )}

      {pin.status === "pending" && (
        <div className="flex flex-col gap-3 pt-2 border-t border-gray-100">
          {sites.length === 0 ? (
            <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
              No sites found. Add one in <strong>Geography</strong> settings first.
            </p>
          ) : (
            <>
              {/* Site */}
              <GeoSelect
                label="Site *"
                value={siteId}
                onChange={onSiteIdChange}
                options={sites.map((s) => ({ id: s.id, label: `${s.name} (${s.code})` }))}
                placeholder="— Select site —"
              />

              {/* Location */}
              {siteId && (
                <GeoSelect
                  label="Location"
                  value={locationId}
                  onChange={onLocationIdChange}
                  options={locationsList.map((l) => ({ id: l.id, label: l.code ? `${l.name} (${l.code})` : l.name }))}
                  placeholder="— Select location —"
                />
              )}

              {/* Unit */}
              {locationId && (
                <GeoSelect
                  label="Unit"
                  value={unitId}
                  onChange={onUnitIdChange}
                  options={unitsList.map((u) => ({ id: u.id, label: u.code ? `${u.name} (${u.code})` : u.name }))}
                  placeholder="— Select unit —"
                />
              )}

              {/* Partition */}
              {unitId && (
                <GeoSelect
                  label="Partition"
                  value={partitionId}
                  onChange={onPartitionIdChange}
                  options={partitionsList.map((p) => ({ id: p.id, label: p.code ? `${p.name} (${p.code})` : p.name }))}
                  placeholder="— Select partition —"
                />
              )}

              {/* System hierarchy */}
              <div className="border-t border-gray-100 pt-3 mt-1">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">System</p>
                {disciplines.length === 0 ? (
                  <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                    No systems found. Add one in <strong>Systems</strong> settings first.
                  </p>
                ) : (
                  <>
                    <GeoSelect
                      label="Discipline *"
                      value={disciplineId}
                      onChange={onDisciplineIdChange}
                      options={disciplines.map((d) => ({ id: d.id, label: `${d.name} (${d.code})` }))}
                      placeholder="— Select discipline —"
                    />
                    {disciplineId && (
                      <div className="mt-2">
                        <GeoSelect
                          label="System *"
                          value={groupId}
                          onChange={onGroupIdChange}
                          options={groupsList.map((g) => ({ id: g.id, label: `${g.name} (${g.code})` }))}
                          placeholder="— Select system —"
                        />
                      </div>
                    )}
                    {groupId && (
                      <div className="mt-2">
                        <GeoSelect
                          label="Subsystem *"
                          value={subgroupId}
                          onChange={onSubgroupIdChange}
                          options={subgroupsList.map((s) => ({ id: s.id, label: `${s.name} (${s.code})` }))}
                          placeholder="— Select subsystem —"
                        />
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Parent asset */}
              {assetsList.length > 0 && (
                <GeoSelect
                  label="Parent Asset (optional)"
                  value={parentAssetId}
                  onChange={onParentAssetIdChange}
                  options={assetsList.map((a) => ({ id: a.id, label: a.name ? `${a.tag} — ${a.name}` : a.tag }))}
                  placeholder="— No parent —"
                />
              )}
            </>
          )}

          <button
            onClick={onConfirm}
            disabled={!siteId || !subgroupId}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
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

function NewPinForm({
  onSave,
  onCancel,
}: {
  onSave: (tag: string, assetType?: string, description?: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [tag, setTag] = useState("");
  const [assetType, setAssetType] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tag.trim()) return;
    setSaving(true);
    await onSave(tag.trim(), assetType.trim() || undefined, description.trim() || undefined);
    setSaving(false);
  }

  return (
    <div className="p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-900">New Pin</h3>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
      </div>
      <p className="text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-2">
        Pin placed. Fill in the details below to create the asset.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="text-xs font-medium text-gray-600">
          Asset Tag <span className="text-red-400">*</span>
          <input
            required
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            placeholder="e.g. AHU-01"
            className="mt-1 block w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
        </label>
        <label className="text-xs font-medium text-gray-600">
          Asset Type
          <input
            value={assetType}
            onChange={(e) => setAssetType(e.target.value)}
            placeholder="e.g. Air Handling Unit"
            className="mt-1 block w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
        </label>
        <label className="text-xs font-medium text-gray-600">
          Description
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional notes"
            className="mt-1 block w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
        </label>
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !tag.trim()}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Pin"}
          </button>
        </div>
      </form>
    </div>
  );
}

function PinList({ pins, onSelect, onHover }: { pins: Pin[]; onSelect: (id: number) => void; onHover: (id: number | null) => void }) {
  const router = useRouter();
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
              onMouseEnter={() => onHover(pin.id)}
              onMouseLeave={() => onHover(null)}
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
            pin.asset_id ? (
              <button
                key={pin.id}
                onClick={() => router.push(`/dashboard/assets/${pin.asset_id}`)}
                onMouseEnter={() => onHover(pin.id)}
                onMouseLeave={() => onHover(null)}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-green-50 text-sm mb-1 flex items-center gap-2 group"
              >
                <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                <span className="text-gray-700 group-hover:text-green-700 font-medium">{pin.tag}</span>
                <span className="ml-auto text-xs text-gray-300 group-hover:text-green-500">→</span>
              </button>
            ) : (
              <div
                key={pin.id}
                onMouseEnter={() => onHover(pin.id)}
                onMouseLeave={() => onHover(null)}
                className="px-3 py-2 text-sm mb-1 flex items-center gap-2 text-gray-500"
              >
                <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                <span>{pin.tag}</span>
              </div>
            )
          ))}
        </div>
      )}
    </div>
  );
}
