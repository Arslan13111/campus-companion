"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { CalendarIcon, Clock, MapPin, Edit } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

interface ClassSession {
  id: string
  title: string
  description: string
  course_id: string
  course_name: string
  course_code: string
  session_date: string
  start_time: string
  end_time: string
  location: string
  session_type: string
  status: string
}

interface OfficeHour {
  day: string
  start: string
  end: string
}

export default function FacultySchedule() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [sessions, setSessions] = useState<ClassSession[]>([])
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [loading, setLoading] = useState(true)
  const [officeHours, setOfficeHours] = useState<OfficeHour[]>([])
  const [view, setView] = useState<"week" | "month">("week")

  useEffect(() => {
    if (user) {
      fetchSchedule()
      fetchOfficeHours()
    }
  }, [user])

  const fetchSchedule = async () => {
    try {
      // Get faculty's course IDs
      const { data: facultyCourses } = await supabase
        .from("faculty_courses")
        .select("course_id")
        .eq("faculty_id", user?.id)

      const courseIds = facultyCourses?.map((fc) => fc.course_id) || []

      const { data, error } = await supabase
        .from("class_sessions")
        .select(`
          *,
          courses (
            name,
            code
          )
        `)
        .eq("faculty_id", user?.id)
        .in("course_id", courseIds)
        .gte("session_date", new Date().toISOString().split("T")[0])
        .order("session_date", { ascending: true })
        .order("start_time", { ascending: true })

      if (error) throw error

      const sessionsData =
        data?.map((session: any) => ({
          ...session,
          course_name: session.courses.name,
          course_code: session.courses.code,
        })) || []

      setSessions(sessionsData)
    } catch (error) {
      console.error("Error fetching schedule:", error)
      toast({
        title: "Error",
        description: "Failed to load schedule",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchOfficeHours = async () => {
    try {
      const { data, error } = await supabase
        .from("faculty_settings")
        .select("office_hours")
        .eq("faculty_id", user?.id)
        .single()

      if (error && error.code !== "PGRST116") throw error

      if (data?.office_hours) {
        setOfficeHours(data.office_hours)
      }
    } catch (error) {
      console.error("Error fetching office hours:", error)
    }
  }

  const getWeekDates = (date: Date) => {
    const week = []
    const startDate = new Date(date)
    const day = startDate.getDay()
    const diff = startDate.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
    startDate.setDate(diff)

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate)
      currentDate.setDate(startDate.getDate() + i)
      week.push(currentDate)
    }
    return week
  }

  const getSessionsForDate = (date: Date) => {
    const dateString = date.toISOString().split("T")[0]
    return sessions.filter((session) => session.session_date === dateString)
  }

  const getSessionsForWeek = () => {
    const weekDates = getWeekDates(selectedDate)
    return weekDates.map((date) => ({
      date,
      sessions: getSessionsForDate(date),
    }))
  }

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getOfficeHoursForDay = (dayName: string) => {
    return officeHours.filter((oh) => oh.day.toLowerCase() === dayName.toLowerCase())
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
          <h1 className="text-3xl font-bold">My Schedule</h1>
          <p className="text-muted-foreground">Manage your class schedule and office hours</p>
        </div>
        <div className="flex gap-2">
          <Button variant={view === "week" ? "default" : "outline"} onClick={() => setView("week")}>
            Week View
          </Button>
          <Button variant={view === "month" ? "default" : "outline"} onClick={() => setView("month")}>
            Month View
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Calendar Sidebar */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md border"
            />

            <div className="mt-4 space-y-2">
              <h4 className="font-semibold text-sm">Today's Sessions</h4>
              {getSessionsForDate(new Date()).length > 0 ? (
                getSessionsForDate(new Date()).map((session) => (
                  <div key={session.id} className="p-2 bg-muted rounded text-sm">
                    <p className="font-medium">{session.course_code}</p>
                    <p className="text-muted-foreground">
                      {formatTime(session.start_time)} - {formatTime(session.end_time)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No sessions today</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Main Schedule */}
        <div className="lg:col-span-3">
          <Tabs value={view} onValueChange={(v) => setView(v as "week" | "month")}>
            <TabsContent value="week" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Week of {selectedDate.toLocaleDateString()}</CardTitle>
                      <CardDescription>Your weekly class schedule</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          const newDate = new Date(selectedDate)
                          newDate.setDate(newDate.getDate() - 7)
                          setSelectedDate(newDate)
                        }}
                      >
                        Previous Week
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          const newDate = new Date(selectedDate)
                          newDate.setDate(newDate.getDate() + 7)
                          setSelectedDate(newDate)
                        }}
                      >
                        Next Week
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-7 gap-2">
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, index) => {
                      const weekDates = getWeekDates(selectedDate)
                      const currentDate = weekDates[index]
                      const daySessions = getSessionsForDate(currentDate)
                      const dayOfficeHours = getOfficeHoursForDay(day)

                      return (
                        <div key={day} className="space-y-2">
                          <div className="text-center">
                            <p className="font-semibold text-sm">{day}</p>
                            <p className="text-xs text-muted-foreground">{currentDate.getDate()}</p>
                          </div>

                          <div className="space-y-1 min-h-[200px]">
                            {/* Class Sessions */}
                            {daySessions.map((session) => (
                              <Card key={session.id} className="p-2 bg-blue-50 border-blue-200">
                                <div className="space-y-1">
                                  <p className="font-medium text-xs">{session.course_code}</p>
                                  <p className="text-xs text-muted-foreground">{session.title}</p>
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    {formatTime(session.start_time)} - {formatTime(session.end_time)}
                                  </div>
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <MapPin className="h-3 w-3" />
                                    {session.location}
                                  </div>
                                  <Badge size="sm" variant={session.status === "scheduled" ? "default" : "secondary"}>
                                    {session.status}
                                  </Badge>
                                </div>
                              </Card>
                            ))}

                            {/* Office Hours */}
                            {dayOfficeHours.map((oh, ohIndex) => (
                              <Card key={ohIndex} className="p-2 bg-green-50 border-green-200">
                                <div className="space-y-1">
                                  <p className="font-medium text-xs">Office Hours</p>
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    {oh.start} - {oh.end}
                                  </div>
                                </div>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="month" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Schedule</CardTitle>
                  <CardDescription>Overview of your monthly commitments</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {sessions.slice(0, 20).map((session) => (
                      <Card key={session.id} className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{session.course_code}</Badge>
                              <h4 className="font-semibold">{session.title}</h4>
                            </div>
                            <p className="text-sm text-muted-foreground">{session.description}</p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <CalendarIcon className="h-4 w-4" />
                                {new Date(session.session_date).toLocaleDateString()}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {formatTime(session.start_time)} - {formatTime(session.end_time)}
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {session.location}
                              </div>
                            </div>
                          </div>
                          <Badge variant={session.status === "scheduled" ? "default" : "secondary"}>
                            {session.status}
                          </Badge>
                        </div>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Office Hours Management */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Office Hours</CardTitle>
              <CardDescription>Manage your weekly office hours</CardDescription>
            </div>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-1" />
              Edit Office Hours
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => {
              const dayHours = getOfficeHoursForDay(day)
              return (
                <Card key={day} className="p-4">
                  <h4 className="font-semibold mb-2">{day}</h4>
                  {dayHours.length > 0 ? (
                    dayHours.map((oh, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {oh.start} - {oh.end}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No office hours</p>
                  )}
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
