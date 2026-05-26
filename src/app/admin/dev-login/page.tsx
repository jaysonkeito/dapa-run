'use client'

import { Suspense, useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail, Lock, Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react'

function DevLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Handle NextAuth error redirect
  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam === 'Configuration') {
      setError('Session expired. Please try again.')
      window.history.replaceState({}, '', '/admin/dev-login')
    } else if (errorParam === 'SessionRequired') {
      setError('Please sign in to access the developer portal.')
      window.history.replaceState({}, '', '/admin/dev-login')
    } else if (errorParam) {
      setError('Authentication error. Please try again.')
      window.history.replaceState({}, '', '/admin/dev-login')
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid email or password')
        setLoading(false)
        return
      }

      // Login succeeded - wait for session to be available
      await new Promise(resolve => setTimeout(resolve, 800))

      const res = await fetch('/api/auth/session')
      const session = await res.json()

      if (session?.user?.role === 'developer') {
        window.location.replace('/admin/dev-dashboard')
      } else if (session?.user?.role === 'admin' || session?.user?.role === 'staff') {
        window.location.replace('/admin/dashboard')
      } else {
        setError('Access denied. Developer credentials required.')
        setLoading(false)
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 25px 25px, #14b8a6 2%, transparent 0%)',
          backgroundSize: '50px 50px',
        }} />
      </div>

      <div className="relative w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-500 to-teal-600 p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4 overflow-hidden">
              <img src="/dapa-run-logo.png" alt="DAPA RUN" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-2xl font-bold text-white">Developer Portal</h1>
            <p className="text-teal-100 text-sm mt-1">DAPA RUN System Management</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="developer@daparun.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-bold py-6 shadow-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In to Developer Portal'
              )}
            </Button>

            <button
              type="button"
              onClick={() => router.push('/')}
              className="w-full flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-teal-500 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to DAPA RUN
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function DevLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading...</p>
          </div>
        </div>
      }
    >
      <DevLoginForm />
    </Suspense>
  )
}
