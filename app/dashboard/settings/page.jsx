"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Mail, Bell, Check, Loader2, Settings } from "lucide-react";

function Toggle({ enabled, onChange, loading }) {
  return (
    <button
      onClick={() => !loading && onChange(!enabled)}
      className={cn(
        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none",
        enabled ? "bg-primary" : "bg-border",
        loading && "opacity-60 cursor-not-allowed"
      )}
    >
      <span className={cn(
        "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200",
        enabled ? "translate-x-6" : "translate-x-1"
      )} />
    </button>
  );
}

function SettingRow({ icon: Icon, title, description, children }) {
  return (
    <div className="flex items-start justify-between gap-4 py-5 border-b border-border/50 last:border-0">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
          <Icon className="h-4.5 w-4.5 text-primary" />
        </div>
        <div>
          <p className="font-semibold text-sm">{title}</p>
          <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{description}</p>
        </div>
      </div>
      <div className="shrink-0 mt-1">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [emailDigest, setEmailDigest] = useState(true);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);

  useEffect(() => {
    if (!user?.email) return;
    fetch(`/api/profile?email=${encodeURIComponent(user.email)}`)
      .then((r) => r.json())
      .then((data) => {
        // null = never set = default opted in
        setEmailDigest(data?.email_digest !== false);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user?.email]);

  const handleToggle = async (val) => {
    setSaving(true);
    const res = await fetch("/api/email/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: val }),
    });
    if (res.ok) {
      setEmailDigest(val);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
    setSaving(false);
  };

  return (
    <div className="max-w-xl mx-auto px-4 pt-6 pb-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <Settings className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Settings</h1>
            <p className="text-sm text-muted-foreground">Manage your account preferences.</p>
          </div>
        </div>
      </motion.div>

      {/* Notifications card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-card border border-border rounded-2xl px-6 py-1"
      >
        <p className="text-xs font-bold font-mono text-muted-foreground uppercase tracking-wider py-4 border-b border-border/50">
          Notifications
        </p>

        {loading ? (
          <div className="py-8 flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <SettingRow
            icon={Mail}
            title="Weekly digest email"
            description="Receive a summary every Monday with your session count, avg score, streak, roadmap progress, and upcoming interview reminder."
          >
            <div className="flex items-center gap-2">
              {saved && <Check className="h-3.5 w-3.5 text-emerald-400" />}
              <Toggle enabled={emailDigest} onChange={handleToggle} loading={saving} />
            </div>
          </SettingRow>
        )}
      </motion.div>

      {/* Info note */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="text-xs text-muted-foreground text-center mt-6 leading-relaxed"
      >
        Digest emails are sent every Monday at 9:00 AM UTC.
        You can also unsubscribe directly from any email.
      </motion.p>
    </div>
  );
}
