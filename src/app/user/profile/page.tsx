"use client";
import Image from "next/image"
import React, { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import UserSidebar from "@/app/components/user/sidebar";
import { useRouter } from "next/navigation";

/*
  User Profile Page with Sidebar
  - Displays user profile fetched from GET /api/customers/:id
  - Allows editing via PUT /api/customers/:id
  - Sidebar is always present (mobile toggle included)
*/

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

type UserProfileShape = {
  user_id: number;
  email: string | null;
  phone: string | null;
  full_name: string | null;
  profile_image: string | null;
  is_active: number;
  created_at: string | null;
  updated_at: string | null;
  firebase_uid?: string | null;
};

export default function UserProfilePage({ userId }: { userId?: number }) {
  const id = userId ?? 1;
  const [user, setUser] = useState<UserProfileShape | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<UserProfileShape>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [active, setActive] = useState("profile");
  const [userName, setUserName] = useState("User");
  const [userEmail, setUserEmail] = useState("");
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${BACKEND}/api/customers/${id}`);
        if (!res.ok) throw new Error(`Failed to load: ${res.status}`);
        const data = await res.json();
        setUser(data);
        setForm({
          email: data.email,
          phone: data.phone ?? "",
          full_name: data.full_name ?? "",
          profile_image: data.profile_image ?? "",
        });
        setUserName(data.full_name || "User");
        setUserEmail(data.email || "");
      } catch (err) {
        console.error(err);
        setMessage("Could not load user profile — check backend URL and network.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleChange = (k: keyof UserProfileShape, v: string) => {
    setForm((s) => ({ ...s, [k]: v }));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setMessage(null);
    const payload: Partial<UserProfileShape> = {
      email: form.email ?? user.email,
      phone: form.phone ?? user.phone,
      full_name: form.full_name ?? user.full_name,
      profile_image: form.profile_image ?? user.profile_image,
    };

    try {
      const res = await fetch(`${BACKEND}/api/customers/${user.user_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`${res.status} ${errText}`);
      }
      const updated = await res.json();
      setUser(updated);
      setEditing(false);
      setMessage("Profile updated successfully.");
    } catch (err: any) {
      console.error(err);
      setMessage("Failed to save profile. Check console for details.");
    } finally {
      setSaving(false);
    }
  };

  const handleNavChange = (id: string) => {
    if (id === "logout") {
      localStorage.removeItem("user");
      router.push("/login");
    } else {
      setActive(id);
    }
    setSidebarOpen(false);
  };

  return (
    <div className="flex min-h-screen text-slate-100 antialiased">
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
         <h1 className="text-4xl py-5 text-center md:text-5xl lg:text-6xl font-bold mb-6">[profile]</h1>
        {loading && <div>Loading profile…</div>}
        {!loading && user && (
          <div className="container mx-auto p-6">
            <div className="bg-white/5 backdrop-blur rounded-2xl p-6 shadow-2xl border border-white/8">
              <div className="flex items-center gap-6">
               <Image
  src={user?.profile_image || "/placeholder-avatar.png"}
  alt={user?.full_name || "User avatar"}
  width={112} // 28 * 4px (Tailwind's w-28 = 7rem = 112px)
  height={112} // same as width to keep it square
  className="rounded-full object-cover ring-1 ring-white/10"
/>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-semibold">{user.full_name}</h2>
                      <p className="text-sm text-slate-300 mt-1">{user.email}</p>
                      <p className="text-xs text-slate-500 mt-2">Joined: {new Date(user.created_at ?? "").toLocaleString()}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${user.is_active ? "bg-emerald-700/30 text-emerald-200" : "bg-rose-700/20 text-rose-200"}`}>
                        {user.is_active ? "Active" : "Inactive"}
                      </span>

                      <button
                        onClick={() => setEditing((s) => !s)}
                        className="px-3 py-2 rounded-xl bg-white/6 hover:bg-white/8 text-sm"
                      >
                        {editing ? "Cancel" : "Edit"}
                      </button>
                    </div>
                  </div>

                  {message && <div className="mt-4 text-sm text-slate-200">{message}</div>}

                  {editing && (
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-slate-400">Full name</label>
                        <input
                          value={form.full_name ?? ""}
                          onChange={(e) => handleChange("full_name", e.target.value)}
                          className="mt-1 w-full rounded-xl p-3 bg-white/3 outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-slate-400">Email</label>
                        <input
                          value={form.email ?? ""}
                          onChange={(e) => handleChange("email", e.target.value)}
                          className="mt-1 w-full rounded-xl p-3 bg-white/3 outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-slate-400">Phone</label>
                        <input
                          value={form.phone ?? ""}
                          onChange={(e) => handleChange("phone", e.target.value)}
                          className="mt-1 w-full rounded-xl p-3 bg-white/3 outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-slate-400">Profile image URL</label>
                        <input
                          value={form.profile_image ?? ""}
                          onChange={(e) => handleChange("profile_image", e.target.value)}
                          className="mt-1 w-full rounded-xl p-3 bg-white/3 outline-none"
                        />
                      </div>

                      <div className="md:col-span-2 flex items-center gap-3 mt-2">
                        <button
                          onClick={handleSave}
                          disabled={saving}
                          className="px-4 py-2 rounded-2xl bg-white/8 hover:bg-white/12 active:scale-95"
                        >
                          {saving ? "Saving…" : "Save changes"}
                        </button>

                        <button
                          onClick={() => setEditing(false)}
                          className="px-4 py-2 rounded-2xl bg-transparent border border-white/6"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {!editing && (
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-300">
                      <div>
                        <div className="text-xs text-slate-400">Phone</div>
                        <div className="mt-1">{user.phone ?? "—"}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400">Firebase UID</div>
                        <div className="mt-1 break-words text-xs text-slate-300">{user.firebase_uid ?? "—"}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400">Last updated</div>
                        <div className="mt-1">{user.updated_at ? new Date(user.updated_at).toLocaleString() : "—"}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}