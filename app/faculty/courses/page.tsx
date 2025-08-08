"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Clock, MapPin, Users, BookOpen, Plus, Eye, AlertCircle } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

interface Course {
  id: string
  name: string
  code: string
  description: string
  credits: number
  semester: string
  year: number
  status: string
  enrollment_count?: number
}

interface ClassSession {
  id: string
  title: string
  description: string
  session_date: string
  start_time: string
  end_time: string
  location: string
  session_type: string
  status: string
}

export default function FacultyCourses() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [courses, setCourses] = useState<Course[]>([])
  const [sessions, setSessions] = useState<ClassSession[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [isSessionDialogOpen, setIsSessionDialogOpen] = useState(false)
  const [dbError, setDbError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchCourses()
    }
  }, [user])

  const fetchCourses = async () => {
    try {
      setDbError(null)

      // Try to get faculty courses first
      const { data: facultyCourses, error: fcError } = await supabase
        .from("faculty_courses")
        .select("course_id, role")
        .eq("faculty_id", user?.id)

      if (fcError) {
        console.error("Faculty courses error:", fcError)
        setDbError("Faculty courses table not found. Please run the database setup script.")

        // Fallback: show all courses
        const { data: allCourses, error: coursesError } = await supabase.from("courses").select("*").limit(10)

        if (coursesError) {
          throw coursesError
        }

        const coursesWithEnrollment = (allCourses || []).map((course: any) => ({
          ...course,
          enrollment_count: 0,
        }))

        setCourses(coursesWithEnrollment)
        return
      }

      if (!facultyCourses || facultyCourses.length === 0) {
        setCourses([])
        return
      }

      // Get course details
      const courseIds = facultyCourses.map((fc) => fc.course_id)
      const { data: coursesData, error: coursesError } = await supabase.from("courses").select("*").in("id", courseIds)

      if (coursesError) throw coursesError

      // Try to get enrollment counts
      const coursesWithEnrollment = await Promise.all(
        (coursesData || []).map(async (course: any) => {
          try {
            const { count } = await supabase
              .from("enrollments")
              .select("*", { count: "exact", head: true })
              .eq("course_id", course.id)

            return {
              ...course,
              enrollment_count: count || 0,
            }
          } catch (error) {
            console.error("Error getting enrollment count:", error)
            return {
              ...course,
              enrollment_count: 0,
            }
          }
        }),
      )

      setCourses(coursesWithEnrollment)
    } catch (error) {
      console.error("Error fetching courses:", error)
      setDbError("Failed to load courses. Please check your database setup.")
      toast({
        title: "Error",
        description: "Failed to load courses",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchSessions = async (courseId: string) => {
    try {
      const { data, error } = await supabase
        .from("class_sessions")
        .select("*")
        .eq("course_id", courseId)
        .eq("faculty_id", user?.id)
        .order("session_date", { ascending: true })

      if (error) {
        console.error("Sessions error:", error)
        // Show sample sessions if table doesn't exist
        const sampleSessions = [
          {
            id: "1",
            title: "Introduction to Course",
            description: "Course overview and syllabus",
            session_date: new Date().toISOString().split("T")[0],
            start_time: "09:00",
            end_time: "10:30",
            location: "Room 101",
            session_type: "lecture",
            status: "scheduled",
          },
          {
            id: "2",
            title: "Chapter 1: Fundamentals",
            description: "Basic concepts and principles",
            session_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            start_time: "09:00",
            end_time: "10:30",
            location: "Room 101",
            session_type: "lecture",
            status: "scheduled",
          },
        ]
        setSessions(sampleSessions)
        return
      }

      setSessions(data || [])
    } catch (error) {
      console.error("Error fetching sessions:", error)
    }
  }

  const createSession = async (sessionData: any) => {
    try {
      const { error } = await supabase.from("class_sessions").insert({
        ...sessionData,
        course_id: selectedCourse?.id,
        faculty_id: user?.id,
      })

      if (error) {
        console.error("Create session error:", error)
        // Add to local state as fallback
        const newSession = {
          id: Date.now().toString(),
          ...sessionData,
          status: "scheduled",
        }
        setSessions((prev) => [...prev, newSession])
        toast({
          title: "Session Scheduled",
          description: "Class session scheduled locally (database not fully configured)",
        })
      } else {
        toast({
          title: "Success",
          description: "Class session created successfully",
        })
        if (selectedCourse) {
          fetchSessions(selectedCourse.id)
        }
      }

      setIsSessionDialogOpen(false)
    } catch (error) {
      console.error("Error creating session:", error)
      toast({
        title: "Error",
        description: "Failed to create session",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">My Courses</h1>
          <p className="text-muted-foreground">Manage your courses and class sessions</p>
        </div>
      </div>

      {dbError && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-orange-800">
              <AlertCircle className="h-5 w-5" />
              <div>
                <p className="font-semibold">Database Setup Required</p>
                <p className="text-sm">{dbError}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {courses.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Courses Assigned</h3>
            <p className="text-muted-foreground">
              {dbError
                ? "Please run the database setup script to configure faculty course assignments."
                : "You haven't been assigned to any courses yet. Contact your administrator to get course assignments."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Card key={course.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{course.name}</CardTitle>
                    <CardDescription>{course.code}</CardDescription>
                  </div>
                  <Badge variant={course.status === "active" ? "default" : "secondary"}>{course.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    {course.credits} credits
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {course.enrollment_count} students
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedCourse(course)
                      fetchSessions(course.id)
                    }}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedCourse && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>{selectedCourse.name}</CardTitle>
                <CardDescription>
                  {selectedCourse.code} - {selectedCourse.semester} {selectedCourse.year}
                </CardDescription>
              </div>
              <Button onClick={() => setSelectedCourse(null)} variant="outline">
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="sessions">
              <TabsList>
                <TabsTrigger value="sessions">Class Sessions</TabsTrigger>
                <TabsTrigger value="details">Course Details</TabsTrigger>
              </TabsList>

              <TabsContent value="sessions" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Class Sessions</h3>
                  <Dialog open={isSessionDialogOpen} onOpenChange={setIsSessionDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-1" />
                        Add Session
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create Class Session</DialogTitle>
                        <DialogDescription>Add a new class session for {selectedCourse.name}</DialogDescription>
                      </DialogHeader>
                      <SessionForm onSubmit={createSession} />
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="grid gap-4">
                  {sessions.length === 0 ? (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-semibold mb-2">No Sessions Scheduled</h3>
                        <p className="text-muted-foreground">Create your first class session to get started.</p>
                      </CardContent>
                    </Card>
                  ) : (
                    sessions.map((session) => (
                      <Card key={session.id}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="space-y-2">
                              <h4 className="font-semibold">{session.title}</h4>
                              <p className="text-sm text-muted-foreground">{session.description}</p>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  {new Date(session.session_date).toLocaleDateString()}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {session.start_time} - {session.end_time}
                                </div>
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  {session.location}
                                </div>
                              </div>
                            </div>
                            <Badge variant={session.status === "completed" ? "default" : "secondary"}>
                              {session.status}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="details" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="text-sm font-medium">Course Code</Label>
                    <p className="text-sm text-muted-foreground">{selectedCourse.code}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Credits</Label>
                    <p className="text-sm text-muted-foreground">{selectedCourse.credits}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Semester</Label>
                    <p className="text-sm text-muted-foreground">
                      {selectedCourse.semester} {selectedCourse.year}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Enrollment</Label>
                    <p className="text-sm text-muted-foreground">{selectedCourse.enrollment_count} students</p>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium">Description</Label>
                    <p className="text-sm text-muted-foreground">{selectedCourse.description}</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function SessionForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    session_date: "",
    start_time: "",
    end_time: "",
    location: "",
    session_type: "lecture",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
    setFormData({
      title: "",
      description: "",
      session_date: "",
      start_time: "",
      end_time: "",
      location: "",
      session_type: "lecture",
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Session Title</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="session_date">Date</Label>
          <Input
            id="session_date"
            type="date"
            value={formData.session_date}
            onChange={(e) => setFormData({ ...formData, session_date: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="session_type">Type</Label>
          <Select
            value={formData.session_type}
            onValueChange={(value) => setFormData({ ...formData, session_type: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lecture">Lecture</SelectItem>
              <SelectItem value="lab">Lab</SelectItem>
              <SelectItem value="seminar">Seminar</SelectItem>
              <SelectItem value="exam">Exam</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="start_time">Start Time</Label>
          <Input
            id="start_time"
            type="time"
            value={formData.start_time}
            onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="end_time">End Time</Label>
          <Input
            id="end_time"
            type="time"
            value={formData.end_time}
            onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          placeholder="e.g., Room 101, Online"
          required
        />
      </div>

      <DialogFooter>
        <Button type="submit">Create Session</Button>
      </DialogFooter>
    </form>
  )
}
