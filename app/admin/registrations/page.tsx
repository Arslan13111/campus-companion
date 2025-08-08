"use client"

import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/auth/auth-guard"
import { AdminLayout } from "@/components/layouts/admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { supabase } from "@/lib/supabase"
import type { RegistrationRequest } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserIcon,
  MailIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
  RefreshCwIcon,
} from "lucide-react"

export default function RegistrationRequests() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [requests, setRequests] = useState<RegistrationRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchRequests()
    }
  }, [user])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      console.log("Fetching registration requests...")

      // Use a simpler query first to test permissions
      const { data, error } = await supabase
        .from("registration_requests")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Supabase error:", error)
        throw error
      }

      console.log("Fetched requests:", data)
      setRequests(data || [])
    } catch (error: any) {
      console.error("Error fetching requests:", error)
      toast({
        title: "Error Loading Requests",
        description: error.message || "Failed to load registration requests",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (requestId: string) => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to approve requests",
        variant: "destructive",
      })
      return
    }

    setProcessingId(requestId)
    try {
      console.log("Approving request:", requestId, "by admin:", user.id)

      const { error } = await supabase.rpc("approve_registration_request", {
        request_id: requestId,
        admin_id: user.id,
      })

      if (error) {
        console.error("Approval error:", error)
        throw error
      }

      // Refresh the requests list
      await fetchRequests()

      toast({
        title: "Request Approved",
        description: "The registration request has been approved successfully.",
      })
    } catch (error: any) {
      console.error("Error approving request:", error)
      toast({
        title: "Approval Failed",
        description: error.message || "Failed to approve request",
        variant: "destructive",
      })
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (requestId: string) => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to reject requests",
        variant: "destructive",
      })
      return
    }

    setProcessingId(requestId)
    try {
      console.log("Rejecting request:", requestId, "by admin:", user.id)

      const { error } = await supabase.rpc("reject_registration_request", {
        request_id: requestId,
        admin_id: user.id,
      })

      if (error) {
        console.error("Rejection error:", error)
        throw error
      }

      // Refresh the requests list
      await fetchRequests()

      toast({
        title: "Request Rejected",
        description: "The registration request has been rejected.",
      })
    } catch (error: any) {
      console.error("Error rejecting request:", error)
      toast({
        title: "Rejection Failed",
        description: error.message || "Failed to reject request",
        variant: "destructive",
      })
    } finally {
      setProcessingId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-700 border-green-200">Approved</Badge>
      case "rejected":
        return <Badge className="bg-red-100 text-red-700 border-red-200">Rejected</Badge>
      default:
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Pending</Badge>
    }
  }

  const getRoleBadge = (role: string) => {
    const colors = {
      admin: "bg-red-100 text-red-700 border-red-200",
      faculty: "bg-blue-100 text-blue-700 border-blue-200",
      student: "bg-green-100 text-green-700 border-green-200",
    }
    return (
      <Badge variant="outline" className={colors[role as keyof typeof colors]}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    )
  }

  const pendingRequests = requests.filter((req) => req.status === "pending")
  const processedRequests = requests.filter((req) => req.status !== "pending")

  if (loading) {
    return (
      <AuthGuard allowedRoles={["admin"]}>
        <AdminLayout>
          <div className="space-y-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/4"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
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
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">Registration Requests</h1>
              <p className="text-gray-600">Review and approve new user registrations</p>
            </div>
            <Button onClick={fetchRequests} variant="outline" size="sm">
              <RefreshCwIcon className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Debug Info */}
          {user && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4">
                <p className="text-sm text-blue-700">
                  <strong>Debug Info:</strong> Logged in as {user.email} (Role: {user.role}, ID: {user.id})
                </p>
              </CardContent>
            </Card>
          )}

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">Pending Requests</CardTitle>
                <ClockIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{pendingRequests.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">Approved</CardTitle>
                <CheckCircleIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {requests.filter((r) => r.status === "approved").length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">Rejected</CardTitle>
                <XCircleIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {requests.filter((r) => r.status === "rejected").length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pending Requests */}
          {pendingRequests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <ClockIcon className="h-5 w-5 text-orange-600" />
                  Pending Requests ({pendingRequests.length})
                </CardTitle>
                <CardDescription>These requests require your review and approval</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingRequests.map((request) => (
                    <div key={request.id} className="border rounded-lg p-4 space-y-4 bg-white">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-blue-100 text-blue-600">
                              {request.full_name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900">{request.full_name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              {getRoleBadge(request.role)}
                              {getStatusBadge(request.status)}
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleApprove(request.id)}
                            disabled={processingId === request.id}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CheckCircleIcon className="mr-2 h-4 w-4" />
                            {processingId === request.id ? "Processing..." : "Approve"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReject(request.id)}
                            disabled={processingId === request.id}
                            className="border-red-200 text-red-600 hover:bg-red-50"
                          >
                            <XCircleIcon className="mr-2 h-4 w-4" />
                            Reject
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center space-x-2 text-gray-600">
                          <MailIcon className="h-4 w-4" />
                          <span>{request.email}</span>
                        </div>
                        {request.phone && (
                          <div className="flex items-center space-x-2 text-gray-600">
                            <PhoneIcon className="h-4 w-4" />
                            <span>{request.phone}</span>
                          </div>
                        )}
                        {request.department && (
                          <div className="flex items-center space-x-2 text-gray-600">
                            <MapPinIcon className="h-4 w-4" />
                            <span>{request.department}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-2 text-gray-600">
                          <CalendarIcon className="h-4 w-4" />
                          <span>{new Date(request.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Processed Requests */}
          {processedRequests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-gray-900">Processed Requests</CardTitle>
                <CardDescription>Previously reviewed registration requests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {processedRequests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {request.full_name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-gray-900">{request.full_name}</div>
                          <div className="text-sm text-gray-600">{request.email}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getRoleBadge(request.role)}
                        {getStatusBadge(request.status)}
                        <span className="text-xs text-gray-500">
                          {new Date(request.reviewed_at || request.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {requests.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2 text-gray-900">No Registration Requests</h3>
                <p className="text-gray-600">There are no registration requests at this time.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </AdminLayout>
    </AuthGuard>
  )
}
