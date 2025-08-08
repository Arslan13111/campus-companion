"use client"

import { useEffect, useState } from "react"
import { AuthGuard } from "@/components/auth/auth-guard"
import { StudentLayout } from "@/components/layouts/student-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/use-auth"
import { CalendarIcon, ClockIcon, MapPinIcon, BookOpenIcon } from "lucide-react"
import { format, startOfWeek, addDays, isSameDay } from "date-fns"

interface ScheduleItem {
  id: string
  course_code: string
  course_name: string
  day_of_week: number
  start_time: string
  end_time: string
  room: string
  building: string
  schedule_type: string
  instructor_name?: string
}

interface Assignment {
  id: string
  title: string
  course_code: string
  due_date: string
  type: string
}

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const timeSlots = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"]

export default function StudentSchedule() {
  const { user } = useAuth()
  const [schedule, setSchedule] = useState<ScheduleItem[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date()))

  useEffect(() => {
    const fetchScheduleData = async () => {
      if (!user) return

      try {
        // Fetch course schedules
        const { data: enrollments } = await supabase
          .from("course_enrollments")
          .select(`
            courses:course_id (
              id,
              code,
              name,
              users:instructor_id (
                full_name
              ),
              schedules (
                id,
                day_of_week,
                start_time,
                end_time,
                room,
                building,
                schedule_type
              )
            )
          `)
          .eq("student_id", user.id)
          .eq("status", "active")

        const scheduleData: ScheduleItem[] = []
        enrollments?.forEach((enrollment: any) => {
          const course = enrollment.courses
          course.schedules?.forEach((schedule: any) => {
            scheduleData.push({
              id: schedule.id,
              course_code: course.code,
              course_name: course.name,
              day_of_week: schedule.day_of_week,
              start_time: schedule.start_time,
              end_time: schedule.end_time,
              room: schedule.room,
              building: schedule.building,
              schedule_type: schedule.schedule_type,
              instructor_name: course.users?.full_name,
            })
          })
        })

        setSchedule(scheduleData)

        // Fetch upcoming assignments
        const courseIds = enrollments?.map((e: any) => e.courses.id) || []
        if (courseIds.length > 0) {
          const { data: assignmentsData } = await supabase
            .from("assignments")
            .select(`
              id,
              title,
              due_date,
              type,
              courses:course_id (
                code
              )
            `)
            .in("course_id", courseIds)
            .eq("is_published", true)
            .gte("due_date", new Date().toISOString())
            .order("due_date", { ascending: true })
            .limit(10)

          const formattedAssignments =
            assignmentsData?.map((assignment: any) => ({
              id: assignment.id,
              title: assignment.title,
              course_code: assignment.courses.code,
              due_date: assignment.due_date,
              type: assignment.type,
            })) || []

          setAssignments(formattedAssignments)
        }
      } catch (error) {
        console.error("Error fetching schedule:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchScheduleData()
  }, [user])

  const getScheduleForDay = (dayOfWeek: number) => {
    return schedule.filter((item) => item.day_of_week === dayOfWeek)
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "lecture":
        return "bg-blue-100 text-blue-800"
      case "lab":
        return "bg-green-100 text-green-800"
      case "tutorial":
        return "bg-purple-100 text-purple-800"
      case "seminar":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <AuthGuard allowedRoles={["student"]}>
        <StudentLayout>
          <div className="space-y-6">
            <div className="h-8 bg-muted rounded animate-pulse" />
            <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
              {[...Array(7)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <div className="h-6 bg-muted rounded animate-pulse" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[...Array(3)].map((_, j) => (
                        <div key={j} className="h-16 bg-muted rounded animate-pulse" />
                      ))}
                    </div>
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
            <h1 className="text-2xl font-bold">My Schedule</h1>
            <p className="text-muted-foreground">View your weekly class schedule and upcoming assignments.</p>
          </div>

          {/* Week Navigation */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Week of {format(currentWeek, "MMMM d, yyyy")}</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentWeek(addDays(currentWeek, -7))}
                className="px-3 py-1 text-sm border rounded hover:bg-accent"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentWeek(startOfWeek(new Date()))}
                className="px-3 py-1 text-sm border rounded hover:bg-accent"
              >
                Today
              </button>
              <button
                onClick={() => setCurrentWeek(addDays(currentWeek, 7))}
                className="px-3 py-1 text-sm border rounded hover:bg-accent"
              >
                Next
              </button>
            </div>
          </div>

          {/* Weekly Schedule Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
            {dayNames.map((dayName, dayIndex) => {
              const daySchedule = getScheduleForDay(dayIndex)
              const currentDate = addDays(currentWeek, dayIndex)
              const isToday = isSameDay(currentDate, new Date())

              return (
                <Card key={dayIndex} className={isToday ? "ring-2 ring-primary" : ""}>
                  <CardHeader className="pb-3">
                    <CardTitle className={`text-sm ${isToday ? "text-primary" : ""}`}>
                      {dayName}
                    </CardTitle>
                    <CardDescription>{format(currentDate, "MMM d")}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {daySchedule.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">No classes</p>
                    ) : (
                      daySchedule.map((item) => (
                        <div
                          key={item.id}
                          className="p-2 rounded-lg border hover:shadow-sm transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-1">
                            <h4 className="text-xs font-medium">{item.course_code}</h4>
                            <Badge className={`text-xs ${getTypeColor(item.schedule_type)}`}>
                              {item.schedule_type}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">{item.course_name}</p>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <ClockIcon className="h-3 w-3" />
                              <span>
                                {item.start_time} - {item.end_time}
                              </span>
                            </div>
                            {item.room && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <MapPinIcon className="h-3 w-3" />
                                <span>
                                  {item.room}, {item.building}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Upcoming Assignments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Upcoming Assignments
              </CardTitle>
              <CardDescription>Assignments due in the next two weeks</CardDescription>
            </CardHeader>
            <CardContent>
              {assignments.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No upcoming assignments</p>
              ) : (
                <div className="space-y-3">
                  {assignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent"
                    >
                      <div className="flex items-center gap-3">
                        <BookOpenIcon className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <h4 className="text-sm font-medium">{assignment.title}</h4>
                          <p className="text-xs text-muted-foreground">{assignment.course_code}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">
                          {format(new Date(assignment.due_date), "MMM d, h:mm a")}
                        </p>
                        <Badge variant="outline" className="text-xs capitalize">
                          {assignment.type}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </StudentLayout>
    </AuthGuard>
  )
}