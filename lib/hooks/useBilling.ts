"use client";

import { useAuth } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { Subscription, fetchSubscription, startCheckout, openPortal } from "../models/billing";

export function useBilling() {
  const { getToken } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) return;
      const sub = await fetchSubscription(token);
      setSubscription(sub);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleStartTrial() {
    const token = await getToken();
    if (!token) return;
    setRedirecting(true);
    try {
      const url = await startCheckout(token);
      window.location.href = url;
    } catch {
      setRedirecting(false);
    }
  }

  async function handleManage() {
    const token = await getToken();
    if (!token) return;
    setRedirecting(true);
    try {
      const url = await openPortal(token);
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
