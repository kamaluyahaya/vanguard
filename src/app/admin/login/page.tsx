"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback("");

    try {
      const res = await fetch(`${BACKEND}/api/auth/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setFeedback(data.message || "❌ Invalid credentials");
        return;
      }

      // Save token and user info in localStorage
      localStorage.setItem("auth", JSON.stringify({ token: data.data.token, user: data.data.user }));
      console.log(data.data.user)

      setFeedback("✅ Login successful!");
      setEmail("");
      setPassword("");

      // Redirect to admin dashboard
      router.push("/admin");
    } catch (err) {
      console.error(err);
      setFeedback("❌ Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen text-white">
      <div className="bg-white/5 p-8 rounded-xl w-full max-w-md border border-white/10 shadow-lg">
        <h1 className="text-3xl font-bold mb-6 text-center">Admin Login</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10 focus:ring-2 focus:ring-amber-400 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10 focus:ring-2 focus:ring-amber-400 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 font-semibold"
          >
            {loading && <Loader2 className="animate-spin w-4 h-4" />}
            {loading ? "Logging in..." : "Login"}
          </button>

          {feedback && <p className="text-sm mt-2 text-center">{feedback}</p>}
        </form>
      </div>
    </div>
  );
}
