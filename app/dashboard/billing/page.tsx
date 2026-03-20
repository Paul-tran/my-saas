"use client";

export const dynamic = "force-dynamic";

import { useAuth } from "@clerk/nextjs";
import Sidebar from "../../components/Sidebar";
import { useBilling } from "../../../lib/hooks/useBilling";
import { STATUS_LABEL, STATUS_COLOR, simulateBilling } from "../../../lib/models/billing";

const DEV_SCENARIOS = ["trial", "active", "past_due", "canceled"] as const;

export default function BillingPage() {
  const { subscription, loading, redirecting, isActive, handleStartTrial, handleManage, reload } = useBilling();
  const { getToken } = useAuth();

  async function handleSimulate(scenario: typeof DEV_SCENARIOS[number]) {
    const token = await getToken();
    if (!token) return;
    await simulateBilling(scenario, token);
    reload();
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar active="billing" />

      <main className="flex-1 px-8 py-8 max-w-2xl">
        <h2 className="text-2xl font-bold text-gray-900">Billing</h2>
        <p className="mt-2 text-gray-500">Manage your ConstructIQ subscription.</p>

        {loading ? (
          <div className="mt-12 text-gray-400">Loading...</div>
        ) : subscription ? (
          <div className="mt-8 bg-white rounded-xl shadow-sm p-6 space-y-6">
            {/* Status */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Subscription Status</p>
                <span className={`mt-1 inline-block px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLOR[subscription.status] || "text-gray-500 bg-gray-100"}`}>
                  {STATUS_LABEL[subscription.status] || subscription.status}
                </span>
              </div>
              <button
                onClick={handleManage}
                disabled={redirecting}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {redirecting ? "Redirecting..." : "Manage Subscription"}
              </button>
            </div>

            {/* Trial info */}
            {subscription.status === "trialing" && subscription.trial_ends_at && (
              <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800">
                Your free trial ends on{" "}
                <strong>{new Date(subscription.trial_ends_at).toLocaleDateString()}</strong>.
                Add a payment method before then to keep access.
              </div>
            )}

            {/* Past due warning */}
            {subscription.status === "past_due" && (
              <div className="bg-red-50 rounded-lg p-4 text-sm text-red-800">
                Your last payment failed. Update your payment method to restore access.
              </div>
            )}

            {/* Next billing */}
            {subscription.current_period_end && subscription.status === "active" && (
              <div className="text-sm text-gray-600">
                Next billing date:{" "}
                <strong>{new Date(subscription.current_period_end).toLocaleDateString()}</strong>
              </div>
            )}

            {/* Plan details */}
            <div className="border-t border-gray-100 pt-4 text-sm text-gray-600 space-y-1">
              <p><span className="font-medium">Plan:</span> ConstructIQ Pro</p>
              <p><span className="font-medium">Price:</span> $49 / user / month</p>
              <p><span className="font-medium">Includes:</span> All modules — Documents, Assets, Commissioning, AI Analysis</p>
            </div>
          </div>
        ) : (
          /* No subscription yet */
          <div className="mt-8 bg-white rounded-xl shadow-sm p-8 text-center space-y-4">
            <p className="text-5xl">💳</p>
            <h3 className="text-lg font-bold text-gray-900">No active subscription</h3>
            <p className="text-gray-500 text-sm">
              Start your 14-day free trial — no credit card required.
            </p>
            <button
              onClick={handleStartTrial}
              disabled={redirecting}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50"
            >
              {redirecting ? "Redirecting to Stripe..." : "Start Free Trial"}
            </button>
          </div>
        )}
        {/* Dev simulation panel */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-10 border border-dashed border-yellow-400 rounded-xl p-5 bg-yellow-50">
            <p className="text-xs font-bold text-yellow-700 uppercase tracking-wide mb-3">Dev tools — simulate billing state</p>
            <div className="flex gap-2 flex-wrap">
              {DEV_SCENARIOS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSimulate(s)}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white border border-yellow-300 text-yellow-800 hover:bg-yellow-100"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
