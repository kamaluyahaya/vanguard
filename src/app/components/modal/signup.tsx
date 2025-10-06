"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import MyInput from "../inputs/input"
import { signInWithGooglePopup } from "../../lib/firebaseClient" // <- import
import { useRouter } from "next/navigation" // ✅ import router
import Image from "next/image";

interface SignupModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (email: string) => void
}

export default function SignupModal({ isOpen, onClose, onSuccess }: SignupModalProps) {

  const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

    const router = useRouter() // ✅ initialize router
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [step, setStep] = useState<"email" | "otp">("email")
  const [otpLoading, setOtpLoading] = useState(false)
const [googleLoading, setGoogleLoading] = useState(false)

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [isOpen, onClose])

  const validateEmail = () => {
    const e: Record<string, string> = {}
    if (!email.trim()) e.email = "Please enter your email"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Invalid email address"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  // helper to persist auth

  interface AuthUser {
  email: string;
  name?: string | null;
  photo?: string | null;
  uid?: string;
  [key: string]: any; // optional fallback
}

const saveAuth = (token: string, userObj: AuthUser) => {
  try {
    const payload = { token, user: userObj, savedAt: new Date().toISOString() }
    localStorage.setItem("auth", JSON.stringify(payload))
    // optional quick access
    localStorage.setItem("token", token)
  } catch (e) {
    console.warn("Failed to save auth to localStorage", e)
  }
}


  // inside your SignupModal component

const handleEmailSubmit = async (ev: React.FormEvent) => {
  ev.preventDefault()
  if (!validateEmail()) return

  setOtpLoading(true)
  setErrors({})
  try {
    const r = await fetch(`${BACKEND}/api/auth/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
    const json = await r.json()
    if (!r.ok) throw new Error(json.message || "Failed to send OTP")
    setStep("otp")
  }catch (err: unknown) {
  const e = err instanceof Error ? err : new Error(String(err));
  setErrors({ otp: e.message });
}finally {
    setOtpLoading(false)
  }
}

interface GoogleUser {
  email: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  uid: string;
}

interface GoogleSignInResult {
  user: GoogleUser;
  idToken: string;
}

  const handleOtpSubmit = async (ev: React.FormEvent) => {
  ev.preventDefault()
  if (otp.trim().length < 4) {
    setErrors({ otp: "Please enter a valid OTP" })
    return
  }

  setOtpLoading(true)
  setErrors({})
  try {
    const r = await fetch(`${BACKEND}/api/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp }),
    })
    const json = await r.json()
    if (!r.ok) throw new Error(json.message || "OTP verification failed")

    // Expect backend to return { token: "...", user: { email, name, ... } }
    const token = json.token || json.data?.token
    const user = json.user || json.data?.user || { email }

    if (!token) {
      console.warn("No token returned from backend", json)
      throw new Error("No authentication token received")
    }

    // save auth
    saveAuth(token, user)

    setSuccess(true)
    onSuccess?.(email)

    setTimeout(() => {
      setSuccess(false)
      setOtpLoading(false)
      setStep("email")
      setEmail("")
      setOtp("")
      onClose()
      router.push("/user/dashboard")
    }, 600)
  }catch (err: unknown) {
  const e = err instanceof Error ? err : new Error(String(err));
  setErrors({ otp: e.message });
    setOtpLoading(false)
  }
}


  const handleGoogleSignIn = async () => {
  setErrors({})
  setGoogleLoading(true)
  try {
    // const { user, idToken } = await signInWithGooglePopup();
    const { user, idToken }: GoogleSignInResult = await signInWithGooglePopup();


    const userData = {
      email: user.email,
      name: user.displayName,
      photo: user.photoURL,
      uid: user.uid,
    }

    const resp = await fetch(`${BACKEND}/api/auth/firebase`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken, ...userData }),
    })

    const data = await resp.json().catch(() => ({}))
    if (!resp.ok) {
      throw new Error(data.message || "Auth failed")
    }

    // backend should return { token, user }
    const token = data.token || data.data?.token
    const userFromBackend = data.user || data.data?.user || userData

    if (!token) {
      console.warn("No token from backend on firebase auth", data)
      throw new Error("No authentication token received")
    }

    console.log(userFromBackend, token);

    // persist
    saveAuth(token, userFromBackend)

    setSuccess(true)
    onSuccess?.(user.email || "")

    setTimeout(() => {
      setSuccess(false)
      setGoogleLoading(false)
      onClose()
      router.push("/user/dashboard")
    }, 900)
  } catch (err: unknown) {
  const e = err instanceof Error ? err : new Error(String(err));
    console.error("Google sign-in error:", err)
    setErrors({ form: e.message || "Google sign-in failed" })
    setGoogleLoading(false)
  }
}



  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed text-white inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="bg-gradient-to-br from-[#071033] to-[#08162b] border border-slate-700 rounded-3xl shadow-2xl p-6 md:p-8 relative w-full max-w-sm"
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 220, damping: 20 }}
            role="dialog"
            aria-modal="true"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-amber-500 text-white hover:bg-slate-800 transition"
              aria-label="Close"
            >
              <X size={16} />
            </button>

            <h2 className="text-2xl font-semibold text-white mb-1 text-center">
              Welcome 👋
            </h2>
            <p className="text-sm text-slate-400 mb-6 text-center">
              Sign in or create an account to continue.
            </p>

            {errors.form && (
              <div className="mb-3 text-sm text-red-500 bg-red-50/10 border border-red-600/30 p-3 rounded-xl text-center">
                {errors.form}
              </div>
            )}

            {success ? (
              <div className="py-12 text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-100 mx-auto mb-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-green-600">
                    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white">Welcome aboard 🎉</h3>
                <p className="text-sm text-slate-400 mt-2">Signed in successfully.</p>
              </div>
            ) : (
              <>
              
                {step === "email" && (
                  <form onSubmit={handleEmailSubmit} className="space-y-4">
                    <MyInput
                      type="email"
                      label="Email Address"
                      name="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="rounded-xl"
                    />
                    {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email}</p>}

                    <button
                      type="submit"
                      disabled={otpLoading}
                      className={`w-full py-3 rounded-2xl font-semibold shadow transition ${
                        otpLoading
                          ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                          : "bg-gradient-to-r from-sky-600 to-indigo-600 text-white hover:from-sky-700 hover:to-indigo-700"
                      }`}
                    >
                      {otpLoading ? "Sending OTP..." : "Continue with Email"}
                    </button>
                  </form>
                )}

                {step === "otp" && (
                  <form onSubmit={handleOtpSubmit} className="space-y-4">
                    <MyInput
                      type="text"
                      label="Enter OTP"
                      name="otp"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="rounded-xl tracking-widest text-center text-lg"
                      maxLength={6}
                    />
                    {errors.otp && <p className="text-xs text-red-400 mt-1">{errors.otp}</p>}

                    <button
                      type="submit"
                      disabled={otpLoading}
                      className={`w-full py-3 rounded-2xl font-semibold shadow transition ${
                        otpLoading
                          ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                          : "bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-700 hover:to-green-700"
                      }`}
                    >
                      {otpLoading ? "Verifying..." : "Verify OTP"}
                    </button>
                  </form>
                )}

                <div className="relative flex items-center justify-center my-6">
                  <div className="h-px w-full bg-slate-700" />
                  <span className="absolute px-2 bg-[#08162b] text-slate-400 text-xs uppercase tracking-wider">or</span>
                </div>

                <button
                  type="button"
                  className="w-full py-3 rounded-2xl font-semibold shadow bg-white text-slate-800 flex items-center justify-center gap-2 hover:bg-slate-100 transition"
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading}
                >
                                    

<Image src="/google.webp" alt="Google" width={20} height={20} />
                  {googleLoading ? "Please wait..." : "Continue with Google"}
                </button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
