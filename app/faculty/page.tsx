"use client"

import { useEffect, useState } from "react"
import { AuthGuard } from "@/components/auth/auth-guard"
import { FacultyLayout } from "@/components/layouts/faculty-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import type { Form, Event, Course } from "@/lib/supabase"
import { useAuth } from "@/hooks/use-auth"
import { BookOpenIcon, CalendarIcon, FileTextIcon, UsersIcon, PlusIcon } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

export default function FacultyDashboard() {
  const { user } = useAuth()
  const [forms, setForms] = useState<Form[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeForms: 0,
    upcomingEvents: 0,
    totalCourses: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch forms created by this faculty
        const { data: formsData } = await supabase
          .from("forms")
          .select("*")
          .eq("created_by", user?.id)
          .order("created_at", { ascending: false })
          .limit(5)

        // Fetch events created by this faculty
        const { data: eventsData } = await supabase
          .from("events")
          .select("*")
          .eq("created_by", user?.id)
          .gte("start_time", new Date().toISOString())
          .order("start_time", { ascending: true })
          .limit(5)

        // Fetch courses taught by this faculty
        const { data: coursesData } = await supabase
          .from("courses")
          .select("*")
          .eq("instructor_id", user?.id)
          .order("created_at", { ascending: false })
          .limit(5)

        // Fetch statistics
        const { data: activeFormsCount } = await supabase
          .from("forms")
          .select("id", { count: "exact" })
          .eq("created_by", user?.id)
          .eq("status", "active")

        const { data: upcomingEventsCount } = await supabase
          .from("events")
          .select("id", { count: "exact" })
          .eq("created_by", user?.id)
          .gte("start_time", new Date().toISOString())

        const { data: totalCoursesCount } = await supabase
          .from("courses")
          .select("id", { count: "exact" })
          .eq("instructor_id", user?.id)

        // Get total students enrolled in faculty's courses
        const { data: enrollmentsCount } = await supabase
          .from("course_enrollments")
          .select("id", { count: "exact" })
          .in("course_id", coursesData?.map((c) => c.id) || [])
          .eq("status", "active")

        setForms(formsData || [])
        setEvents(eventsData || [])
        setCourses(coursesData || [])
        setStats({
          totalStudents: enrollmentsCount?.length || 0,
          activeForms: activeFormsCount?.length || 0,
          upcomingEvents: upcomingEventsCount?.length || 0,
          totalCourses: totalCoursesCount?.length || 0,
        })
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    if (user?.id) {
      fetchDashboardData()
    }
  }, [user?.id])

  return (
    <AuthGuard allowedRoles={["faculty"]}>
      <FacultyLayout>
        <div className="space-y-6">
          {/* Welcome Section */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg p-6 text-white">
            <h1 className="text-2xl font-bold mb-2">Welcome back, {user?.full_name}!</h1>
            <p className="text-green-100">
              Manage your courses, students, and academic activities from your faculty portal.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">My Courses</CardTitle>
                <BookOpenIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalCourses}</div>
                <p className="text-xs text-muted-foreground">Active courses</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <UsersIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalStudents}</div>
                <p className="text-xs text-muted-foreground">Enrolled students</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Forms</CardTitle>
                <FileTextIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeForms}</div>
                <p className="text-xs text-muted-foreground">Forms created</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.upcomingEvents}</div>
                <p className="text-xs text-muted-foreground">Events scheduled</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* My Courses */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpenIcon className="h-5 w-5" />
                      My Courses
                    </CardTitle>
                    <CardDescription>Courses you're teaching</CardDescription>
                  </div>
                  <Button asChild size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                    <Link href="/faculty/courses/create">
                      <PlusIcon className="h-4 w-4 mr-1" />
                      Add Course
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
                    ))}
                  </div>
                ) : courses.length > 0 ? (
                  <div className="space-y-3">
                    {courses.map((course) => (
                      <div key={course.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">
                            {course.code} - {course.name}
                          </h4>
                          <p className="text-sm text-gray-600">{course.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary">{course.department}</Badge>
                            <Badge variant="outline">{course.credits} credits</Badge>
                          </div>
                        </div>
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/faculty/courses/${course.id}`}>Manage</Link>
                        </Button>
                      </div>
                    ))}
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/faculty/courses">View All Courses</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500 mb-2">No courses yet</p>
                    <Button asChild size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                      <Link href="/faculty/courses/create">Create Your First Course</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* My Forms */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileTextIcon className="h-5 w-5" />
                      My Forms
                    </CardTitle>
                    <CardDescription>Forms you've created</CardDescription>
                  </div>
                  <Button asChild size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                    <Link href="/faculty/forms/create">
                      <PlusIcon className="h-4 w-4 mr-1" />
                      Create Form
                    </Link>
                  </Button>
                </div>
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
                            <Badge variant={form.status === "active" ? "default" : "secondary"}>{form.status}</Badge>
                            <Badge variant="outline">{form.type}</Badge>
                          </div>
                        </div>
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/faculty/forms/${form.id}`}>View</Link>
                        </Button>
                      </div>
                    ))}
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/faculty/forms">View All Forms</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500 mb-2">No forms created yet</p>
                    <Button asChild size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                      <Link href="/faculty/forms/create">Create Your First Form</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" />
                    My Upcoming Events
                  </CardTitle>
                  <CardDescription>Events you've organized</CardDescription>
                </div>
                <Button asChild size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                  <Link href="/faculty/events/create">
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Create Event
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="h-20 bg-gray-100 rounded animate-pulse" />
                  ))}
                </div>
              ) : events.length > 0 ? (
                <div className="space-y-4">
                  {events.map((event) => (
                    <div key={event.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{event.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span>{formatDistanceToNow(new Date(event.start_time), { addSuffix: true })}</span>
                            {event.location && <span>📍 {event.location}</span>}
                          </div>
                        </div>
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/faculty/events/${event.id}`}>Manage</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/faculty/events">View All Events</Link>
                  </Button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500 mb-2">No upcoming events</p>
                  <Button asChild size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                    <Link href="/faculty/events/create">Create Your First Event</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </FacultyLayout>
    </AuthGuard>
  )
}
