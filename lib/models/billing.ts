import { apiFetch } from "../api";

export type Subscription = {
  id: number;
  clerk_user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: "trialing" | "active" | "past_due" | "canceled" | "unpaid";
  trial_ends_at: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
};

export async function fetchSubscription(token?: string): Promise<Subscription | null> {
  return apiFetch("/api/v1/billing/subscription", token);
}

export async function startCheckout(token?: string): Promise<string> {
  const res = await apiFetch<{ url: string }>("/api/v1/billing/checkout", token, {
    method: "POST",
  });
  return res.url;
}

export async function openPortal(token?: string): Promise<string> {
  const res = await apiFetch<{ url: string }>("/api/v1/billing/portal", token, {
    method: "POST",
  });
  return res.url;
}

export async function simulateBilling(
  scenario: "trial" | "active" | "past_due" | "canceled",
  token?: string
): Promise<Subscription> {
  return apiFetch(`/api/v1/billing/simulate/${scenario}`, token, { method: "POST" });
}

export const STATUS_LABEL: Record<string, string> = {
  trialing: "Free Trial",
  active: "Active",
  past_due: "Payment Past Due",
  canceled: "Canceled",
  unpaid: "Unpaid",
};

export const STATUS_COLOR: Record<string, string> = {
  trialing: "text-blue-600 bg-blue-50",
  active: "text-green-600 bg-green-50",
  past_due: "text-red-600 bg-red-50",
  canceled: "text-gray-500 bg-gray-100",
  unpaid: "text-red-600 bg-red-50",
};
