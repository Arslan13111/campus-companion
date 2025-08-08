"use client"

import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { GraduationCapIcon, Loader2 } from "lucide-react"

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/auth/login")
      } else if (!user.is_approved) {
        router.push("/auth/pending-approval")
      } else {
        // Redirect based on user role
        switch (user.role) {
          case "admin":
            router.push("/admin")
            break
          case "faculty":
            router.push("/faculty")
            break
          case "student":
            router.push("/student")
            break
          default:
            router.push("/auth/login")
        }
      }
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <GraduationCapIcon className="h-16 w-16 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">University Campus Portal</h1>
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
          <p className="text-gray-600 mt-2">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return null // Will redirect based on role
}
