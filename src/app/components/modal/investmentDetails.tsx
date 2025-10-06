"use client"

import React, { useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"

type InvRaw = {
  investment_name?: string;
  coin_name?: string;
  overview?: string | number;
};

type Inv = {
  id: string;
  source: "tesla" | "coin";
  name: string;
  slug?: string;
  category?: string;
  min_investment?: string | number | null;
  expected_return?: string | number | null;
  price?: string | number | null;
  market_cap?: string | number | null;
  duration?: string | null;
  hours?: number | null;
  risk?: string | null;
  is_featured?: number | boolean;
  created_at?: string | null;
  raw?: InvRaw | null;
};

interface Props {
  isOpen: boolean
  onClose: () => void
  inv?: Inv | null
}

/**
 * Uses NEXT_PUBLIC_TELEGRAM_USERNAME and NEXT_PUBLIC_TELEGRAM_CHANNEL env vars (set in .env.local)
 * - NEXT_PUBLIC_TELEGRAM_USERNAME : the bot or support handle (e.g. "ksoft_support")
 * - NEXT_PUBLIC_TELEGRAM_CHANNEL  : channel or group link (e.g. "https://t.me/joinchat/AAAA...") or "https://t.me/yourchannel"
 */
export default function InvestmentDetailModal({ isOpen, onClose, inv }: Props) {
  const TELEGRAM_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_USERNAME || ""
  const TELEGRAM_CHANNEL = process.env.NEXT_PUBLIC_TELEGRAM_CHANNEL || ""
  const supportHandle = TELEGRAM_USERNAME.replace(/^@/, "")

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  if (!isOpen || !inv) return null

  const title = inv.name || (inv.raw?.investment_name || inv.raw?.coin_name) || "Investment"
  const overview = (inv.raw?.overview || "").toString()
  const createdAt = inv.created_at ? new Date(inv.created_at).toLocaleString() : "—"

  // create telegram chat link with prefilled text
  const prefill = encodeURIComponent(
    `Hi, I'm interested in "${title}" (${inv.source}). Please share more details.`
  )
  const telegramChatLink = supportHandle ? `https://t.me/${supportHandle}?text=${prefill}` : ""
  const mailtoLink = `mailto:hello@yourcompany.com?subject=${encodeURIComponent(
    `Interest: ${title}`
  )}&body=${encodeURIComponent(`Hi,\n\nI'm interested in ${title}.\n\nPlease send details.\n\nThanks.`)}`

  const openSupport = () => {
    if (telegramChatLink) {
      window.open(telegramChatLink, "_blank")
    } else {
      // fallback to mailto
      window.open(mailtoLink, "_blank")
    }
  }

  const openViewTelegram = () => {
    if (TELEGRAM_CHANNEL) {
      window.open(TELEGRAM_CHANNEL, "_blank")
    } else if (supportHandle) {
      window.open(`https://t.me/${supportHandle}`, "_blank")
    } else {
      // fallback: copy link (or mail)
      navigator.clipboard?.writeText(mailtoLink)
      alert("No Telegram configured — mailto link copied to clipboard.")
    }
  }

  const joinChannel = () => {
    if (TELEGRAM_CHANNEL) {
      window.open(TELEGRAM_CHANNEL, "_blank")
    } else {
      alert("Telegram channel not configured. Please set NEXT_PUBLIC_TELEGRAM_CHANNEL.")
    }
  }

  return (
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
  <button
    aria-label="Close"
    onClick={onClose}
    className="absolute right-6 top-6 w-9 h-9 rounded-full bg-amber-500 text-black flex items-center justify-center hover:bg-amber-400 transition"
  >
    <X size={20} />
  </button>

          <header className="mb-4">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-lg bg-white/6 flex items-center justify-center text-xl font-semibold">
                {inv.source === "tesla" ? "F" : "C"}
              </div>
              <div>
                <h3 className="text-2xl font-semibold">{title}</h3>
                <div className="text-sm text-slate-300 mt-1">
                  {inv.category || "—"} • {inv.source.toUpperCase()} • {createdAt}
                </div>
              </div>
            </div>
          </header>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <h4 className="text-sm text-slate-300 mb-2">Overview</h4>
              <p className="text-sm text-slate-100 leading-relaxed">{overview || "No description available."}</p>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                {/* left */}
                <div className="space-y-2">
                  <div>
                    <div className="text-xs text-slate-400">Type</div>
                    <div className="text-sm">{inv.source}</div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-400">Duration / Hours</div>
                    <div className="text-sm">{inv.duration ?? (inv.hours ? `${inv.hours} hrs` : "—")}</div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-400">Risk</div>
                    <div className="text-sm">{inv.risk ?? "—"}</div>
                  </div>
                </div>

                {/* right */}
                <div className="space-y-2">
                  <div>
                    <div className="text-xs text-slate-400">Price / Min Investment</div>
                    <div className="text-sm">{inv.source === "tesla" ? (inv.min_investment ?? "—") : (inv.price ?? "—")}</div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-400">Return / Market Cap</div>
                    <div className="text-sm">{inv.source === "tesla" ? `${inv.expected_return ?? "—"}%` : (inv.market_cap ?? "—")}</div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-400">Created</div>
                    <div className="text-sm">{createdAt}</div>
                  </div>
                </div>
              </div>
            </div>

            <aside className="space-y-4 p-3 rounded-lg bg-white/3 h-fit">
              <div>
                <div className="text-sm text-slate-300 mb-2">Get in touch</div>

                <button
                  onClick={openSupport}
                  className="w-full py-2 rounded-xl font-semibold bg-gradient-to-r from-orange-500 to-indigo-600 text-white mb-2"
                >
                  Invest NOW
                </button>

                <button
                  onClick={openViewTelegram}
                  className="w-full py-2 rounded-xl font-semibold bg-white text-slate-900 mb-2"
                >
                  View on Telegram
                </button>

                <button
                  onClick={joinChannel}
                  className="w-full py-2 rounded-xl font-semibold border border-white/10 text-white"
                >
                  Join our Telegram channel
                </button>
              </div>

              {/* <div className="text-xs text-slate-300">
                <strong>Note:</strong> Telegram links are configurable using environment variables:<br />
                <code className="text-xs bg-white/6 px-1 rounded">NEXT_PUBLIC_TELEGRAM_USERNAME</code> and <code className="text-xs bg-white/6 px-1 rounded">NEXT_PUBLIC_TELEGRAM_CHANNEL</code>
              </div> */}
            </aside>
          </section>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
