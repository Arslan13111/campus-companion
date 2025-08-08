"use client"

import { useEffect, useState } from "react"
import { AuthGuard } from "@/components/auth/auth-guard"
import { StudentLayout } from "@/components/layouts/student-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/use-auth"
import { TrendingUpIcon, BookOpenIcon, AwardIcon, BarChart3Icon } from "lucide-react"

interface Grade {
  id: string
  course_code: string
  course_name: string
  assignment_title?: string
  grade: number
  max_grade: number
  grade_type: string
  recorded_at: string
  comments?: string
}

interface CourseGrade {
  course_code: string
  course_name: string
  grades: Grade[]
  average: number
  total_points: number
  max_points: number
}

export default function StudentGrades() {
  const { user } = useAuth()
  const [grades, setGrades] = useState<Grade[]>([])
  const [courseGrades, setCourseGrades] = useState<CourseGrade[]>([])
  const [overallGPA, setOverallGPA] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchGrades = async () => {
      if (!user) return

      try {
        // Fetch all grades for the student
        const { data: gradesData, error } = await supabase
          .from("grades")
          .select(`
            *,
            courses:course_id (
              code,
              name
            ),
            assignments:assignment_id (
              title
            )
          `)
          .eq("student_id", user.id)
          .order("recorded_at", { ascending: false })

        if (error) throw error

        const formattedGrades: Grade[] =
          gradesData?.map((grade: any) => ({
            id: grade.id,
            course_code: grade.courses.code,
            course_name: grade.courses.name,
            assignment_title: grade.assignments?.title,
            grade: grade.grade,
            max_grade: grade.max_grade,
            grade_type: grade.grade_type,
            recorded_at: grade.recorded_at,
            comments: grade.comments,
          })) || []

        setGrades(formattedGrades)

        // Group grades by course
        const courseMap = new Map<string, Grade[]>()
        formattedGrades.forEach((grade) => {
          const key = grade.course_code
          if (!courseMap.has(key)) {
            courseMap.set(key, [])
          }
          courseMap.get(key)!.push(grade)
        })

        const courseGradesData: CourseGrade[] = Array.from(courseMap.entries()).map(([courseCode, courseGrades]) => {
          const totalPoints = courseGrades.reduce((sum, grade) => sum + grade.grade, 0)
          const maxPoints = courseGrades.reduce((sum, grade) => sum + grade.max_grade, 0)
          const average = maxPoints > 0 ? (totalPoints / maxPoints) * 100 : 0

          return {
            course_code: courseCode,
            course_name: courseGrades[0].course_name,
            grades: courseGrades,
            average,
            total_points: totalPoints,
            max_points: maxPoints,
          }
        })

        setCourseGrades(courseGradesData)

        // Calculate overall GPA (simplified)
        const totalAverage = courseGradesData.reduce((sum, course) => sum + course.average, 0)
        const gpa = courseGradesData.length > 0 ? totalAverage / courseGradesData.length / 25 : 0 // Convert to 4.0 scale
        setOverallGPA(Math.min(gpa, 4.0))
      } catch (error) {
        console.error("Error fetching grades:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchGrades()
  }, [user])

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return "text-green-600"
    if (percentage >= 80) return "text-blue-600"
    if (percentage >= 70) return "text-yellow-600"
    if (percentage >= 60) return "text-orange-600"
    return "text-red-600"
  }

  const getGradeLetter = (percentage: number) => {
    if (percentage >= 90) return "A"
    if (percentage >= 80) return "B"
    if (percentage >= 70) return "C"
    if (percentage >= 60) return "D"
    return "F"
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "assignment":
        return "bg-blue-100 text-blue-800"
      case "quiz":
        return "bg-green-100 text-green-800"
      case "exam":
        return "bg-red-100 text-red-800"
      case "project":
        return "bg-purple-100 text-purple-800"
      case "participation":
        return "bg-yellow-100 text-yellow-800"
      case "final":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <AuthGuard allowedRoles={["student"]}>
        <StudentLayout>
          <div className="space-y-6">
            <div className="h-8 bg-gray-200 rounded animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <div className="h-6 bg-gray-200 rounded animate-pulse" />
                  </CardHeader>
                  <CardContent>
                    <div className="h-8 bg-gray-100 rounded animate-pulse" />
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
            <h1 className="text-2xl font-bold text-gray-900">My Grades</h1>
            <p className="text-gray-600">Track your academic performance and GPA.</p>
          </div>

          {/* GPA Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">Overall GPA</CardTitle>
                <AwardIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{overallGPA.toFixed(2)}</div>
                <p className="text-xs text-gray-600">Out of 4.0</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">Courses</CardTitle>
                <BookOpenIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{courseGrades.length}</div>
                <p className="text-xs text-gray-600">Enrolled courses</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">Total Grades</CardTitle>
                <BarChart3Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{grades.length}</div>
                <p className="text-xs text-gray-600">Recorded grades</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Course Overview</TabsTrigger>
              <TabsTrigger value="detailed">Detailed Grades</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {courseGrades.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-4 text-lg font-medium text-gray-900">No grades yet</h3>
                    <p className="mt-2 text-gray-500">Your grades will appear here once they're posted.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {courseGrades.map((course) => (
                    <Card key={course.course_code}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-gray-900">{course.course_code}</CardTitle>
                            <CardDescription className="text-gray-600">{course.course_name}</CardDescription>
                          </div>
                          <Badge className={`${getGradeColor(course.average)} bg-transparent border`}>
                            {getGradeLetter(course.average)} ({course.average.toFixed(1)}%)
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Course Progress</span>
                            <span className="text-gray-900 font-medium">
                              {course.total_points}/{course.max_points} points
                            </span>
                          </div>
                          <Progress value={course.average} className="h-2" />
                        </div>

                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-gray-900">Recent Grades</h4>
                          <div className="space-y-1">
                            {course.grades.slice(0, 3).map((grade) => (
                              <div key={grade.id} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                  <Badge className={`text-xs ${getTypeColor(grade.grade_type)}`}>
                                    {grade.grade_type}
                                  </Badge>
                                  <span className="text-gray-600 truncate">
                                    {grade.assignment_title || `${grade.grade_type} grade`}
                                  </span>
                                </div>
                                <span className={`font-medium ${getGradeColor((grade.grade / grade.max_grade) * 100)}`}>
                                  {grade.grade}/{grade.max_grade}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="detailed" className="space-y-6">
              {grades.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <TrendingUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-4 text-lg font-medium text-gray-900">No detailed grades</h3>
                    <p className="mt-2 text-gray-500">Individual assignment grades will appear here.</p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-gray-900">All Grades</CardTitle>
                    <CardDescription className="text-gray-600">Complete list of all your grades</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {grades.map((grade) => {
                        const percentage = (grade.grade / grade.max_grade) * 100
                        return (
                          <div key={grade.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-4">
                              <div>
                                <h4 className="font-medium text-gray-900">
                                  {grade.assignment_title || `${grade.grade_type} Grade`}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  {grade.course_code} - {grade.course_name}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge className={`text-xs ${getTypeColor(grade.grade_type)}`}>
                                    {grade.grade_type}
                                  </Badge>
                                  <span className="text-xs text-gray-500">
                                    {new Date(grade.recorded_at).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`text-lg font-bold ${getGradeColor(percentage)}`}>
                                {grade.grade}/{grade.max_grade}
                              </div>
                              <div className={`text-sm ${getGradeColor(percentage)}`}>
                                {getGradeLetter(percentage)} ({percentage.toFixed(1)}%)
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </StudentLayout>
    </AuthGuard>
  )
}
