"use client";

import { motion } from "framer-motion";
import { useState } from "react";

/* ── Animation variants ───────────────────────────────────────────────────── */

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
};

/* ── Page ──────────────────────────────────────────────────────────────────── */

export default function SettingsPage() {
  const [displayName, setDisplayName] = useState("Demo Director");
  const [email] = useState("demo@genesis.ai");
  const [notifications, setNotifications] = useState({
    renderComplete: true,
    weeklyDigest: false,
    productUpdates: true,
  });
  const [theme, setTheme] = useState<"dark" | "light" | "system">("dark");
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <motion.div
      className="max-w-3xl space-y-8"
      initial="initial"
      animate="animate"
      variants={stagger}
    >
      {/* Header */}
      <motion.div variants={fadeUp}>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white">
          Settings
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Manage your account preferences
        </p>
      </motion.div>

      {/* Profile Section */}
      <motion.section variants={fadeUp} className="glass rounded-2xl p-6 space-y-5">
        <h2 className="font-heading text-lg font-semibold text-white">Profile</h2>

        <div className="space-y-4">
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-300 mb-1.5">
              Display Name
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-xl bg-surface border border-surface-border px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-genesis-500/50 focus:border-genesis-500/50 transition-all"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              disabled
              className="w-full rounded-xl bg-surface/50 border border-surface-border px-4 py-2.5 text-sm text-gray-500 cursor-not-allowed"
            />
            <p className="text-xs text-gray-600 mt-1">Contact support to change your email</p>
          </div>
        </div>
      </motion.section>

      {/* Notifications */}
      <motion.section variants={fadeUp} className="glass rounded-2xl p-6 space-y-5">
        <h2 className="font-heading text-lg font-semibold text-white">Notifications</h2>

        <div className="space-y-4">
          {[
            { key: "renderComplete" as const, label: "Render Complete", desc: "Get notified when your renders finish" },
            { key: "weeklyDigest" as const, label: "Weekly Digest", desc: "Receive a weekly summary of your activity" },
            { key: "productUpdates" as const, label: "Product Updates", desc: "Learn about new features and improvements" },
          ].map((item) => (
            <label key={item.key} className="flex items-center justify-between cursor-pointer group">
              <div>
                <p className="text-sm font-medium text-white">{item.label}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={notifications[item.key]}
                onClick={() => setNotifications((prev) => ({ ...prev, [item.key]: !prev[item.key] }))}
                className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-genesis-500/50 ${
                  notifications[item.key] ? "bg-genesis-600" : "bg-surface-border"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transform transition-transform duration-200 ${
                    notifications[item.key] ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </label>
          ))}
        </div>
      </motion.section>

      {/* Appearance */}
      <motion.section variants={fadeUp} className="glass rounded-2xl p-6 space-y-5">
        <h2 className="font-heading text-lg font-semibold text-white">Appearance</h2>

        <div className="grid grid-cols-3 gap-3">
          {([
            { value: "dark" as const, label: "Dark", icon: "🌙" },
            { value: "light" as const, label: "Light", icon: "☀️" },
            { value: "system" as const, label: "System", icon: "💻" },
          ]).map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setTheme(option.value)}
              className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition-all ${
                theme === option.value
                  ? "border-genesis-500/50 bg-genesis-500/10 text-white"
                  : "border-surface-border bg-surface/50 text-gray-400 hover:border-surface-border hover:bg-surface"
              }`}
            >
              <span className="text-2xl">{option.icon}</span>
              <span className="text-sm font-medium">{option.label}</span>
            </button>
          ))}
        </div>
      </motion.section>

      {/* Save button */}
      <motion.div variants={fadeUp} className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-genesis-600 to-genesis-500 text-white font-medium text-sm hover:from-genesis-500 hover:to-genesis-400 transition-all shadow-lg shadow-genesis-500/20 hover:shadow-genesis-500/30"
        >
          {saved ? "✓ Saved" : "Save Changes"}
        </button>
      </motion.div>
    </motion.div>
  );
}
