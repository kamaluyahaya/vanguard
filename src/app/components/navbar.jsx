'use client'

import Link from 'next/link'
import Image from "next/image"
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import SignupModal from "../components/modal/signup";

const NAV = [
  { label: 'Home', href: '/' },
  { label: 'Review', href: '/#services' },
  { label: 'Investment Plans', href: '/#plans' },
  { label: 'How to Invest', href: '/#how' },
  { label: 'FAQ', href: '/#team' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [openSignup, setSignupOpen] = useState(false)
  const [active, setActive] = useState('/') // stores pathname + hash when available

  // Keep the active link in sync with location (runs client-side only)
  useEffect(() => {
    const updateActive = () => {
      try {
        const p = window.location.pathname || '/'
        const h = window.location.hash || ''
        setActive(p + h)
      } catch {
        setActive('/')
      }
    }
    updateActive()
    window.addEventListener('hashchange', updateActive)
    window.addEventListener('popstate', updateActive)
    return () => {
      window.removeEventListener('hashchange', updateActive)
      window.removeEventListener('popstate', updateActive)
    }
  }, [])

  // Prevent body scroll when mobile nav is open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  // Close on Escape for mobile nav
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const isActive = (href) => {
    if (!href) return false
    if (href.includes('#')) return active === href
    return active === href || active.startsWith(href)
  }

  return(
  <>
      <button
  onClick={() => setSignupOpen(true)}
  className="fixed right-4 top-5 z-[60] hidden md:inline-flex items-center gap-2 px-6 py-2 rounded-full shadow-lg bg-amber-400 text-black font-semibold hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-amber-300 transition"
  aria-label="Join now"
>
  Join now
</button>

      {/* Make header fixed & full width so nav doesn't get hidden/overlapped */}
     <header className="relative w-full bg-transparent z-10">
  <div className="container mx-auto px-6 py-4 flex items-center justify-between">
    <div className="flex items-center justify-between w-full gap-4">
     {/* Brand */}
           <div className="flex items-center gap-3 mb-8">
             <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-slate-700/40 flex-shrink-0">
               <Image
                 src="/logo.jpg"
                 alt="Vanguard"
                 fill
                 sizes="48px"
                 style={{ objectFit: "cover" }}
               />
             </div>
             <div>
               <div className="font-bold text-lg text-white">Vanguard</div>
               <div className="text-xs text-slate-500 -mt-0.5">Coins · Tesla · Picks</div>
             </div>
           </div>
      {/* Center: Nav capsule (shows from md and up) */}
      <nav className="hidden md:inline-flex items-center justify-center flex-1">
        <div className="inline-flex items-center rounded-full bg-white/6 p-1">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setActive(n.href)}
              className={`px-4 py-2 text-sm rounded-full select-none transition inline-flex items-center justify-center whitespace-nowrap
                ${isActive(n.href)
                  ? 'bg-white/10 text-white font-medium shadow-sm'
                  : 'text-white/80 hover:bg-white/6 hover:text-white'}`}
              aria-current={isActive(n.href) ? 'page' : undefined}
            >
              {n.label}
            </Link>
          ))}
        </div>
      </nav>

            {/* Mobile toggle — unchanged */}
           <div className="md:hidden flex items-center">
              {/* small vertical divider so users notice 'there's something there' */}
              <div className="h-6 w-px bg-white/20 mr-3" aria-hidden="true" />

              <button
                onClick={() => setOpen((v) => !v)}
                aria-label={open ? 'Close menu' : 'Open menu'}
                aria-expanded={open}
                className="p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-300"
              >
                {/* vertical kebab / three vertical dots — clear mobile menu indicator */}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white/90">
                  <rect x="11" y="4" width="2" height="2" rx="1" fill="currentColor" />
                  <rect x="11" y="11" width="2" height="2" rx="1" fill="currentColor" />
                  <rect x="11" y="18" width="2" height="2" rx="1" fill="currentColor" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile sliding menu (full screen cover) */}
        <AnimatePresence>
  {open && (
    <>
      {/* Backdrop */}
      
      {/* Backdrop — fixed and below the panel */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.35 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        onClick={() => setOpen(false)}
        className="fixed inset-0 z-40 bg-black"
        aria-hidden
      />

      {/* Sliding panel: fixed, above backdrop */}
      <motion.nav
        key="panel"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'tween', duration: 0.28, ease: 'easeInOut' }}
        className="fixed inset-0 z-50 w-full sm:w-[420px] bg-white shadow-2xl overflow-auto h-screen flex flex-col"
        aria-label="Mobile menu"
      >
        {/* Top: brand + close */}
        <div className="px-6  py-5 flex items-center justify-between border-b">
         {/* Brand */}
           <div className="flex items-center gap-3 mb-8">
             <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-slate-700/40 flex-shrink-0">
               <Image
                 src="/logo.jpg"
                 alt="Vanguard"
                 fill
                 sizes="48px"
                 style={{ objectFit: "cover" }}
               />
             </div>
             <div>
               <div className="font-bold text-lg text-slate-700">Vanguard</div>
                 <div className="text-xs text-slate-500 -mt-0.5">Coins · Tesla · Picks</div>
             </div>
           </div>

          <button
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-300"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M6 18L18 6M6 6l12 12" stroke="#0f172a" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Main nav area: fills remaining height and centers links */}
        <div className="flex flex-col items-center justify-center ">
          <div className="w-full max-w-md">
            {NAV.map((n) => (
              <a
                key={n.href}
                href={n.href}
                onClick={() => {
                  setOpen(false)
                  setActive(n.href)
                }}
                className="block w-full text-center text-2xl sm:text-xl font-semibold text-slate-900 py-6 border-b border-slate-100 hover:bg-slate-50 rounded-lg"
              >
                {n.label}
              </a>
            ))}

            <div className="mt-6 px-6">
              <Link
                href=""
                onClick={() => {
                  setOpen(false)
                  setSignupOpen(true)
                }}
                className="block w-full text-center px-4 py-4 rounded-full bg-amber-400 text-black font-semibold shadow-lg"
              >
                Join now
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 text-sm text-slate-500  pt-14">
          <p className="mb-1">Try any paid plan risk-free for 7 days. Cancel anytime.</p>
          <p className="text-xs">Support: support@Vanguardxhub.com</p>
        </div>
      </motion.nav>
    </>
  )}
</AnimatePresence>
      </header>

      {/* Signup modal */}
      <SignupModal isOpen={openSignup} onClose={() => setSignupOpen(false)} />
    </>
  )
}
