"use client";

import { useEffect, useMemo, useState } from "react";
import { Menu, Search, X } from "lucide-react";
import SignupModal from "./../../components/modal/signup";
import UserSidebar from "./../../components/user/sidebar";
import { useRouter } from "next/navigation";
import InvestmentDetailModal from "@/app/components/modal/investmentDetails";
import Image from "next/image"

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

type InvestmentCoin = {
  id: string; // "coin:1"
  source: "coin";
  name: string;
  slug?: string;
  category?: string;
  price?: string | number | null;
  market_cap?: string | number | null;
  hours?: number | null;
  overview?: string | null;
  risk?: string | null;
  is_featured?: number | boolean;
  created_at?: string | null;
  raw: any;
};

function useDebounce<T>(value: T, delay = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

export default function CoinsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [active, setActive] = useState<string>("invest-coins");
  const [userName, setUserName] = useState<string>("Investor");
  const [userEmail, setUserEmail] = useState<string>("");

  const router = useRouter();

  const [query, setQuery] = useState("");
  const debounced = useDebounce(query, 300);
  const [category, setCategory] = useState<string>("All");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coins, setCoins] = useState<any[]>([]);
  const [selectedInv, setSelectedInv] = useState<InvestmentCoin | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [page, setPage] = useState(1);
  const perPage = 12;

  // Fetch coins only
  useEffect(() => {
    const ac = new AbortController();
    const fetchCoins = async () => {
      try {
        setLoading(true);
        setError(null);

        const url = new URL(`${BACKEND}/api/coins`);
        url.searchParams.set("limit", "200");
        url.searchParams.set("offset", "0");

        const res = await fetch(url.toString(), { signal: ac.signal });
        if (!res.ok) {
          const body = await res.text().catch(() => null);
          throw new Error(`Failed to load: ${res.status} ${body || res.statusText}`);
        }

        const json = await res.json();
        // support { data: { coins: [...] } } or { coins: [...] }
        const arr = Array.isArray(json?.data?.coins ? json.data.coins : json?.coins ?? json?.data ?? json)
          ? (json?.data?.coins ?? json?.coins ?? json?.data ?? json)
          : [];
        setCoins(Array.isArray(arr) ? arr : []);
      } catch (err: any) {
        if (err.name === "AbortError") return;
        console.error(err);
        setError(err.message || "Failed to fetch coins");
      } finally {
        setLoading(false);
      }
    };

    fetchCoins();
    return () => ac.abort();
  }, []);

  // unified list (coins only)
  const unified = useMemo<InvestmentCoin[]>(
    () =>
      coins
        .map((r: any) => ({
          id: `coin:${r.coin_id}`,
          source: "coin" as const,
          name: r.coin_name,
          slug: r.slug,
          category: r.category,
          price: r.price,
          market_cap: r.market_cap,
          hours: r.hours,
          overview: r.overview,
          risk: r.risk,
          is_featured: r.is_featured,
          created_at: r.created_at,
          raw: r,
        }))
        .sort((a, b) => {
          const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
          const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
          return tb - ta;
        }),
    [coins]
  );

  // categories derived from coins
  const categories = useMemo(() => {
    const set = new Set<string>(["All"]);
    unified.forEach((i) => {
      if (i.category) set.add(i.category);
    });
    return Array.from(set);
  }, [unified]);

  // filtered list (debounced search + category)
  const filtered = useMemo(() => {
    const term = String(debounced || "").trim().toLowerCase();
    let data = unified;

    if (category && category !== "All") {
      data = data.filter((i) => String(i.category || "").toLowerCase() === String(category || "").toLowerCase());
    }

    if (term.length > 0) {
      data = data.filter((i) => {
        const overview = (i.raw?.overview || i.overview || "").toString().toLowerCase();
        const name = (i.name || "").toString().toLowerCase();
        const slug = (i.slug || "").toString().toLowerCase();
        const cat = (i.category || "").toString().toLowerCase();
        return name.includes(term) || overview.includes(term) || slug.includes(term) || cat.includes(term);
      });
    }

    return data;
  }, [unified, debounced, category]);

  // pagination
  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / perPage));
  const pageData = useMemo(() => {
    const start = (page - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, page]);

  useEffect(() => {
    setPage(1);
  }, [debounced, category]);

  // user load from localStorage (unchanged)
  const [user, setUser] = useState<any | null>(null);
  useEffect(() => {
    try {
      const rawAuth = localStorage.getItem("auth");
      if (rawAuth) {
        const parsed = JSON.parse(rawAuth);
        if (parsed?.user) return setUser(parsed.user);
        if (parsed?.token && parsed?.user) return setUser(parsed.user);
      }
      const rawUser = localStorage.getItem("user");
      if (rawUser) return setUser(JSON.parse(rawUser));
      const alt = localStorage.getItem("auth");
      if (alt) {
        try {
          const p = JSON.parse(alt);
          if (p?.email) setUser(p);
        } catch {}
      }
    } catch (e) {
      console.warn("failed reading user from storage", e);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedUser = localStorage.getItem("user");
      if (savedUser) {
        const { name, email } = JSON.parse(savedUser);
        setUserName(name || "Investor");
        setUserEmail(email || "");
      }
    }
  }, []);

  const handleNavChange = (id: string) => {
    if (id === "invest-coins" || id === "post-coins") {
      // open a signup/invest modal if you have one
      // here we reuse signupOpen for example
      setSidebarOpen(false);
      setActive(id);
    } else if (id === "logout") {
      localStorage.removeItem("user");
      router.push("/login");
    } else {
      setActive(id);
      setSidebarOpen(false);
    }
  };

  const displayName = user?.full_name || user?.name || "Investor";
  const displayEmail = user?.email || "";
  const avatar = user?.profile_image || user?.photo || null;
  const initial = String(displayName || "I").slice(0, 1).toUpperCase();

  const formatCurrency = (v?: string | number) => {
    if (v == null || v === "") return "-";
    try {
      const num = Number(v);
      return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } catch {
      return String(v);
    }
  };

  return (
    <>
      <div className="text-slate-100 antialiased">
        {/* Mobile toggle */}
        <div className="md:hidden fixed top-4 left-4 z-50">
          <button onClick={() => setSidebarOpen((s) => !s)} className="p-2 rounded-lg bg-white/6 backdrop-blur text-slate-100">
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <aside
          className={`fixed top-0 left-0 h-screen w-72 z-40 transform transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 `}
        >
          <UserSidebar
            active={active}
            onChange={handleNavChange}
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
                <button aria-label="Search" className="p-2 rounded-full hover:bg-white/8 flex items-center justify-center">
                  <Search size={16} />
                </button>

                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search coins: name, overview, slug or category..." className="w-full bg-transparent outline-none placeholder:text-slate-400 text-slate-100 text-sm" />
                </div>

                <div className="hidden sm:block w-px h-6 bg-white/10 mx-2" />

                

<div className="flex items-center gap-2 ml-1">
  {avatar ? (
    <div className="relative w-9 h-9 rounded-full overflow-hidden border border-white/10">
      <Image
        src={avatar}
        alt={displayName}
        fill
        sizes="36px"
        className="object-cover"
        onError={(e) => {
          // fallback: hide image if it fails
          (e.currentTarget as HTMLImageElement).style.display = "none"
        }}
      />
    </div>
  ) : (
    <div className="w-9 h-9 rounded-full bg-slate-700/30 flex items-center justify-center text-white font-medium">
      {initial}
    </div>
  )}

  <div className="hidden sm:flex flex-col leading-tight overflow-hidden">
    <span className="text-sm font-medium text-white truncate">{displayName}</span>
    {displayEmail && <span className="text-xs text-slate-400 truncate">{displayEmail}</span>}
  </div>
</div>

              </div>
            </div>
          </header>

          <h1 className="text-4xl py-5 text-center md:text-5xl lg:text-6xl font-bold mb-6">[coin investments]</h1>

          {/* categories */}
          <div className="max-w-6xl mx-auto mb-4 px-4">
            <div className="flex flex-wrap gap-2 justify-center">
              {categories.map((cat) => (
                <button key={cat} onClick={() => { setCategory(cat); setPage(1); }} className={`px-3 py-2 rounded-full text-sm font-medium transition ${category === cat ? "bg-amber-500 text-black" : "bg-white/6 text-slate-100 hover:bg-white/8"}`}>{cat}</button>
              ))}
            </div>
          </div>

          {/* table card */}
          <div className="container mx-auto bg-white/5 rounded-2xl border border-white/8 overflow-hidden">
            <div className="p-4 border-b border-white/6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Coin Investments</h3>
                <div className="text-xs text-slate-400">Showing {pageData.length} of {total}</div>
              </div>
              <div className="text-xs text-slate-400">Sort: <strong className="text-white">Recent</strong></div>
            </div>

            {/* header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 text-slate-300 text-xs uppercase tracking-wide">
              <div className="col-span-4">Name</div>
              <div className="col-span-2">Category</div>
              <div className="col-span-2 text-right">Price</div>
              <div className="col-span-2 text-right">MarketCap</div>
              <div className="col-span-1 text-right">Risk</div>
              <div className="col-span-1 text-right">Created</div>
            </div>

            <div>
              {loading && <div className="p-6 text-center text-slate-400">Loading…</div>}
              {error && <div className="p-4 text-center text-red-400">{error}</div>}
              {!loading && pageData.length === 0 && <div className="p-6 text-center text-slate-400">No coins found.</div>}

              {pageData.map((row) => (
                <div key={row.id} role="button" onClick={() => { setSelectedInv(row); setDetailOpen(true); }} className="grid grid-cols-1 md:grid-cols-12 gap-4 px-4 py-4 items-center hover:bg-white/4 transition cursor-pointer">
                  <div className="col-span-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-700/30 flex items-center justify-center text-sm font-semibold text-white">C</div>
                      <div>
                        <div className="text-sm font-medium text-white">{row.name}</div>
                        <div className="text-xs text-slate-400">{row.slug || "—"} • COIN</div>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-2 text-sm text-slate-300">{row.category || "—"}</div>

                  <div className="col-span-2 text-right text-sm">{row.price ? formatCurrency(row.price) : "-"}</div>

                  <div className="col-span-2 text-right text-sm">{row.market_cap ? formatCurrency(row.market_cap) : "-"}</div>

                  <div className="col-span-1 text-right text-sm">{row.risk || "—"}</div>

                  <div className="col-span-1 text-right text-xs text-slate-400">{row.created_at ? new Date(row.created_at).toLocaleDateString() : "-"}</div>
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

        <SignupModal isOpen={false} onClose={() => {}} onSuccess={() => router.push("/invest-coins")} />
      </div>

      <InvestmentDetailModal isOpen={detailOpen} onClose={() => { setDetailOpen(false); setSelectedInv(null); }} inv={selectedInv} />
    </>
  );
}
