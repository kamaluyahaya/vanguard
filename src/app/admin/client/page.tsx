"use client"

import React, { JSX, useState } from "react"
import { toast } from "sonner"

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000"

export default function CreateCustomerForm(): JSX.Element {
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [fullName, setFullName] = useState("")
  const [password, setPassword] = useState("")
  const [profileImage, setProfileImage] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!email.trim() || !phone.trim() || !fullName.trim() || !password.trim()) {
      toast.error("Please fill all required fields")
      return
    }

    const formData = new FormData()
    formData.append("email", email.trim())
    formData.append("phone", phone.trim())
    formData.append("full_name", fullName.trim())
    formData.append("password", password.trim())
    if (profileImage) formData.append("profile_image", profileImage)

    setIsSubmitting(true)
    try {
  const res = await fetch(`${BACKEND}/api/customers`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    let msg = `Failed to create user (${res.status})`;
    try {
      const data = await res.json();
      if (data?.error) msg = data.error;
      if (data?.message) msg = data.message;
    } catch {}
    throw new Error(msg);
  }

  toast.success("Customer created successfully ✅");
  setEmail("");
  setPhone("");
  setFullName("");
  setPassword("");
  setProfileImage(null);

} catch (err: unknown) {
  console.error("Create customer error:", err);
  if (err instanceof Error) {
    toast.error(err.message);
  } else {
    toast.error("Failed to create customer");
  }
}

  }

  return (
    <section className="container mx-auto py-10">
      <h1 className="text-2xl md:text-4xl text-center font-bold mb-6"></h1>
              <h1 className="text-2xl py-5 text-center md:text-5xl lg:text-6xl font-bold mb-6">[create new customer]</h1>

      <form onSubmit={submit} className="bg-white/5 rounded-lg p-6 space-y-4">
        {/* Full Name */}
        <label className="block">
          <div className="text-sm mb-1">Full Name *</div>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="John Doe"
            className="w-full px-4 py-2 rounded bg-white/5"
          />
        </label>

        {/* Email */}
        <label className="block">
          <div className="text-sm mb-1">Email *</div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@mail.com"
            className="w-full px-4 py-2 rounded bg-white/5"
          />
        </label>

        {/* Phone */}
        <label className="block">
          <div className="text-sm mb-1">Phone *</div>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="08012345678"
            className="w-full px-4 py-2 rounded bg-white/5"
          />
        </label>

        {/* Password */}
        <label className="block">
          <div className="text-sm mb-1">Password *</div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-4 py-2 rounded bg-white/5"
          />
        </label>

        {/* Image Upload */}
        <label className="block">
          <div className="text-sm mb-1">Profile Image (optional)</div>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setProfileImage(e.target.files?.[0] || null)}
            className="w-full px-3 py-2 rounded bg-white/5 file:mr-3 file:py-2 file:px-3 file:rounded file:border-0 file:bg-amber-400 file:text-black"
          />
          {profileImage && (
            <div className="mt-2 text-xs text-slate-400">
              Selected: <strong>{profileImage.name}</strong>
            </div>
          )}
        </label>

        {/* Buttons */}
        <div className="mt-4 flex gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 rounded bg-amber-400 text-black font-semibold disabled:opacity-60"
          >
            {isSubmitting ? "Creating..." : "Create Customer"}
          </button>

          <button
            type="button"
            onClick={() => {
              setEmail("")
              setPhone("")
              setFullName("")
              setPassword("")
              setProfileImage(null)
            }}
            className="px-4 py-2 rounded bg-white/6"
          >
            Clear
          </button>
        </div>
      </form>
    </section>
  )
}