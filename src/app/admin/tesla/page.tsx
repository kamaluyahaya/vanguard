"use client"

import React, { useState } from "react"

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000"

type Category = "Stocks" | "ETF" | "Project" | "Featured"
type Risk = "Low" | "Medium" | "High"

interface InvestmentForm {
  investmentName: string
  category: Category
  minInvestment: number | ""
  expectedReturn: number | ""
  duration: string
  overview: string
  risk: Risk
}

const DEFAULT: InvestmentForm = {
  investmentName: "",
  category: "Stocks",
  minInvestment: "",
  expectedReturn: "",
  duration: "12 - 24 months",
  overview: "",
  risk: "Medium",
}

export default function PostTeslaPanel(): React.ReactElement {
  const [form, setForm] = useState<InvestmentForm>(DEFAULT)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleChange<K extends keyof InvestmentForm>(key: K, value: InvestmentForm[K]) {
    setForm((s) => ({ ...s, [key]: value }))
  }

  // map UI categories to API categories
  const categoryMap: Record<Category, string> = {
    Stocks: "Equity",
    ETF: "ETF",
    Project: "Project",
    Featured: "Equity", // keep categorical type as Equity but mark as featured
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    // Basic validation
    if (!form.investmentName.trim()) return alert("Please enter an investment name")
    if (form.minInvestment === "" || Number(form.minInvestment) <= 0) return alert("Enter a valid minimum investment")
    if (form.expectedReturn === "" || Number(form.expectedReturn) < 0) return alert("Enter a valid expected return (%, number)")
    if (!form.duration.trim()) return alert("Please enter a duration")

    const payload = {
      investmentName: form.investmentName.trim(),
      category: categoryMap[form.category],
      minInvestment: Number(form.minInvestment),
      expectedReturn: Number(form.expectedReturn),
      duration: form.duration.trim(),
      overview: form.overview.trim(),
      risk: form.risk,
      // mark featured when user selects Featured category
      is_featured: form.category === "Featured",
    }

    setIsSubmitting(true)
    try {
      console.log("Posting investment opportunity", payload)

      const res = await fetch(`${BACKEND}/api/tesla`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        // try to parse json error message if available
        let errText = `Request failed with status ${res.status}`
        try {
          const data = await res.json()
          if (data?.message) errText = data.message
        } catch {
          /* ignore parse errors */
        }
        throw new Error(errText)
      }

      const data = await res.json().catch(() => ({}))
      alert("Investment opportunity saved ✅")
      // optionally show returned id or message
      console.log("Response:", data)
      setForm(DEFAULT)
    } catch (err: unknown) {
  if (err instanceof Error) {
    console.error("Error posting investment:", err);
    alert(`Failed to save: ${err.message}`);
  } else {
    console.error("Error posting investment:", err);
    alert(`Failed to save: ${String(err)}`);
  }
} finally {
  setIsSubmitting(false);
}
  }

  return (
    <section>
           <h1 className="text-2xl py-5 text-center md:text-5xl lg:text-6xl font-bold mb-6">[post tesla investment opportunity]</h1>

      <form onSubmit={submit} className="bg-white/3 rounded-lg p-6 space-y-4">
        <label className="block">
          <div className="text-sm mb-1">Investment name</div>
          <input
            value={form.investmentName}
            onChange={(e) => handleChange("investmentName", e.target.value)}
            placeholder="e.g. Tesla Series A Co-Invest"
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
              <option>Stocks</option>
              <option>ETF</option>
              <option>Project</option>
              <option>Featured</option>
            </select>
          </label>

          <label className="block">
            <div className="text-sm mb-1">Min investment ($)</div>
            <input
              type="number"
              min={0}
              value={form.minInvestment === "" ? "" : String(form.minInvestment)}
              onChange={(e) => handleChange("minInvestment", e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="e.g. 50000"
              className="w-full px-4 py-2 rounded bg-white/5"
            />
          </label>

          <label className="block">
            <div className="text-sm mb-1">Expected return (%)</div>
            <input
              type="number"
              step="0.01"
              value={form.expectedReturn === "" ? "" : String(form.expectedReturn)}
              onChange={(e) => handleChange("expectedReturn", e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="e.g. 18"
              className="w-full px-4 py-2 rounded bg-white/5"
            />
          </label>
        </div>

        <label className="block">
          <div className="text-sm mb-1">Duration</div>
          <input
            value={form.duration}
            onChange={(e) => handleChange("duration", e.target.value)}
            placeholder="e.g. 12 - 24 months"
            className="w-full px-4 py-2 rounded bg-white/5"
          />
        </label>

        <label className="block">
          <div className="text-sm mb-1">Overview</div>
          <textarea
            value={form.overview}
            onChange={(e) => handleChange("overview", e.target.value)}
            placeholder="Short description / pitch"
            className="w-full px-4 py-3 rounded bg-white/5 min-h-[120px]"
          />
        </label>

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

        {/* quick preview */}
        {form.investmentName && (
          <div className="mt-4 p-4 bg-white/2 rounded">
            <div className="font-semibold">Preview</div>
            <div className="text-sm">{form.investmentName} • {form.category} • {form.duration}</div>
            <div className="text-xs mt-2">Min: {form.minInvestment === "" ? "—" : `$${form.minInvestment}`} • Return: {form.expectedReturn === "" ? "—" : `${form.expectedReturn}%`} • Risk: {form.risk}</div>
            <p className="mt-2 text-sm">{form.overview || "No overview yet"}</p>
          </div>
        )}
      </form>
    </section>
  )
}
