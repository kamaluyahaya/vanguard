"use client"

import { useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, TrendingUp, DollarSign, Calendar } from "lucide-react"

interface TeslaInvestmentModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function TeslaInvestmentModal({ isOpen, onClose }: TeslaInvestmentModalProps) {
  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <motion.div
            className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-8 relative"
            initial={{ y: 60, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 250, damping: 22 }}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-black text-white hover:bg-slate-800 transition"
            >
              <X size={16} />
            </button>

            {/* Header */}
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight mb-2">
              Tesla Investment Opportunity 🚘⚡
            </h2>
            <p className="text-slate-500 mb-6">
              Get exclusive access to Tesla stock–linked investment plans and maximize your portfolio growth.
            </p>

            {/* Investment details */}
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <TrendingUp className="text-green-500" />
                <span className="text-slate-800 font-medium">
                  Expected ROI: <span className="font-semibold">15–25% annually</span>
                </span>
              </div>
              <div className="flex items-center gap-3">
                <DollarSign className="text-blue-500" />
                <span className="text-slate-800 font-medium">
                  Minimum Investment: <span className="font-semibold">$1,000</span>
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="text-amber-500" />
                <span className="text-slate-800 font-medium">
                  Duration: <span className="font-semibold">6–12 months lock-in</span>
                </span>
              </div>
            </div>

            {/* CTA buttons */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => alert("Proceeding to Invest...")}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-semibold shadow hover:from-sky-700 hover:to-indigo-700 transition"
              >
                Invest Now
              </button>
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gray-100 text-slate-700 font-medium hover:bg-gray-200 transition"
              >
                Maybe Later
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
