import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between px-8 py-4 border-b border-gray-200">
      <Link href="/" className="text-xl font-bold text-blue-600">ConstructIQ</Link>
      <div className="flex items-center gap-6">
        <Link href="/pricing" className="text-gray-500 text-sm font-medium">Pricing</Link>
        <Link href="/sign-in" className="text-gray-500 text-sm font-medium">Sign In</Link>
        <Link href="/sign-up" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
          Get Started
        </Link>
      </div>
    </nav>
  );
}