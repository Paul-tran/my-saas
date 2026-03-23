"use client";

import { useState, useEffect } from "react";
import { Subscription, fetchSubscription, startCheckout, openPortal } from "../models/billing";

export function useBilling() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const sub = await fetchSubscription();
      setSubscription(sub);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleStartTrial() {
    setRedirecting(true);
    try {
      const url = await startCheckout();
      window.location.href = url;
    } catch {
      setRedirecting(false);
    }
  }

  async function handleManage() {
    setRedirecting(true);
    try {
      const url = await openPortal();
      window.location.href = url;
    } catch {
      setRedirecting(false);
    }
  }

  const isActive = subscription?.status === "active" || subscription?.status === "trialing";

  return {
    subscription,
    loading,
    redirecting,
    isActive,
    handleStartTrial,
    handleManage,
    reload: load,
  };
}
