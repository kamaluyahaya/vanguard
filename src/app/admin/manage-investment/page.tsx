"use client"

import { AnimatePresence, motion } from "framer-motion"
import { X } from "lucide-react"
import React, { useEffect, useMemo, useState } from "react"

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000"

type Category =
  | "Stocks"
  | "ETF"
  | "Project"
  | "Featured"
  | "Top"
  | "Stablecoins"
  | "Altcoins"

type Risk = "Low" | "Medium" | "High"

type Kind = "asset" | "coin"

interface Metrics {
  circulatingSupply?: number | null
  maxSupply?: number | null
  blockchain?: string | null
}

interface AssetItemRaw {
  tesla_id: number
  investment_name: string
  slug: string
  category: string
  min_investment: string
  expected_return: string
  duration: string
  overview: string
  risk: Risk
  created_by?: string | null;
  is_active: 0 | 1
  is_featured: 0 | 1
  views?: number
  created_at?: string
  updated_at?: string
}

interface CoinItemRaw {
  coin_id: number
  coin_name: string
  slug: string
  category: string
  price: string
  hours: number
  market_cap: string
  overview: string
  circulating_supply?: number
  max_supply?: number
  blockchain?: string
  risk: Risk
  is_active: 0 | 1
  is_featured: 0 | 1
  views?: number
  created_at?: string
  updated_at?: string
}

interface ApiResponse {
  status: string
  message?: string
  data?: {
    tesla?: AssetItemRaw[]
    coins?: CoinItemRaw[]
    total?: number
  }
}

// Unified UI item
interface BaseItem {
  id: number
  kind: Kind
  name: string
  category: string
  overview?: string
  is_active: boolean
  is_featured: boolean
  created_at?: string
  updated_at?: string
}

interface AssetItem extends BaseItem {
  kind: "asset"
  minInvestment?: number | null
  expectedReturn?: number | null
  duration?: string | null
  risk?: Risk
}

interface CoinItem extends BaseItem {
  kind: "coin"
  price?: number | null
  hours?: number | null
  marketCap?: number | null
  metrics?: Metrics
  risk?: Risk
}

type InvestmentItem = AssetItem | CoinItem

export default function ManageInvestmentsPanel(): React.ReactElement {
  const [items, setItems] = useState<InvestmentItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [query, setQuery] = useState("")
  const [filterKind, setFilterKind] = useState<Kind | "all">("all")
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("all")

  // editor state
  const [editing, setEditing] = useState<InvestmentItem | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchInvestments()
  }, [])

  async function fetchInvestments() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${BACKEND}/api/investments`)
      if (!res.ok) throw new Error(`Failed to fetch (${res.status})`)
      const json: ApiResponse = await res.json()

      const rawTesla = json.data?.tesla ?? []
      const rawCoins = json.data?.coins ?? []

      const assets: AssetItem[] = rawTesla.map((t) => ({
        id: t.tesla_id,
        kind: "asset",
        name: t.investment_name,
        category: t.category as Category,
        overview: t.overview,
        is_active: Boolean(t.is_active),
        is_featured: Boolean(t.is_featured),
        created_at: t.created_at,
        updated_at: t.updated_at,
        minInvestment: Number(t.min_investment),
        expectedReturn: Number(t.expected_return),
        duration: t.duration,
        risk: t.risk,
      }))

      const coins: CoinItem[] = rawCoins.map((c) => ({
        id: c.coin_id,
        kind: "coin",
        name: c.coin_name,
        category: c.category as Category,
        overview: c.overview,
        is_active: Boolean(c.is_active),
        is_featured: Boolean(c.is_featured),
        created_at: c.created_at,
        updated_at: c.updated_at,
        price: Number(c.price),
        hours: c.hours,
        marketCap: Number(c.market_cap),
        metrics: {
          circulatingSupply: c.circulating_supply ?? null,
          maxSupply: c.max_supply ?? null,
          blockchain: c.blockchain ?? null,
        },
        risk: c.risk,
      }))

      // merge and sort by newest
      const merged = [...assets, ...coins].sort((a, b) => {
        const A = new Date(a.created_at || 0).getTime()
        const B = new Date(b.created_at || 0).getTime()
        return B - A
      })

      setItems(merged)
    } catch (err: unknown) {
  console.error(err)
  if (err instanceof Error) setError(err.message)
  else setError(String(err))
} finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    return items.filter((it) => {
      if (filterKind !== "all" && it.kind !== filterKind) return false
      if (filterActive !== "all") {
        if (filterActive === "active" && !it.is_active) return false
        if (filterActive === "inactive" && it.is_active) return false
      }
      if (!query) return true
      const q = query.toLowerCase()
      return (
        it.name.toLowerCase().includes(q) ||
        (it.overview || "").toLowerCase().includes(q) ||
        it.category.toLowerCase().includes(q)
      )
    })
  }, [items, query, filterKind, filterActive])

  function fmt(n?: number | null) {
    if (n == null) return "—"
    return n.toLocaleString()
  }

  // optimistic toggle active
  async function toggleActive(it: InvestmentItem) {
    const confirmMsg = it.is_active ? "Deactivate this item?" : "Activate this item?"
    if (!confirm(confirmMsg)) return
    const prev = [...items]
    setItems((s) => s.map((x) => (x.id === it.id ? { ...x, is_active: !x.is_active } : x)))

    const endpoint = it.kind === "asset" ? "tesla" : "coins"
    try {
      // NOTE: backend exposes only PUT for updates (no PATCH). We send a minimal PUT payload.
      const payload = { is_active: it.is_active ? 0 : 1 }
      const res = await fetch(`${BACKEND}/api/${endpoint}/${it.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(`Failed to update (${res.status})`)
    } catch (err) {
      console.error(err)
      alert("Failed to update status — reverting")
      setItems(prev)
    }
  }

