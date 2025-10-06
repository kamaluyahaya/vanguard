// components/admin/ProfilePanel.tsx
"use client";

import React, { JSX, useEffect, useState } from "react";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

type Staff = {
  staff_id: number;
  full_name: string;
  email: string;
  phone?: string | null;
  role?: string | null;
  department?: string | null;
  position?: string | null;
  password_hash?: string | null;
  is_active?: number | boolean;
  last_login?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export default function ProfilePanel(): JSX.Element {
  const [staff, setStaff] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // form fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [department, setDepartment] = useState<string | null>(null);
  const [position, setPosition] = useState<string | null>(null);
  const [isActive, setIsActive] = useState<boolean>(true);

  // get staff id from localStorage.auth.user (robust)
  const getStoredStaffId = (): number | string | null => {
    try {
      if (typeof window === "undefined") return null;
      const raw = localStorage.getItem("auth") || localStorage.getItem("user");
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      const user = parsed?.user ?? parsed;
      if (!user) return null;
      return user.staff_id ?? user.id ?? user.user_id ?? null;
    } catch (e) {
      console.warn("Failed to read stored auth/user", e);
      return null;
    }
  };

  useEffect(() => {
    const id = getStoredStaffId();
    if (!id) {
      setError("No logged-in staff found in localStorage. Please login.");
      setLoading(false);
      return;
    }

    const ac = new AbortController();
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${BACKEND}/api/staff/${id}`, { signal: ac.signal });
        if (!res.ok) {
          const txt = await res.text().catch(() => null);
          throw new Error(`Failed to load profile (${res.status}) ${txt ?? ""}`);
        }
        const json = await res.json();
        // api might return the object directly or wrapped { data: {...} }
        const payload = json?.data ?? json;
        const record: Staff = payload?.staff || payload || json;
        setStaff(record);
        // populate form
        setFullName(record?.full_name ?? "");
        setEmail(record?.email ?? "");
        setPhone(record?.phone ?? null);
        setRole(record?.role ?? null);
        setDepartment(record?.department ?? null);
        setPosition(record?.position ?? null);
        setIsActive(Boolean(record?.is_active ?? true));
      } catch (err: unknown) {
  if (err instanceof Error) {
    console.error("fetch profile error:", err);
    setError(err.message || "Failed to fetch profile");
  } else {
    console.error("fetch profile error:", err);
    setError("Failed to fetch profile");
  }
} finally {
        setLoading(false);
      }
    };

    fetchProfile();
    return () => ac.abort();
  }, []);

  const formatDate = (d?: string | null) => (d ? new Date(d).toLocaleString() : "-");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staff) return;

    const id = staff.staff_id;
    setSaving(true);
    setError(null);

    try {
      const payload = {
        full_name: fullName,
        email,
        phone,
        role,
        department,
        position,
        is_active: isActive ? 1 : 0,
      };

      const res = await fetch(`${BACKEND}/api/staff/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message || `Failed to update (${res.status})`);
      }

      const updated = await res.json();
      const updatedRecord: Staff = updated?.data ?? updated ?? payload;
      const updatedStaff: Staff = updatedRecord as Staff;
setStaff((prev) => ({ ...(prev ?? {}), ...updatedStaff }));
setFullName(updatedStaff.full_name ?? fullName);
setEmail(updatedStaff.email ?? email);
setPhone(updatedStaff.phone ?? phone);
setRole(updatedStaff.role ?? role);
setDepartment(updatedStaff.department ?? department);
setPosition(updatedStaff.position ?? position);
setIsActive(Boolean(updatedStaff.is_active ?? isActive));


      // simple feedback
      alert("Profile updated successfully.");
    } catch (err: unknown) {
  if (err instanceof Error) {
    console.error("update profile error:", err);
    setError(err.message || "Failed to update profile");
  } else {
    console.error("update profile error:", err);
    setError("Failed to update profile");
  }
}finally {
      setSaving(false);
    }
  };

  return (
    <section>
      <h1 className="text-2xl py-5 text-center md:text-4xl font-bold mb-6">[my profile]</h1>

      {loading ? (
        <div className="text-slate-400 text-center py-8">Loading profile…</div>
      ) : error ? (
        <div className="text-rose-400 text-center py-6">{error}</div>
      ) : !staff ? (
        <div className="text-slate-400 text-center py-6">No profile data available.</div>
      ) : (
        <div className="container mx-auto">
          <div className="bg-white/5 rounded-lg p-6 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-slate-400">Staff ID</div>
                <div className="font-medium">{staff.staff_id}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Active</div>
                <div className="font-medium">{staff.is_active ? "Yes" : "No"}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Created</div>
                <div className="font-medium">{formatDate(staff.created_at)}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Last login</div>
                <div className="font-medium">{formatDate(staff.last_login)}</div>
              </div>
              <div className="col-span-2">
                <div className="text-xs text-slate-400">Password hash</div>
                <div className="text-xs break-all">{staff.password_hash || "(hidden)"}</div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSave} className="bg-white/3 rounded-lg p-6 space-y-4">
            <label className="block">
              <div className="text-sm mb-1">Full name</div>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2 rounded bg-white/5"
              />
            </label>

            <label className="block">
              <div className="text-sm mb-1">Email</div>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                className="w-full px-4 py-2 rounded bg-white/5"
              />
            </label>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <label className="block">
                <div className="text-sm mb-1">Phone</div>
                <input value={phone ?? ""} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-2 rounded bg-white/5" />
              </label>
              <label className="block">
                <div className="text-sm mb-1">Role</div>
                <input value={role ?? ""} onChange={(e) => setRole(e.target.value)} className="w-full px-4 py-2 rounded bg-white/5" />
              </label>
              <label className="block">
                <div className="text-sm mb-1">Department</div>
                <input value={department ?? ""} onChange={(e) => setDepartment(e.target.value)} className="w-full px-4 py-2 rounded bg-white/5" />
              </label>
            </div>

            <label className="block">
              <div className="text-sm mb-1">Position</div>
              <input value={position ?? ""} onChange={(e) => setPosition(e.target.value)} className="w-full px-4 py-2 rounded bg-white/5" />
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              Active account
            </label>

            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="px-4 py-2 rounded bg-amber-400 text-black font-semibold">
                {saving ? "Saving…" : "Save profile"}
              </button>

              <button
                type="button"
                onClick={() => {
                  // reset form to fetched staff
                  setFullName(staff.full_name ?? "");
                  setEmail(staff.email ?? "");
                  setPhone(staff.phone ?? null);
                  setRole(staff.role ?? null);
                  setDepartment(staff.department ?? null);
                  setPosition(staff.position ?? null);
                  setIsActive(Boolean(staff.is_active ?? true));
                }}
                className="px-4 py-2 rounded bg-white/6"
              >
                Reset
              </button>
            </div>

            {error && <div className="text-sm text-rose-400">{error}</div>}
          </form>
        </div>
      )}
    </section>
  );
}
