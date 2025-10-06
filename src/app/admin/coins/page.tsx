"use client"

import React, { useState } from "react"
 import { toast } from "sonner"
const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000"

type Category = "Top" | "Stablecoins" | "Altcoins" | "Featured"
type Risk = "Low" | "Medium" | "High"

interface CoinForm {
  coinName: string
  category: Category
  price: number | ""
  hours: number | ""
  marketCap: number | ""
  overview: string
  circulatingSupply: number | ""
  maxSupply: number | ""
  blockchain: string
  risk: Risk
}

const DEFAULT: CoinForm = {
  coinName: "",
  category: "Top",
  price: "",
  hours: "",
  marketCap: "",
  overview: "",
  circulatingSupply: "",
  maxSupply: "",
  blockchain: "",
  risk: "Medium",
}

export default function PostCoinsPanel(): React.ReactElement {
  const [form, setForm] = useState<CoinForm>(DEFAULT)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleChange<K extends keyof CoinForm>(key: K, value: CoinForm[K]) {
    setForm((s) => ({ ...s, [key]: value }))
  }

  // UI -> API category mapping (change if you prefer different strings)
  const categoryMap: Record<Category, string> = {
    Top: "Cryptos",
    Stablecoins: "Stablecoins",
    Altcoins: "Altcoins",
    Featured: "Cryptos", // still a crypto category but marked featured via is_featured
  }



async function submit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault()

  // Validation
  if (!form.coinName.trim()) return toast.error("Please enter a coin name")
  if (form.price === "" || Number(form.price) < 0) return toast.error("Enter a valid price")
  if (form.hours === "" || Number(form.hours) < 0) return toast.error("Enter a valid number of hours")
  if (form.marketCap === "" || Number(form.marketCap) < 0) return toast.error("Enter a valid market cap")

  const payload = {
    coin_name: form.coinName.trim(),
    category: categoryMap[form.category],
    price: Number(form.price),
    hours: Number(form.hours),
    market_cap: Number(form.marketCap),
    overview: form.overview.trim(),
    circulating_supply: form.circulatingSupply === "" ? null : Number(form.circulatingSupply),
    max_supply: form.maxSupply === "" ? null : Number(form.maxSupply),
    blockchain: form.blockchain.trim() || null,
    risk: form.risk,
    is_featured: form.category === "Featured",
  }

  setIsSubmitting(true)
  try {
    console.log("Posting coin data", payload)

    const res = await fetch(`${BACKEND}/api/coins`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      let errText = `Request failed with status ${res.status}`
      try {
        const data = await res.json()
        if (data?.message) errText = data.message
      } catch { /* ignore parse errors */ }
      throw new Error(errText)
    }

    const data = await res.json().catch(() => ({}))
    toast.success("Coin opportunity saved ✅")
    console.log("Response:", data)
    setForm(DEFAULT)
  } catch (err: unknown) {
    console.error("Error posting coin:", err)
    if (err instanceof Error) {
      toast.error(`Failed to save: ${err.message}`)
    } else {
      toast.error("Failed to save: Unknown error")
    }
  } finally {
    setIsSubmitting(false)
  }
}


  return (
    <section>
      <h1 className="text-2xl py-5 text-center md:text-5xl lg:text-6xl font-bold mb-6">[post coins investment opportunity]</h1>

      <form onSubmit={submit} className="bg-white/3 rounded-lg p-6 space-y-4">
        <label className="block">
          <div className="text-sm mb-1">Coin name</div>
          <input
            value={form.coinName}
            onChange={(e) => handleChange("coinName", e.target.value)}
            placeholder="e.g. Bitcoin (BTC)"
            className="w-full px-4 py-2 rounded bg-white/5"
          />
        </label>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <label className="block">
            <div className="text-sm mb-1">Category</div>
            <select
              value={form.category}
              onChange={(e) => handleChange("category", e.target.value as Category)}
              className="w-full px-4 py-2 rounded bg-white/5"
            >
              <option>Top</option>
              <option>Stablecoins</option>
              <option>Altcoins</option>
              <option>Featured</option>
            </select>
          </label>

          <label className="block">
            <div className="text-sm mb-1">Price ($)</div>
            <input
              type="number"
              min={0}
              step="0.01"
              value={form.price === "" ? "" : String(form.price)}
              onChange={(e) => handleChange("price", e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="e.g. 12,345.50"
              className="w-full px-4 py-2 rounded bg-white/5"
            />
          </label>

          <label className="block">
            <div className="text-sm mb-1">In how many hours</div>
            <input
              type="number"
              min={0}
              value={form.hours === "" ? "" : String(form.hours)}
              onChange={(e) => handleChange("hours", e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="e.g. 24"
              className="w-full px-4 py-2 rounded bg-white/5"
            />
          </label>
        </div>

        <label className="block">
          <div className="text-sm mb-1">Market Cap ($)</div>
          <input
            type="number"
            min={0}
            step="0.01"
            value={form.marketCap === "" ? "" : String(form.marketCap)}
            onChange={(e) => handleChange("marketCap", e.target.value === "" ? "" : Number(e.target.value))}
            placeholder="e.g. 1,000,000,000.00"
            className="w-full px-4 py-2 rounded bg-white/5"
          />
        </label>

        <label className="block">
          <div className="text-sm mb-1">Overview</div>
          <textarea
            value={form.overview}
            onChange={(e) => handleChange("overview", e.target.value)}
            placeholder="Short description / notes"
            className="w-full px-4 py-3 rounded bg-white/5 min-h-[120px]"
          />
        </label>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <label className="block">
            <div className="text-sm mb-1">Circulating supply</div>
            <input
              type="number"
              min={0}
              value={form.circulatingSupply === "" ? "" : String(form.circulatingSupply)}
              onChange={(e) => handleChange("circulatingSupply", e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="e.g. 18,000,000"
              className="w-full px-4 py-2 rounded bg-white/5"
            />
          </label>

          <label className="block">
            <div className="text-sm mb-1">Max supply</div>
            <input
              type="number"
              min={0}
              value={form.maxSupply === "" ? "" : String(form.maxSupply)}
              onChange={(e) => handleChange("maxSupply", e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="e.g. 21,000,000"
              className="w-full px-4 py-2 rounded bg-white/5"
            />
          </label>

          <label className="block">
            <div className="text-sm mb-1">Blockchain</div>
            <input
              value={form.blockchain}
              onChange={(e) => handleChange("blockchain", e.target.value)}
              placeholder="e.g. Bitcoin, Ethereum"
              className="w-full px-4 py-2 rounded bg-white/5"
            />
          </label>
        </div>

        <label className="block md:w-1/3">
          <div className="text-sm mb-1">Risk level</div>
          <select
            value={form.risk}
            onChange={(e) => handleChange("risk", e.target.value as Risk)}
            className="w-full px-4 py-2 rounded bg-white/5"
          >
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
          </select>
        </label>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 rounded bg-amber-400 text-black font-semibold disabled:opacity-60"
          >
            {isSubmitting ? "Publishing..." : "Publish"}
          </button>
          <button type="button" onClick={() => setForm(DEFAULT)} className="px-4 py-2 rounded bg-white/6">Clear</button>
        </div>

        {form.coinName && (
          <div className="mt-4 p-4 bg-white/2 rounded">
            <div className="font-semibold">Preview</div>
            <div className="text-sm">{form.coinName} • {form.category} • In {form.hours === "" ? "—" : `${form.hours}h`}</div>
            <div className="text-xs mt-2">Price: {form.price === "" ? "—" : `$${form.price}`} • Market Cap: {form.marketCap === "" ? "—" : `$${form.marketCap}`} • Risk: {form.risk}</div>
            <p className="mt-2 text-sm">{form.overview || "No overview yet"}</p>
            <div className="text-xs mt-2">Metrics: Circulating {form.circulatingSupply === "" ? "—" : form.circulatingSupply} • Max {form.maxSupply === "" ? "—" : form.maxSupply} • Blockchain: {form.blockchain || "—"}</div>
          </div>
        )}
      </form>
    </section>
  )
}
