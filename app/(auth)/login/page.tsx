"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })

    if (res?.error) {
      setError("Invalid credentials")
      setLoading(false)
    } else {
      router.push("/dashboard")
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink text-parchment p-4 relative">
      {/* Warm editorial glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] left-[30%] w-[500px] h-[500px] rounded-full bg-amber/5 blur-[120px]" />
      </div>

      <div className="relative w-full max-w-md z-10 animate-fade-up">
        <div className="card-dark p-8 shadow-2xl" style={{ borderRadius: '16px' }}>
          <div className="text-center mb-8">
            <h1 className="font-serif text-3xl text-parchment mb-2">
              Welcome Back
            </h1>
            <p className="text-slate-light text-sm">Sign in to your analytics dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-terracotta-muted border border-terracotta/30 text-terracotta p-3 rounded-lg text-sm text-center">
                {error}
              </div>
            )}
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-light">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field input-dark"
                placeholder="teacher@example.com"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-light">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field input-dark"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-ink/20 border-t-ink rounded-full animate-spin" />
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-light">
            Don't have an account?{" "}
            <Link href="/register" className="text-amber hover:text-amber-hover transition-colors font-medium">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
