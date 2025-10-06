"use client"

import React, { JSX, useState } from "react"
import { toast } from "sonner"

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000"

export default function PostNoticePanel(): JSX.Element {
  const [title, setTitle] = useState<string>("")
  const [notice, setNotice] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  async function submit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault()

    if (!title.trim()) {
      toast.error("Please enter a title for the notice")
      return
    }
    if (!notice.trim()) {
      toast.error("Please enter the notice body")
      return
    }

    const payload = {
      title: title.trim(),
      content: notice.trim(),
    }

    setIsSubmitting(true)
    try {
      const res = await fetch(`${BACKEND}/api/notices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        let msg = `Failed to post notice (${res.status})`
        try {
          const data = await res.json()
          if (data?.message) msg = data.message
        } catch {
          /* ignore parse errors */
        }
        throw new Error(msg)
      }

      toast.success("Notice posted")
      setTitle("")
      setNotice("")
      } catch (err: unknown) {
  console.error(err)
  if (err instanceof Error) (err.message)
      console.error("Notice post error:", err)
      toast.error(`Failed to post notice: ${err || err}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section>
            <h1 className="text-2xl py-5 text-center md:text-5xl lg:text-6xl font-bold mb-6">[post notice]</h1>
      <form onSubmit={submit} className="bg-white/3 rounded-lg p-6 space-y-4">
        <label className="block">
          <div className="text-sm mb-1">Title</div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Notice title"
            className="w-full px-4 py-2 rounded bg-white/5"
          />
        </label>

        <label className="block">
          <div className="text-sm mb-1">Notice</div>
          <textarea
            value={notice}
            onChange={(e) => setNotice(e.target.value)}
            placeholder="Write your notice"
            className="w-full px-4 py-3 rounded bg-white/5 min-h-[120px]"
          />
        </label>

        <div className="mt-4 flex gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 rounded bg-amber-400 text-black font-semibold disabled:opacity-60"
          >
            {isSubmitting ? "Posting..." : "Post Notice"}
          </button>

          <button
            type="button"
            onClick={() => { setTitle(""); setNotice("") }}
            className="px-4 py-2 rounded bg-white/6"
          >
            Clear
          </button>
        </div>
      </form>
    </section>
  )
}
