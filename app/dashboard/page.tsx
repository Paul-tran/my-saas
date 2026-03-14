import Sidebar from "../components/Sidebar";

export default function Dashboard() {
  return (
    <div className="flex min-h-screen bg-gray-50">

      <Sidebar active="dashboard" />

      {/* Main Content */}
      <main className="flex-1 px-8 py-8">
        <h2 className="text-2xl font-bold text-gray-900">Welcome to ConstructIQ</h2>
        <p className="mt-2 text-gray-500">Here's an overview of your projects.</p>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-6 mt-8">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <p className="text-sm text-gray-500">Total Documents</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">0</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <p className="text-sm text-gray-500">Active Assets</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">0</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <p className="text-sm text-gray-500">Open Inspections</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">0</p>
          </div>
        </div>
      </main>

    </div>
  );
}