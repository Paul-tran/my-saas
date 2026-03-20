export default function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="mt-6 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
      <span className="font-medium">Error:</span> {message}
    </div>
  );
}
