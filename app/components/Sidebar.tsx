export default function Sidebar({ active }: { active: string }) {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 px-4 py-8">
      <h1 className="text-xl font-bold text-blue-600 mb-8">ConstructIQ</h1>
      <nav className="flex flex-col gap-2">
        <a href="/dashboard" className={`px-4 py-2 rounded-lg text-sm font-medium ${active === "dashboard" ? "bg-blue-50 text-blue-600" : "text-gray-500 hover:bg-gray-50"}`}>
          Dashboard
        </a>
        <a href="/dashboard/documents" className={`px-4 py-2 rounded-lg text-sm font-medium ${active === "documents" ? "bg-blue-50 text-blue-600" : "text-gray-500 hover:bg-gray-50"}`}>
          Documents
        </a>
        <a href="/dashboard/assets" className={`px-4 py-2 rounded-lg text-sm font-medium ${active === "assets" ? "bg-blue-50 text-blue-600" : "text-gray-500 hover:bg-gray-50"}`}>
          Assets
        </a>
        <a href="/dashboard/commissioning" className={`px-4 py-2 rounded-lg text-sm font-medium ${active === "commissioning" ? "bg-blue-50 text-blue-600" : "text-gray-500 hover:bg-gray-50"}`}>
          Commissioning
        </a>
        <a href="/dashboard/billing" className={`px-4 py-2 rounded-lg text-sm font-medium ${active === "billing" ? "bg-blue-50 text-blue-600" : "text-gray-500 hover:bg-gray-50"}`}>
          Billing
        </a>
      </nav>
    </aside>
  );
}