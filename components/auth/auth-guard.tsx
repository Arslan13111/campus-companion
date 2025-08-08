"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import type { UserRole } from "@/lib/supabase"
import { Loader2 } from "lucide-react"

interface AuthGuardProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
  requireAuth?: boolean
}

export function AuthGuard({ children, allowedRoles, requireAuth = true }: AuthGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (requireAuth && !user) {
        router.push("/auth/login")
        return
      }

      if (user && !user.is_approved) {
        router.push("/auth/pending-approval")
        return
      }

      if (user && allowedRoles && !allowedRoles.includes(user.role)) {
        router.push("/unauthorized")
        return
      }
    }
  }, [user, loading, router, allowedRoles, requireAuth])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (requireAuth && !user) {
    return null
  }

  if (user && !user.is_approved) {
    return null
  }

  if (user && allowedRoles && !allowedRoles.includes(user.role)) {
    return null
  }

  return <>{children}</>
}
