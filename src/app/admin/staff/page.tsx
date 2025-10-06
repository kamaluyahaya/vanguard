// components/admin/EnrollStaffPanel.tsx
"use client";

import React, { JSX, useState } from "react";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

type StaffPayload = {
  full_name: string;
  email: string;
  phone?: string;
  role?: string;
  department?: string;
  position?: string;
  password?: string; // send plaintext -> backend should hash it (password_hash)
  is_active?: boolean;
};

type StaffRecord = {
  staff_id: number;
  full_name: string;
  email: string;
  phone?: string;
  role?: string;
  department?: string;
  position?: string;
  password_hash?: string;
  is_active?: boolean;
  last_login?: string | null;
  created_at?: string;
  updated_at?: string;
};

export default function EnrollStaffPanel(): JSX.Element {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [department, setDepartment] = useState("");
  const [position, setPosition] = useState("");
  const [password, setPassword] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [created, setCreated] = useState<StaffRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFeedback(null);
    setError(null);

    if (!fullName.trim() || !email.trim() || !password) {
      setError("Please provide full name, email and password.");
      return;
    }

    const payload: StaffPayload = {
      full_name: fullName.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      role: role.trim() || undefined,
      department: department.trim() || undefined,
      position: position.trim() || undefined,
      password: password, // backend should hash -> password_hash
      is_active: isActive,
    };

    setLoading(true);
    try {
      const res = await fetch(`${BACKEND}/api/staff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }

      const data: StaffRecord = await res.json();
      setCreated(data);
      setFeedback("Staff enrolled successfully.");
      // reset sensible fields
      setFullName("");
      setEmail("");
      setPhone("");
      setRole("");
      setDepartment("");
      setPosition("");
      setPassword("");
      setIsActive(true);
    } catch (err: any) {
      console.error("Enroll staff error:", err);
      setError(err?.message || "Failed to enroll staff.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
             <h1 className="text-2xl py-5 text-center md:text-5xl lg:text-6xl font-bold mb-6">[enroll staff]</h1>
      

      <form onSubmit={submit} className="bg-white/5 rounded-lg p-6 space-y-4 container">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Full name"
            className="w-full px-4 py-2 rounded bg-white/6 outline-none"
            required
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            type="email"
            className="w-full px-4 py-2 rounded bg-white/6 outline-none"
            required
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone"
            className="w-full px-4 py-2 rounded bg-white/6 outline-none"
          />
          <input
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="Role (e.g. Admin, Analyst)"
            className="w-full px-4 py-2 rounded bg-white/6 outline-none"
          />
          <input
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="Department"
            className="w-full px-4 py-2 rounded bg-white/6 outline-none"
          />
          <input
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            placeholder="Position"
            className="w-full px-4 py-2 rounded bg-white/6 outline-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (will be hashed server-side)"
            type="password"
            className="w-full px-4 py-2 rounded bg-white/6 outline-none"
            required
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              type="checkbox"
              className="rounded"
            />
            Active account
          </label>
        </div>

        <div className="flex items-center gap-3">
          <button
            className="px-4 py-2 rounded bg-amber-400 text-black font-semibold disabled:opacity-60"
            type="submit"
            disabled={loading}
          >
            {loading ? "Saving..." : "Enroll Staff"}
          </button>

          <button
            type="button"
            onClick={() => {
              setFullName("");
              setEmail("");
              setPhone("");
              setRole("");
              setDepartment("");
              setPosition("");
              setPassword("");
              setIsActive(true);
              setError(null);
              setFeedback(null);
              setCreated(null);
            }}
            className="px-3 py-2 rounded bg-white/6"
          >
            Reset
          </button>
        </div>

        {error && <div className="text-sm text-rose-400 mt-2">{error}</div>}
        {feedback && <div className="text-sm text-emerald-300 mt-2">{feedback}</div>}
      </form>

      {created && (
        <section className="mt-6 bg-white/5 p-4 rounded-lg border border-white/6 container">
          <h4 className="font-semibold mb-2">Created staff</h4>
          <table className="w-full text-sm">
            <tbody>
              <tr>
                <td className="font-medium py-1">Staff ID</td>
                <td className="py-1">{created.staff_id}</td>
              </tr>
              <tr>
                <td className="font-medium py-1">Full name</td>
                <td className="py-1">{created.full_name}</td>
              </tr>
              <tr>
                <td className="font-medium py-1">Email</td>
                <td className="py-1">{created.email}</td>
              </tr>
              <tr>
                <td className="font-medium py-1">Phone</td>
                <td className="py-1">{created.phone || "-"}</td>
              </tr>
              <tr>
                <td className="font-medium py-1">Role</td>
                <td className="py-1">{created.role || "-"}</td>
              </tr>
              <tr>
                <td className="font-medium py-1">Department</td>
                <td className="py-1">{created.department || "-"}</td>
              </tr>
              <tr>
                <td className="font-medium py-1">Position</td>
                <td className="py-1">{created.position || "-"}</td>
              </tr>
              <tr>
                <td className="font-medium py-1">Password hash</td>
                <td className="py-1 text-xs break-all">{created.password_hash || "(hidden)"}</td>
              </tr>
              <tr>
                <td className="font-medium py-1">Active</td>
                <td className="py-1">{created.is_active ? "Yes" : "No"}</td>
              </tr>
              <tr>
                <td className="font-medium py-1">Last login</td>
                <td className="py-1">{created.last_login || "-"}</td>
              </tr>
              <tr>
                <td className="font-medium py-1">Created at</td>
                <td className="py-1">{created.created_at || "-"}</td>
              </tr>
              <tr>
                <td className="font-medium py-1">Updated at</td>
                <td className="py-1">{created.updated_at || "-"}</td>
              </tr>
            </tbody>
          </table>
        </section>
      )}
    </section>
  );
}
