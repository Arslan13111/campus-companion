"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { TrendingUp, Users, BookOpen, Award, Download, Filter } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

interface GradeData {
  student_id: string
  student_name: string
  student_email: string
  course_id: string
  course_name: string
  course_code: string
  assignment_title: string
  grade: number
  max_points: number
  percentage: number
  submitted_at: string
  graded_at: string
}

interface CourseStats {
  course_id: string
  course_name: string
  course_code: string
  total_students: number
  total_assignments: number
  average_grade: number
  grade_distribution: { grade: string; count: number }[]
}

export default function FacultyGrades() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [grades, setGrades] = useState<GradeData[]>([])
  const [courseStats, setCourseStats] = useState<CourseStats[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCourse, setSelectedCourse] = useState("all")
  const [selectedStudent, setSelectedStudent] = useState("all")
  const [students, setStudents] = useState<any[]>([])

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  const fetchData = async () => {
    try {
      await Promise.all([fetchCourses(), fetchGrades(), fetchCourseStats()])
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Failed to load grade data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from("faculty_courses")
        .select(`
          courses (
            id,
            name,
            code
          )
        `)
        .eq("faculty_id", user?.id)

      if (error) throw error
      setCourses(data?.map((fc: any) => fc.courses) || [])
    } catch (error) {
      console.error("Error fetching courses:", error)
    }
  }

  const fetchGrades = async () => {
    try {
      // Get faculty's course IDs
      const { data: facultyCourses } = await supabase
        .from("faculty_courses")
        .select("course_id")
        .eq("faculty_id", user?.id)

      const courseIds = facultyCourses?.map((fc) => fc.course_id) || []

      const { data, error } = await supabase
        .from("submissions")
        .select(`
          id,
          student_id,
          grade,
          submitted_at,
          updated_at,
          assignments (
            id,
            title,
            max_points,
            course_id,
            courses (
              name,
              code
            )
          ),
          profiles (
            full_name,
            email
          )
        `)
        .in("assignments.course_id", courseIds)
        .not("grade", "is", null)
        .order("updated_at", { ascending: false })

      if (error) throw error

      const gradesData =
        data?.map((submission: any) => ({
          student_id: submission.student_id,
          student_name: submission.profiles?.full_name || "Unknown",
          student_email: submission.profiles?.email || "",
          course_id: submission.assignments.course_id,
          course_name: submission.assignments.courses.name,
          course_code: submission.assignments.courses.code,
          assignment_title: submission.assignments.title,
          grade: submission.grade,
          max_points: submission.assignments.max_points,
          percentage: Math.round((submission.grade / submission.assignments.max_points) * 100),
          submitted_at: submission.submitted_at,
          graded_at: submission.updated_at,
        })) || []

      setGrades(gradesData)

      // Extract unique students
      const uniqueStudents = Array.from(
        new Map(
          gradesData.map((g) => [g.student_id, { id: g.student_id, name: g.student_name, email: g.student_email }]),
        ).values(),
      )
      setStudents(uniqueStudents)
    } catch (error) {
      console.error("Error fetching grades:", error)
    }
  }

  const fetchCourseStats = async () => {
    try {
      const { data: facultyCourses } = await supabase
        .from("faculty_courses")
        .select("course_id")
        .eq("faculty_id", user?.id)

      const courseIds = facultyCourses?.map((fc) => fc.course_id) || []

      const stats = await Promise.all(
        courses.map(async (course) => {
          // Get total students enrolled
          const { count: totalStudents } = await supabase
            .from("enrollments")
            .select("*", { count: "exact", head: true })
            .eq("course_id", course.id)

          // Get total assignments
          const { count: totalAssignments } = await supabase
            .from("assignments")
            .select("*", { count: "exact", head: true })
            .eq("course_id", course.id)

          // Get grades for this course
          const courseGrades = grades.filter((g) => g.course_id === course.id)
          const averageGrade =
            courseGrades.length > 0
              ? Math.round(courseGrades.reduce((sum, g) => sum + g.percentage, 0) / courseGrades.length)
              : 0

          // Calculate grade distribution
          const gradeDistribution = [
            { grade: "A (90-100)", count: courseGrades.filter((g) => g.percentage >= 90).length },
            { grade: "B (80-89)", count: courseGrades.filter((g) => g.percentage >= 80 && g.percentage < 90).length },
            { grade: "C (70-79)", count: courseGrades.filter((g) => g.percentage >= 70 && g.percentage < 80).length },
            { grade: "D (60-69)", count: courseGrades.filter((g) => g.percentage >= 60 && g.percentage < 70).length },
            { grade: "F (0-59)", count: courseGrades.filter((g) => g.percentage < 60).length },
          ]

          return {
            course_id: course.id,
            course_name: course.name,
            course_code: course.code,
            total_students: totalStudents || 0,
            total_assignments: totalAssignments || 0,
            average_grade: averageGrade,
            grade_distribution: gradeDistribution,
          }
        }),
      )

      setCourseStats(stats)
    } catch (error) {
      console.error("Error fetching course stats:", error)
    }
  }

  const filteredGrades = grades.filter((grade) => {
    if (selectedCourse !== "all" && grade.course_id !== selectedCourse) return false
    if (selectedStudent !== "all" && grade.student_id !== selectedStudent) return false
    return true
  })

  const exportGrades = () => {
    const csvContent = [
      [
        "Student Name",
        "Student Email",
        "Course",
        "Assignment",
        "Grade",
        "Max Points",
        "Percentage",
        "Graded Date",
      ].join(","),
      ...filteredGrades.map((grade) =>
        [
          grade.student_name,
          grade.student_email,
          `${grade.course_code} - ${grade.course_name}`,
          grade.assignment_title,
          grade.grade,
          grade.max_points,
          `${grade.percentage}%`,
          new Date(grade.graded_at).toLocaleDateString(),
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "grades.csv"
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Grades & Analytics</h1>
          <p className="text-muted-foreground">Track student performance and course analytics</p>
        </div>
        <Button onClick={exportGrades}>
          <Download className="h-4 w-4 mr-1" />
          Export Grades
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{courses.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Graded Submissions</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{grades.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Grade</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {grades.length > 0 ? Math.round(grades.reduce((sum, g) => sum + g.percentage, 0) / grades.length) : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="grades" className="space-y-4">
        <TabsList>
          <TabsTrigger value="grades">Grade Book</TabsTrigger>
          <TabsTrigger value="analytics">Course Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="grades" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-4 items-center">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <span className="text-sm font-medium">Filters:</span>
                </div>
                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Courses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Courses</SelectItem>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.code} - {course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Students" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Students</SelectItem>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Grades Table */}
          <Card>
            <CardHeader>
              <CardTitle>Grade Book</CardTitle>
              <CardDescription>Showing {filteredGrades.length} graded submissions</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Assignment</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Percentage</TableHead>
                    <TableHead>Graded Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGrades.map((grade, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{grade.student_name}</p>
                          <p className="text-sm text-muted-foreground">{grade.student_email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{grade.course_code}</p>
                          <p className="text-sm text-muted-foreground">{grade.course_name}</p>
                        </div>
                      </TableCell>
                      <TableCell>{grade.assignment_title}</TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {grade.grade}/{grade.max_points}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            grade.percentage >= 90
                              ? "default"
                              : grade.percentage >= 80
                                ? "secondary"
                                : grade.percentage >= 70
                                  ? "outline"
                                  : "destructive"
                          }
                        >
                          {grade.percentage}%
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(grade.graded_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {/* Course Analytics */}
          <div className="grid gap-6 md:grid-cols-2">
            {courseStats.map((stats) => (
              <Card key={stats.course_id}>
                <CardHeader>
                  <CardTitle className="text-lg">{stats.course_code}</CardTitle>
                  <CardDescription>{stats.course_name}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold">{stats.total_students}</p>
                      <p className="text-sm text-muted-foreground">Students</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.total_assignments}</p>
                      <p className="text-sm text-muted-foreground">Assignments</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.average_grade}%</p>
                      <p className="text-sm text-muted-foreground">Avg Grade</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Grade Distribution</h4>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={stats.grade_distribution.filter((d) => d.count > 0)}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ grade, count }) => `${grade}: ${count}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                        >
                          {stats.grade_distribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
