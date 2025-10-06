"use client";

import { useEffect, useState } from "react";
import { Loader2, Menu, X } from "lucide-react";
import UserSidebar from "@/app/components/user/sidebar";
import { useRouter } from "next/navigation";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

interface Notice {
  notice_id: number;
  title: string;
  content: string;
  created_at: string;
}

export default function NoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [active, setActive] = useState("notices");
  const [userName, setUserName] = useState("Investor");
  const [userEmail, setUserEmail] = useState("");

  const router = useRouter();

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const res = await fetch(`${BACKEND}/api/notices/`);
        const data = await res.json();
        setNotices(data);
      } catch (error) {
        console.error("Failed to fetch notices:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotices();
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedUser = localStorage.getItem("user");
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        setUserName(parsed?.name || "Investor");
        setUserEmail(parsed?.email || "");
      }
    }
  }, []);

  const handleNavChange = (id: string) => {
    if (id === "logout") {
      localStorage.removeItem("user");
      router.push("/login");
    } else {
      setActive(id);
      // you could add navigation logic here if needed
    }
    setSidebarOpen(false);
  };

  return (
    <div className="flex min-h-screen  text-slate-100 antialiased">
      {/* Sidebar toggle for mobile */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setSidebarOpen((s) => !s)}
          className="p-2 rounded-lg bg-white/6 backdrop-blur text-slate-100"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen w-72 z-40 transform transition-transform duration-200
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} 
          md:translate-x-0`}
      >
        <UserSidebar
                  active={active}
                  onChange={handleNavChange}
                  userName={userName}
                  userEmail={userEmail}
                  onLogout={() => {
                    localStorage.removeItem("user");
                    localStorage.removeItem("token");
                    localStorage.removeItem("auth");
                    router.push("/");
                  }}
                />
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
        />
      )}

      {/* Main content */}
      <main className="flex-1 p-6 md:ml-72">
        <h1 className="text-4xl py-5 text-center md:text-5xl lg:text-6xl font-bold mb-6">[notices]</h1>

        {loading ? (
          <div className="flex items-center gap-2 text-slate-400">
            <Loader2 className="animate-spin" /> Loading notices...
          </div>
        ) : notices.length === 0 ? (
          <div className="text-slate-400">No notices available.</div>
        ) : (
          <div className="space-y-4">
            {notices.map((notice) => (
              <div
                key={notice.notice_id}
                className="p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition"
              >
                <h2 className="text-lg font-semibold text-white">
                  {notice.title}
                </h2>
                <p className="text-slate-300 mt-1">{notice.content}</p>
                <div className="text-xs text-slate-500 mt-2">
                  {new Date(notice.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
