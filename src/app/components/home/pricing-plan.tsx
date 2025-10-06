import React, { useState } from "react";
import { motion } from "framer-motion";

// Pricing plans tailored to two investment products: Coins and Tesla
// Apple-like UI: clean cards, subtle shadows, accessible controls.

const PLANS_BY_ASSET = {
  coins: [
    {
      id: "free",
      title: "Free Plan",
      price: "0.00",
      billing: "/Month",
      bullets: [
        "Market watchlists for top tokens",
        "1000+ influencer & whale wallet tracking",
        "Web App Access",
        "Public Telegram Group",
      ],
      cta: "Get Free",
      accent: false,
    },
    {
      id: "basic",
      title: "Basic",
      price: "50.00",
      billing: "/Month",
      bullets: [
        "Everything from Free",
        "Token search & on-chain history",
        "Trader profiles & social signals",
        "Advanced filters & sorting",
        "General Telegram Alerts",
        "AI summaries for token trends",
      ],
      cta: "Start Basic",
      accent: false,
    },
    {
      id: "premium",
      title: "Premium",
      price: "150.00",
      billing: "/Month",
      bullets: [
        "* Annual Plan (20% off)",
        "Priority alerts for new token listings & whale moves",
        "Unlimited access to token analytics",
        "Deep on-chain reports & alerts",
        "Private Telegram group for crypto alerts",
        "Priority support & early feature access",
      ],
      cta: "Try Premium",
      accent: true,
    },
  ],

  tesla: [
    {
      id: "free",
      title: "Free Plan",
      price: "0.00",
      billing: "/Month",
      bullets: [
        "Basic Tesla news & sentiment feed",
        "Weekly market insights",
        "Web App Access",
        "Public Telegram Group",
      ],
      cta: "Get Free",
      accent: false,
    },
    {
      id: "basic",
      title: "Basic",
      price: "100.00",
      billing: "/Month",
      bullets: [
        "Everything from Free",
        "Intraday Tesla alerts & trend signals",
        "Trader profiles focused on equities",
        "Advanced filters & sorting",
        "General Telegram alerts",
        "AI-driven YouTube & news summaries",
      ],
      cta: "Start Basic",
      accent: false,
    },
    {
      id: "premium",
      title: "Premium",
      price: "250.00",
      billing: "/Month",
      bullets: [
        "* Annual Plan (20% off)",
        "Priority alerts for institutional moves & filings",
        "Full equity research dashboard",
        "Private Telegram group for Tesla investors",
        "Early feature access & priority support",
      ],
      cta: "Try Premium",
      accent: true,
    },
  ],
};

export default function PricingPlansByAsset() {
  const [asset, setAsset] = useState<"coins" | "tesla">("coins");

  const plans = PLANS_BY_ASSET[asset];

  return (
    <section className="rounded-2xl p-6 bg-gradient-to-br from-white/3 via-white/2 to-white/1">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">[ pricing plans ]</h2>
          <p className="text-sm text-slate-300 mt-2">Select an investment product to view tailored plans.</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Asset toggle */}
          <div className="inline-flex rounded-xl p-1 bg-white/6">
            <button
              onClick={() => setAsset("coins")}
              className={`px-3 py-2 rounded-lg text-sm font-medium ${asset === "coins" ? "bg-white/9 text-white shadow-sm" : "text-slate-300"}`}
              aria-pressed={asset === "coins"}
            >
              Coins
            </button>
            <button
              onClick={() => setAsset("tesla")}
              className={`px-3 py-2 rounded-lg text-sm font-medium ${asset === "tesla" ? "bg-white/9 text-white shadow-sm" : "text-slate-300"}`}
              aria-pressed={asset === "tesla"}
            >
              Tesla
            </button>
          </div>

          <div className="text-sm text-amber-300">7-Day Money-Back Guarantee</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((p) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28 }}
            className={`relative rounded-2xl p-6 border border-white/6 bg-white/4 shadow-md ${p.accent ? "ring-2 ring-amber-300" : ""}`}
          >
            {p.accent && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="inline-block bg-amber-300 text-black text-xs font-semibold px-3 py-1 rounded-full">Most popular</span>
              </div>
            )}

            <div className="mt-4">
              <div className="flex items-baseline justify-between">
                <h3 className="text-xl font-semibold text-white">{p.title}</h3>
                <div className="text-sm text-slate-300">{p.billing}</div>
              </div>

              <div className="mt-4 flex items-end gap-2">
                <div className="text-4xl md:text-5xl font-extrabold text-white">${p.price}</div>
                <div className="text-sm text-slate-300">{p.billing}</div>
              </div>

              <ul className="mt-6 space-y-3 text-sm text-slate-200">
                {p.bullets.map((b, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="mt-1 inline-flex h-3 w-3 items-center justify-center rounded-full bg-white/10 text-xs">✓</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6">
                <button
                  className={`w-full py-3 rounded-lg font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400 ${p.accent ? "bg-amber-400 text-black" : "bg-white/6 text-white"}`}
                >
                  {p.cta}
                </button>
              </div>

              <div className="mt-4 text-xs text-slate-400">
                {p.id === "premium" ? (
                  <>
                    <strong className="text-slate-100">Risk-free:</strong> Try any plan risk-free for 7 days — full refund if not satisfied.
                  </>
                ) : (
                  <>7-day money-back guarantee on all paid plans.</>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 text-sm text-slate-300">Not thrilled? Get a full refund, no questions asked. Join now and unlock game-changing insights for {asset === "coins" ? "crypto tokens" : "Tesla equity"} with zero risk!</div>
    </section>
  );
}
