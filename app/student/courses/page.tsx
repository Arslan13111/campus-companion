"use client"

import { useEffect, useState } from "react"
import { AuthGuard } from "@/components/auth/auth-guard"
import { StudentLayout } from "@/components/layouts/student-layout"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/use-auth"
import {
  BookOpenIcon,
  ClockIcon,
  UserIcon,
  CalendarIcon,
} from "lucide-react"

interface ScheduleItem {
  day_of_week: number
  start_time: string
  end_time: string
}

interface Course {
  id: string
  code: string
  name: string
  description: string
  credits: number
  department: string
  semester: string
  year: number
  instructor_name: string
  prerequisites: string[]
  schedule: ScheduleItem[]
}

interface Enrollment extends Course {
  enrolled_at: string
  status: string
}

interface RegistrationError {
  course: Course
  reason: string
}

export default function StudentCourses() {
  const { user } = useAuth()
  const [available, setAvailable] = useState<Course[]>([])
  const [enrolled, setEnrolled] = useState<Enrollment[]>([])
  const [errors, setErrors] = useState<RegistrationError[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAll()
  }, [user])

  async function loadAll() {
    if (!user) return
    setLoading(true)

    const { data: courses, error: coursesErr } = await supabase
      .from("faculty_courses")
      .select("*, users:instructor_id(full_name)")
      .eq("semester", "Fall")
      .eq("year", 2025)

    if (coursesErr?.message) {
      console.error("Error fetching faculty_courses:", coursesErr.message)
    }

    const parsedCourses: Course[] = (courses || []).map((c: any) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      description: c.description,
      credits: c.credits,
      department: c.department,
      semester: c.semester,
      year: c.year,
      instructor_name: c.users?.full_name || "TBA",
      prerequisites: c.prerequisites || [],
      schedule: c.schedule || [],
    }))

    const { data: enr, error: enrErr } = await supabase
      .from("course_enrollments")
      .select("*, faculty_courses(*)")
      .eq("student_id", user.id)
      .eq("status", "active")

    if (enrErr?.message) {
      console.error("Error fetching enrollments:", enrErr.message)
    }

    const parsedEnr: Enrollment[] = (enr || []).map((e: any) => ({
      id: e.faculty_courses.id,
      code: e.faculty_courses.code,
      name: e.faculty_courses.name,
      description: e.faculty_courses.description,
      credits: e.faculty_courses.credits,
      department: e.faculty_courses.department,
      semester: e.faculty_courses.semester,
      year: e.faculty_courses.year,
      instructor_name: e.faculty_courses.users?.full_name || "TBA",
      prerequisites: e.faculty_courses.prerequisites || [],
      schedule: e.faculty_courses.schedule || [],
      enrolled_at: e.enrolled_at,
      status: e.status,
    }))

    setEnrolled(parsedEnr)
    setAvailable(parsedCourses.filter(c => !parsedEnr.find(e => e.id === c.id)))
    setLoading(false)
  }

  if (loading) {
    return (
      <AuthGuard allowedRoles={["student"]}>
        <StudentLayout>
          <div className="text-center py-10">Loading...</div>
        </StudentLayout>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard allowedRoles={["student"]}>
      <StudentLayout>
        <section className="my-4">
          <h2 className="text-xl font-semibold">My Registered Courses</h2>
          {enrolled.length ? (
            <div className="grid gap-4">
              {enrolled.map(c => (
                <Card key={c.id}>
                  <CardHeader>
                    <CardTitle>{c.code} - {c.name}</CardTitle>
                    <CardDescription>{c.instructor_name}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>{c.description}</p>
                    <p>Credits: {c.credits}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : <p>No registered courses.</p>}
        </section>

        <section className="my-4">
          <h2 className="text-xl font-semibold">Available Courses</h2>
          {available.length ? (
            <div className="grid gap-4">
              {available.map(c => (
                <Card key={c.id}>
                  <CardHeader>
                    <CardTitle>{c.code} - {c.name}</CardTitle>
                    <CardDescription>{c.instructor_name}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>{c.description}</p>
                    <p>Credits: {c.credits}</p>
                    <Button>Register</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : <p>No courses available.</p>}
        </section>
      </StudentLayout>
    </AuthGuard>
  )
}
