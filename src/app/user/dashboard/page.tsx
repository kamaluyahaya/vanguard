"use client"
import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import { Menu, Search, X } from "lucide-react"
import UserSidebar from "./../../components/user/sidebar"
import { useRouter } from "next/navigation"

const BACKEND = "http://localhost:4000"
const COINLORE = "https://api.coinlore.net/api/tickers/?start=100&limit=100"

type CoinLoreRaw = {
  id: string
  symbol: string
  name: string
  nameid: string
  rank: number
  price_usd: string
  percent_change_24h: string
  percent_change_1h: string
  percent_change_7d: string
  price_btc: string
  market_cap_usd: string
  volume24: number
  volume24a: number
  csupply: string
  tsupply: string
  msupply: string
  [k: string]: any
}

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [coins, setCoins] = useState<CoinLoreRaw[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<CoinLoreRaw | null>(null)
  const [user, setUser] = useState<any>(null)
  const [userBalance, setUserBalance] = useState<number | null>(null)
  const router = useRouter()

      const getStoredAuth = () => {
    try {
      const rawAuth = localStorage.getItem("user_auth")
      if (rawAuth) {
        try {
          const parsed = JSON.parse(rawAuth)
          if (parsed?.token || parsed?.user) return parsed
        } catch {}
      }
      const token = localStorage.getItem("token")
      const userRaw = localStorage.getItem("user")
      const user = userRaw ? JSON.parse(userRaw) : null
      if (token || user) return { token, user }
      return null
    } catch (e) {
      return null
    }
  }


  // default invest pct
  const [investPct, setInvestPct] = useState<number>(20) // default 20%
  useEffect(() => {
    setInvestPct(20)
  }, [selected])

  useEffect(() => {
    const ac = new AbortController()
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(COINLORE, { signal: ac.signal })
        if (!res.ok) throw new Error(`Failed to fetch coinlore: ${res.status}`)
        const json = await res.json()
        const list = Array.isArray(json?.data) ? json.data : []
        // normalize simple types
        const mapped = list.map((c: any) => ({
          ...c,
          id: String(c.id ?? ""),
          price_usd: String(c.price_usd ?? c.price ?? "0"),
          volume24: Number(c.volume24 ?? 0),
          volume24a: Number(c.volume24a ?? 0),
          market_cap_usd: String(c.market_cap_usd ?? c.market_cap ?? "0"),
        }))
        setCoins(mapped)
      } catch (e: any) {
        if (e.name === "AbortError") return
        console.error(e)
        setError(String(e?.message ?? e))
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => ac.abort()
  }, [])


  useEffect(() => {
  try {
    const raw =
      localStorage.getItem("user") ||
      localStorage.getItem("auth")

    if (!raw) return

    const parsed = JSON.parse(raw)
    const u = parsed.user ?? parsed

    setUser(u)
  } catch (e) {
    console.error("Failed to load user", e)
  }
}, [])

useEffect(() => {
  const fetchWallet = async () => {
    try {
             const auth = getStoredAuth()
    const user_id = auth?.user.id || null
    // fetch(`/api/fund/user/${u.user_id}`)
      const res = await fetch(`${BACKEND}/api/fund/user/${user_id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      })
      if (!res.ok) throw new Error("Failed to fetch wallet")

      const json = await res.json()
      console.log("Wallet API response:", json) // DEBUG

      setUserBalance(Number(json?.balance ?? 0))
    } catch (err) {
      console.error("Wallet fetch error:", err)
      setUserBalance(0)
    }
  }

  fetchWallet()
}, [])



  const filtered = useMemo(() => {
    const t = query.trim().toLowerCase()
    if (!t) return coins
    return coins.filter((c) => {
      return (
        (c.name ?? "").toString().toLowerCase().includes(t) ||
        (c.symbol ?? "").toString().toLowerCase().includes(t) ||
        (c.nameid ?? "").toString().toLowerCase().includes(t)
      )
    })
  }, [coins, query])

  function makeVolumeSeries(a: number, b: number, points = 12) {
    const arr: number[] = []
    for (let i = 0; i < points; i++) {
      const t = i / (points - 1)
      const eased = 1 - Math.pow(1 - t, 2)
      arr.push(a + (b - a) * eased)
    }
    return arr
  }

function Sparkline({
  data,
  height = 40,
}: {
  data: number[]
  height?: number
}) {
  if (!data || data.length === 0) return null

  const w = Math.max(120, data.length * 8)
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  // 📉📈 detect trend
  const isDown = data[data.length - 1] < data[0]

  // Apple-like colors
  const strokeColor = isDown ? "#ef4444" : "#22c55e" // red-500 | green-500
  const fillColor = isDown
    ? "rgba(239,68,68,0.12)"
    : "rgba(34,197,94,0.12)"

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * (w - 4) + 2
      const y = ((max - v) / range) * (height - 4) + 2
      return `${x},${y}`
    })
    .join(" ")

  return (
    <svg width={w} height={height} className="block">
      {/* line */}
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth={1.8}
        points={points}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* soft area fill */}
      <polyline
        fill={fillColor}
        stroke="transparent"
        points={`${points} ${w - 2},${height - 2} 2,${height - 2}`}
      />
    </svg>
  )
}


  function fmt(n: string | number | null | undefined) {
    if (n == null) return "-"
    const num = Number(n)
    if (Number.isNaN(num)) return String(n)
    return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  // inside the modal where Invest button lives (React client component)
async function handleInvest() {
  try {
    const userId = user?.user_id ?? 1;
    const amt = userBalance ? (userBalance * investPct) / 100 : 0;
    const payload = {
      user_id: userId,
      amount: Number(amt.toFixed(2)),
      coin: selected,
      duration_days: 30,
      projected_pct: investPct
    };

    const res = await fetch(`${BACKEND}/api/fund/invest/init`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const json = await res.json();

    if (!res.ok) {
      alert(json.error || "Failed to initialize investment");
      return;
    }

    // show success message
    alert(json.message || "Initialized investment successfully");

    // CLOSE THE MODAL
    setSelected(null);

    // NAVIGATE TO MY-INVESTMENTS PAGE
    router.push("/user/my-investments");

    // optional telegram share
    if (json.telegram_url) {
      window.open(json.telegram_url, "_blank");
    } else {
      const text = `I've initialized an investment of $${payload.amount} in ${selected!.symbol} — projected ${selected!.price_usd}.`;
      window.open(`https://t.me/share/url?url=&text=${encodeURIComponent(text)}`, "_blank");
    }

  } catch (err) {
    console.error("Invest error", err);
    alert("An error occurred while initializing investment.");
  }
}



  return (
    <>
      <div className="text-slate-100 antialiased">
        <div className="md:hidden fixed top-4 left-4 z-50">
          <button
            onClick={() => setSidebarOpen((s) => !s)}
            className="p-2 rounded-lg bg-white/6 backdrop-blur text-slate-100"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <aside className={`fixed top-0 left-0 h-screen w-72 z-40 transform transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}>
          <UserSidebar
            active={"dashboard"}
            onChange={(id: string) => {
              if (id === "logout") {
                localStorage.removeItem("user_token")
                localStorage.removeItem("user_auth")
                router.push("/")
              }
            }}
            userName={user?.name ?? user?.full_name ?? "Investor"}
            userEmail={user?.email ?? ""}
          />
        </aside>

        {sidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-30 bg-black/40 md:hidden" />}

        <main className="ml-0 md:ml-72 min-h-screen p-4 md:p-6">

          <header className="mb-4">
            <div className="flex justify-center">
              <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/6 border border-white/10 max-w-6xl w-full mx-2">
                <button aria-label="Search" className="p-2 rounded-full hover:bg-white/8 flex items-center justify-center">
                  <Search size={16} />
                </button>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search coins by name or symbol..."
                  className="w-full bg-transparent outline-none placeholder:text-slate-400 text-slate-100 text-sm"
                />
                <div className="  w-px h-6 bg-white/10 mx-2" />
                <div className=" flex-col text-right mr-2">
                  <span className="text-xs text-slate-400">Wallet</span>
                  <span className="text-sm font-medium text-white">${fmt(userBalance)}</span>
                </div>
              </div>
            </div>
          </header>

          <h1 className="text-center text-4xl md:text-5xl lg:text-6xl font-bold mb-6">[investment opportunity]</h1>

          <div className="max-w-7xl mx-auto space-y-4">
            <div className="bg-white/5 rounded-2xl border border-white/8 p-3">
              <div className="p-2 border-b border-white/6 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">Coins</h3>
                  <div className="text-xs text-slate-400">Showing {filtered.length} coins</div>
                </div>
                <div className="text-xs text-slate-400">Source: Coinlore</div>
              </div>

              {loading && <div className="p-6 text-center text-slate-400">Loading…</div>}
              {error && <div className="p-4 text-center text-red-400">{error}</div>}

              <div>
                {filtered.map((c) => (
                  <div
                    key={c.id}
                    role="button"
                    onClick={() => setSelected(c)}
                    className="cursor-pointer hover:bg-white/4 transition p-3 md:p-4 border-b border-white/6 flex flex-col md:grid md:grid-cols-12 gap-3 items-center"
                  >
                    <div className="col-span-4 flex items-center gap-3 w-full">
                      <div className="w-12 h-12 rounded-lg bg-slate-700/30 flex items-center justify-center text-sm font-semibold text-white shrink-0">
                        {c.symbol?.slice(0, 3) ?? "C"}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-white truncate">{c.name}</div>
                        <div className="text-xs text-slate-400 truncate">{c.symbol} • rank {c.rank}</div>
                      </div>
                    </div>

                    <div className="col-span-2 text-sm text-slate-300 w-full">
                      {c.nameid ?? "—"}
                    </div>

                    <div className="col-span-2 text-right md:text-right text-sm">
                      <div className="font-medium">${fmt(c.price_usd)}</div>
                      <div className="text-xs text-slate-400">BTC {c.price_btc}</div>
                    </div>

                    <div className="col-span-2 text-right text-sm">
                      <div className="font-medium">{c.market_cap_usd ? `$${fmt(c.market_cap_usd)}` : "-"}</div>
                      <div className="text-xs text-slate-400">Vol24 ${fmt(c.volume24)}</div>
                    </div>

                    <div className="col-span-1 text-right md:text-right text-sm">
                      <div className={`font-medium ${Number(c.percent_change_24h) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {c.percent_change_24h ?? "-"}%
                      </div>
                    </div>

                    <div className="col-span-1 text-right md:text-right">
                      <div className="flex items-center justify-end">
                        <div className="w-28">
                          <Sparkline data={makeVolumeSeries(c.volume24a ?? 0, c.volume24 ?? 0, 12)} height={40} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {!loading && filtered.length === 0 && <div className="p-6 text-center text-slate-400">No coins found.</div>}
            </div>
          </div>
        </main>
      </div>

      {/* Detail modal */}
{selected && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/60" onClick={() => setSelected(null)} />

    <div className="relative w-full max-w-5xl bg-white rounded-2xl border border-slate-200 overflow-hidden h-[90vh] md:h-auto shadow-xl">
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur px-4 py-3 border-b border-slate-200 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-sm font-semibold text-slate-900">
            {selected.symbol?.slice(0, 3)}
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900">
              {selected.name} <span className="text-sm text-slate-500">({selected.symbol})</span>
            </div>
            <div className="text-xs text-slate-500">rank {selected.rank} • {selected.nameid}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={process.env.NEXT_PUBLIC_TELEGRAM_LINK ?? `https://t.me/share/url?url=${encodeURIComponent('https://coinlore.com/coins/' + (selected.nameid||''))}&text=${encodeURIComponent(selected.name||selected.symbol||'')}`}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1 rounded bg-amber-500 text-black text-sm font-medium"
          >
            Open Telegram
          </a>

          <a
            href={`https://t.me/share/url?url=${encodeURIComponent('https://coinlore.com/coins/' + (selected.nameid||''))}&text=${encodeURIComponent('Check out ' + (selected.name||selected.symbol||''))}`}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1 rounded bg-slate-100 text-sm text-slate-700"
          >
            Share
          </a>

          <button onClick={() => setSelected(null)} className="px-3 py-1 rounded bg-slate-100 text-sm text-slate-700">
            Close
          </button>
        </div>
      </div>

      <div className="overflow-y-auto px-4 py-4" style={{ maxHeight: 'calc(100vh - 88px)' }}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-3">
            <div className="text-xs text-slate-500">Price (USD)</div>
            <div className="text-2xl font-semibold text-slate-900">${fmt(selected.price_usd)}</div>

            <div className="text-xs text-slate-500">Price (BTC)</div>
            <div className="text-sm text-slate-700">{selected.price_btc}</div>

            <div className="mt-3 text-xs text-slate-500">Projected return ({investPct}%)</div>
            <div className="text-lg font-medium text-slate-900">
              ${fmt(Number(selected.price_usd) * (1 + investPct / 100))}
            </div>

            <div className="mt-3 text-xs text-slate-500">Market Cap</div>
            <div className="text-sm text-slate-700">${fmt(selected.market_cap_usd)}</div>

            <div className="mt-3 text-xs text-slate-500">Circulating Supply</div>
            <div className="text-sm text-slate-700">{selected.csupply ?? "-"}</div>

            <div className="mt-4">
              <label className="text-xs text-slate-500 block mb-1">Invest percent of wallet</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={investPct}
                  onChange={(e) => setInvestPct(Math.max(0, Math.min(100, Number(e.target.value || 0))))}
                  className="w-24 px-2 py-1 rounded bg-white border border-slate-200 text-slate-900 text-sm"
                />
                <button
                  onClick={() => setInvestPct(20)}
                  className="px-3 py-1 rounded bg-slate-100 text-sm text-slate-700"
                >
                  Default 20%
                </button>
              </div>

              <div className="mt-2 text-xs text-slate-500">
                {userBalance != null ? (
                  <>
                    Investing <strong className="text-slate-900">{investPct}%</strong> = <strong className="text-slate-900">${fmt((userBalance * investPct) / 100)}</strong> of your wallet (${fmt(userBalance)})
                  </>
                ) : (
                  <>Connect wallet to see invest amount</>
                )}
              </div>

              <div className="mt-3 flex gap-2">
                <button onClick={handleInvest} className="px-4 py-2 rounded bg-amber-500 text-black font-medium">
                  Invest ({investPct}%)
                </button>

                <button
                  onClick={() => {
                    const amt = userBalance ? (userBalance * investPct) / 100 : 0
                    const projected = amt * 1.2
                    const text = `I'm investing ${fmt(amt)} in ${selected.symbol} — projected ${fmt(projected)} (+${investPct}%).`
                    window.open(`https://t.me/share/url?url=&text=${encodeURIComponent(text)}`, "_blank")
                  }}
                  className="px-3 py-2 rounded bg-slate-100 text-slate-700"
                >
                  Quick share
                </button>
              </div>
            </div>
          </div>

          <div className="col-span-1 md:col-span-2">
            <div className="text-xs text-slate-500 mb-2">Volume (24h) trend</div>
            <div className="bg-slate-50 p-3 rounded">
              <Sparkline data={makeVolumeSeries(selected.volume24a ?? 0, selected.volume24 ?? 0, 24)} height={120} />
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="bg-slate-50 p-3 rounded border border-slate-100">
                <div className="text-xs text-slate-500">Volume (24h)</div>
                <div className="font-medium text-slate-900">${fmt(selected.volume24)}</div>
              </div>
              <div className="bg-slate-50 p-3 rounded border border-slate-100">
                <div className="text-xs text-slate-500">Volume (24h a)</div>
                <div className="font-medium text-slate-900">${fmt(selected.volume24a)}</div>
              </div>
            </div>
          </div>

          <div className="md:col-span-3 mt-2">
            <div className="text-xs text-slate-500 mb-2">Full details</div>
            <div className="bg-slate-50 p-3 rounded grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-700">
              <div><strong className="text-slate-900">ID:</strong> {selected.id}</div>
              <div><strong className="text-slate-900">NameID:</strong> {selected.nameid}</div>
              <div><strong className="text-slate-900">Rank:</strong> {selected.rank}</div>
              <div><strong className="text-slate-900">1h %:</strong> {selected.percent_change_1h}%</div>
              <div><strong className="text-slate-900">24h %:</strong> {selected.percent_change_24h}%</div>
              <div><strong className="text-slate-900">7d %:</strong> {selected.percent_change_7d}%</div>
              <div><strong className="text-slate-900">Market Cap USD:</strong> ${fmt(selected.market_cap_usd)}</div>
              <div><strong className="text-slate-900">CSupply:</strong> {selected.csupply}</div>
              <div><strong className="text-slate-900">TSupply:</strong> {selected.tsupply}</div>
              <div><strong className="text-slate-900">MSupply:</strong> {selected.msupply || "-"}</div>
              <div className="sm:col-span-2">
                <strong className="text-slate-900">Raw object:</strong>
                <pre className="text-sm max-h-40 overflow-auto text-slate-700 bg-slate-50 p-2 rounded">{JSON.stringify(selected, null, 2)}</pre>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
)}


    </>
  )
}
