import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-white">

<Navbar />

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center px-8 py-32">
        <h2 className="text-5xl font-bold text-gray-900 max-w-2xl">
          Project Management Built for Construction
        </h2>
        <p className="mt-6 text-xl text-gray-500 max-w-xl">
          Document control, asset management, and commissioning — all in one place.
        </p>
        <button className="mt-8 bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-medium">
          Start Free Trial
        </button>
     </section>

      {/* Features Section */}
      <section className="bg-gray-50 px-8 py-24">
        <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Everything you need on one platform
        </h3>
        <div className="grid grid-cols-3 gap-8 max-w-5xl mx-auto">

          <div className="bg-white p-8 rounded-xl shadow-sm">
            <h4 className="text-lg font-bold text-gray-800">Document Control</h4>
            <p className="mt-2 text-gray-500">Manage drawings, submittals, and RFIs in one place.</p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-sm">
            <h4 className="text-lg font-bold text-gray-800">Asset Management</h4>
            <p className="mt-2 text-gray-500">Track equipment and assets across your entire project.</p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-sm">
            <h4 className="text-lg font-bold text-gray-800">Commissioning</h4>
            <p className="mt-2 text-gray-500">Streamline inspections, checklists, and sign-offs.</p>
          </div>

        </div>
      </section>
{/* Call to Action */}
      <section className="flex flex-col items-center justify-center text-center px-8 py-24 bg-blue-600">
        <h3 className="text-4xl font-bold text-white">
          Ready to simplify your projects?
        </h3>
        <p className="mt-4 text-blue-100 text-xl">
          Join construction teams already using ConstructIQ.
        </p>
        <button className="mt-8 bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-medium">
          Get Started Free
        </button>
      </section>
      <Footer />
    </main>
  );
}