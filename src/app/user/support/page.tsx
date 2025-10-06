"use client";

import { useEffect, useState } from "react";
import { Loader2, Menu, X } from "lucide-react";
import UserSidebar from "@/app/components/user/sidebar";
import { useRouter } from "next/navigation";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export default function SupportPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [active, setActive] = useState("support");

  const [userName, setUserName] = useState("Investor");
  const [userEmail, setUserEmail] = useState("");

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");

  const router = useRouter();

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

  

  // Load user from localStorage once
  useEffect(() => {
    
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("user");
      if (saved) {
        const parsed = JSON.parse(saved);
        setUserName(parsed?.name || "Investor");
        setUserEmail(parsed?.email || "");
      }
    }
  }, []);

  const handleNavChange = (id: string) => {
    
    if (id === "logout") {
      localStorage.removeItem("user");
      router.push("/");
    } else {
      setActive(id);
      // add routing logic if needed
    }
    setSidebarOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
        const auth = getStoredAuth()
    const user_id = auth?.user.id || null
    e.preventDefault();
    if (!user_id) {
        
      setFeedback(`❌ User not found. Please login again. ${user_id}`);
      return;
    }

    setLoading(true);
    setFeedback("");

    try {
      const res = await fetch(`${BACKEND}/api/support`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user_id, // now sending the correct user_id
          subject,
          message,
        }),
      });

      if (!res.ok) throw new Error("Failed to send complaint");

      setFeedback("✅ Your complaint has been submitted successfully.");
      setSubject("");
      setMessage("");
    } catch (err) {
      setFeedback("❌ Failed to send complaint. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="flex min-h-screen text-slate-100 antialiased">
      {/* Mobile sidebar toggle */}
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
        <h1 className="text-4xl py-5 text-center md:text-5xl lg:text-6xl font-bold mb-6 font-bold mb-6">
        [support center]
        </h1>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 container bg-white/5 p-6 rounded-xl border border-white/10"
        >
          <div>
            <label className="block text-sm font-medium mb-1">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white focus:ring-2 focus:ring-amber-400 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={5}
              className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white focus:ring-2 focus:ring-amber-400 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-2"
          >
            {loading && <Loader2 className="animate-spin w-4 h-4" />}
            {loading ? "Sending..." : "Submit Complaint"}
          </button>

          {feedback && <p className="text-sm mt-2">{feedback}</p>}
        </form>
      </main>
    </div>
  );
}
