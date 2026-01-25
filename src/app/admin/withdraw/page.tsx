"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

type WithdrawRequest = {
  request_id: number;
  user_id: number;
  full_name: string;
  email: string;
  amount: number;
  status: string;
  admin_note?: string | null;
  created_at?: string;
  profile_image?: string | null;
};

export default function AdminWithdrawPanel() {
  const [requests, setRequests] = useState<WithdrawRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<WithdrawRequest | null>(null);
  const [note, setNote] = useState("");
  const [updateLoading, setUpdateLoading] = useState(false);
  const [query, setQuery] = useState("");

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BACKEND}/api/fund/withdraw`);
      if (!res.ok) throw new Error("Failed to fetch withdraw requests");
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || "Failed to fetch requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return requests;
    return requests.filter((r) => 
      r.full_name.toLowerCase().includes(term) || r.email.toLowerCase().includes(term)
    );
  }, [requests, query]);

  const formatDate = (iso?: string) => (iso ? new Date(iso).toLocaleString() : "-");

  const statusBadge = (s: string) => {
    const st = s.toLowerCase();
    const base = "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium";
    if (st === "pending") return <span className={`${base} bg-yellow-600/20 text-amber-300 border border-amber-400/20`}>Pending</span>;
    if (st === "approved") return <span className={`${base} bg-green-600/10 text-emerald-300 border border-emerald-400/20`}>Approved</span>;
    if (st === "rejected") return <span className={`${base} bg-red-600/10 text-rose-300 border border-rose-400/10`}>Rejected</span>;
    return <span className={`${base} bg-slate-700 text-slate-200`}>{s}</span>;
  };

  const handleUpdateStatus = async (status: "approved" | "rejected") => {
    if (!selected) return;
    setUpdateLoading(true);
    try {
      const admin_id = 0; // Replace with real admin id if needed
      const res = await fetch(`${BACKEND}/api/fund/withdraw/${selected.request_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, admin_id, note }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      await res.json();
      setSelected(null);
      fetchRequests();
    } catch (err: any) {
      alert(err.message || "Failed to update status");
    } finally {
      setUpdateLoading(false);
    }
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl py-5 text-center md:text-5xl lg:text-6xl font-bold mb-6">[Withdraw Requests]</h1>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or email..."
          className="px-3 py-2 rounded-xl bg-white/5 placeholder:text-slate-400 text-sm"
        />
        <button onClick={fetchRequests} className="px-3 py-2 rounded-xl bg-white/6 text-sm">Refresh</button>
      </div>

      <div className="bg-white/3 rounded-2xl p-4 overflow-x-auto shadow-sm">
        {loading ? (
          <div className="py-8 text-center text-slate-400">Loading requests…</div>
        ) : error ? (
          <div className="py-8 text-center text-rose-400">{error}</div>
        ) : (
          <table className="w-full text-sm table-auto">
            <thead className="text-slate-500 text-left">
              <tr>
                <th className="py-2">User</th>
                <th className="py-2">Email</th>
                <th className="py-2">Amount</th>
                <th className="py-2">Status</th>
                <th className="py-2">Admin Note</th>
                <th className="py-2">Requested</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.request_id} className="border-t border-white/6 hover:bg-white/2">
                  <td className="py-3">{r.full_name}</td>
                  <td className="py-3 text-slate-400">{r.email}</td>
                  <td className="py-3">₦{r.amount.toLocaleString()}</td>
                  <td className="py-3">{statusBadge(r.status)}</td>
                  <td className="py-3">{r.admin_note || "-"}</td>
                  <td className="py-3">{formatDate(r.created_at)}</td>
                  <td className="py-3">
                    <button onClick={() => { setSelected(r); setNote(r.admin_note || ""); }} className="px-3 py-1 rounded-lg bg-white/6 text-sm">Manage</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal for approving/rejecting */}
{selected && (
  <div className="fixed inset-0 flex items-center justify-center bg-black/40 p-4 z-50">
    <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-lg text-slate-900">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-lg font-semibold text-slate-900">
          {selected.full_name} — Withdraw ₦{selected.amount.toLocaleString()}
        </h4>
        <button onClick={() => setSelected(null)} className="text-slate-600">
          Close
        </button>
      </div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Admin note (optional)"
        className="w-full p-3 rounded-lg border border-slate-200 mb-4 text-slate-900 placeholder:text-slate-400"
      />
      <div className="flex gap-2 justify-end">
        <button
          onClick={() => handleUpdateStatus("approved")}
          disabled={updateLoading}
          className="px-4 py-2 rounded-xl bg-emerald-500 text-white"
        >
          {updateLoading ? "Processing…" : "Approve"}
        </button>
        <button
          onClick={() => handleUpdateStatus("rejected")}
          disabled={updateLoading}
          className="px-4 py-2 rounded-xl bg-rose-500 text-white"
        >
          {updateLoading ? "Processing…" : "Reject"}
        </button>
      </div>
    </div>
  </div>
)}

    </section>
  );
}
