"use client";

import React, { JSX, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

type InvestItem = {
  investment_id: number;
  user_id: number;
  amount: string;
  coin_id: string;
  coin_symbol: string;
  coin_name: string;
  coin_data?: string | Record<string, any> | null;
  price_usd?: string;
  status?: string;
  expected_return?: string | null;
  actual_return?: string | null;
  roi_percent?: string;
  duration_days?: number;
  created_at?: string;
  updated_at?: string;
  email?: string;
  full_name?: string;
  phone?: string;
  profile_image?: string | null;
  is_active?: number;
};

function formatCurrencyNaira(amount: number | string | undefined | null) {
  const n = Number(amount ?? 0);
  if (Number.isNaN(n)) return "₦0.00";
  return "₦" + n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatUSD(amount: number | string | undefined | null) {
  const n = Number(amount ?? 0);
  if (Number.isNaN(n)) return "$0.00";
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 8 });
}

export default function InvestmentsPage(): JSX.Element {
  const [data, setData] = useState<InvestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [selected, setSelected] = useState<InvestItem | null>(null);

  // new states for updating status
  const [statusValue, setStatusValue] = useState<string>("");
  const [updating, setUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const ac = new AbortController();

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`${BACKEND}/api/fund/invest/user`, {
          method: "GET",
          signal: ac.signal,
          headers: {
            Accept: "application/json",
          },
        });

        if (!res.ok) {
          const text = await res.text().catch(() => null);
          throw new Error(`Failed to load investments (${res.status}) ${text ?? ""}`);
        }

        const json = await res.json();

        const investments: InvestItem[] = Array.isArray(json)
          ? json
          : Array.isArray(json?.data)
          ? json.data
          : [];

        if (!mounted) return;

        setData(investments);
      } catch (err: any) {
        if (err.name === "AbortError") return;

        setError(err instanceof Error ? err.message : "Failed to load investments");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
      ac.abort();
    };
  }, []);

  // keep statusValue in sync with selected
  useEffect(() => {
    setStatusValue(selected?.status ?? "");
    setUpdateMessage(null);
  }, [selected]);

  // parsed coin_data cached
  const parsed = useMemo(() => {
    const m: Record<number, Record<string, any> | null> = {};
    for (const d of data) {
      try {
        if (!d.coin_data) {
          m[d.investment_id] = null;
          continue;
        }
        if (typeof d.coin_data === "string") {
          m[d.investment_id] = JSON.parse(d.coin_data);
        } else {
          m[d.investment_id] = d.coin_data as Record<string, any>;
        }
      } catch {
        m[d.investment_id] = null;
      }
    }
    return m;
  }, [data]);

  // filtering and searching
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.filter((i) => {
      if (statusFilter !== "all" && (i.status ?? "unknown") !== statusFilter) return false;
      if (!q) return true;
      const fields = [
        String(i.investment_id),
        i.full_name ?? "",
        i.email ?? "",
        i.coin_symbol ?? "",
        i.coin_name ?? "",
        String(i.amount ?? ""),
      ];
      return fields.some((f) => f.toLowerCase().includes(q));
    });
  }, [data, query, statusFilter]);

  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / limit));
  const pageData = useMemo(() => {
    const start = (page - 1) * limit;
    return filtered.slice(start, start + limit);
  }, [filtered, page, limit]);

  useEffect(() => setPage(1), [query, statusFilter, limit]);

  const exportCSV = () => {
    if (!data.length) return;
    const rows = data.map((d) => ({
      investment_id: d.investment_id,
      user_id: d.user_id,
      full_name: d.full_name,
      email: d.email,
      amount: d.amount,
      coin_symbol: d.coin_symbol,
      coin_name: d.coin_name,
      price_usd: d.price_usd,
      status: d.status,
      expected_return: d.expected_return,
      roi_percent: d.roi_percent,
      duration_days: d.duration_days,
      created_at: d.created_at,
    }));
    const csv = [
      Object.keys(rows[0]).join(","),
      ...rows.map((r) => Object.values(r).map((v) => `"${String(v ?? "")}"`).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `investments-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // update status API call
  async function updateInvestmentStatus(investmentId: number, newStatus: string) {
    setUpdating(true);
    setUpdateMessage(null);
    try {
      const res = await fetch(`${BACKEND}/api/fund/invest/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          investment_id: String(investmentId),
          status: newStatus,
        }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => null);
        throw new Error(`Update failed (${res.status}) ${text ?? ""}`);
      }

      const json = await res.json();
      // server message
      setUpdateMessage(json?.message ?? "Investment status updated successfully");

      // update local copy so UI updates instantly
      setData((prev) => prev.map((p) => (p.investment_id === investmentId ? { ...p, status: newStatus } : p)));
      setSelected((prev) => (prev ? { ...prev, status: newStatus } : prev));
    } catch (err: any) {
      setUpdateMessage(err?.message ?? "Failed to update status");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <section className="p-6">
      <div className="flex items-center justify-between mb-6">
               <h1 className="text-2xl font-semibold"></h1>
        <h1 className="text-2xl py-5 text-center md:text-5xl lg:text-6xl font-bold mb-6">[investment records]</h1>

        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="px-3 py-2 rounded-xl bg-slate-100 text-slate-900 text-sm">Export CSV</button>
        </div>
      </div>

      <div className=" rounded-2xl p-4 shadow-sm text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, email, coin, amount or id..."
              className="px-3 py-2 rounded-xl border border-slate-100 text-sm w-[320px]"
            />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-100 text-sm">
              <option value="all">All statuses</option>
              {[...new Set(data.map((d) => d.status ?? "unknown"))].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-sm text-slate-500">{total} investments</div>
            <select value={limit} onChange={(e) => setLimit(Number(e.target.value))} className="px-2 py-1 rounded border border-slate-100 text-sm">
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-500">Loading investments…</div>
        ) : error ? (
          <div className="py-8 text-center text-rose-500">{error}</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm table-auto border-collapse">
                <thead>
                  <tr className="text-slate-600 text-left">
                    <th className="py-3 pr-4">User</th>
                    <th className="py-3 pr-4">Amount</th>
                    <th className="py-3 pr-4">Coin</th>
                    <th className="py-3 pr-4">Price (USD)</th>
                    <th className="py-3 pr-4">Expected</th>
                    <th className="py-3 pr-4">ROI %</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3 pr-4">Duration</th>
                    <th className="py-3 pr-4">Created</th>
                    <th className="py-3 pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageData.map((it) => {
                    const coinInfo = parsed[it.investment_id];
                    const priceUsd = it.price_usd ?? coinInfo?.price_usd ?? coinInfo?.price_usd;
                    return (
                      <tr key={it.investment_id} className="border-t border-slate-100 hover:bg-slate-500">
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            {it.profile_image ? (
                              <img src={it.profile_image} alt={it.full_name ?? "user"} className="w-8 h-8 rounded-full object-cover border border-slate-100" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-800 text-xs font-medium">
                                {String(it.full_name ?? "U").split(" ").map((s) => s[0]).slice(0, 2).join("")}
                              </div>
                            )}
                            <div>
                              <div className="text-slate-400 font-medium">{it.full_name ?? "—"}</div>
                              <div className="text-xs text-slate-200">{it.email}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 pr-4 text-slate-400">{formatCurrencyNaira(Number(it.amount) ?? 0)}</td>

                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            <div className="text-slate-400 font-medium">{it.coin_symbol}</div>
                            <div className="text-xs text-slate-300">{it.coin_name}</div>
                          </div>
                        </td>

                        <td className="py-3 pr-4 text-slate-400">{priceUsd ? formatUSD(priceUsd) : "-"}</td>

                        <td className="py-3 pr-4 text-slate-400">{formatCurrencyNaira(Number(it.expected_return) ?? 0)}</td>

                        <td className="py-3 pr-4 text-slate-400">{it.roi_percent ? `${Number(it.roi_percent).toFixed(2)}%` : "-"}</td>

                        <td className="py-3 pr-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              it.status === "initialized"
                                ? "bg-amber-100 text-amber-500"
                                : it.status === "completed"
                                ? "bg-emerald-100 text-emerald-400"
                                : "bg-slate-100 text-slate-400"
                            }`}
                          >
                            {it.status ?? "—"}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-slate-400">{it.duration_days ?? "-"}</td>
                        <td className="py-3 pr-4 text-slate-300 text-xs">{it.created_at ? new Date(it.created_at).toLocaleString("en-NG") : "-"}</td>
                        <td className="py-3 pr-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => setSelected(it)}
                              className="px-3 py-1 rounded-lg bg-slate-100 text-slate-900 text-sm"
                            >
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {pageData.length === 0 && (
                    <tr>
                      <td colSpan={11} className="py-8 text-center text-slate-500">
                        No investments found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-slate-500">
                Showing {Math.min((page - 1) * limit + 1, total)}–{Math.min(page * limit, total)} of {total}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-3 py-1 rounded bg-slate-100 text-slate-900">
                  Prev
                </button>
                <div className="px-3 py-1 rounded bg-slate-50 text-sm text-slate-700">{page}</div>
                <button onClick={() => setPage((p) => Math.min(pages, p + 1))} className="px-3 py-1 rounded bg-slate-100 text-slate-900">
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Detail modal (white background) */}
      <AnimatePresence>
        {selected && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl p-6 relative border border-slate-100"
              initial={{ y: 8, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 8, opacity: 0, scale: 0.98 }}
            >
              <button
                aria-label="Close"
                onClick={() => setSelected(null)}
                className="absolute top-5 right-5 w-9 h-9 rounded-full bg-slate-100 text-slate-900 flex items-center justify-center hover:bg-slate-200"
              >
                <X size={16} />
              </button>

              <div className="flex items-center gap-4">
                {selected.profile_image ? (
                  <img src={selected.profile_image} alt={selected.full_name ?? "user"} className="w-16 h-16 rounded-full object-cover border border-slate-100" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-semibold">{(selected.full_name ?? "U").split(" ").map(s => s[0]).slice(0,2).join("")}</div>
                )}
                <div>
                  <div className="text-lg font-semibold text-slate-900">{selected.full_name}</div>
                  <div className="text-sm text-slate-500">{selected.email}</div>
                  <div className="text-xs text-slate-400 mt-1">Investment ID: {selected.investment_id}</div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4 text-sm text-slate-700">
                <div>
                  <div className="text-xs text-slate-500">Amount</div>
                  <div className="text-base font-medium">{formatCurrencyNaira(Number(selected.amount) ?? 0)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Expected return</div>
                  <div className="text-base font-medium">{formatCurrencyNaira(Number(selected.expected_return) ?? 0)}</div>
                </div>

                <div>
                  <div className="text-xs text-slate-500">Coin</div>
                  <div className="text-base font-medium">{selected.coin_symbol} — {selected.coin_name}</div>
                </div>

                <div>
                  <div className="text-xs text-slate-500">Price (USD)</div>
                  <div className="text-base font-medium">{selected.price_usd ? formatUSD(selected.price_usd) : "-"}</div>
                </div>

                <div>
                  <div className="text-xs text-slate-500">ROI %</div>
                  <div className="text-base font-medium">{selected.roi_percent ? `${Number(selected.roi_percent).toFixed(2)}%` : "-"}</div>
                </div>

                <div>
                  <div className="text-xs text-slate-500">Duration (days)</div>
                  <div className="text-base font-medium">{selected.duration_days ?? "-"}</div>
                </div>

                <div className="col-span-2">
                  <div className="text-xs text-slate-500">Status</div>
                  {/* editable status selector */}
                  <div className="mt-1 flex items-center gap-2">
                    <select
                      value={statusValue}
                      onChange={(e) => setStatusValue(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-slate-100 text-sm"
                    >
                      {/* include current statuses found in data, plus common statuses */}
                      {[...new Set([
                        ...(data.map(d => d.status ?? "")),
                        "initialized",
                        "pending",
                        "completed",
                        "active",
                        "failed",
                        "cancelled",
                      ])]
                        .filter(Boolean)
                        .map(s => s)}
                      {Array.from(new Set([
                        ...data.map(d => d.status ?? ""),
                        "initialized",
                        "pending",
                        "completed",
                        "active",
                        "failed",
                        "cancelled",
                        "unknown",
                      ])).filter(Boolean).map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => {
                        if (!selected) return;
                        if (statusValue === (selected.status ?? "")) {
                          setUpdateMessage("Status unchanged");
                          return;
                        }
                        updateInvestmentStatus(selected.investment_id, statusValue);
                      }}
                      disabled={updating || !statusValue}
                      className={`px-4 py-2 rounded-xl text-sm ${updating ? "bg-slate-200 text-slate-400" : "bg-slate-900 text-white"}`}
                    >
                      {updating ? "Updating..." : "Save status"}
                    </button>
                  </div>

                  {updateMessage && <div className="mt-2 text-xs text-slate-600">{updateMessage}</div>}
                </div>

                <div className="col-span-2">
                  <div className="text-xs text-slate-500">Created</div>
                  <div className="text-sm text-slate-600">{selected.created_at ? new Date(selected.created_at).toLocaleString("en-NG") : "-"}</div>
                </div>
              </div>

              <div className="mt-6">
                <div className="text-sm font-medium text-slate-900 mb-2">Coin metadata</div>
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs text-slate-700 max-h-48 overflow-auto">
                  <pre className="whitespace-pre-wrap">
                    {JSON.stringify(parsed[selected.investment_id] ?? selected.coin_data ?? {}, null, 2)}
                  </pre>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button onClick={() => setSelected(null)} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-900">Close</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
