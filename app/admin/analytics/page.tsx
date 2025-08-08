"use client"

import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/auth/auth-guard"
import { AdminLayout } from "@/components/layouts/admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import {
  BarChart3Icon,
  UsersIcon,
  FileTextIcon,
  CalendarIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  ActivityIcon,
} from "lucide-react"

export default function Analytics() {
  const { toast } = useToast()
  const [analytics, setAnalytics] = useState({
    totalUsers: 0,
    newUsersThisMonth: 0,
    totalForms: 0,
    formResponses: 0,
    totalEvents: 0,
    upcomingEvents: 0,
    userGrowth: 0,
    formCompletionRate: 0,
    eventAttendanceRate: 0,
    usersByRole: { admin: 0, faculty: 0, student: 0 },
    monthlyStats: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      // Fetch user statistics
      const { data: users } = await supabase.from("users").select("role, created_at, is_approved")
      const { data: forms } = await supabase.from("forms").select("id, status")
      const { data: events } = await supabase.from("events").select("id, start_time, status")
      const { data: responses } = await supabase.from("form_responses").select("id")

      const now = new Date()
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

      const approvedUsers = users?.filter((u) => u.is_approved) || []
      const newUsersThisMonth = approvedUsers.filter((u) => new Date(u.created_at) >= thisMonth).length
      const newUsersLastMonth = approvedUsers.filter(
        (u) => new Date(u.created_at) >= lastMonth && new Date(u.created_at) < thisMonth,
      ).length

      const userGrowth =
        newUsersLastMonth > 0 ? ((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100 : 100

      const usersByRole = approvedUsers.reduce(
        (acc, user) => {
          acc[user.role] = (acc[user.role] || 0) + 1
          return acc
        },
        { admin: 0, faculty: 0, student: 0 },
      )

      const upcomingEvents = events?.filter((e) => new Date(e.start_time) > now && e.status !== "cancelled").length || 0

      setAnalytics({
        totalUsers: approvedUsers.length,
        newUsersThisMonth,
        totalForms: forms?.length || 0,
        formResponses: responses?.length || 0,
        totalEvents: events?.length || 0,
        upcomingEvents,
        userGrowth,
        formCompletionRate: 75, // Mock data
        eventAttendanceRate: 68, // Mock data
        usersByRole,
        monthlyStats: [], // Mock data
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <AuthGuard allowedRoles={["admin"]}>
        <AdminLayout>
          <div className="space-y-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/4"></div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-32 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </AdminLayout>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard allowedRoles={["admin"]}>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
            <p className="text-muted-foreground">Monitor system performance and user engagement</p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <UsersIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalUsers}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  {analytics.userGrowth >= 0 ? (
                    <TrendingUpIcon className="h-3 w-3 text-green-600 mr-1" />
                  ) : (
                    <TrendingDownIcon className="h-3 w-3 text-red-600 mr-1" />
                  )}
                  <span className={analytics.userGrowth >= 0 ? "text-green-600" : "text-red-600"}>
                    {Math.abs(analytics.userGrowth).toFixed(1)}%
                  </span>
                  <span className="ml-1">from last month</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">New Users</CardTitle>
                <ActivityIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{analytics.newUsersThisMonth}</div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Form Responses</CardTitle>
                <FileTextIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{analytics.formResponses}</div>
                <p className="text-xs text-muted-foreground">{analytics.formCompletionRate}% completion rate</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{analytics.upcomingEvents}</div>
                <p className="text-xs text-muted-foreground">{analytics.eventAttendanceRate}% avg attendance</p>
              </CardContent>
            </Card>
          </div>

          {/* User Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>User Distribution by Role</CardTitle>
                <CardDescription>Breakdown of users by their assigned roles</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium">Students</span>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{analytics.usersByRole.student}</div>
                      <div className="text-xs text-muted-foreground">
                        {((analytics.usersByRole.student / analytics.totalUsers) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm font-medium">Faculty</span>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{analytics.usersByRole.faculty}</div>
                      <div className="text-xs text-muted-foreground">
                        {((analytics.usersByRole.faculty / analytics.totalUsers) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-sm font-medium">Administrators</span>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{analytics.usersByRole.admin}</div>
                      <div className="text-xs text-muted-foreground">
                        {((analytics.usersByRole.admin / analytics.totalUsers) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Overview</CardTitle>
                <CardDescription>Key system metrics and performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileTextIcon className="h-5 w-5 text-blue-600" />
                      <span className="font-medium">Active Forms</span>
                    </div>
                    <span className="text-xl font-bold text-blue-600">{analytics.totalForms}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <BarChart3Icon className="h-5 w-5 text-green-600" />
                      <span className="font-medium">Response Rate</span>
                    </div>
                    <span className="text-xl font-bold text-green-600">{analytics.formCompletionRate}%</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <CalendarIcon className="h-5 w-5 text-purple-600" />
                      <span className="font-medium">Event Attendance</span>
                    </div>
                    <span className="text-xl font-bold text-purple-600">{analytics.eventAttendanceRate}%</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <TrendingUpIcon className="h-5 w-5 text-orange-600" />
                      <span className="font-medium">Growth Rate</span>
                    </div>
                    <span className="text-xl font-bold text-orange-600">
                      {analytics.userGrowth >= 0 ? "+" : ""}
                      {analytics.userGrowth.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest system activities and user interactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4 p-3 border rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">New user registration approved</p>
                    <p className="text-xs text-muted-foreground">2 minutes ago</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 p-3 border rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">New form response submitted</p>
                    <p className="text-xs text-muted-foreground">15 minutes ago</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 p-3 border rounded-lg">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Event created: "Campus Open Day"</p>
                    <p className="text-xs text-muted-foreground">1 hour ago</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 p-3 border rounded-lg">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Announcement published</p>
                    <p className="text-xs text-muted-foreground">3 hours ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </AuthGuard>
  )
}
