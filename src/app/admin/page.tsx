"use client"

import React, { useEffect, useState } from "react"
import { X, Menu } from "lucide-react"
import AdminDashboard from "./dashboard/page"
import ClientsPanel from "./client/page"
import ManagementClientsPanel from "./manage-client/page"
import PostCoinsPanel from "./coins/page"
import PostTeslaPanel from "./tesla/page"
import ManageInvestmentsPanel from "./manage-investment/page"
import ContactsPanel from "./contact/page"
import PostNoticePanel from "./notice/page"
import ProfilePanel from "./profile/page"
import EnrollStaffPanel from "./staff/page"
import StaffPanel from "./staff-record/page"
import Sidebar from "../components/admin/sidebar"
import { useRouter } from "next/navigation"
import ChangePasswordPage from "./password/page"

const PANELS: Record<string, React.ReactNode> = {
  dashboard: <AdminDashboard />,
  clients: <ClientsPanel />,
  "management-clients": <ManagementClientsPanel />,
  "management-staff": <StaffPanel />,
  "post-tesla": <PostTeslaPanel />,
  "post-coins": <PostCoinsPanel />,
  "manage-investments": <ManageInvestmentsPanel />,
  "post-notice": <PostNoticePanel />,
  "password": <ChangePasswordPage />,
  contacts: <ContactsPanel />,
  profile: <ProfilePanel />,
  "enroll-staff": <EnrollStaffPanel />,
}

export default function AdminPage(): React.ReactElement {
  const [active, setActive] = useState<string>("dashboard")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userName, setUserName] = useState("Admin")

  const router = useRouter()

  // Close drawer on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setSidebarOpen(false)
    }
    if (sidebarOpen) window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [sidebarOpen])

  // Load logged-in admin details from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const rawAuth = localStorage.getItem("auth") || localStorage.getItem("user")
      if (rawAuth) {
        try {
          const parsed = JSON.parse(rawAuth)
          // If auth object has a user
          const user = parsed.user || parsed
          if (user) {
            setUserName(user.full_name || user.name || "Admin")
          }
        } catch (e) {
          console.warn("Failed to parse stored user:", e)
        }
      }
    }
  }, [])

  return (
    <div className="min-h-screen text-slate-100 antialiased flex">
      {/* Mobile toggle button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setSidebarOpen((s) => !s)}
          className="p-2 rounded-lg bg-white/6 backdrop-blur text-slate-100"
          aria-label="Toggle menu"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-screen w-72 z-40 transform transition-transform duration-200
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 md:static md:h-auto
        `}
      >
        <Sidebar
          active={active}
          onChange={(id) => {
            setActive(id)
            setSidebarOpen(false)
          }}
         
        />
      </aside>

      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
        />
      )}

      <main className="flex-1 p-6 transition-all duration-300 md:ml-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Staff</h2>
          <div className="flex items-center gap-3">
            <div className="text-sm text-slate-400">Welcome back, {userName}</div>
          </div>
        </div>

        <div className="space-y-6">{PANELS[active]}</div>
      </main>
    </div>
  )
}
