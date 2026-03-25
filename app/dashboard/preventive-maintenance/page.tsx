"use client";

import { useEffect, useState } from "react";
import {
  PMSchedule, PMActivity, PMHistoryEntry, PMFrequency,
  fetchPMSchedules, createPMSchedule, deletePMSchedule,
  addPMActivity, deletePMActivity,
  addScheduleAsset, removeScheduleAsset,
  generateWorkOrders, fetchScheduleHistory,
} from "@/lib/models/pm-schedules";
import { Asset, fetchAssets } from "@/lib/models/assets";
import { Site, Location, GeoUnit, Partition, fetchSites, fetchLocations, fetchUnits, fetchPartitions } from "@/lib/models/geography";

const DEFAULT_PROJECT_ID = parseInt(process.env.NEXT_PUBLIC_DEFAULT_PROJECT_ID || "1");

// ── Helpers ───────────────────────────────────────────────────────────────────

const FREQ_LABELS: Record<PMFrequency | string, string> = {
  weekly: "Weekly", monthly: "Monthly", quarterly: "Quarterly",
  annually: "Annually", custom_days: "Custom",
};
const FREQ_OPTIONS: PMFrequency[] = ["weekly", "monthly", "quarterly", "annually", "custom_days"];

function scheduleStatus(s: PMSchedule): "active" | "paused" | "overdue" {
  if (!s.is_active) return "paused";
  const today = new Date();
  for (const a of (s.activities ?? [])) {
    if (a.next_due_date && new Date(a.next_due_date) < today) return "overdue";
  }
  return "active";
}

function nearestDue(s: PMSchedule): string | null {
  const dates = (s.activities ?? [])
    .map((a) => a.next_due_date)
    .filter(Boolean)
    .sort() as string[];
  return dates[0] ?? null;
}

function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" });
}

const STATUS_STYLES = {
  active: { bg: "#dcfce7", color: "#15803d", label: "Active" },
  paused: { bg: "#f3f4f5", color: "#524534", label: "Paused" },
  overdue: { bg: "#ffdad6", color: "#93000a", label: "Overdue" },
};

// ── Projected dates helper ─────────────────────────────────────────────────────

function advanceDate(d: Date, frequency: PMFrequency | string, intervalDays: number | null): Date {
  const n = new Date(d);
  if (frequency === "weekly") n.setDate(n.getDate() + 7);
  else if (frequency === "monthly") n.setMonth(n.getMonth() + 1);
  else if (frequency === "quarterly") n.setMonth(n.getMonth() + 3);
  else if (frequency === "annually") n.setFullYear(n.getFullYear() + 1);
  else if (frequency === "custom_days" && intervalDays) n.setDate(n.getDate() + intervalDays);
  else n.setDate(n.getDate() + 30);
  return n;
}

function regressDate(d: Date, frequency: PMFrequency | string, intervalDays: number | null): Date {
  const n = new Date(d);
  if (frequency === "weekly") n.setDate(n.getDate() - 7);
  else if (frequency === "monthly") n.setMonth(n.getMonth() - 1);
  else if (frequency === "quarterly") n.setMonth(n.getMonth() - 3);
  else if (frequency === "annually") n.setFullYear(n.getFullYear() - 1);
  else if (frequency === "custom_days" && intervalDays) n.setDate(n.getDate() - intervalDays);
  else n.setDate(n.getDate() - 30);
  return n;
}

function projectDatesForMonth(activity: PMActivity, scheduleStartDate: string): string[] {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);

  const anchorStr = activity.next_due_date || scheduleStartDate;
  const anchor = new Date(anchorStr + "T00:00:00");
  const endDate = activity.end_date ? new Date(activity.end_date + "T00:00:00") : null;

  const result = new Set<string>();

  // Walk backward from anchor into the current month
  let d = new Date(anchor);
  for (let i = 0; i < 60; i++) {
    if (d < monthStart) break;
    if (d <= monthEnd) result.add(d.toISOString().split("T")[0]);
    d = regressDate(d, activity.frequency, activity.interval_days);
  }

  // Walk forward from anchor into the current month
  d = advanceDate(anchor, activity.frequency, activity.interval_days);
  for (let i = 0; i < 60; i++) {
    if (d > monthEnd) break;
    if (d >= monthStart) result.add(d.toISOString().split("T")[0]);
    d = advanceDate(d, activity.frequency, activity.interval_days);
  }

  return Array.from(result).filter((s) => !endDate || new Date(s + "T00:00:00") <= endDate);
}

// ── Mini Calendar ─────────────────────────────────────────────────────────────

