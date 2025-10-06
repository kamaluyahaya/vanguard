"use client"

import { useEffect, useMemo, useState } from "react"
import { Menu, Search, X } from "lucide-react"
import TeslaInvestmentModal from "../../components/modal/tesla-investment-modal"
import SignupModal from "../../components/modal/signup"
import InvestmentDetailModal from "../../components/modal/investmentDetails"
import UserSidebar from "../../components/user/sidebar"
import { useRouter } from "next/navigation"

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"

type RawTesla = {
  tesla_id: string
  investment_name: string
  slug?: string
  category?: string
  min_investment?: number | string
  expected_return?: number | string
  duration?: string
  risk?: string
  is_featured?: number | boolean
  created_at?: string
  overview?: string
  created_by?: string | number
}

type RawCoin = {
  coin_id: string
  coin_name: string
  slug?: string
  category?: string
  price?: number | string
  market_cap?: number | string
  hours?: number
  risk?: string
  is_featured?: number | boolean
  created_at?: string
  overview?: string
  created_by?: string | number
}


type Investment = {
  id: string // "tesla:1" or "coin:2"
  source: "tesla" | "coin"
  name: string
  slug?: string
  category?: string
  min_investment?: string | number | null
  expected_return?: string | number | null
  price?: string | number | null
  market_cap?: string | number | null
  duration?: string | null
  hours?: number | null
  risk?: string | null
  is_featured?: number | boolean
  created_at?: string | null
  raw: RawTesla | RawCoin
}

function useDebounce<T>(value: T, delay = 300) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return v
}

export default function MyInvestmentsPage() {
  // page/modal state
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [openNew, setOpenNew] = useState(false)
  const [signupOpen, setSignupOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedInv, setSelectedInv] = useState<Investment | null>(null)

  const [user, setUser] = useState<{ id: string | number; full_name?: string; name?: string; email?: string } | null>(null)
const [tesla, setTesla] = useState<RawTesla[]>([])
const [coins, setCoins] = useState<RawCoin[]>([])

  // user + UI state
  const [userName, setUserName] = useState<string>("Investor")
  const [userEmail, setUserEmail] = useState<string>("")
  const router = useRouter()

  // data & filters
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [query, setQuery] = useState("")
  const debounced = useDebounce(query, 350)
  const [category, setCategory] = useState<string>("All")

  // pagination
  const [page, setPage] = useState(1)
  const perPage = 12

  // load current user from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("user") || localStorage.getItem("auth")
      if (raw) {
        const parsed = JSON.parse(raw)
        // Support both shapes: { user: {...} } or direct user object
        const u = parsed?.user ?? parsed
        if (u) {
          setUser(u)
          setUserName(u.full_name || u.name || "Investor")
          setUserEmail(u.email || "")
        }
      }
    } catch (e) {
      // ignore
      console.log(e)
    }
  }, [])

  // fetch my investments once (server returns only user's investments)
  useEffect(() => {
    const ac = new AbortController()
    const fetchMy = async () => {
      try {
        setLoading(true)
        setError(null)
        const url = new URL(`${BACKEND}/api/my-investments`)
        // If backend expects pagination - we fetch more and paginate client-side
        url.searchParams.set("limit", "500")
        url.searchParams.set("offset", "0")

        const token = localStorage.getItem("token") || JSON.parse(localStorage.getItem("auth") || "null")?.token
        const headers: Record<string, string> = { "Content-Type": "application/json" }
        if (token) headers["Authorization"] = `Bearer ${token}`

        const res = await fetch(url.toString(), { headers, signal: ac.signal })
        if (!res.ok) {
          const txt = await res.text().catch(() => null)
          throw new Error(`${res.status} ${txt || res.statusText}`)
        }
       const json = await res.json()
const data: { tesla?: RawTesla[]; coins?: RawCoin[] } = json?.data ?? json

       setTesla(Array.isArray(data?.tesla) ? data.tesla : [])
setCoins(Array.isArray(data?.coins) ? data.coins : [])
      } catch (err: any) {
        if (err.name === "AbortError") return
        console.error("fetchMyInvestments error", err)
        setError(err.message || "Failed to load your investments")
      } finally {
        setLoading(false)
      }
    }
    fetchMy()
    return () => ac.abort()
  }, [])

  // unify the sets
 const unified = useMemo<Investment[]>(() => {
  const t = tesla.map((r: RawTesla) => ({
    id: `tesla:${r.tesla_id}`,
    source: "tesla" as const,
    name: r.investment_name,
    slug: r.slug,
    category: r.category,
    min_investment: r.min_investment,
    expected_return: r.expected_return,
    duration: r.duration,
    risk: r.risk,
    is_featured: r.is_featured,
    created_at: r.created_at,
    raw: r,
  }))

  const c = coins.map((r: RawCoin) => ({
    id: `coin:${r.coin_id}`,
    source: "coin" as const,
    name: r.coin_name,
    slug: r.slug,
    category: r.category,
    price: r.price,
    market_cap: r.market_cap,
    hours: r.hours,
    risk: r.risk,
    is_featured: r.is_featured,
    created_at: r.created_at,
    raw: r,
  }))

  return [...t, ...c].sort((a, b) => {
    const ta = a.created_at ? new Date(a.created_at).getTime() : 0
    const tb = b.created_at ? new Date(b.created_at).getTime() : 0
    return tb - ta
  })
}, [tesla, coins])


  // derive categories from unified data
  const categories = useMemo(() => {
    const set = new Set<string>(["All"])
    unified.forEach((i) => {
      if (i.category) set.add(i.category)
    })
    return Array.from(set)
  }, [unified])

  // apply client-side filters (debounced search + category)
  const filtered = useMemo(() => {
    const term = String(debounced || "").trim().toLowerCase()
    let data = unified

    if (category && category !== "All") {
      data = data.filter((i) => String(i.category || "").toLowerCase() === category.toLowerCase())
    }

    if (term.length > 0) {
      data = data.filter((i) => {
        const name = (i.name || "").toString().toLowerCase()
        const slug = (i.slug || "").toString().toLowerCase()
        const overview = (i.raw?.overview || "").toString().toLowerCase()
        const cat = (i.category || "").toString().toLowerCase()
        return name.includes(term) || slug.includes(term) || overview.includes(term) || cat.includes(term)
      })
    }

    return data
  }, [unified, debounced, category])

  const total = filtered.length
  const pages = Math.max(1, Math.ceil(total / perPage))

  const pageData = useMemo(() => {
    const start = (page - 1) * perPage
    return filtered.slice(start, start + perPage)
  }, [filtered, page])

  useEffect(() => {
    // reset page when filters/search change
    setPage(1)
  }, [debounced, category])

  // helpers
  const formatCurrency = (v?: string | number) => {
    if (v == null || v === "") return "-"
    try {
      const n = Number(v)
      return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    } catch {
      return String(v)
    }
  }
  const truncate = (s?: string, n = 120) => (s && s.length > n ? s.slice(0, n).trim() + "…" : s || "")

  // click handlers
  const openDetails = (inv: Investment) => {
    setSelectedInv(inv)
    setDetailOpen(true)
  }

