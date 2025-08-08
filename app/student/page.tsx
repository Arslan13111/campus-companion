"use client"

import { useEffect, useState } from "react"
import { AuthGuard } from "@/components/auth/auth-guard"
import { StudentLayout } from "@/components/layouts/student-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import type { Form, Event, Announcement } from "@/lib/supabase"
import { useAuth } from "@/hooks/use-auth"
import { CalendarIcon, FileTextIcon, MegaphoneIcon, ClockIcon, MapPinIcon, AlertCircleIcon } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

export default function StudentDashboard() {
  const { user } = useAuth()
  const [forms, setForms] = useState<Form[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch active forms for students
        const { data: formsData } = await supabase
          .from("forms")
          .select("*")
          .eq("status", "active")
          .contains("target_roles", ["student"])
          .order("created_at", { ascending: false })
          .limit(5)

        // Fetch upcoming events
        const { data: eventsData } = await supabase
          .from("events")
          .select("*")
          .contains("target_roles", ["student"])
          .gte("start_time", new Date().toISOString())
          .order("start_time", { ascending: true })
          .limit(5)

        // Fetch recent announcements
        const { data: announcementsData } = await supabase
          .from("announcements")
          .select("*")
          .contains("target_roles", ["student"])
          .order("created_at", { ascending: false })
          .limit(5)

        setForms(formsData || [])
        setEvents(eventsData || [])
        setAnnouncements(announcementsData || [])
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  return (
    <AuthGuard allowedRoles={["student"]}>
      <StudentLayout>
        <div className="space-y-6">
          {/* Welcome Section */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-6 text-white">
            <h1 className="text-2xl font-bold mb-2">Welcome back, {user?.full_name}!</h1>
            <p className="text-blue-100">Here's what's happening in your campus portal today.</p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Available Forms</CardTitle>
                <FileTextIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{forms.length}</div>
                <p className="text-xs text-muted-foreground">Forms to complete</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{events.length}</div>
                <p className="text-xs text-muted-foreground">Events this month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">New Announcements</CardTitle>
                <MegaphoneIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{announcements.length}</div>
                <p className="text-xs text-muted-foreground">Recent updates</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Forms */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileTextIcon className="h-5 w-5" />
                  Available Forms
                </CardTitle>
                <CardDescription>Forms you can complete</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
                    ))}
                  </div>
                ) : forms.length > 0 ? (
                  <div className="space-y-3">
                    {forms.map((form) => (
                      <div key={form.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{form.title}</h4>
                          <p className="text-sm text-gray-600">{form.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary">{form.category}</Badge>
                            <Badge variant="outline">{form.type}</Badge>
                          </div>
                        </div>
                        <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                          <Link href={`/student/forms/${form.id}`}>Complete</Link>
                        </Button>
                      </div>
                    ))}
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/student/forms">View All Forms</Link>
                    </Button>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No forms available</p>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Events */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Upcoming Events
                </CardTitle>
                <CardDescription>Events you can attend</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
                    ))}
                  </div>
                ) : events.length > 0 ? (
                  <div className="space-y-3">
                    {events.map((event) => (
                      <div key={event.id} className="p-3 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">{event.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <ClockIcon className="h-4 w-4" />
                                {formatDistanceToNow(new Date(event.start_time), { addSuffix: true })}
                              </div>
                              {event.location && (
                                <div className="flex items-center gap-1">
                                  <MapPinIcon className="h-4 w-4" />
                                  {event.location}
                                </div>
                              )}
                            </div>
                          </div>
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/student/events/${event.id}`}>Register</Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/student/events">View All Events</Link>
                    </Button>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No upcoming events</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Announcements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MegaphoneIcon className="h-5 w-5" />
                Recent Announcements
              </CardTitle>
              <CardDescription>Latest updates from the university</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-20 bg-gray-100 rounded animate-pulse" />
                  ))}
                </div>
              ) : announcements.length > 0 ? (
                <div className="space-y-4">
                  {announcements.map((announcement) => (
                    <div key={announcement.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">{announcement.title}</h4>
                            {announcement.is_urgent && (
                              <Badge variant="destructive" className="flex items-center gap-1">
                                <AlertCircleIcon className="h-3 w-3" />
                                Urgent
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{announcement.content}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            {formatDistanceToNow(new Date(announcement.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No announcements</p>
              )}
            </CardContent>
          </Card>
        </div>
      </StudentLayout>
    </AuthGuard>
  )
}