function MiniCalendar({ dueDates }: { dueDates: string[] }) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dueDays = new Set(
    dueDates
      .filter((d) => {
        const dt = new Date(d);
        return dt.getFullYear() === year && dt.getMonth() === month;
      })
      .map((d) => new Date(d).getDate())
  );
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const monthName = today.toLocaleDateString("en-CA", { month: "long", year: "numeric" });

  return (
    <div className="bg-white rounded-2xl p-5" style={{ boxShadow: "0 4px 20px rgba(25,28,29,0.05)" }}>
      <p className="text-sm font-bold mb-3" style={{ fontFamily: "var(--font-manrope)", color: "#191c1d" }}>{monthName}</p>
      <div className="grid grid-cols-7 gap-1 text-center">
        {["Su","Mo","Tu","We","Th","Fr","Sa"].map((d) => (
          <div key={d} className="text-xs font-semibold" style={{ color: "#857462" }}>{d}</div>
        ))}
        {cells.map((day, i) => (
          <div key={i} className="relative flex items-center justify-center">
            {day && (
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium"
                style={{
                  background: dueDays.has(day) ? "#835500" : day === today.getDate() ? "#f3f4f5" : "transparent",
                  color: dueDays.has(day) ? "#fff" : day === today.getDate() ? "#835500" : "#191c1d",
                  fontWeight: day === today.getDate() ? "700" : undefined,
                }}
              >
                {day}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-3">
        <div className="w-3 h-3 rounded-full" style={{ background: "#835500" }} />
        <span className="text-xs" style={{ color: "#857462" }}>Activity due date</span>
      </div>
    </div>
  );
}

// ── Activity Form Row ─────────────────────────────────────────────────────────

interface ActivityDraft {
  name: string;
  frequency: PMFrequency;
  interval_days: string;
  end_date: string;
  description: string;
}

function emptyDraft(): ActivityDraft {
  return { name: "", frequency: "monthly", interval_days: "", end_date: "", description: "" };
}

function ActivityFormRow({
  draft, onChange, onRemove,
}: {
  draft: ActivityDraft;
  onChange: (d: ActivityDraft) => void;
  onRemove?: () => void;
}) {
  const inputStyle = {
    borderBottom: "1.5px solid #d7c3ae",
    background: "transparent",
    outline: "none",
    color: "#191c1d",
    fontSize: "0.875rem",
    padding: "4px 0",
    width: "100%",
  };
  return (
    <div className="rounded-xl p-4 mb-3" style={{ background: "#f8f9fa", border: "1px dashed #d7c3ae" }}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <input
          value={draft.name}
          onChange={(e) => onChange({ ...draft, name: e.target.value })}
          placeholder="Activity name *"
          style={inputStyle}
        />
        {onRemove && (
          <button onClick={onRemove} className="p-1 rounded hover:bg-red-50 flex-shrink-0">
            <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "#ba1a1a" }}>close</span>
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        {FREQ_OPTIONS.map((f) => (
          <button
            key={f}
            onClick={() => onChange({ ...draft, frequency: f })}
            className="px-3 py-1 rounded-lg text-xs font-semibold transition-colors"
            style={{
              background: draft.frequency === f ? "#835500" : "#edeeef",
              color: draft.frequency === f ? "#fff" : "#524534",
            }}
          >
            {FREQ_LABELS[f]}
          </button>
        ))}
      </div>
      {draft.frequency === "custom_days" && (
        <div className="mb-3">
          <input
            type="number"
            value={draft.interval_days}
            onChange={(e) => onChange({ ...draft, interval_days: e.target.value })}
            placeholder="Every N days"
            style={{ ...inputStyle }}
          />
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#857462" }}>End Date (optional)</label>
          <input
            type="date"
            value={draft.end_date}
            onChange={(e) => onChange({ ...draft, end_date: e.target.value })}
            style={inputStyle}
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#857462" }}>Notes</label>
          <input
            value={draft.description}
            onChange={(e) => onChange({ ...draft, description: e.target.value })}
            placeholder="Optional description"
            style={inputStyle}
          />
        </div>
      </div>
    </div>
  );
}

// ── Asset Picker Modal ────────────────────────────────────────────────────────

function FilterSelect({
  value, onChange, placeholder, options, disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
  disabled?: boolean;
}) {
  const selectStyle: React.CSSProperties = {
    width: "100%",
    padding: "6px 10px",
    borderRadius: "8px",
    border: "1.5px solid",
    borderColor: value ? "#835500" : "#e8ddd3",
    background: value ? "rgba(131,85,0,0.04)" : "#f8f9fa",
    color: value ? "#191c1d" : "#857462",
    fontSize: "0.8rem",
    fontWeight: value ? 600 : 400,
    outline: "none",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.45 : 1,
  };
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} style={selectStyle}>
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function AssetPickerModal({
  assets,
  initialSelection,
  onConfirm,
  onClose,
  title = "Select Assets",
}: {
  assets: Asset[];
  initialSelection: number[];
  onConfirm: (ids: number[]) => void;
  onClose: () => void;
  title?: string;
}) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<number[]>(initialSelection);

  // Geography filters
  const [sites, setSites] = useState<Site[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [units, setUnits] = useState<GeoUnit[]>([]);
  const [partitions, setPartitions] = useState<Partition[]>([]);
  const [siteId, setSiteId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [partitionId, setPartitionId] = useState("");

  // Asset hierarchy filter — derived from the passed asset list
  const [parentId, setParentId] = useState("");
  const parentOptions = Array.from(
    new Map(
      assets
        .filter((a) => a.parent_id !== null && a.parent_tag !== null)
        .map((a) => [a.parent_id, a.parent_tag!])
    ).entries()
  ).map(([id, tag]) => ({ value: String(id), label: tag }));

  // Fetch sites on mount
  useEffect(() => {
    fetchSites().then(setSites).catch(() => {});
  }, []);

  // Cascade: site → locations
  useEffect(() => {
    setLocationId("");
    setUnitId("");
    setPartitionId("");
    setLocations([]);
    setUnits([]);
    setPartitions([]);
    if (siteId) fetchLocations(parseInt(siteId)).then(setLocations).catch(() => {});
  }, [siteId]);

  // Cascade: location → units
  useEffect(() => {
    setUnitId("");
    setPartitionId("");
    setUnits([]);
    setPartitions([]);
    if (locationId) fetchUnits(parseInt(locationId)).then(setUnits).catch(() => {});
  }, [locationId]);

  // Cascade: unit → partitions
  useEffect(() => {
    setPartitionId("");
    setPartitions([]);
    if (unitId) fetchPartitions(parseInt(unitId)).then(setPartitions).catch(() => {});
  }, [unitId]);

  const hasFilters = !!(search || siteId || locationId || unitId || partitionId || parentId);

  function clearFilters() {
    setSearch("");
    setSiteId("");
    setLocationId("");
    setUnitId("");
    setPartitionId("");
    setParentId("");
  }

  const filtered = assets.filter((a) => {
    if (search) {
      const q = search.toLowerCase();
      const matches =
        a.tag.toLowerCase().includes(q) ||
        (a.name ?? "").toLowerCase().includes(q) ||
        (a.type ?? "").toLowerCase().includes(q);
      if (!matches) return false;
    }
    if (siteId && a.site_id !== parseInt(siteId)) return false;
    if (locationId && a.location_id !== parseInt(locationId)) return false;
    if (unitId && a.unit_id !== parseInt(unitId)) return false;
    if (partitionId && a.partition_id !== parseInt(partitionId)) return false;
    if (parentId && a.parent_id !== parseInt(parentId)) return false;
    return true;
  });

  function toggle(id: number) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function toggleAll() {
    setSelected((prev) => {
      const ids = filtered.map((a) => a.id);
      return ids.every((id) => prev.includes(id))
        ? prev.filter((id) => !ids.includes(id))
        : [...new Set([...prev, ...ids])];
    });
  }

  const allFilteredSelected = filtered.length > 0 && filtered.every((a) => selected.includes(a.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(25,28,29,0.4)" }}>
      <div
        className="w-full max-w-xl flex flex-col rounded-2xl overflow-hidden"
        style={{ background: "#fff", boxShadow: "0 24px 64px rgba(25,28,29,0.18)", maxHeight: "85vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: "1px solid rgba(215,195,174,0.2)" }}>
          <div>
            <h2 className="font-bold" style={{ fontFamily: "var(--font-manrope)", fontSize: "1.1rem", color: "#191c1d" }}>{title}</h2>
            {selected.length > 0 && (
              <p className="text-xs mt-0.5" style={{ color: "#835500" }}>{selected.length} selected</p>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-black/5">
            <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "#857462" }}>close</span>
          </button>
        </div>

        {/* Search + filters */}
        <div className="px-6 py-4 space-y-3" style={{ borderBottom: "1px solid rgba(215,195,174,0.15)", background: "#fafaf9" }}>
          {/* Search bar */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "#f3f4f5" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "#857462" }}>search</span>
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by tag, name, or type…"
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: "#191c1d" }}
            />
            {search && (
              <button onClick={() => setSearch("")}>
                <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "#857462" }}>close</span>
              </button>
            )}
          </div>

          {/* Geography row */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "#857462" }}>Geography</p>
            <div className="grid grid-cols-4 gap-2">
              <FilterSelect
                value={siteId}
                onChange={setSiteId}
                placeholder="Site"
                options={sites.map((s) => ({ value: String(s.id), label: s.name }))}
              />
              <FilterSelect
                value={locationId}
                onChange={setLocationId}
                placeholder="Location"
                options={locations.map((l) => ({ value: String(l.id), label: l.name }))}
                disabled={!siteId}
              />
              <FilterSelect
                value={unitId}
                onChange={setUnitId}
                placeholder="Unit"
                options={units.map((u) => ({ value: String(u.id), label: u.name }))}
                disabled={!locationId}
              />
              <FilterSelect
                value={partitionId}
                onChange={setPartitionId}
                placeholder="Partition"
                options={partitions.map((p) => ({ value: String(p.id), label: p.name }))}
                disabled={!unitId}
              />
            </div>
          </div>

          {/* Asset hierarchy row */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "#857462" }}>Asset Hierarchy</p>
            <div className="grid grid-cols-2 gap-2">
              <FilterSelect
                value={parentId}
                onChange={setParentId}
                placeholder="Parent asset"
                options={parentOptions}
              />
              <div /> {/* placeholder for future sub-level */}
            </div>
          </div>

          {/* Clear filters */}
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs font-semibold"
              style={{ color: "#835500" }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>filter_alt_off</span>
              Clear all filters
            </button>
          )}
        </div>

        {/* Select-all bar */}
        {filtered.length > 0 && (
          <div
            className="flex items-center gap-3 px-6 py-2 cursor-pointer"
            style={{ borderBottom: "1px solid rgba(215,195,174,0.1)", background: "#fafaf9" }}
            onClick={toggleAll}
          >
            <div
              className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
              style={{ border: `2px solid ${allFilteredSelected ? "#835500" : "#d7c3ae"}`, background: allFilteredSelected ? "#835500" : "transparent" }}
            >
              {allFilteredSelected && <span className="material-symbols-outlined" style={{ fontSize: "11px", color: "#fff" }}>check</span>}
            </div>
            <span className="text-xs font-semibold" style={{ color: "#524534" }}>
              {allFilteredSelected ? "Deselect all" : `Select all${hasFilters ? " matching" : ""}`}
            </span>
            <span className="text-xs ml-auto" style={{ color: "#857462" }}>{filtered.length} asset{filtered.length !== 1 ? "s" : ""}</span>
          </div>
        )}

        {/* Asset list */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <span className="material-symbols-outlined" style={{ fontSize: "36px", color: "#d7c3ae", display: "block", marginBottom: "8px" }}>search_off</span>
              <p className="text-sm" style={{ color: "#857462" }}>No assets match the current filters.</p>
            </div>
          ) : (
            filtered.map((a) => {
              const isSelected = selected.includes(a.id);
              return (
                <div
                  key={a.id}
                  onClick={() => toggle(a.id)}
                  className="flex items-center gap-4 px-6 py-3 cursor-pointer transition-colors"
                  style={{
                    background: isSelected ? "rgba(131,85,0,0.04)" : "transparent",
                    borderBottom: "1px solid rgba(215,195,174,0.1)",
                  }}
                >
                  <div
                    className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                    style={{ border: `2px solid ${isSelected ? "#835500" : "#d7c3ae"}`, background: isSelected ? "#835500" : "transparent" }}
                  >
                    {isSelected && <span className="material-symbols-outlined" style={{ fontSize: "11px", color: "#fff" }}>check</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold" style={{ color: "#191c1d" }}>{a.tag}</span>
                      {a.type && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(131,85,0,0.08)", color: "#835500" }}>{a.type}</span>
                      )}
                      {a.parent_tag && (
                        <span className="text-xs" style={{ color: "#857462" }}>↳ {a.parent_tag}</span>
                      )}
                    </div>
                    {a.name && <p className="text-xs mt-0.5 truncate" style={{ color: "#857462" }}>{a.name}</p>}
                  </div>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{
                      background: a.status === "active" ? "#dcfce7" : "#f3f4f5",
                      color: a.status === "active" ? "#15803d" : "#524534",
                    }}
                  >
                    {a.status}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4" style={{ borderTop: "1px solid rgba(215,195,174,0.2)" }}>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-xl font-medium"
            style={{ border: "1.5px solid #d7c3ae", color: "#524534" }}
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(selected)}
            className="px-5 py-2 text-sm font-semibold text-white rounded-xl"
            style={{ background: "linear-gradient(135deg,#835500,#f5a623)" }}
          >
            Confirm{selected.length > 0 ? ` (${selected.length})` : ""}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── New Schedule Drawer ───────────────────────────────────────────────────────

function NewScheduleDrawer({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (s: PMSchedule) => void;
}) {
  const [name, setName] = useState("");
  const [leadDays, setLeadDays] = useState("7");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [assignedTo, setAssignedTo] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [assetIds, setAssetIds] = useState<number[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [activities, setActivities] = useState<ActivityDraft[]>([emptyDraft()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAssets(DEFAULT_PROJECT_ID).then(setAssets).catch(() => {});
  }, []);

  const inputStyle = {
    borderBottom: "1.5px solid #d7c3ae",
    background: "transparent",
    outline: "none",
    color: "#191c1d",
    fontSize: "0.875rem",
    padding: "6px 0",
    width: "100%",
  };

  async function handleSave() {
    if (!name.trim() || !startDate) { setError("Schedule name and start date are required."); return; }
    setError("");
    setSaving(true);
    try {
      const result = await createPMSchedule({
        name: name.trim(),
        asset_ids: assetIds,
        lead_days: parseInt(leadDays) || 7,
        start_date: startDate,
        assigned_to: assignedTo.trim() || null,
        is_active: isActive,
        activities: activities
          .filter((a) => a.name.trim())
          .map((a) => ({
            name: a.name.trim(),
            frequency: a.frequency,
            interval_days: a.interval_days ? parseInt(a.interval_days) : null,
            end_date: a.end_date || null,
            description: a.description,
          })),
      });
      onCreated(result);
    } catch (e: any) {
      setError(e.message || "Failed to create schedule");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="flex-1" onClick={onClose} />
      <div
        className="w-full max-w-md h-full flex flex-col overflow-hidden"
        style={{ background: "#fff", boxShadow: "-20px 0 40px rgba(25,28,29,0.1)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: "1px solid rgba(215,195,174,0.2)" }}>
          <h2 className="font-bold" style={{ fontFamily: "var(--font-manrope)", fontSize: "1.1rem", color: "#191c1d" }}>
            New PM Schedule
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-black/5">
            <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "#857462" }}>close</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#857462" }}>Schedule Name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Monthly HVAC Inspection" style={inputStyle} />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide mb-2 block" style={{ color: "#857462" }}>Assets</label>
            <button
              type="button"
              onClick={() => setShowAssetModal(true)}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm transition-colors"
              style={{ border: "1.5px solid #d7c3ae", color: assetIds.length ? "#191c1d" : "#857462", background: "transparent" }}
            >
              <span>{assetIds.length ? `${assetIds.length} asset${assetIds.length !== 1 ? "s" : ""} selected` : "Select assets…"}</span>
              <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "#857462" }}>hardware</span>
            </button>
            {assetIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {assets.filter((a) => assetIds.includes(a.id)).map((a) => (
                  <span key={a.id} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: "rgba(131,85,0,0.08)", color: "#835500" }}>
                    {a.tag}
                    <button onClick={() => setAssetIds((prev) => prev.filter((id) => id !== a.id))}>
                      <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>close</span>
                    </button>
                  </span>
                ))}
              </div>
            )}
            {showAssetModal && (
              <AssetPickerModal
                assets={assets}
                initialSelection={assetIds}
                onConfirm={(ids) => { setAssetIds(ids); setShowAssetModal(false); }}
                onClose={() => setShowAssetModal(false)}
              />
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#857462" }}>Lead Days</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={leadDays}
                  onChange={(e) => setLeadDays(e.target.value)}
                  style={{ ...inputStyle, width: "60px" }}
                />
                <span className="text-xs" style={{ color: "#857462" }}>days before due</span>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#857462" }}>Start Date *</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={inputStyle} />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#857462" }}>Assigned To</label>
            <input value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} placeholder="Name or email" style={inputStyle} />
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm font-medium" style={{ color: "#191c1d" }}>Active</span>
            <button
              onClick={() => setIsActive(!isActive)}
              className="relative w-10 h-6 rounded-full transition-colors"
              style={{ background: isActive ? "#835500" : "#d7c3ae" }}
            >
              <span
                className="absolute top-1 w-4 h-4 rounded-full bg-white transition-transform"
                style={{ left: isActive ? "22px" : "2px", transform: "translateX(0)" }}
              />
            </button>
          </div>

          {/* Activities */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold" style={{ fontFamily: "var(--font-manrope)", color: "#191c1d" }}>Activities</p>
              <button
                onClick={() => setActivities((prev) => [...prev, emptyDraft()])}
                className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg"
                style={{ background: "rgba(131,85,0,0.08)", color: "#835500" }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>add</span>
                Add Activity
              </button>
            </div>
            {activities.map((draft, i) => (
              <ActivityFormRow
                key={i}
                draft={draft}
                onChange={(d) => setActivities((prev) => prev.map((a, idx) => (idx === i ? d : a)))}
                onRemove={activities.length > 1 ? () => setActivities((prev) => prev.filter((_, idx) => idx !== i)) : undefined}
              />
            ))}
          </div>

          {error && <p className="text-xs px-3 py-2 rounded-lg" style={{ background: "#ffdad6", color: "#93000a" }}>{error}</p>}
        </div>

        {/* Footer */}
        <div className="px-6 py-5" style={{ borderTop: "1px solid rgba(215,195,174,0.2)" }}>
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#835500,#f5a623)" }}
          >
            {saving ? "Saving…" : "Save Schedule"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type Tab = "overview" | "activities" | "history";

export default function PreventiveMaintenancePage() {
  const [schedules, setSchedules] = useState<PMSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [showDrawer, setShowDrawer] = useState(false);
  const [history, setHistory] = useState<PMHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genMsg, setGenMsg] = useState<string | null>(null);

  // Activity inline add
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [newActivity, setNewActivity] = useState<ActivityDraft>(emptyDraft());
  const [savingActivity, setSavingActivity] = useState(false);

  // Asset management
  const [allAssets, setAllAssets] = useState<Asset[]>([]);
  const [showAssetPicker, setShowAssetPicker] = useState(false);

  useEffect(() => {
    fetchAssets(DEFAULT_PROJECT_ID).then(setAllAssets).catch(() => {});
  }, []);

  useEffect(() => {
    fetchPMSchedules()
      .then((data) => {
        setSchedules(data);
        if (data.length) setSelectedId(data[0].id);
      })
      .finally(() => setLoading(false));
  }, []);

  const selected = schedules.find((s) => s.id === selectedId) ?? null;

  useEffect(() => {
    if (activeTab === "history" && selectedId) {
      setHistoryLoading(true);
      fetchScheduleHistory(selectedId)
        .then(setHistory)
        .finally(() => setHistoryLoading(false));
    }
  }, [activeTab, selectedId]);

  async function handleGenerate() {
    if (!selectedId) return;
    setGenerating(true);
    setGenMsg(null);
    try {
      const res = await generateWorkOrders(selectedId);
      setGenMsg(res.generated > 0 ? `${res.generated} work order(s) created.` : "No activities due yet.");
      // Refresh schedule to update next_due_dates
      const updated = await fetchPMSchedules();
      setSchedules(updated);
    } catch (e: any) {
      setGenMsg(e.message);
    } finally {
      setGenerating(false);
    }
  }

  async function handleAddActivity() {
    if (!selectedId || !newActivity.name.trim()) return;
    setSavingActivity(true);
    try {
      const act = await addPMActivity(selectedId, {
        name: newActivity.name.trim(),
        frequency: newActivity.frequency,
        interval_days: newActivity.interval_days ? parseInt(newActivity.interval_days) : null,
        end_date: newActivity.end_date || null,
        description: newActivity.description,
      });
      setSchedules((prev) =>
        prev.map((s) => s.id === selectedId ? { ...s, activities: [...s.activities, act] } : s)
      );
      setNewActivity(emptyDraft());
      setShowAddActivity(false);
    } finally {
      setSavingActivity(false);
    }
  }

  async function handleDeleteActivity(activityId: number) {
    if (!selectedId) return;
    await deletePMActivity(selectedId, activityId);
    setSchedules((prev) =>
      prev.map((s) => s.id === selectedId
        ? { ...s, activities: s.activities.filter((a) => a.id !== activityId) }
        : s
      )
    );
  }

  async function handleDeleteSchedule(id: number) {
    await deletePMSchedule(id);
    const remaining = schedules.filter((s) => s.id !== id);
    setSchedules(remaining);
    setSelectedId(remaining.length ? remaining[0].id : null);
  }

  async function handleAddAsset(assetId: number) {
    if (!selectedId) return;
    const updated = await addScheduleAsset(selectedId, assetId);
    setSchedules((prev) => prev.map((s) => s.id === selectedId ? { ...s, assets: updated.assets } : s));
  }

  async function handleRemoveAsset(assetId: number) {
    if (!selectedId) return;
    await removeScheduleAsset(selectedId, assetId);
    setSchedules((prev) =>
      prev.map((s) => s.id === selectedId ? { ...s, assets: s.assets.filter((a) => a.id !== assetId) } : s)
    );
  }

  const allDueDates = selected
    ? (selected.activities ?? []).flatMap((a) => projectDatesForMonth(a, selected.start_date))
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#835500", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <div className="flex h-full" style={{ fontFamily: "var(--font-inter, Inter, sans-serif)", background: "#f8f9fa", minHeight: "calc(100vh - 64px)" }}>
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@400,0&display=swap" rel="stylesheet" />

      {/* ── Left Sidebar ── */}
      <div className="w-72 flex-shrink-0 flex flex-col" style={{ background: "#f3f4f5", borderRight: "1px solid rgba(215,195,174,0.15)" }}>
        {/* Header */}
        <div className="px-5 pt-6 pb-4">
          <h1 className="font-bold mb-0.5" style={{ fontFamily: "var(--font-manrope)", fontSize: "1.1rem", color: "#191c1d" }}>
            Preventive Maintenance
          </h1>
          <p className="text-xs" style={{ color: "#857462" }}>Manage recurring schedules</p>
          <button
            onClick={() => setShowDrawer(true)}
            className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-semibold"
            style={{ background: "linear-gradient(135deg,#835500,#f5a623)" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>add</span>
            New Schedule
          </button>
        </div>

        {/* Schedule list */}
        <div className="flex-1 overflow-y-auto px-3 pb-4">
          {schedules.length === 0 && (
            <div className="text-center py-12 px-4">
              <span className="material-symbols-outlined" style={{ fontSize: "36px", color: "#d7c3ae", display: "block", marginBottom: "8px" }}>event_repeat</span>
              <p className="text-sm font-semibold" style={{ color: "#191c1d" }}>No schedules yet</p>
              <p className="text-xs mt-1" style={{ color: "#857462" }}>Click "New Schedule" to get started.</p>
            </div>
          )}
          {schedules.map((s) => {
            const status = scheduleStatus(s);
            const due = nearestDue(s);
            const st = STATUS_STYLES[status];
            return (
              <div
                key={`sched-${s.id}`}
                onClick={() => { setSelectedId(s.id); setActiveTab("overview"); }}
                className="cursor-pointer rounded-xl px-4 py-3 mb-2 group transition-colors"
                style={{
                  background: selectedId === s.id ? "#fff" : "transparent",
                  borderLeft: selectedId === s.id ? "3px solid #835500" : "3px solid transparent",
                  boxShadow: selectedId === s.id ? "0 4px 12px rgba(25,28,29,0.06)" : "none",
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold leading-tight" style={{ color: "#191c1d" }}>{s.name}</p>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: st.bg, color: st.color }}>
                    {st.label}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="text-xs px-2 py-0.5 rounded-md font-medium" style={{ background: "rgba(131,85,0,0.08)", color: "#835500" }}>
                    {(s.activities ?? []).length} {(s.activities ?? []).length === 1 ? "activity" : "activities"}
                  </span>
                  {due && (
                    <span className="text-xs" style={{ color: "#857462" }}>Due {fmtDate(due)}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 overflow-y-auto">
        {!selected ? (
          <div className="flex items-center justify-center h-full text-sm" style={{ color: "#857462" }}>
            Select a schedule to view details.
          </div>
        ) : (
          <div className="px-8 py-7">
            {/* Page header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="font-bold" style={{ fontFamily: "var(--font-manrope)", fontSize: "1.5rem", color: "#191c1d" }}>
                    {selected.name}
                  </h2>
                  {(() => {
                    const st = STATUS_STYLES[scheduleStatus(selected)];
                    return (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: st.bg, color: st.color }}>
                        {st.label}
                      </span>
                    );
                  })()}
                </div>
                <p className="text-sm" style={{ color: "#857462" }}>
                  Starts {fmtDate(selected.start_date)} · {selected.lead_days} day lead · {selected.assigned_to ?? "Unassigned"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {genMsg && (
                  <span className="text-xs font-medium" style={{ color: genMsg.includes("order") ? "#15803d" : "#835500" }}>{genMsg}</span>
                )}
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg,#835500,#f5a623)" }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                    {generating ? "hourglass_empty" : "play_arrow"}
                  </span>
                  Generate WOs
                </button>
                <button
                  onClick={() => handleDeleteSchedule(selected.id)}
                  className="p-2 rounded-xl hover:bg-red-50"
                  title="Delete schedule"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "#ba1a1a" }}>delete</span>
                </button>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              {[
                { label: "Activities", value: (selected.activities ?? []).length, icon: "task" },
                { label: "Lead Days", value: `${selected.lead_days}d`, icon: "schedule" },
                { label: "Next Due", value: fmtDate(nearestDue(selected)), icon: "event" },
                {
                  label: "Generated WOs",
                  value: (selected.activities ?? []).reduce((sum, a) => sum + a.generated_wo_count, 0),
                  icon: "assignment",
                },
              ].map(({ label, value, icon }) => (
                <div key={label} className="bg-white rounded-2xl px-5 py-4" style={{ boxShadow: "0 4px 20px rgba(25,28,29,0.05)" }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "#835500" }}>{icon}</span>
                    <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#857462" }}>{label}</p>
                  </div>
                  <p className="font-bold" style={{ fontFamily: "var(--font-manrope)", fontSize: "1.4rem", color: "#191c1d" }}>{value}</p>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-6" style={{ borderBottom: "1px solid rgba(215,195,174,0.2)" }}>
              {(["overview", "activities", "history"] as Tab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="px-5 py-2.5 text-sm font-medium capitalize transition-colors"
                  style={{
                    color: activeTab === tab ? "#835500" : "#857462",
                    borderBottom: activeTab === tab ? "2px solid #835500" : "2px solid transparent",
                    marginBottom: "-1px",
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* ── Overview Tab ── */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <MiniCalendar dueDates={allDueDates} />
                  <div className="bg-white rounded-2xl p-5" style={{ boxShadow: "0 4px 20px rgba(25,28,29,0.05)" }}>
                    <p className="text-sm font-bold mb-4" style={{ fontFamily: "var(--font-manrope)", color: "#191c1d" }}>Schedule Details</p>
                    {[
                      { label: "Assigned To", value: selected.assigned_to ?? "—", icon: "person" },
                      { label: "Start Date", value: fmtDate(selected.start_date), icon: "calendar_today" },
                      { label: "Lead Days", value: `${selected.lead_days} days before due date`, icon: "schedule" },
                      { label: "Status", value: selected.is_active ? "Active" : "Paused", icon: "toggle_on" },
                    ].map(({ label, value, icon }) => (
                      <div key={label} className="flex items-center gap-3 py-2.5" style={{ borderBottom: "1px solid rgba(215,195,174,0.1)" }}>
                        <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "#857462" }}>{icon}</span>
                        <div>
                          <p className="text-xs" style={{ color: "#857462" }}>{label}</p>
                          <p className="text-sm font-medium" style={{ color: "#191c1d" }}>{value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Assets panel */}
                <div className="bg-white rounded-2xl p-5" style={{ boxShadow: "0 4px 20px rgba(25,28,29,0.05)" }}>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-bold" style={{ fontFamily: "var(--font-manrope)", color: "#191c1d" }}>Assets</p>
                    <button
                      onClick={() => setShowAssetPicker(true)}
                      className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg"
                      style={{ background: "rgba(131,85,0,0.08)", color: "#835500" }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>add</span>
                      Add Asset
                    </button>
                  </div>

                  {showAssetPicker && (
                    <AssetPickerModal
                      assets={allAssets.filter((a) => !(selected.assets ?? []).some((sa) => sa.id === a.id))}
                      initialSelection={[]}
                      title="Add Assets to Schedule"
                      onConfirm={async (ids) => {
                        for (const id of ids) await handleAddAsset(id);
                        setShowAssetPicker(false);
                      }}
                      onClose={() => setShowAssetPicker(false)}
                    />
                  )}

                  {(selected.assets ?? []).length === 0 ? (
                    <p className="text-sm" style={{ color: "#857462" }}>No assets linked. Click "Add Asset" to link one.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {(selected.assets ?? []).map((a) => (
                        <div
                          key={a.id}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium"
                          style={{ background: "rgba(131,85,0,0.08)", color: "#835500" }}
                        >
                          <span>{a.tag}{a.name ? ` — ${a.name}` : ""}</span>
                          <button onClick={() => handleRemoveAsset(a.id)} className="hover:opacity-70">
                            <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>close</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Activities Tab ── */}
            {activeTab === "activities" && (
              <div>
                <div className="flex justify-end mb-4">
                  <button
                    onClick={() => setShowAddActivity(!showAddActivity)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
                    style={{ background: "rgba(131,85,0,0.08)", color: "#835500" }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>add</span>
                    Add Activity
                  </button>
                </div>

                {showAddActivity && (
                  <div className="mb-4">
                    <ActivityFormRow draft={newActivity} onChange={setNewActivity} />
                    <div className="flex justify-end gap-3">
                      <button onClick={() => { setShowAddActivity(false); setNewActivity(emptyDraft()); }} className="px-4 py-2 text-sm rounded-xl" style={{ border: "1.5px solid #d7c3ae", color: "#524534" }}>
                        Cancel
                      </button>
                      <button
                        onClick={handleAddActivity}
                        disabled={savingActivity || !newActivity.name.trim()}
                        className="px-4 py-2 text-sm font-semibold text-white rounded-xl disabled:opacity-50"
                        style={{ background: "linear-gradient(135deg,#835500,#f5a623)" }}
                      >
                        {savingActivity ? "Saving…" : "Save Activity"}
                      </button>
                    </div>
                  </div>
                )}

                {(selected.activities ?? []).length === 0 && !showAddActivity ? (
                  <div className="text-center py-16 bg-white rounded-2xl" style={{ boxShadow: "0 4px 20px rgba(25,28,29,0.05)" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "40px", color: "#d7c3ae", display: "block", marginBottom: "12px" }}>task_alt</span>
                    <p className="text-sm font-semibold" style={{ color: "#191c1d" }}>No activities yet</p>
                    <p className="text-xs mt-1" style={{ color: "#857462" }}>Add activities to define the work and its recurrence.</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: "0 4px 20px rgba(25,28,29,0.05)" }}>
                    <table className="w-full">
                      <thead>
                        <tr style={{ background: "#f3f4f5" }}>
                          {["Activity", "Frequency", "Next Due", "End Date", "WOs", "Actions"].map((h) => (
                            <th key={h} className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide" style={{ color: "#524534" }}>{h !== "Actions" ? h : ""}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(selected.activities ?? []).map((a, i) => (
                          <tr
                            key={a.id ?? i}
                            style={{ borderBottom: i < (selected.activities ?? []).length - 1 ? "1px solid rgba(215,195,174,0.1)" : "none" }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "#fafafa")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                          >
                            <td className="px-5 py-3">
                              <p className="text-sm font-semibold" style={{ color: "#191c1d" }}>{a.name}</p>
                              {a.description && <p className="text-xs mt-0.5" style={{ color: "#857462" }}>{a.description}</p>}
                            </td>
                            <td className="px-5 py-3">
                              <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: "rgba(131,85,0,0.08)", color: "#835500" }}>
                                {FREQ_LABELS[a.frequency]}
                                {a.frequency === "custom_days" && a.interval_days ? ` (${a.interval_days}d)` : ""}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-sm" style={{ color: "#191c1d" }}>{fmtDate(a.next_due_date)}</td>
                            <td className="px-5 py-3 text-sm" style={{ color: "#857462" }}>{a.end_date ? fmtDate(a.end_date) : "No end date"}</td>
                            <td className="px-5 py-3 text-sm font-medium" style={{ color: "#191c1d" }}>{a.generated_wo_count}</td>
                            <td className="px-5 py-3">
                              <button
                                onClick={() => handleDeleteActivity(a.id)}
                                className="p-1.5 rounded hover:bg-red-50"
                                title="Delete activity"
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: "15px", color: "#ba1a1a" }}>delete</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ── History Tab ── */}
            {activeTab === "history" && (
              <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: "0 4px 20px rgba(25,28,29,0.05)" }}>
                {historyLoading ? (
                  <div className="flex items-center justify-center h-48">
                    <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#835500", borderTopColor: "transparent" }} />
                  </div>
                ) : history.length === 0 ? (
                  <div className="text-center py-16">
                    <span className="material-symbols-outlined" style={{ fontSize: "40px", color: "#d7c3ae", display: "block", marginBottom: "12px" }}>history</span>
                    <p className="text-sm font-semibold" style={{ color: "#191c1d" }}>No work orders generated yet</p>
                    <p className="text-xs mt-1" style={{ color: "#857462" }}>Use "Generate WOs" to create work orders for due activities.</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr style={{ background: "#f3f4f5" }}>
                        {["WO #", "Activity", "Due Date", "Completed", "Status", "Assigned To"].map((h) => (
                          <th key={h} className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide" style={{ color: "#524534" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((wo, i) => {
                        const statusColors: Record<string, { bg: string; color: string }> = {
                          open: { bg: "#e7f3ff", color: "#1d4ed8" },
                          in_progress: { bg: "rgba(131,85,0,0.08)", color: "#835500" },
                          completed: { bg: "#dcfce7", color: "#15803d" },
                          on_hold: { bg: "#fff7ed", color: "#c2410c" },
                          cancelled: { bg: "#f3f4f5", color: "#524534" },
                        };
                        const sc = statusColors[wo.status] ?? { bg: "#f3f4f5", color: "#524534" };
                        return (
                          <tr
                            key={wo.id ?? i}
                            style={{ borderBottom: i < history.length - 1 ? "1px solid rgba(215,195,174,0.1)" : "none" }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "#fafafa")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                          >
                            <td className="px-5 py-3 text-sm font-mono font-semibold" style={{ color: "#835500" }}>#{wo.id}</td>
                            <td className="px-5 py-3 text-sm" style={{ color: "#191c1d" }}>{wo.activity_name ?? "—"}</td>
                            <td className="px-5 py-3 text-sm" style={{ color: "#191c1d" }}>{fmtDate(wo.due_date)}</td>
                            <td className="px-5 py-3 text-sm" style={{ color: "#857462" }}>{wo.completed_date ? fmtDate(wo.completed_date) : "—"}</td>
                            <td className="px-5 py-3">
                              <span className="text-xs font-semibold px-2.5 py-1 rounded-full capitalize" style={{ background: sc.bg, color: sc.color }}>
                                {wo.status.replace("_", " ")}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-sm" style={{ color: "#857462" }}>{wo.assigned_to ?? "—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Drawer */}
      {showDrawer && (
        <NewScheduleDrawer
          onClose={() => setShowDrawer(false)}
          onCreated={(s) => {
            setSchedules((prev) => [...prev, s]);
            setSelectedId(s.id);
            setShowDrawer(false);
          }}
        />
      )}
    </div>
  );
}
