"use client"

import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/auth/auth-guard"
import { AdminLayout } from "@/components/layouts/admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import {
  MegaphoneIcon,
  PlusIcon,
  SearchIcon,
  CalendarIcon,
  EyeIcon,
  EditIcon,
  Trash2Icon,
  AlertCircleIcon,
} from "lucide-react"
import { useRouter } from "next/navigation"

interface Announcement {
  id: string
  title: string
  content: string
  priority: "low" | "medium" | "high" | "urgent"
  target_audience: "all" | "students" | "faculty" | "staff"
  is_published: boolean
  published_at: string | null
  expires_at: string | null
  created_at: string
  created_by: string
}

export default function AnnouncementsManagement() {
  const { toast } = useToast()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase.from("announcements").select("*").order("created_at", { ascending: false })

      if (error) throw error
      setAnnouncements(data || [])
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

  const getPriorityBadge = (priority: string) => {
    const colors = {
      low: "bg-gray-100 text-gray-700 border-gray-200",
      medium: "bg-blue-100 text-blue-700 border-blue-200",
      high: "bg-orange-100 text-orange-700 border-orange-200",
      urgent: "bg-red-100 text-red-700 border-red-200",
    }
    return (
      <Badge variant="outline" className={colors[priority as keyof typeof colors]}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </Badge>
    )
  }

  const getAudienceBadge = (audience: string) => {
    const colors = {
      all: "bg-purple-100 text-purple-700 border-purple-200",
      students: "bg-green-100 text-green-700 border-green-200",
      faculty: "bg-blue-100 text-blue-700 border-blue-200",
      staff: "bg-yellow-100 text-yellow-700 border-yellow-200",
    }
    return (
      <Badge variant="outline" className={colors[audience as keyof typeof colors]}>
        {audience.charAt(0).toUpperCase() + audience.slice(1)}
      </Badge>
    )
  }

  const filteredAnnouncements = announcements.filter(
    (announcement) =>
      announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      announcement.content.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const publishedAnnouncements = filteredAnnouncements.filter((a) => a.is_published)
  const draftAnnouncements = filteredAnnouncements.filter((a) => !a.is_published)
  const urgentAnnouncements = filteredAnnouncements.filter((a) => a.priority === "urgent")

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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Announcements</h1>
              <p className="text-muted-foreground">Create and manage university announcements</p>
            </div>
            <Button onClick={() => router.push("/admin/announcements/create")}>
              <PlusIcon className="mr-2 h-4 w-4" />
              Create Announcement
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total</CardTitle>
                <MegaphoneIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{announcements.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Published</CardTitle>
                <EyeIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{publishedAnnouncements.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Drafts</CardTitle>
                <EditIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{draftAnnouncements.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Urgent</CardTitle>
                <AlertCircleIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{urgentAnnouncements.length}</div>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <Card>
            <CardHeader>
              <CardTitle>Announcements</CardTitle>
              <CardDescription>Manage all university announcements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative mb-6">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search announcements..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {filteredAnnouncements.length === 0 ? (
                <div className="text-center py-8">
                  <MegaphoneIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Announcements Found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery
                      ? "No announcements match your search criteria."
                      : "No announcements have been created yet."}
                  </p>
                  <Button>
                    <PlusIcon className="mr-2 h-4 w-4" />
                    Create Your First Announcement
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredAnnouncements.map((announcement) => (
                    <Card key={announcement.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{announcement.title}</CardTitle>
                            <div className="flex items-center space-x-2 mt-2">
                              {getPriorityBadge(announcement.priority)}
                              {getAudienceBadge(announcement.target_audience)}
                              <Badge variant={announcement.is_published ? "default" : "secondary"}>
                                {announcement.is_published ? "Published" : "Draft"}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex space-x-1">
                            <Button size="sm" variant="ghost">
                              <EyeIcon className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <EditIcon className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700">
                              <Trash2Icon className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm text-muted-foreground line-clamp-3">{announcement.content}</p>

                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center space-x-2">
                            <CalendarIcon className="h-3 w-3" />
                            <span>Created {new Date(announcement.created_at).toLocaleDateString()}</span>
                          </div>
                          {announcement.expires_at && (
                            <div className="flex items-center space-x-2">
                              <span>Expires {new Date(announcement.expires_at).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </AuthGuard>
  )
}
