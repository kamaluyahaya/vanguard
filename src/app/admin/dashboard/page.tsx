"use client"

import React, { useEffect, useMemo, useState } from "react"
import ClientsPanel from "../client/page"

// Recharts
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as ReTooltip,
  ResponsiveContainer,
} from "recharts"

const COLORS = ["#0070f3", "#34c759", "#ff9500", "#bf5af2", "#ff2d55"]

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000"

// --- Types ---
interface TeslaInvestment {
  tesla_id: number
  investment_name: string
  slug: string
  category?: string
  min_investment?: string
  expected_return?: string
  duration?: string
  overview?: string
  risk?: string
  created_by?: string | number | null
  is_active?: number
  is_featured?: number
  views?: number
  created_at?: string
  updated_at?: string
}

interface TeslaResponse {
  status?: string
  message?: string
  data?: { investments: TeslaInvestment[] }
  investments?: TeslaInvestment[] // some APIs return at root
}

interface Coin {
  coin_id: number
  coin_name: string
  slug: string
  category?: string
  price?: string
  hours?: number
  market_cap?: string
  overview?: string
  circulating_supply?: number
  max_supply?: number
  blockchain?: string
  risk?: string
  created_by?: any
  is_active?: number
  is_featured?: number
  views?: number
  created_at?: string
  updated_at?: string
}

interface CoinsResponse {
  status?: string
  message?: string
  data?: { coins: Coin[] }
}

interface Customer {
  user_id: number
  email: string
  phone?: string | null
  full_name?: string
  profile_image?: string
  password_hash?: string | null
  is_active?: number
  created_at?: string
  updated_at?: string
  firebase_uid?: string
}

// type StaffResponse = any // staff endpoint is inconsistent in sample (object or array)

interface StaffMember {
  staff_id: number
  full_name: string
  email: string
  role: string
  is_active: number
}

type StaffResponse = StaffMember[] | StaffMember | null

// --- Helpers ---
function fmtCurrency(n: number): string {
  if (!isFinite(n)) return "₦0"
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 2 }).format(n)
}

