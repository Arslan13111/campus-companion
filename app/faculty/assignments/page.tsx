"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import {
  Tabs, TabsContent, TabsList, TabsTrigger
} from "@/components/ui/tabs"
import {
  Calendar, FileText, Users, Plus, Edit, Eye
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

interface Assignment {
  id: string
  title: string
  description: string
  course_id: string
  course_name: string
  course_code: string
  due_date: string
  max_points: number
  assignment_type: string
  status: string
  created_at: string
  submission_count?: number
  graded_count?: number
}

interface Submission {
  id: string
  student_id: string
  student_name: string
  submitted_at: string
  content: string
  file_url?: string
  grade?: number
  feedback?: string
  status: string
}

export default function FacultyAssignments() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  useEffect(() => {
    if (user) {
      fetchAssignments()
      fetchCourses()
    }
  }, [user])

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from("faculty_courses")
        .select(`courses ( id, name, code )`)
        .eq("faculty_id", user?.id)
      if (error) throw error
      setCourses(data?.map((fc: any) => fc.courses) || [])
    } catch (error) {
      console.error("Error fetching courses:", error)
    }
  }

  const fetchAssignments = async () => {
    try {
      const { data: facultyCourses } = await supabase
        .from("faculty_courses")
        .select("course_id")
        .eq("faculty_id", user?.id)

      const courseIds = facultyCourses?.map((fc) => fc.course_id) || []
      const { data, error } = await supabase
        .from("assignments")
        .select(`*, courses ( name, code )`)
        .in("course_id", courseIds)
        .order("created_at", { ascending: false })
      if (error) throw error

      const assignmentsWithCounts = await Promise.all(
        (data || []).map(async (assignment) => {
          const { count: totalSubmissions } = await supabase
            .from("submissions")
            .select("*", { count: "exact", head: true })
            .eq("assignment_id", assignment.id)
          const { count: gradedSubmissions } = await supabase
            .from("submissions")
            .select("*", { count: "exact", head: true })
            .eq("assignment_id", assignment.id)
            .not("grade", "is", null)
          return {
            ...assignment,
            course_name: assignment.courses.name,
            course_code: assignment.courses.code,
            submission_count: totalSubmissions || 0,
            graded_count: gradedSubmissions || 0,
          }
        })
      )
      setAssignments(assignmentsWithCounts)
    } catch (error) {
      console.error("Error fetching assignments:", error)
      toast({ title: "Error", description: "Failed to load assignments", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const fetchSubmissions = async (assignmentId: string) => {
    try {
      const { data, error } = await supabase
        .from("submissions")
        .select(`*, profiles ( full_name )`)
        .eq("assignment_id", assignmentId)
        .order("submitted_at", { ascending: false })
      if (error) throw error
      setSubmissions(
        data?.map((s) => ({
          ...s,
          student_name: s.profiles?.full_name || "Unknown Student",
        })) || []
      )
    } catch (error) {
      console.error("Error fetching submissions:", error)
    }
  }

  const createAssignment = async (assignmentData: any) => {
    if (!assignmentData.course_id) {
      toast({ title: "Validation Error", description: "Please select a course.", variant: "destructive" })
      return
    }
    try {
      const { error } = await supabase.from("assignments").insert(assignmentData)
      if (error) throw error
      toast({ title: "Success", description: "Assignment created successfully" })
      fetchAssignments()
      setIsCreateDialogOpen(false)
    } catch (error: any) {
      console.error("Error creating assignment:", error.message || error)
      toast({ title: "Error", description: error.message || "Failed to create assignment", variant: "destructive" })
    }
  }

  const updateAssignment = async (assignmentData: any) => {
    if (!selectedAssignment) return
    try {
      const { error } = await supabase
        .from("assignments")
        .update(assignmentData)
        .eq("id", selectedAssignment.id)
      if (error) throw error
      toast({ title: "Success", description: "Assignment updated successfully" })
      fetchAssignments()
      setIsEditDialogOpen(false)
      setSelectedAssignment(null)
    } catch (error) {
      console.error("Error updating assignment:", error)
      toast({ title: "Error", description: "Failed to update assignment", variant: "destructive" })
    }
  }

  const gradeSubmission = async (submissionId: string, grade: number, feedback: string) => {
    try {
      const { error } = await supabase
        .from("submissions")
        .update({ grade, feedback, status: "graded" })
        .eq("id", submissionId)
      if (error) throw error
      toast({ title: "Success", description: "Submission graded successfully" })
      if (selectedAssignment) {
        fetchSubmissions(selectedAssignment.id)
        fetchAssignments()
      }
    } catch (error) {
      console.error("Error grading submission:", error)
      toast({ title: "Error", description: "Failed to grade submission", variant: "destructive" })
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
          <h1 className="text-3xl font-bold">Assignments</h1>
          <p className="text-muted-foreground">Create and manage assignments</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" />Create Assignment</Button></DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Assignment</DialogTitle>
              <DialogDescription>Fill out the form to create a new assignment</DialogDescription>
            </DialogHeader>
            <AssignmentForm courses={courses} onSubmit={createAssignment} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {assignments.map((assignment) => (
          <Card key={assignment.id}>
            <CardHeader>
              <CardTitle>{assignment.title}</CardTitle>
              <CardDescription>{assignment.course_code} - {assignment.course_name}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm">{assignment.description}</p>
              <div className="text-sm flex flex-col gap-1">
                <div><Calendar className="inline w-4 h-4 mr-1" /> Due: {new Date(assignment.due_date).toLocaleDateString()}</div>
                <div><FileText className="inline w-4 h-4 mr-1" /> {assignment.max_points} points</div>
                <div><Users className="inline w-4 h-4 mr-1" /> {assignment.submission_count} submissions</div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => { setSelectedAssignment(assignment); fetchSubmissions(assignment.id) }}><Eye className="h-4 w-4 mr-1" />View</Button>
                <Button size="sm" onClick={() => { setSelectedAssignment(assignment); setIsEditDialogOpen(true) }}><Edit className="h-4 w-4 mr-1" />Edit</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Assignment</DialogTitle>
            <DialogDescription>Update assignment details</DialogDescription>
          </DialogHeader>
          <AssignmentForm assignment={selectedAssignment} courses={courses} onSubmit={updateAssignment} />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function AssignmentForm({ courses, assignment, onSubmit }: { courses: any[]; assignment?: Assignment | null; onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState({
    title: assignment?.title || "",
    description: assignment?.description || "",
    course_id: assignment?.course_id || "",
    due_date: assignment?.due_date?.split("T")[0] || "",
    max_points: assignment?.max_points || 100,
    assignment_type: assignment?.assignment_type || "homework",
    status: assignment?.status || "draft",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.course_id) {
      alert("Please select a course.")
      return
    }
    onSubmit(assignment ? { ...formData, id: assignment.id } : formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div><Label>Title</Label><Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required /></div>
      <div><Label>Description</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required /></div>
      <div><Label>Course</Label><Select value={formData.course_id} onValueChange={(v) => setFormData({ ...formData, course_id: v })}><SelectTrigger><SelectValue placeholder="Select Course" /></SelectTrigger><SelectContent>{courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.code} - {c.name}</SelectItem>)}</SelectContent></Select></div>
      <div><Label>Due Date</Label><Input type="date" value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} required /></div>
      <div><Label>Max Points</Label><Input type="number" value={formData.max_points} onChange={(e) => setFormData({ ...formData, max_points: parseInt(e.target.value) })} required /></div>
      <div><Label>Type</Label><Select value={formData.assignment_type} onValueChange={(v) => setFormData({ ...formData, assignment_type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="homework">Homework</SelectItem><SelectItem value="quiz">Quiz</SelectItem><SelectItem value="project">Project</SelectItem></SelectContent></Select></div>
      <div><Label>Status</Label><Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="published">Published</SelectItem></SelectContent></Select></div>
      <DialogFooter><Button type="submit">{assignment ? "Update Assignment" : "Create Assignment"}</Button></DialogFooter>
    </form>
  )
}
