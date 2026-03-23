import Sidebar from "../components/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        background: "#f8f9fa",
        overflow: "hidden",
        fontFamily: "var(--font-inter, Inter, sans-serif)",
      }}
    >
      <Sidebar />
      {/* Content — offset by collapsed sidebar width on desktop, full-width on mobile */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          marginLeft: "64px",
        }}
        className="dashboard-content"
      >
        {children}
      </div>

      <style>{`
        @media (max-width: 1023px) {
          .dashboard-content { margin-left: 0 !important; }
        }
      `}</style>
    </div>
  );
}
