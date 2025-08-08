"use client"

import { useEffect, useState } from "react"
import { AuthGuard } from "@/components/auth/auth-guard"
import { StudentLayout } from "@/components/layouts/student-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/use-auth"
import { FileTextIcon, ClockIcon, CheckCircleIcon, AlertCircleIcon, CalendarIcon } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow, isAfter, isBefore } from "date-fns"

interface Assignment {
  id: string
  title: string
  description: string
  type: string
  total_points: number
  due_date: string
  course_code: string
  course_name: string
  submission_status?: string
  grade?: number
  submitted_at?: string
}

export default function StudentAssignments() {
  const { user } = useAuth()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAssignments = async () => {
      if (!user) return

      try {
        // Get assignments from enrolled courses
        const { data: enrollments } = await supabase
          .from("course_enrollments")
          .select("course_id")
          .eq("student_id", user.id)
          .eq("status", "active")

        if (!enrollments || enrollments.length === 0) {
          setLoading(false)
          return
        }

        const courseIds = enrollments.map((e) => e.course_id)

        const { data: assignmentsData, error } = await supabase
          .from("assignments")
          .select(`
            *,
            courses:course_id (
              code,
              name
            ),
            assignment_submissions!left (
              status,
              grade,
              submitted_at
            )
          `)
          .in("course_id", courseIds)
          .eq("is_published", true)
          .order("due_date", { ascending: true })

        if (error) throw error

        const formattedAssignments =
          assignmentsData?.map((assignment: any) => ({
            id: assignment.id,
            title: assignment.title,
            description: assignment.description,
            type: assignment.type,
            total_points: assignment.total_points,
            due_date: assignment.due_date,
            course_code: assignment.courses.code,
            course_name: assignment.courses.name,
            submission_status: assignment.assignment_submissions[0]?.status || "not_submitted",
            grade: assignment.assignment_submissions[0]?.grade,
            submitted_at: assignment.assignment_submissions[0]?.submitted_at,
          })) || []

        setAssignments(formattedAssignments)
      } catch (error) {
        console.error("Error fetching assignments:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAssignments()
  }, [user])

  const getAssignmentStatus = (assignment: Assignment) => {
    const now = new Date()
    const dueDate = new Date(assignment.due_date)

    if (assignment.submission_status === "submitted" || assignment.submission_status === "graded") {
      return "submitted"
    } else if (isAfter(now, dueDate)) {
      return "overdue"
    } else if (isBefore(now, dueDate)) {
      return "pending"
    }
    return "pending"
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "submitted":
        return <Badge className="bg-green-100 text-green-800">Submitted</Badge>
      case "overdue":
        return <Badge variant="destructive">Overdue</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "submitted":
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />
      case "overdue":
        return <AlertCircleIcon className="h-5 w-5 text-red-600" />
      case "pending":
        return <ClockIcon className="h-5 w-5 text-yellow-600" />
      default:
        return <FileTextIcon className="h-5 w-5 text-gray-600" />
    }
  }

  const filterAssignments = (status: string) => {
    return assignments.filter((assignment) => {
      const assignmentStatus = getAssignmentStatus(assignment)
      if (status === "all") return true
      return assignmentStatus === status
    })
  }

  if (loading) {
    return (
      <AuthGuard allowedRoles={["student"]}>
        <StudentLayout>
          <div className="space-y-6">
            <div className="h-8 bg-gray-200 rounded animate-pulse" />
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <div className="h-6 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 bg-gray-100 rounded animate-pulse" />
                  </CardHeader>
                  <CardContent>
                    <div className="h-4 bg-gray-100 rounded animate-pulse" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </StudentLayout>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard allowedRoles={["student"]}>
      <StudentLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Assignments</h1>
            <p className="text-gray-600">View and manage your course assignments.</p>
          </div>

          <Tabs defaultValue="all" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All ({assignments.length})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({filterAssignments("pending").length})</TabsTrigger>
              <TabsTrigger value="submitted">Submitted ({filterAssignments("submitted").length})</TabsTrigger>
              <TabsTrigger value="overdue">Overdue ({filterAssignments("overdue").length})</TabsTrigger>
            </TabsList>

            {["all", "pending", "submitted", "overdue"].map((status) => (
              <TabsContent key={status} value={status} className="space-y-4">
                {filterAssignments(status).length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <FileTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-4 text-lg font-medium text-gray-900">
                        No {status === "all" ? "" : status} assignments
                      </h3>
                      <p className="mt-2 text-gray-500">
                        {status === "all"
                          ? "You don't have any assignments yet."
                          : `You don't have any ${status} assignments.`}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  filterAssignments(status).map((assignment) => {
                    const assignmentStatus = getAssignmentStatus(assignment)
                    return (
                      <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              {getStatusIcon(assignmentStatus)}
                              <div>
                                <CardTitle className="text-gray-900">{assignment.title}</CardTitle>
                                <CardDescription className="text-gray-600">
                                  {assignment.course_code} - {assignment.course_name}
                                </CardDescription>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(assignmentStatus)}
                              <Badge variant="outline" className="capitalize">
                                {assignment.type}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <p className="text-sm text-gray-600">{assignment.description}</p>

                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1 text-gray-600">
                                <CalendarIcon className="h-4 w-4" />
                                <span>
                                  Due: {formatDistanceToNow(new Date(assignment.due_date), { addSuffix: true })}
                                </span>
                              </div>
                              <div className="text-gray-600">Points: {assignment.total_points}</div>
                            </div>

                            {assignment.grade !== undefined && (
                              <div className="text-sm font-medium text-gray-900">
                                Grade: {assignment.grade}/{assignment.total_points}
                              </div>
                            )}
                          </div>

                          {assignment.submitted_at && (
                            <div className="text-sm text-green-600">
                              Submitted {formatDistanceToNow(new Date(assignment.submitted_at), { addSuffix: true })}
                            </div>
                          )}

                          <div className="flex gap-2">
                            <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                              <Link href={`/student/assignments/${assignment.id}`}>
                                {assignmentStatus === "submitted" ? "View Submission" : "Start Assignment"}
                              </Link>
                            </Button>
                            {assignmentStatus !== "submitted" && (
                              <Button variant="outline" size="sm">
                                Save Draft
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </StudentLayout>
    </AuthGuard>
  )
}
