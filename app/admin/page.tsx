"use client"

import { useEffect, useState } from "react"
import { AuthGuard } from "@/components/auth/auth-guard"
import { AdminLayout } from "@/components/layouts/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import type { RegistrationRequest, User } from "@/lib/supabase"
import { useAuth } from "@/hooks/use-auth"
import { UsersIcon, UserCheckIcon, FileTextIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function AdminDashboard() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [registrationRequests, setRegistrationRequests] = useState<RegistrationRequest[]>([])
  const [recentUsers, setRecentUsers] = useState<User[]>([])
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingRequests: 0,
    activeForms: 0,
    upcomingEvents: 0,
    usersByRole: { admin: 0, faculty: 0, student: 0 },
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data: requestsData } = await supabase
          .from("registration_requests")
          .select("*")
          .eq("status", "pending")
          .order("created_at", { ascending: false })
          .limit(5)

        const { data: usersData } = await supabase
          .from("users")
          .select("*")
          .eq("is_approved", true)
          .order("created_at", { ascending: false })
          .limit(5)

        const { data: totalUsersData } = await supabase
          .from("users")
          .select("id", { count: "exact" })
          .eq("is_approved", true)

        const { data: pendingRequestsData } = await supabase
          .from("registration_requests")
          .select("id", { count: "exact" })
          .eq("status", "pending")

        const { data: activeFormsData } = await supabase
          .from("forms")
          .select("id", { count: "exact" })
          .eq("status", "active")

        const { data: upcomingEventsData } = await supabase
          .from("events")
          .select("id", { count: "exact" })
          .gte("start_time", new Date().toISOString())

        const { data: usersByRoleData } = await supabase
          .from("users")
          .select("role")
          .eq("is_approved", true)

        const usersByRole = usersByRoleData?.reduce((acc, user) => {
          acc[user.role] = (acc[user.role] || 0) + 1
          return acc
        }, { admin: 0, faculty: 0, student: 0 }) || { admin: 0, faculty: 0, student: 0 }

        setRegistrationRequests(requestsData || [])
        setRecentUsers(usersData || [])
        setStats({
          totalUsers: totalUsersData?.length || 0,
          pendingRequests: pendingRequestsData?.length || 0,
          activeForms: activeFormsData?.length || 0,
          upcomingEvents: upcomingEventsData?.length || 0,
          usersByRole,
        })
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const handleApproveRequest = async (requestId: string) => {
    try {
      const { error } = await supabase.rpc("approve_registration_request", {
        request_id: requestId,
        admin_id: user?.id,
      })

      if (error) throw error

      toast({
        title: "Request Approved",
        description: "The registration request has been approved successfully.",
      })

      setRegistrationRequests(prev => prev.filter(req => req.id !== requestId))
      setStats(prev => ({ ...prev, pendingRequests: prev.pendingRequests - 1 }))
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleRejectRequest = async (requestId: string) => {
    try {
      const { error } = await supabase.rpc("reject_registration_request", {
        request_id: requestId,
        admin_id: user?.id,
      })

      if (error) throw error

      toast({
        title: "Request Rejected",
        description: "The registration request has been rejected.",
      })

      setRegistrationRequests(prev => prev.filter(req => req.id !== requestId))
      setStats(prev => ({ ...prev, pendingRequests: prev.pendingRequests - 1 }))
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  return (
    <AuthGuard allowedRoles={["admin"]}>
      <AdminLayout>
        <div className="space-y-6">
          {/* Welcome Section */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg p-6 text-white">
            <h1 className="text-2xl font-bold mb-2">Welcome back, {user?.full_name}!</h1>
            <p className="text-purple-100">
              Manage your university portal from the admin dashboard.
            </p>
          </div>

          {/* Add your dashboard sections below */}
        </div>
      </AdminLayout>
    </AuthGuard>
  )
}
