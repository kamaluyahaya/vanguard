"use client";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import React, { useState, useEffect, JSX } from "react";

interface Staff {
  staff_id: number;
  full_name: string;
  email: string;
  phone?: string;
  role?: string;
  department?: string;
  position?: string;
  is_active: number; // 1 or 0
  created_at: string;
}

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export default function StaffPanel(): JSX.Element {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selected, setSelected] = useState<Staff | null>(null);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const res = await fetch(`${BACKEND}/api/staff`);
        const data: Staff[] = await res.json();
        setStaffList(data);
      } catch (err) {
        console.error("Failed to fetch staff:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStaff();
  }, []);

  const filtered = staffList.filter(
    (s) =>
      (s.full_name + s.email + (s.role || "") + (s.department || "")).toLowerCase().includes(query.toLowerCase())
  );

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl py-5 text-center md:text-5xl lg:text-6xl font-bold mb-6">[staff record]</h1>
        <div className="flex gap-2 items-center">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search staff..."
            className="px-3 py-2 rounded-xl bg-white/5 placeholder:text-slate-400"
          />
          <button className="px-3 py-2 rounded-xl bg-white/6">Export</button>
        </div>
      </div>

      <div className="bg-white/3 rounded-2xl p-4 overflow-x-auto shadow-sm">
        {loading ? (
          <div className="text-slate-400 py-6">Loading staff...</div>
        ) : (
          <>
            <table className="w-full text-sm table-auto">
              <thead className="text-slate-300 text-left">
                <tr>
                  <th className="py-2">Name</th>
                  <th className="py-2">Email</th>
                  <th className="py-2">Role</th>
                  <th className="py-2">Department</th>
                  <th className="py-2">Joined</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice((page - 1) * limit, page * limit).map((s) => (
                  <tr key={s.staff_id} className="border-t border-white/6 hover:bg-white/2">
                    <td className="py-3">{s.full_name}</td>
                    <td className="py-3 text-slate-300">{s.email}</td>
                    <td className="py-3 text-slate-300">{s.role || "-"}</td>
                    <td className="py-3 text-slate-300">{s.department || "-"}</td>
                    <td className="py-3 text-slate-300">{new Date(s.created_at).toLocaleDateString()}</td>
                    <td className="py-3">
                      <button
                        className="px-3 py-1 rounded-lg bg-white/6 text-sm"
                        onClick={() => setSelected(s)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No staff found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="mt-4 flex items-center justify-between">
              <div className="text-slate-400 text-sm">{filtered.length} staff</div>
              <div className="flex gap-2 items-center">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1 rounded bg-white/5"
                >
                  Prev
                </button>
                <div className="px-3 py-1 rounded bg-white/5">{page}</div>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1 rounded bg-white/5"
                >
                  Next
                </button>
                <select
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                  className="ml-2 px-2 rounded bg-white/5"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                </select>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Detail modal */}
      {selected && (
      <AnimatePresence>
        <motion.div
            className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <motion.div
            className="w-full max-w-4xl bg-gradient-to-br from-[#071033] to-[#08162b] rounded-2xl border border-white/6 shadow-2xl text-white p-6 relative"
            initial={{ y: 20, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 10, opacity: 0, scale: 0.99 }}
            >
            <button
                aria-label="Close"
                onClick={() => setSelected(null)} 
                className="absolute right-6 top-6 w-9 h-9 rounded-full bg-amber-500 text-black flex items-center justify-center hover:bg-amber-400 transition"
            >
                <X size={20} />
            </button>
            <div className="flex justify-between items-start">
              <h1 className="text-lg font-bold text-center">{selected.full_name}</h1>
             
            </div>
            <div className="mt-4 text-sm text-slate-300 space-y-1">
              <p><strong>Email:</strong> {selected.email}</p>
              <p><strong>Phone:</strong> {selected.phone || "-"}</p>
              <p><strong>Role:</strong> {selected.role || "-"}</p>
              <p><strong>Department:</strong> {selected.department || "-"}</p>
              <p><strong>Position:</strong> {selected.position || "-"}</p>
              <p><strong>Active:</strong> {selected.is_active ? "Yes" : "No"}</p>
              <p><strong>Joined:</strong> {new Date(selected.created_at).toLocaleString()}</p>
            </div>
            <div className="mt-6 flex gap-2">
              <button className="px-4 py-2 rounded-xl bg-white/6">Suspend</button>
              <button className="px-4 py-2 rounded-xl bg-white/6">Message</button>
            </div>
            
                </motion.div>
                </motion.div>
              </AnimatePresence>
      )}
    </section>
  );
}
