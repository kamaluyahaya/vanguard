"use client"
import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import { Menu, Search, X } from "lucide-react"
import TeslaInvestmentModal from "./../../components/modal/tesla-investment-modal"
import SignupModal from "./../../components/modal/signup"
import UserSidebar from "./../../components/user/sidebar"
import { useRouter } from "next/navigation"
import InvestmentDetailModal from "@/app/components/modal/investmentDetails"

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"

type TeslaRaw = {
  tesla_id: string
  investment_name: string
  slug?: string
  category?: string
  min_investment?: string | number
  expected_return?: string | number
  duration?: string
  risk?: string
  is_featured?: number | boolean
  created_at?: string
  overview?: string
}

type CoinRaw = {
  coin_id: string
  coin_name: string
  slug?: string
  category?: string
  price?: string | number
  market_cap?: string | number
  hours?: number
  risk?: string
  is_featured?: number | boolean
  created_at?: string
  overview?: string
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
  raw: any
}

function useDebounce<T>(value: T, delay = 350) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return v
}

export default function Home() {
  const [open, setOpen] = useState(false) // Tesla modal
  const [signupOpen, setSignupOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false) // mobile toggle
  const [active, setActive] = useState<string>("dashboard")
  const [userName, setUserName] = useState<string>("Investor")
  const [userEmail, setUserEmail] = useState<string>("")

  const [tesla, setTesla] = useState<TeslaRaw[]>([])
const [coins, setCoins] = useState<CoinRaw[]>([])
const [user, setUser] = useState<{ name?: string; full_name?: string; email?: string; profile_image?: string; photo?: string } | null>(null)


  const router = useRouter()

  const [query, setQuery] = useState("")
  const debounced = useDebounce(query, 300)
  const [category, setCategory] = useState<string>("All")

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
const [selectedInv, setSelectedInv] = useState<Investment | null>(null)
const [detailOpen, setDetailOpen] = useState(false)
  const [page, setPage] = useState(1)
  const perPage = 12

  // Fetch once on mount (no query/category on backend)
  useEffect(() => {
    const ac = new AbortController()
    const fetchAll = async () => {
      try {
        setLoading(true)
        setError(null)
        const url = new URL(`${BACKEND}/api/investments`)
        url.searchParams.set("limit", "200")
        url.searchParams.set("offset", "0")

        const res = await fetch(url.toString(), { signal: ac.signal })
        if (!res.ok) {
          const body = await res.text().catch(() => null)
          throw new Error(`Failed to load: ${res.status} ${body || res.statusText}`)
        }
        const json = await res.json()
        const data = json?.data ?? json
        setTesla(Array.isArray(data?.tesla) ? data.tesla : [])
        setCoins(Array.isArray(data?.coins) ? data.coins : [])
     } catch (err: unknown) {
  if ((err as { name?: string }).name === "AbortError") return
  console.error(err)
  setError((err as { message?: string }).message || "Failed to fetch investments")
}finally {
        setLoading(false)
      }
    }
    fetchAll()
    return () => ac.abort()
  }, [])

  // unified list (raw combined)
 const unified = useMemo<Investment[]>(() => {
  const t = tesla.map((r) => ({
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

  const c = coins.map((r) => ({
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


  // categories derived from the full set (so buttons always show available categories)
  const categories = useMemo(() => {
    const set = new Set<string>(["All"])
    unified.forEach((i) => {
      if (i.category) set.add(i.category)
    })
    return Array.from(set)
  }, [unified])

  // filtered list (client-side search + category) — debounced search
  const filtered = useMemo(() => {
    const term = String(debounced || "").trim().toLowerCase()
    let data = unified

    if (category && category !== "All") {
      data = data.filter((i) => String(i.category || "").toLowerCase() === String(category || "").toLowerCase())
    }

    if (term.length > 0) {
      data = data.filter((i) => {
        // check main name + slug + overview + category
        const overview = (i.raw?.overview || "").toString().toLowerCase()
        const name = (i.name || "").toString().toLowerCase()
        const slug = (i.slug || "").toString().toLowerCase()
        const cat = (i.category || "").toString().toLowerCase()
        return name.includes(term) || overview.includes(term) || slug.includes(term) || cat.includes(term)
      })
    }

    return data
  }, [unified, debounced, category])

  // pagination based on filtered
  const total = filtered.length
  const pages = Math.max(1, Math.ceil(total / perPage))
  const pageData = useMemo(() => {
    setTimeout(() => {}, 0) // keep hook stable
    const start = (page - 1) * perPage
    return filtered.slice(start, start + perPage)
  }, [filtered, page])

  // reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [debounced, category])

  // user load from local storage (unchanged)
  useEffect(() => {
    try {
      const rawAuth = localStorage.getItem("auth")
      if (rawAuth) {
        const parsed = JSON.parse(rawAuth)
        if (parsed?.user) return setUser(parsed.user)
        if (parsed?.token && parsed?.user) return setUser(parsed.user)
      }
      const rawUser = localStorage.getItem("user")
      if (rawUser) return setUser(JSON.parse(rawUser))
      const alt = localStorage.getItem("auth")
      if (alt) {
        try {
          const p = JSON.parse(alt)
          if (p?.email) setUser(p)
        } catch {}
      }
    } catch (e) {
      console.warn("failed reading user from storage", e)
    }
  }, [])

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedUser = localStorage.getItem("user")
      if (savedUser) {
        const { name, email } = JSON.parse(savedUser)
        setUserName(name || "Investor")
        setUserEmail(email || "")
      }
    }
  }, [])

  const handleNavChange = (id: string) => {
    if (id === "invest-tesla" || id === "post-tesla") {
      setOpen(true)
    } else if (id === "invest-coins" || id === "post-coins") {
      setOpen(true)
    } else if (id === "logout") {
      localStorage.removeItem("user")
      router.push("/login")
    } else {
      setActive(id)
    }
    setSidebarOpen(false)
  }

  const displayName = user?.full_name || user?.name || "Investor"
  const displayEmail = user?.email || ""
  const avatar = user?.profile_image || user?.photo || null
  const initial = String(displayName || "I").slice(0, 1).toUpperCase()

  return (
    <>

    <div className="text-slate-100 antialiased">
      {/* Mobile toggle button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setSidebarOpen((s) => !s)}
          className="p-2 rounded-lg bg-white/6 backdrop-blur text-slate-100"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen w-72 z-40 transform transition-transform duration-200
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} 
          md:translate-x-0 `}
      >
        <UserSidebar
          active={active}
          onChange={handleNavChange}
          userName={userName}
          userEmail={userEmail}
          onLogout={() => {
            localStorage.removeItem("auth")
            localStorage.removeItem("user")
            localStorage.removeItem("token")
            router.push("/")
          }}
        />
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-30 bg-black/40 md:hidden" />
      )}

      {/* Main content */}
      <main className="ml-0 md:ml-72 min-h-screen p-6">
        {/* Center cluster: search icon + input + avatar + name */}
        <header className="mb-6">
          <div className="flex justify-center">
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/6 border border-white/10
                       max-w-6xl w-full mx-4"
              style={{ alignItems: "center" }}
            >
              <button aria-label="Search" className="p-2 rounded-full hover:bg-white/8 flex items-center justify-center" onClick={() => {}}>
                <Search size={16} />
              </button>

              <div className="flex items-center gap-2 flex-1 min-w-0">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search investments, transactions, people..."
                  className="w-full bg-transparent outline-none placeholder:text-slate-400 text-slate-100 text-sm"
                  aria-label="Search"
                />
              </div>

              <div className="hidden sm:block w-px h-6 bg-white/10 mx-2" />

              <div className="flex items-center gap-2 ml-1">


{avatar ? (
  <Image
    src={avatar}
    alt={displayName}
    width={36}
    height={36}
    className="rounded-full border border-white/10 object-cover"
  />
) : (
  <div className="w-9 h-9 rounded-full bg-slate-700/30 flex items-center justify-center text-white font-medium">{initial}</div>
)}

                <div className="hidden sm:flex flex-col leading-tight">
                  <span className="text-sm font-medium text-white">{displayName}</span>
                  {displayEmail && <span className="text-xs text-slate-400">{displayEmail}</span>}
                </div>
              </div>
            </div>
          </div>
        </header>

        <h1 className="text-4xl py-5 text-center md:text-5xl lg:text-6xl font-bold mb-6">[investment opportunities]</h1>

        {/* category buttons + search summary */}
        <div className="max-w-6xl mx-auto mb-4 px-4">
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => { setCategory(cat); setPage(1) }}
                className={`px-3 py-2 rounded-full text-sm font-medium transition ${
                  category === cat ? "bg-amber-500 text-black" : "bg-white/6 text-slate-100 hover:bg-white/8"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* table card */}
        <div className="container mx-auto bg-white/5 rounded-2xl border border-white/8 overflow-hidden">
          <div className="p-4 border-b border-white/6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Investments</h3>
              <div className="text-xs text-slate-400">Showing {pageData.length} of {total}</div>
            </div>
            <div className="text-xs text-slate-400">Sort: <strong className="text-white">Recent</strong></div>
          </div>

          {/* table header */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 text-slate-300 text-xs uppercase tracking-wide">
            <div className="col-span-4">Name</div>
            <div className="col-span-2">Category</div>
            <div className="col-span-2 text-right">Price / Min</div>
            <div className="col-span-2 text-right">Return / MarketCap</div>
            <div className="col-span-1 text-right">Risk</div>
            <div className="col-span-1 text-right">Created</div>
          </div>

          {/* rows */}
          <div>
            {loading && (
              <div className="p-6 text-center text-slate-400">Loading…</div>
            )}

            {error && (
              <div className="p-4 text-center text-red-400">{error}</div>
            )}

            {!loading && pageData.length === 0 && (
              <div className="p-6 text-center text-slate-400">No investments found.</div>
            )}

            {pageData.map((row) => (
               <div key={row.id}
  role="button"
  onClick={() => { setSelectedInv(row); setDetailOpen(true) }}
  className="grid grid-cols-1 md:grid-cols-12 gap-4 px-4 py-4 items-center hover:bg-white/4 transition cursor-pointer">
                <div className="col-span-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-700/30 flex items-center justify-center text-sm font-semibold text-white">
                      {row.source === "tesla" ? "F" : "C"}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{row.name}</div>
                      <div className="text-xs text-slate-400">{row.slug || "—"} • {row.source.toUpperCase()}</div>
                    </div>
                  </div>
                </div>

                <div className="col-span-2 text-sm text-slate-300">{row.category || "—"}</div>

                <div className="col-span-2 text-right text-sm">
                  {row.source === "tesla" ? (
                    <div>{row.min_investment ? Number(row.min_investment).toLocaleString() : "-"}</div>
                  ) : (
                    <div>{row.price ? Number(row.price).toLocaleString(undefined, { minimumFractionDigits: 2 }) : "-"}</div>
                  )}
                </div>

                <div className="col-span-2 text-right text-sm">
                  {row.source === "tesla" ? (
                    <div>{row.expected_return ? `${row.expected_return}%` : "-"}</div>
                  ) : (
                    <div>{row.market_cap ? Number(row.market_cap).toLocaleString() : "-"}</div>
                  )}
                </div>

                <div className="col-span-1 text-right text-sm">{row.risk || "—"}</div>

                <div className="col-span-1 text-right text-xs text-slate-400">{row.created_at ? new Date(row.created_at).toLocaleDateString() : "-"}</div>
              </div>
            ))}
          </div>

          {/* pagination */}
          <div className="flex items-center justify-between p-4 border-t border-white/6">
            <div className="text-sm text-slate-400">Page {page} of {pages}</div>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1 rounded bg-white/6 text-sm">Prev</button>
              <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages}
                className="px-3 py-1 rounded bg-white/6 text-sm">Next</button>
            </div>
          </div>
        </div>

      </main>

      {/* Modals */}
      <TeslaInvestmentModal isOpen={open} onClose={() => setOpen(false)} />
      <SignupModal isOpen={signupOpen} onClose={() => setSignupOpen(false)} onSuccess={() => router.push("/dashboard")} />
    </div>
    <InvestmentDetailModal
  isOpen={detailOpen}
  onClose={() => { setDetailOpen(false); setSelectedInv(null) }}
  inv={selectedInv}
/>
    </>
  )
}