function timeAgo(iso?: string | null): string {
  if (!iso) return ""
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default function AdminDashboard(): React.ReactElement {
  const [teslaData, setTeslaData] = useState<TeslaResponse | null>(null)
  const [coinsData, setCoinsData] = useState<CoinsResponse | null>(null)
  const [customersData, setCustomersData] = useState<Customer[]>([])
  // const [staffData, setStaffData] = useState<StaffResponse | null>(null)
  const [staffData, setStaffData] = useState<StaffResponse>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    let mounted = true
    async function loadAll() {
      setLoading(true)
      try {
        const [teslaRes, coinsRes, customersRes, staffRes] = await Promise.all([
          fetch(`${BASE}/api/tesla`).then((r) => r.json()),
          fetch(`${BASE}/api/coins/`).then((r) => r.json()),
          fetch(`${BASE}/api/customers`).then((r) => r.json()),
          fetch(`${BASE}/api/staff/`).then((r) => r.json()),
        ])

        if (!mounted) return
        setTeslaData(teslaRes as TeslaResponse)
        setCoinsData(coinsRes as CoinsResponse)
        setCustomersData(Array.isArray(customersRes) ? customersRes as Customer[] : [])
        // setStaffData(staffRes as StaffResponse)
        setStaffData(Array.isArray(staffRes) ? staffRes : [staffRes])
      } catch (e) {
        console.error("Failed to fetch dashboard data", e)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    loadAll()
    return () => {
      mounted = false
    }
  }, [])

  const teslaCount = useMemo(() => teslaData?.investments?.length || 0, [teslaData])
  const coinsCount = useMemo(() => coinsData?.data?.coins?.length || 0, [coinsData])
  const customersCount = useMemo(() => customersData.length, [customersData])
  const staffCount = useMemo(() => {
    if (!staffData) return 0
    return Array.isArray(staffData) ? staffData.length : 1
  }, [staffData])

  const teslaTotal = useMemo(() => {
    if (!teslaData?.investments) return 0
    return teslaData.investments.reduce((s, it) => s + (Number(it.min_investment) || 0), 0)
  }, [teslaData])

  const coinsMarketTotal = useMemo(() => {
    const coins = coinsData?.data?.coins || []
    return coins.reduce((s, c) => {
      const price = Number(c.price) || 0
      const circ = Number(c.circulating_supply) || 1
      return s + price * circ
    }, 0)
  }, [coinsData])

  const allocationData = useMemo(() => {
    return [
      { name: "Tesla", value: teslaTotal },
      { name: "Coins", value: coinsMarketTotal },
    ]
  }, [teslaTotal, coinsMarketTotal])

  const recentInvestments = useMemo(() => {
    const out: { id: string; type: string; name: string; value: number; created_at?: string | undefined; slug?: string }[] = []
    if (teslaData?.investments) {
      teslaData.investments.forEach((i) =>
        out.push({
          id: `tesla_${i.tesla_id}`,
          type: "Tesla",
          name: i.investment_name,
          value: Number(i.min_investment) || 0,
          created_at: i.created_at,
          slug: i.slug,
        })
      )
    }
    const coins = coinsData?.data?.coins || []
    coins.forEach((c) =>
      out.push({
        id: `coin_${c.coin_id}`,
        type: "Coin",
        name: c.coin_name,
        value: Number(c.price) || 0,
        created_at: c.created_at,
        slug: c.slug,
      })
    )
    return out.sort((a, b) => (new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()))
  }, [teslaData, coinsData])

  return (
    <div className="p-6">
      <h1 className="text-4xl py-5 text-center md:text-5xl lg:text-6xl font-extrabold mb-6">[admin dashboard]</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white/5 rounded-2xl p-4 shadow-lg">
          <div className="text-xs text-slate-400">Tesla Investments</div>
          <div className="mt-2 flex items-baseline justify-between gap-4">
            <div className="text-2xl font-semibold">{teslaCount}</div>
            <div className="text-sm font-medium text-slate-300">{fmtCurrency(teslaTotal)}</div>
          </div>
        </div>

        <div className="bg-white/5 rounded-2xl p-4 shadow-lg">
          <div className="text-xs text-slate-400">Coins</div>
          <div className="mt-2 flex items-baseline justify-between gap-4">
            <div className="text-2xl font-semibold">{coinsCount}</div>
            <div className="text-sm font-medium text-slate-300">{fmtCurrency(coinsMarketTotal)}</div>
          </div>
        </div>

        <div className="bg-white/5 rounded-2xl p-4 shadow-lg">
          <div className="text-xs text-slate-400">Customers</div>
          <div className="mt-2 flex items-baseline justify-between gap-4">
            <div className="text-2xl font-semibold">{customersCount}</div>
            <div className="text-sm font-medium text-slate-300">Active</div>
          </div>
        </div>

        <div className="bg-white/5 rounded-2xl p-4 shadow-lg">
          <div className="text-xs text-slate-400">Staff</div>
          <div className="mt-2 flex items-baseline justify-between gap-4">
            <div className="text-2xl font-semibold">{staffCount}</div>
            <div className="text-sm font-medium text-slate-300">Active</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 bg-white/5 rounded-2xl p-4 shadow-sm">
          <h4 className="text-sm font-semibold mb-2">Portfolio allocation</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie dataKey="value" data={allocationData} outerRadius={80} label>
                  {allocationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <ReTooltip formatter={(val: number) => fmtCurrency(Number(val))} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4">
            <h5 className="text-xs text-slate-400 mb-2">Breakdown</h5>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {allocationData.map((d) => (
                <div key={d.name} className="bg-white/6 rounded-lg p-3 text-sm">
                  <div className="font-medium">{d.name}</div>
                  <div className="text-xs text-slate-300">{fmtCurrency(d.value)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white/5 rounded-2xl p-4 shadow-sm">
          <h4 className="text-sm font-semibold">Recent activity</h4>
          <ul className="mt-3 text-sm text-slate-300 space-y-3">
            {loading && <li>Loading...</li>}
            {!loading && recentInvestments.length === 0 && <li>No recent investments</li>}
            {!loading && recentInvestments.slice(0, 6).map((it) => (
              <li key={it.id} className="flex items-start justify-between">
                <div>
                  <div className="font-medium">{it.name} <span className="text-xs text-slate-400">· {it.type}</span></div>
                  <div className="text-xs text-slate-400">{fmtCurrency(it.value)}</div>
                </div>
                <div className="text-xs text-slate-400">{timeAgo(it.created_at)}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>

        <div className="lg:col-span-2 bg-white/5 rounded-2xl p-4 shadow-sm">
          <h4 className="text-sm font-semibold mb-3">Investments table (sample)</h4>
          <div className="h-64 overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-slate-400 border-b border-white/6">
                <tr>
                  <th className="py-2 text-left">Name</th>
                  <th className="py-2 text-left">Type</th>
                  <th className="py-2 text-right">Value</th>
                  <th className="py-2 text-right">Added</th>
                </tr>
              </thead>
              <tbody>
                {recentInvestments.map((r) => (
                  <tr key={r.id} className="border-b border-white/6">
                    <td className="py-2">{r.name}</td>
                    <td className="py-2 text-slate-400">{r.type}</td>
                    <td className="py-2 text-right">{fmtCurrency(r.value)}</td>
                    <td className="py-2 text-right text-xs text-slate-400">{r.created_at ? new Date(r.created_at).toLocaleString() : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      <div className="bg-transparent">
        <ClientsPanel />
      </div>

      {/* {showPostTesla && (
        <div className="bg-white/3 rounded-2xl p-4 shadow-sm">
          <PostTeslaPanel />
        </div>
      )} */}

      {/* {showPostCoins && (
        <div className="bg-white/3 rounded-2xl p-4 shadow-sm">
          <PostCoinsPanel />
        </div>
      )} */}
    </div>
  )
}
