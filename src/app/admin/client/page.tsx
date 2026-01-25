"use client"

import React, { JSX, useState } from "react"
import { toast } from "sonner"

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000"

type CreatedUser = {
  id?: number | string | null
  full_name?: string
  email?: string
  phone?: string
  balance?: number
}

export default function CreateCustomerForm(): JSX.Element {
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [fullName, setFullName] = useState("")
  const [password, setPassword] = useState("")
  const [profileImage, setProfileImage] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [createdUser, setCreatedUser] = useState<CreatedUser | null>(null)
  const [walletAmount, setWalletAmount] = useState<string>("")
  const [isProcessingWallet, setIsProcessingWallet] = useState(false)

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
      })

      if (!res.ok) {
        let msg = `Failed to create user (${res.status})`
        try {
          const data = await res.json()
          if (data?.error) msg = data.error
          if (data?.message) msg = data.message
        } catch {}
        throw new Error(msg)
      }

      // Try to parse response body (if any) to pick up user id / initial balance
      let data: any = null
      try {
        data = await res.json()
      } catch {
        data = null
      }

      // heuristics to find id and balance
      const id = data?.user_id ?? data?.id ?? data?.customer_id ?? data?.data?.id ?? null
      const balance =
        Number(data?.balance ?? data?.wallet_balance ?? data?.data?.balance ?? 0) ?? 0

      const user: CreatedUser = {
        id,
        full_name: data?.full_name ?? fullName,
        email: data?.email ?? email,
        phone: data?.phone ?? phone,
        balance,
      }

      setCreatedUser(user)
      setWalletAmount("") // clear wallet input
      toast.success("Customer created successfully ✅")
      // clear basic fields but keep createdUser so we can operate on wallet
      setEmail("")
      setPhone("")
      setFullName("")
      setPassword("")
      setProfileImage(null)
    } catch (err: unknown) {
      console.error("Create customer error:", err)
      if (err instanceof Error) {
        toast.error(err.message)
      } else {
        toast.error("Failed to create customer")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Build request body for fund/withdraw; include id if present else email
  function buildWalletPayload(amount: number) {
    const payload: Record<string, any> = { amount }
    if (createdUser?.id != null) payload.user_id = createdUser.id
    else if (createdUser?.email) payload.email = createdUser.email
    else payload.email = email // fallback if somehow no createdUser id but email still present
    return payload
  }

  async function handleWalletAction(action: "fund" | "withdraw") {
    const amt = Number(walletAmount)
    if (!createdUser) {
      toast.error("No created user selected. Create a customer first.")
      return
    }
    if (!walletAmount || Number.isNaN(amt) || amt <= 0) {
      toast.error("Enter a valid amount")
      return
    }

    setIsProcessingWallet(true)
    try {
      const endpoint =
        action === "fund" ? `${BACKEND}/api/fund/admin/fund` : `${BACKEND}/api/fund/admin/withdraw`
      const payload = buildWalletPayload(amt)

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        let msg = `Failed to ${action} wallet (${res.status})`
        try {
          const data = await res.json()
          if (data?.error) msg = data.error
          if (data?.message) msg = data.message
        } catch {}
        throw new Error(msg)
      }

      // try to read response for updated balance/message
      let data: any = null
      try {
        data = await res.json()
      } catch {
        data = null
      }

      // Decide new balance: prefer server-provided, else adjust locally
      const newBalanceFromServer =
        data?.balance ?? data?.wallet_balance ?? data?.data?.balance ?? undefined

      let updatedBalance = createdUser.balance ?? 0
      if (typeof newBalanceFromServer !== "undefined") {
        updatedBalance = Number(newBalanceFromServer)
      } else {
        updatedBalance = action === "fund" ? updatedBalance + amt : updatedBalance - amt
      }

      setCreatedUser({ ...createdUser, balance: updatedBalance })
      toast.success(
        (data?.message ?? (action === "fund" ? "Wallet funded successfully" : "Wallet debited successfully")) +
          " ✅"
      )
      setWalletAmount("")
    } catch (err: unknown) {
      console.error(`${action} wallet error:`, err)
      if (err instanceof Error) toast.error(err.message)
      else toast.error(`Failed to ${action} wallet`)
    } finally {
      setIsProcessingWallet(false)
    }
  }

  return (
    <section className="container mx-auto py-10">
      <h1 className="text-2xl md:text-4xl text-center font-bold mb-6"></h1>
      <h1 className="text-2xl py-5 text-center md:text-5xl lg:text-6xl font-bold mb-6">
        [create new customer]
      </h1>

      <form onSubmit={submit} className="bg-white/5 rounded-lg p-6 space-y-4 shadow-sm">
        {/* Full Name */}
        <label className="block">
          <div className="text-sm mb-1">Full Name *</div>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="John Doe"
            className="w-full px-4 py-2 rounded bg-white/5 border border-slate-200"
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
            className="w-full px-4 py-2 rounded bg-white/5 border border-slate-200"
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
            className="w-full px-4 py-2 rounded bg-white/5 border border-slate-200"
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
            className="w-full px-4 py-2 rounded bg-white/5 border border-slate-200"
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

      {/* Created user & wallet controls */}
      {createdUser && (
        <div className="mt-6 bg-white/5 rounded-lg p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-500">Created User</div>
              <div className="text-lg font-semibold">
                {createdUser.full_name ?? "Unknown name"}
              </div>
              <div className="text-sm text-slate-400">{createdUser.email}</div>
              <div className="text-sm text-slate-400">{createdUser.phone}</div>
            </div>

            <div className="text-right">
              <div className="text-sm text-slate-500">Wallet balance</div>
              <div className="text-2xl font-bold">
                ₦{Number(createdUser.balance ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <label className="col-span-2">
              <div className="text-sm mb-1">Amount</div>
              <input
                type="number"
                min="0"
                step="0.01"
                value={walletAmount}
                onChange={(e) => setWalletAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-2 rounded bg-white/5 border border-slate-200"
              />
            </label>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleWalletAction("fund")}
                disabled={isProcessingWallet}
                className="px-4 py-2 rounded bg-emerald-500 text-white font-semibold disabled:opacity-60"
              >
                {isProcessingWallet ? "Processing..." : "Fund"}
              </button>

              <button
                type="button"
                onClick={() => handleWalletAction("withdraw")}
                disabled={isProcessingWallet}
                className="px-4 py-2 rounded bg-rose-500 text-white font-semibold disabled:opacity-60"
              >
                {isProcessingWallet ? "Processing..." : "Withdraw"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
