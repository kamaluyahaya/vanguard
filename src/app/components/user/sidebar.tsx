"use client"

import React, { JSX, useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from 'next/navigation'
import { usePathname } from "next/navigation"
import {
  LayoutDashboardIcon,
  CreditCard,
  FileText,
  Megaphone,
  Mail,
  User,
  LogOut,
  SendHorizonal,
} from "lucide-react"

type SidebarProps = {
  active?: string
  onChange?: (id: string) => void
  userName?: string
  userEmail?: string
  onLogout?: () => void
}
export default function UserSidebar({
  active: activeProp,
  onChange,
  userName = "Investor",
  userEmail,
  onLogout,
}: SidebarProps): JSX.Element {
  const NAV = [
    { id: "user/dashboard", label: "Dashboard", icon: LayoutDashboardIcon },
    { id: "user/invest-tesla", label: "Invest in Tesla", icon: CreditCard },
    { id: "user/invest-coins", label: "Invest in Coins", icon: FileText },
    // { id: "user/message-dm", label: "Message", icon: MessageCircle },
    { id: "user/notices", label: "Notices", icon: Megaphone },
    { id: "user/support", label: "Support", icon: Mail },
    { id: "user/profile", label: "Profile", icon: User },
  ]

  // map nav ids to routes - update to match your route structure
  const ROUTES: Record<string, string> = {
    "dashboard": "/dashboard",
    "invest-tesla": "/invest/tesla",
    "invest-coins": "/invest/coins",
    // "message-dm": "/message-dm",
    "notices": "/notices",
    "support": "/support",
    "profile": "/profile",
  }

  interface LocalUser {
  full_name?: string
  name?: string
  email?: string
  profile_image?: string
  photo?: string
  [key: string]: any // fallback for extra properties
}

const [localUser, setLocalUser] = useState<LocalUser | null>(null)

  const [profileImage, setProfileImage] = useState<string | null>(null)

  const pathname = usePathname() || "/"
    const router = useRouter()

  // helper: parse JWT payload (handles base64url)
  const parseJwt = (token: string | null) => {
    if (!token) return null
    try {
      const base64Url = token.split(".")[1]
      if (!base64Url) return null
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => {
            return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)
          })
          .join("")
      )
      return JSON.parse(jsonPayload)
    }catch (_e) {
  console.warn("Failed to parse JWT")
      return null
    }
  }

  const isTokenValid = (token: string | null) => {
    if (!token || token.trim() === "") return false
    const payload = parseJwt(token)
    if (!payload || !payload.exp) return false
    const now = Date.now() / 1000
    return payload.exp > now
  }

  const getStoredAuth = () => {
    try {
      const rawAuth = localStorage.getItem("auth")
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

  const doLogout = () => {
    try {
      if (onLogout) {
        onLogout()
        return
      }
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      localStorage.removeItem("auth")
      window.location.href = "/"
    } catch (e) {
      console.error("logout error", e)
      window.location.href = "/"
    }
  }

   useEffect(() => {
    if (typeof window !== "undefined") {
      const rawAuth = localStorage.getItem("auth")
  
      if (!rawAuth) {
        // No auth found, redirect immediately
        router.push("/")
        return
      }
  
      try {
        const parsed = JSON.parse(rawAuth)
        const user = parsed.user
  
        if (!user) {
          // Auth object invalid, redirect
          router.push("/")
          return
        }
  
        // Set admin info if user exists
        // setAdminName(user.full_name || "Admin")
        // setAdminEmail(user.email || "admin@example.com")
      } catch (err) {
        console.warn("Failed to parse admin auth:", err)
        router.push("/")
      }
    }
  }, [router])
 useEffect(() => {
  if (typeof window === "undefined") return;

  const auth = getStoredAuth();
  const token = auth?.token || null;

  // If no token or invalid token, redirect immediately
  if (!isTokenValid(token)) {
    setTimeout(() => doLogout(), 150); // small delay to avoid hydration issues
    return;
  }

  const userFromStorage = auth?.user || null;
  if (userFromStorage) {
    setLocalUser(userFromStorage);
    setProfileImage(userFromStorage.profile_image || userFromStorage.photo || null);
  } else {
    setLocalUser(null);
    setProfileImage(null);
  }

  // Automatically logout when token expires
  const payload = parseJwt(token);
  if (payload && payload.exp) {
    const expiresAtMs = payload.exp * 1000;
    const msUntilExpiry = expiresAtMs - Date.now();
    if (msUntilExpiry > 0) {
      const t = setTimeout(() => doLogout(), msUntilExpiry + 500);
      return () => clearTimeout(t);
    } else {
      doLogout();
    }
  }
}, []); // eslint-disable-line react-hooks/exhaustive-deps
 // eslint-disable-line react-hooks/exhaustive-deps

  const displayName = localUser?.full_name || localUser?.name || userName
  const displayEmail = localUser?.email || userEmail
  const displayImage = profileImage

  // determine active id: prefer prop, otherwise derive from pathname
  const derivedActive = activeProp || Object.keys(ROUTES).find((k) => {
    const r = ROUTES[k]
    // exact match or pathname startsWith (adjust if you want different behavior)
    return pathname === r || pathname.startsWith(r + "/")
  }) || "dashboard"

  return (
    <aside
      className="fixed top-0 left-0 h-screen w-72 z-50 p-6 flex flex-col
             bg-gradient-to-b from-[#0a1a33] to-[#08162b] lg:bg-none
             border-r border-white/6 text-slate-100"
    >
      {/* Brand */}
      <div className="flex items-center gap-3 mb-8">
        <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-slate-700/40 flex-shrink-0">
          <Image src="/logo.jpg" alt="Vanguard" fill sizes="48px" style={{ objectFit: "cover" }} />
        </div>
        <div>
          <div className="font-bold text-lg text-white">Vanguard</div>
          <div className="text-sm text-slate-400">Investor dashboard</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1">
        <ul className="space-y-1">
          {NAV.map((n) => {
            const Icon = n.icon as unknown as React.ComponentType<{ size?: number; className?: string }>
            const path = ROUTES[n.id] || `/${n.id}`
            const isActive = derivedActive === n.id

            return (
              <li key={n.id}>
                <Link
                  href={path}
                  onClick={() => onChange?.(n.id)}
                  aria-current={isActive ? "true" : undefined}
                  className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
                    ${
                      isActive
                        ? "bg-amber-400/10 ring-1 ring-amber-400/20 text-white"
                        : "hover:bg-white/6 text-slate-200"
                    }`}
                >
                  <Icon size={18} className="opacity-90" />
                  <span className="flex-1">{n.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Quick actions */}
      <div className="mt-6 pt-4 border-t border-white/6 text-sm text-slate-300">
        <div className="mb-2 text-slate-200">Quick actions</div>
        <div className="flex flex-col gap-2">
          <a
            href="https://t.me/yourchannel"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 rounded bg-[#229ED9]/20 hover:bg-[#229ED9]/30 text-sm flex items-center gap-2 text-[#229ED9]"
          >
            <SendHorizonal size={14} /> Join Telegram
          </a>
        </div>
      </div>

      {/* User info & logout */}
      <div className="mt-auto pt-6 flex flex-col gap-3 text-sm">
        <div className="flex items-center gap-3">
          {displayImage ? (
            <div className="w-10 h-10 rounded-md overflow-hidden bg-slate-700/10">
              <Image src={displayImage} alt={displayName || "user"} width={40} height={40} style={{ objectFit: "cover" }} />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-md bg-slate-700/30 flex items-center justify-center text-white font-medium">
              {String(displayName || "I").slice(0, 1).toUpperCase()}
            </div>
          )}

          <div className="flex-1">
            <div className="text-white text-sm font-medium truncate">{displayName}</div>
            {displayEmail && <div className="text-xs text-slate-400 truncate">{displayEmail}</div>}
            <div className="text-xs text-slate-500 mt-1">Investor</div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-xs text-slate-500">v1.0 • internal</div>
          <button
            onClick={() => (onLogout ? onLogout() : doLogout())}
            className="flex items-center gap-2 px-3 py-2 rounded bg-white/5 hover:bg-white/6 text-xs"
            aria-label="Logout"
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </div>
    </aside>
  )
}
