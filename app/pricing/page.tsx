import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function Pricing() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      <section className="flex flex-col items-center justify-center text-center px-8 py-24">
        <h2 className="text-4xl font-bold text-gray-900">Simple Pricing</h2>
        <p className="mt-4 text-gray-500 text-xl">One plan, everything included.</p>

        <div className="mt-12 bg-gray-50 rounded-xl p-10 shadow-sm max-w-sm w-full">
          <h3 className="text-2xl font-bold text-gray-800">Pro Plan</h3>
          <p className="mt-2 text-5xl font-bold text-blue-600">$49<span className="text-xl text-gray-400">/mo</span></p>
          <ul className="mt-6 text-gray-500 space-y-2 text-left">
            <li>✅ Document Control</li>
            <li>✅ Asset Management</li>
            <li>✅ Commissioning</li>
            <li>✅ Unlimited Projects</li>
            <li>✅ Priority Support</li>
          </ul>
          <button className="mt-8 w-full bg-blue-600 text-white py-3 rounded-lg font-medium">
            Get Started Free
          </button>
        </div>
      </section>

      <Footer />
    </main>
  );
}