async function removeItem(it: InvestmentItem): Promise<void> {
  if (!confirm(`Delete ${it.name}? This cannot be undone.`)) return
  const prev = [...items]
  setItems((s) => s.filter((x) => x.id !== it.id))

  const endpoint = it.kind === "asset" ? "tesla" : "coins"
  try {
    const res = await fetch(`${BACKEND}/api/${endpoint}/${it.id}`, { method: "DELETE" })
    if (!res.ok) throw new Error(`Delete failed (${res.status})`)
  } catch (err) {
    console.error(err)
    alert("Failed to delete — reverting")
    setItems(prev)
  }
}


  // open editor
  function openEditor(it: InvestmentItem) {
    setEditing(it)
  }

  function closeEditor() {
    setEditing(null)
  }

  // update local editing state fields
function updateEditing(key: keyof AssetItem | keyof CoinItem, value: string | number | boolean | null): void {
  if (!editing) return

  if (editing.kind === "asset") {
    setEditing({ ...(editing as AssetItem), [key]: value } as InvestmentItem)
  } else {
    setEditing({ ...(editing as CoinItem), [key]: value } as InvestmentItem)
  }
}

  // submit edits to API
  async function submitEdits(e?: React.FormEvent) {
    e?.preventDefault()
    if (!editing) return
    setIsSubmitting(true)
    const it = editing
    const endpoint = it.kind === "asset" ? "tesla" : "coins"

    // build payload that matches API shape
   let payload: Record<string, string | number | null> = {}

    if (it.kind === "asset") {
      payload = {
        investment_name: it.name,
        category: it.category,
        min_investment: (it as AssetItem).minInvestment ?? null,
        expected_return: (it as AssetItem).expectedReturn ?? null,
        duration: (it as AssetItem).duration ?? null,
        overview: it.overview ?? null,
        risk: (it as AssetItem).risk ?? null,
        is_featured: it.is_featured ? 1 : 0,
        is_active: it.is_active ? 1 : 0,
      }
    } else {
      payload = {
        coin_name: it.name,
        category: it.category,
        price: (it as CoinItem).price ?? null,
        hours: (it as CoinItem).hours ?? null,
        market_cap: (it as CoinItem).marketCap ?? null,
        overview: it.overview ?? null,
        circulating_supply: (it as CoinItem).metrics?.circulatingSupply ?? null,
        max_supply: (it as CoinItem).metrics?.maxSupply ?? null,
        blockchain: (it as CoinItem).metrics?.blockchain ?? null,
        risk: (it as CoinItem).risk ?? null,
        is_featured: it.is_featured ? 1 : 0,
        is_active: it.is_active ? 1 : 0,
      }
    }

    try {
      const res = await fetch(`${BACKEND}/api/${endpoint}/${it.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(`Update failed (${res.status})`)
      // optimistic local update already done by editing state — reflect in list
      setItems((s) => s.map((x) => (x.id === it.id ? (editing as InvestmentItem) : x)))
      alert("Updated successfully")
      closeEditor()
    } catch (err) {
      console.error(err)
      alert("Failed to update")
    } finally {
      setIsSubmitting(false)
    }
  }

  // map editing form helpers for nested metrics
function updateMetric(key: keyof Metrics, value: string | number | null) {
  if (!editing || editing.kind !== "coin") return
  const curMetrics = editing.metrics ?? { circulatingSupply: null, maxSupply: null, blockchain: null }
  setEditing({ ...editing, metrics: { ...curMetrics, [key]: value } })
}


  return (
    <section>
       <h1 className="text-2xl py-5 text-center md:text-5xl lg:text-6xl font-bold mb-6">[Manage Investments]</h1>

      <div className="bg-white/3 rounded-lg p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div className="flex gap-2 items-center">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, category, overview" className="px-3 py-2 rounded bg-white/5" />

              <select value={filterKind} onChange={(e) => setFilterKind(e.target.value as Kind | "all")} className="px-3 py-2 rounded bg-white/5">

              <option value="all">All kinds</option>
              <option value="asset">Assets</option>
              <option value="coin">Coins</option>
            </select>

            <select value={filterActive} onChange={(e) => setFilterActive(e.target.value as "all" | "active" | "inactive")} className="px-3 py-2 rounded bg-white/5">
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <button onClick={fetchInvestments} className="px-3 py-2 rounded bg-white/6">Refresh</button>
          </div>

          <div className="text-sm text-slate-400">Showing {filtered.length} of {items.length} (total)</div>
        </div>

        {loading && <div className="text-sm">Loading...</div>}
        {error && <div className="text-sm text-rose-400">{error}</div>}

        <div className="space-y-2">
          {filtered.map((it) => (
            <div key={`${it.kind}-${it.id}`} className="flex items-start justify-between border-b border-white/6 py-3 gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div className="font-medium">{it.name}</div>
                  <div className="text-xs px-2 py-1 rounded bg-white/5">{it.category}</div>
                  <div className={`text-xs px-2 py-1 rounded ${it.is_active ? "bg-green-500/10" : "bg-red-500/10"}`}>{it.is_active ? "Active" : "Inactive"}</div>
                  {it.is_featured && <div className="text-xs px-2 py-1 rounded bg-amber-400/20">Featured</div>}
                </div>

                <div className="text-slate-400 text-sm mt-1">{it.overview || "No overview"}</div>

                <div className="text-xs mt-2 text-slate-400">
                  {it.kind === "asset" && (
                    <>
                      Min: {fmt((it as AssetItem).minInvestment)} • Return: { (it as AssetItem).expectedReturn ?? "—" }% • Duration: { (it as AssetItem).duration ?? '—' } • Risk: { (it as AssetItem).risk ?? '—' }
                    </>
                  )}

                  {it.kind === "coin" && (
                    <>
                      Price: {fmt((it as CoinItem).price)} • Market Cap: {fmt((it as CoinItem).marketCap)} • In: { (it as CoinItem).hours ?? '—' }h • Risk: { (it as CoinItem).risk ?? '—' }
                    </>
                  )}
                </div>

                {it.kind === "coin" && (it as CoinItem).metrics && (
                  <div className="text-xs mt-2 text-slate-400">Metrics: Circulating {fmt((it as CoinItem).metrics!.circulatingSupply)} • Max {fmt((it as CoinItem).metrics!.maxSupply)} • Blockchain: {(it as CoinItem).metrics!.blockchain || '—'}</div>
                )}
              </div>

              <div className="flex-shrink-0 flex flex-col gap-2">
                <button onClick={() => openEditor(it)} className="px-3 py-1 rounded bg-white/6">Edit</button>
                <button onClick={() => toggleActive(it)} className="px-3 py-1 rounded bg-white/6">{it.is_active ? 'Deactivate' : 'Activate'}</button>
                <button onClick={() => removeItem(it)} className="px-3 py-1 rounded bg-rose-500/10">Delete</button>
              </div>
            </div>
          ))}

          {!loading && filtered.length === 0 && <div className="text-slate-400 text-sm p-4">No investments match your filters</div>}
        </div>
      </div>

      {/* Editor modal (simple) */}
{editing && (
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
        {/* Close button */}
        <button
          aria-label="Close"
          onClick={closeEditor} // <-- hook this up
          className="absolute right-6 top-6 w-9 h-9 rounded-full bg-amber-500 text-black flex items-center justify-center hover:bg-amber-400 transition"
        >
          <X size={20} />
        </button>

        {/* Form content */}
        <form
          onSubmit={submitEdits}
          className="rounded-lg p-6 max-w-2xl w-full space-y-4 mx-auto"
        >
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Edit: {editing.name}</h4>
            <div className="text-sm text-slate-400">Kind: {editing.kind}</div>
          </div>

            <label className="block">
              <div className="text-sm mb-1">Name</div>
              <input value={editing.name} onChange={(e) => updateEditing("name", e.target.value)} className="w-full px-3 py-2 rounded bg-white/5" />
            </label>

            <label className="block">
              <div className="text-sm mb-1">Category</div>
              <input value={editing.category} onChange={(e) => updateEditing("category", e.target.value)} className="w-full px-3 py-2 rounded bg-white/5" />
            </label>

            <label className="block">
              <div className="text-sm mb-1">Overview</div>
              <textarea value={editing.overview || ""} onChange={(e) => updateEditing("overview", e.target.value)} className="w-full px-3 py-2 rounded bg-white/5 min-h-[80px]" />
            </label>

            {editing.kind === "asset" ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <label>
                  <div className="text-sm mb-1">Min investment</div>
                  <input type="number" value={(editing as AssetItem).minInvestment ?? ""} onChange={(e) => updateEditing("minInvestment", e.target.value === "" ? null : Number(e.target.value))} className="w-full px-3 py-2 rounded bg-white/5" />
                </label>

                <label>
                  <div className="text-sm mb-1">Expected return (%)</div>
                  <input type="number" step="0.01" value={(editing as AssetItem).expectedReturn ?? ""} onChange={(e) => updateEditing("expectedReturn", e.target.value === "" ? null : Number(e.target.value))} className="w-full px-3 py-2 rounded bg-white/5" />
                </label>

                <label>
                  <div className="text-sm mb-1">Duration</div>
                  <input value={(editing as AssetItem).duration ?? ""} onChange={(e) => updateEditing("duration", e.target.value)} className="w-full px-3 py-2 rounded bg-white/5" />
                </label>

                <label className="md:col-span-1">
                  <div className="text-sm mb-1">Risk</div>
                  <select value={(editing as AssetItem).risk ?? "Medium"} onChange={(e) => updateEditing("risk", e.target.value as Risk)} className="w-full px-3 py-2 rounded bg-white/5">
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </label>

              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <label>
                  <div className="text-sm mb-1">Price</div>
                  <input type="number" step="0.01" value={(editing as CoinItem).price ?? ""} onChange={(e) => updateEditing("price", e.target.value === "" ? null : Number(e.target.value))} className="w-full px-3 py-2 rounded bg-white/5" />
                </label>

                <label>
                  <div className="text-sm mb-1">Hours</div>
                  <input type="number" value={(editing as CoinItem).hours ?? ""} onChange={(e) => updateEditing("hours", e.target.value === "" ? null : Number(e.target.value))} className="w-full px-3 py-2 rounded bg-white/5" />
                </label>

                <label>
                  <div className="text-sm mb-1">Market cap</div>
                  <input type="number" step="0.01" value={(editing as CoinItem).marketCap ?? ""} onChange={(e) => updateEditing("marketCap", e.target.value === "" ? null : Number(e.target.value))} className="w-full px-3 py-2 rounded bg-white/5" />
                </label>

                <label>
                  <div className="text-sm mb-1">Circulating supply</div>
                  <input type="number" value={(editing as CoinItem).metrics?.circulatingSupply ?? ""} onChange={(e) => updateMetric("circulatingSupply", e.target.value === "" ? null : Number(e.target.value))} className="w-full px-3 py-2 rounded bg-white/5" />
                </label>

                <label>
                  <div className="text-sm mb-1">Max supply</div>
                  <input type="number" value={(editing as CoinItem).metrics?.maxSupply ?? ""} onChange={(e) => updateMetric("maxSupply", e.target.value === "" ? null : Number(e.target.value))} className="w-full px-3 py-2 rounded bg-white/5" />
                </label>

                <label>
                  <div className="text-sm mb-1">Blockchain</div>
                  <input value={(editing as CoinItem).metrics?.blockchain ?? ""} onChange={(e) => updateMetric("blockchain", e.target.value)} className="w-full px-3 py-2 rounded bg-white/5" />
                </label>
              </div>
            )}

           <div className="flex items-center gap-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editing.is_featured}
                onChange={(e) => updateEditing("is_featured", e.target.checked)}
              />
              <span className="text-sm">Featured</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editing.is_active}
                onChange={(e) => updateEditing("is_active", e.target.checked)}
              />
              <span className="text-sm">Active</span>
            </label>

            <div className="ml-auto flex gap-2">
              <button
                type="button"
                onClick={closeEditor}
                className="px-3 py-1 rounded bg-white/6"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-3 py-1 rounded bg-amber-400 text-black font-semibold"
              >
                {isSubmitting ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </motion.div>
  </AnimatePresence>
)}
    </section>
  )
}
