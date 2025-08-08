"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser, signOut } from "@/lib/auth"
import type { User } from "@/lib/supabase"
import { supabase } from "@/lib/supabase"

interface AuthContextType {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const refreshUser = async () => {
    try {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
    } catch (error: any) {
      console.error("Error refreshing user:", error)
      setUser(null)

      // Handle specific error types
      if (error.message === "PENDING_APPROVAL") {
        router.push("/auth/pending-approval")
      } else if (error.message === "REGISTRATION_REJECTED") {
        router.push("/auth/rejected")
      } else if (error.message === "NO_REGISTRATION_FOUND") {
        router.push("/auth/register")
      } else if (error.message === "ACCOUNT_CREATION_ERROR") {
        router.push("/auth/error")
      } else {
        // For other errors, redirect to login
        router.push("/auth/login")
      }
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      setUser(null)
      router.push("/auth/login")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          console.error("Session error:", sessionError)
          if (mounted) setLoading(false)
          return
        }

        if (session?.user && mounted) {
          await refreshUser()
        } else if (mounted) {
          setUser(null)
        }
      } catch (error) {
        console.error("Error initializing auth:", error)
        if (mounted) setUser(null)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    initializeAuth()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      console.log("Auth state change:", event, session?.user?.email)

      if (event === "SIGNED_IN" && session?.user) {
        setLoading(true)
        await refreshUser()
        setLoading(false)
      } else if (event === "SIGNED_OUT") {
        setUser(null)
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signOut: handleSignOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
