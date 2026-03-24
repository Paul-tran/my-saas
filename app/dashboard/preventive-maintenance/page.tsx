"use client";

import { useEffect, useState, useCallback } from "react";
import {
  PMSchedule, PMActivity, PMHistoryEntry, PMFrequency,
  fetchPMSchedules, createPMSchedule, updatePMSchedule, deletePMSchedule,
  addPMActivity, updatePMActivity, deletePMActivity,
  generateWorkOrders, fetchScheduleHistory,
} from "@/lib/models/pm-schedules";

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
  const [activities, setActivities] = useState<ActivityDraft[]>([emptyDraft()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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
    setSchedules((prev) => prev.filter((s) => s.id !== id));
    setSelectedId((prev) => {
      const remaining = schedules.filter((s) => s.id !== id);
      return remaining.length ? remaining[0].id : null;
    });
  }

  const allDueDates = (selected?.activities ?? []).map((a) => a.next_due_date).filter(Boolean) as string[];

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
                key={s.id}
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
