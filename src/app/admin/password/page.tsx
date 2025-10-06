"use client";

import React, { useState } from "react";
import { toast } from "sonner";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export default function ChangePasswordPage() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const getStaffId = () => {
    try {
      if (typeof window === "undefined") return null;
      const raw = localStorage.getItem("auth") || localStorage.getItem("user");
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      const user = parsed?.user ?? parsed;
      return user?.staff_id ?? user?.id ?? null;
    } catch {
      return null;
    }
  };

  const getToken = () => {
    try {
      const raw = localStorage.getItem("auth") || localStorage.getItem("user");
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed?.token ?? null;
    } catch {
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New password and confirm password do not match");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }

    const staffId = getStaffId();
    if (!staffId) {
      toast.error("Staff not found. Please login again.");
      return;
    }

    setLoading(true);
    const token = getToken();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const body = JSON.stringify({
      old_password: oldPassword,
      new_password: newPassword,
      confirm_password: confirmPassword,
    });

    try {
      const res = await fetch(`${BACKEND}/api/staff/${staffId}/change-password`, {
        method: "POST",
        headers,
        body,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || data?.error || `Failed (${res.status})`);
      }

      toast.success("Password changed successfully ✅");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
   } catch (err: unknown) {
  console.error("Change password error:", err);
  if (err instanceof Error) {
    toast.error(err.message || "Failed to change password");
  } else {
    toast.error("Failed to change password");
  }
} finally {
  setLoading(false);
}
  };

  return (
    <section className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6 text-center">[change password]</h1>

      <form onSubmit={handleSubmit} className="bg-white/5 p-6 rounded-lg space-y-4">
        <label className="block">
          <div className="text-sm mb-1">Old Password</div>
          <input
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            className="w-full px-4 py-2 rounded bg-white/5"
          />
        </label>

        <label className="block">
          <div className="text-sm mb-1">New Password</div>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-4 py-2 rounded bg-white/5"
          />
        </label>

        <label className="block">
          <div className="text-sm mb-1">Confirm New Password</div>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-2 rounded bg-white/5"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 rounded bg-amber-400 text-black font-semibold"
        >
          {loading ? "Updating…" : "Change Password"}
        </button>
      </form>
    </section>
  );
}