const handleManage = (inv: Investment) => {
  if (inv.source === "tesla") {
    const rawTesla = inv.raw as RawTesla
    router.push(`/manage/tesla/${rawTesla.tesla_id}`)
  } else {
    const rawCoin = inv.raw as RawCoin
    router.push(`/manage/coins/${rawCoin.coin_id}`)
  }
}
  return (
    <div className="text-slate-100 antialiased">
      {/* Mobile toggle */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button onClick={() => setSidebarOpen((s) => !s)} className="p-2 rounded-lg bg-white/6 backdrop-blur text-slate-100">
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-screen w-72 z-40 transform transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 `}>
      <UserSidebar
                active="my-investments"
               onChange={(id) => { if (id === "logout") { localStorage.removeItem("user"); router.push("/") }}}
                userName={userName}
                userEmail={userEmail}
                onLogout={() => {
                  localStorage.removeItem("user");
                  localStorage.removeItem("token");
                  localStorage.removeItem("auth");
                  router.push("/");
                }}
              />
      </aside>

      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-30 bg-black/40 md:hidden" />}

      <main className="ml-0 md:ml-72 min-h-screen p-6">
        <header className="mb-6">
          <div className="flex justify-center">
            <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/6 border border-white/10 max-w-6xl w-full mx-4">
              <div className="p-2 rounded-full hover:bg-white/8 flex items-center justify-center">
                <Search size={16} />
              </div>

              <div className="flex items-center gap-2 flex-1 min-w-0">
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search my investments..." className="w-full bg-transparent outline-none placeholder:text-slate-400 text-slate-100 text-sm" />
              </div>

              <div className="hidden sm:block w-px h-6 bg-white/10 mx-2" />

              <div className="flex items-center gap-2 ml-1">
                <div className="w-9 h-9 rounded-full bg-slate-700/30 flex items-center justify-center text-white font-medium">{String(userName || "I").slice(0, 1).toUpperCase()}</div>
                <div className="hidden sm:flex flex-col leading-tight">
                  <span className="text-sm font-medium text-white">{userName}</span>
                  {userEmail && <span className="text-xs text-slate-400">{userEmail}</span>}
                </div>
              </div>
            </div>
          </div>
        </header>

        <h1 className="text-4xl py-3 text-center md:text-5xl lg:text-5xl font-bold mb-6">My Investments</h1>

        {/* category buttons */}
        <div className="max-w-6xl mx-auto mb-4 px-4">
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map((cat) => (
              <button key={cat} onClick={() => setCategory(cat)} className={`px-3 py-2 rounded-full text-sm font-medium transition ${category === cat ? "bg-amber-500 text-black" : "bg-white/6 text-slate-100 hover:bg-white/8"}`}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* card table */}
        <div className="max-w-6xl mx-auto bg-white/5 rounded-2xl border border-white/8 overflow-hidden">
          <div className="p-4 border-b border-white/6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Your investments</h3>
              <div className="text-xs text-slate-400">{total} items</div>
            </div>
            <div className="text-xs text-slate-400">Sorted: <strong className="text-white">Recent</strong></div>
          </div>

          {/* header */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 text-slate-300 text-xs uppercase tracking-wide">
            <div className="col-span-4">Name</div>
            <div className="col-span-2">Category</div>
            <div className="col-span-2 text-right">Price / Min</div>
            <div className="col-span-2 text-right">Return / MarketCap</div>
            <div className="col-span-1 text-right">Risk</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>

          {/* rows */}
          <div>
            {loading && <div className="p-6 text-center text-slate-400">Loading…</div>}
            {error && <div className="p-4 text-center text-red-400">{error}</div>}
            {!loading && pageData.length === 0 && <div className="p-6 text-center text-slate-400">No investments found.</div>}

            {pageData.map((row) => (
              <div key={row.id} role="button" onClick={() => openDetails(row)} className="grid grid-cols-1 md:grid-cols-12 gap-4 px-4 py-4 items-center hover:bg-white/4 transition cursor-pointer">
                <div className="col-span-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-700/30 flex items-center justify-center text-sm font-semibold text-white">
                      {row.source === "tesla" ? "F" : "C"}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{row.name}</div>
                      <div className="text-xs text-slate-400">{row.slug || "—"} • {row.source.toUpperCase()}</div>
                      <div className="text-xs text-slate-400 mt-1 hidden md:block">{truncate(row.raw?.overview, 80)}</div>
                    </div>
                  </div>
                </div>

                <div className="col-span-2 text-sm text-slate-300">{row.category || "—"}</div>

                <div className="col-span-2 text-right text-sm">
                  {row.source === "tesla" ? (row.min_investment ? formatCurrency(row.min_investment) : "-") : (row.price ? formatCurrency(row.price) : "-")}
                </div>

                <div className="col-span-2 text-right text-sm">
                  {row.source === "tesla" ? (row.expected_return ? `${row.expected_return}%` : "-") : (row.market_cap ? formatCurrency(row.market_cap) : "-")}
                </div>

                <div className="col-span-1 text-right text-sm">{row.risk || "—"}</div>

                <div className="col-span-1 text-right text-sm">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
  e.stopPropagation()
  openDetails(row)
}}className="px-3 py-1 rounded-full bg-white text-slate-900 text-xs">View</button>

                    {/* show Manage only if created_by matches current user */}
                    {user?.id && String(row.raw?.created_by || "") === String(user.id) && (
                      <button onClick={(e) => { e.stopPropagation(); handleManage(row) }} className="px-3 py-1 rounded-full bg-amber-500 text-black text-xs">Manage</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* pagination */}
          <div className="flex items-center justify-between p-4 border-t border-white/6">
            <div className="text-sm text-slate-400">Page {page} of {pages}</div>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 rounded bg-white/6 text-sm">Prev</button>
              <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages} className="px-3 py-1 rounded bg-white/6 text-sm">Next</button>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <TeslaInvestmentModal isOpen={openNew} onClose={() => setOpenNew(false)} />
      <SignupModal isOpen={signupOpen} onClose={() => setSignupOpen(false)} onSuccess={() => router.push("/dashboard")} />
      <InvestmentDetailModal isOpen={detailOpen} onClose={() => { setDetailOpen(false); setSelectedInv(null) }} inv={selectedInv} />
    </div>
  )
}
