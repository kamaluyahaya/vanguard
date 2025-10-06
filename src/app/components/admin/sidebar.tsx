"use client"

import React, { JSX, useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { PlusSquare, Users, LayoutDashboardIcon, FileText, Megaphone, Mail, User,Lock, CreditCard, Settings, LogOut } from 'lucide-react'

type SidebarProps = { active: string; onChange: (id: string) => void }

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboardIcon },
  { id: 'clients', label: 'Clients', icon: Users },
  { id: 'enroll-staff', label: 'Enroll Staff', icon: PlusSquare },
  { id: 'post-tesla', label: 'Post Tesla Investment', icon: CreditCard },
  { id: 'post-coins', label: 'Post Coins Investment', icon: FileText },
  { id: 'manage-investments', label: 'Manage Investments', icon: Settings },
  { id: 'management-staff', label: 'Management Staff', icon: Users },
  { id: 'management-clients', label: 'Management Clients', icon: Users },
  { id: 'post-notice', label: 'Post Notice', icon: Megaphone },
  { id: 'contacts', label: 'Contact Messages', icon: Mail },
  { id: 'password', label: 'Change password', icon: Lock },
  { id: 'profile', label: 'Profile', icon: User },
]

export default function Sidebar({ active, onChange }: SidebarProps): JSX.Element {
  const router = useRouter()
  const [adminName, setAdminName] = useState("Admin")
  const [adminEmail, setAdminEmail] = useState("admin@example.com")

  // Load admin info from localStorage
  useEffect(() => {
  if (typeof window !== "undefined") {
    const rawAuth = localStorage.getItem("auth")

    if (!rawAuth) {
      // No auth found, redirect immediately
      router.push("/admin/login")
      return
    }

    try {
      const parsed = JSON.parse(rawAuth)
      const user = parsed.user

      if (!user) {
        // Auth object invalid, redirect
        router.push("/admin/login")
        return
      }

      // Set admin info if user exists
      setAdminName(user.full_name || "Admin")
      setAdminEmail(user.email || "admin@example.com")
    } catch (err) {
      console.warn("Failed to parse admin auth:", err)
      router.push("/admin/login")
    }
  }
}, [router])


  const handleLogout = () => {
    localStorage.removeItem("auth")
    router.push("/admin/login") // redirect to admin login
  }

  return (
    <aside className="w-72 border-white/6 p-6 flex flex-col bg-gradient-to-b from-[#0a1a33] to-[#08162b] lg:bg-none
             border-r">
      <div className="flex items-center gap-3 mb-8">
        <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-slate-700/40">
          <Image src="/logo.jpg" alt="logo" fill sizes="48px" style={{ objectFit: 'cover' }} />
        </div>
        <div>
          <div className="font-bold text-lg">{adminName}</div>
          <div className="text-sm text-slate-400">{adminEmail}</div>
        </div>
      </div>

      <nav className="flex-1">
        <ul className="space-y-1">
          {NAV.map((n) => (
            <li key={n.id}>
              <button
                onClick={() => onChange(n.id)}
                className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-white/6 ${
                  active === n.id ? 'bg-amber-400/10 ring-1 ring-amber-400/20' : ''
                }`}
              >
                <n.icon size={18} className="opacity-90" />
                <span className="flex-1">{n.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-6 pt-4 border-t border-white/6 text-sm text-slate-400">
        <div className="mb-2">Quick actions</div>
        <div className="flex flex-col gap-2">
          <button onClick={() => onChange('post-coins')} className="px-3 py-2 rounded bg-white/5">New Coins Post</button>
          <button onClick={() => onChange('post-tesla')} className="px-3 py-2 rounded bg-white/5">New Tesla Post</button>
        </div>
      </div>

      {/* Logout button */}
      <div className="mt-auto pt-6 border-t border-white/6">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded bg-red-600 hover:bg-red-700 text-white text-sm font-medium"
        >
          <LogOut size={16} />
          Logout
        </button>
        <div className="mt-2 text-xs text-slate-500">v1.0 • internal</div>
      </div>
    </aside>
  )
}
