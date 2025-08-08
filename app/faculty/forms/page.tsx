"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, MessageSquare, Eye, Edit, BarChart3 } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

interface Form {
  id: string
  title: string
  description: string
  form_type: string
  status: string
  questions: any[]
  course_id?: string | null
  due_date?: string
  created_at: string
  course?: {
    name: string
    code: string
  }
}

interface Course {
  id: string
  name: string
  code: string
}

export default function FacultyForms() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [forms, setForms] = useState<Form[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  useEffect(() => {
    if (user) {
      fetchForms()
      fetchCourses()
    }
  }, [user])

  const fetchForms = async () => {
    try {
      const { data, error } = await supabase
        .from("forms")
        .select(`*, course:courses(name, code)`)
        .eq("created_by", user?.id) // <- Ensure this column exists
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Forms error:", error)
        setForms([])
        return
      }

      setForms(data || [])
    } catch (error) {
      console.error("Error fetching forms:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase.from("courses").select("id, name, code").eq("status", "active").limit(10)

      if (error) {
        console.error("Courses error:", error)
        return
      }

      setCourses(data || [])
    } catch (error) {
      console.error("Error fetching courses:", error)
    }
  }

  const createForm = async (formData: any) => {
    try {
      const formToInsert = {
        ...formData,
        course_id: formData.course_id === "none" ? null : formData.course_id,
        created_by: user?.id, // <- Ensure this column exists
        questions: [],
      }

      const { error } = await supabase.from("forms").insert(formToInsert)

      if (error) {
        console.error("Create form error:", error)
        toast({ title: "Error", description: "Failed to create form", variant: "destructive" })
      } else {
        toast({ title: "Success", description: "Form created successfully" })
        fetchForms()
      }

      setIsCreateDialogOpen(false)
    } catch (error) {
      console.error("Error creating form:", error)
      toast({ title: "Error", description: "Unexpected error", variant: "destructive" })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published": return "bg-green-100 text-green-800"
      case "draft": return "bg-yellow-100 text-yellow-800"
      case "closed": return "bg-gray-100 text-gray-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "survey":
      case "feedback": return <MessageSquare className="h-4 w-4" />
      case "evaluation": return <BarChart3 className="h-4 w-4" />
      default: return <MessageSquare className="h-4 w-4" />
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
          <h1 className="text-3xl font-bold">Forms & Surveys</h1>
          <p className="text-muted-foreground">Create and manage forms for your courses</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Create Form</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Form</DialogTitle>
              <DialogDescription>Create a new form or survey for your students</DialogDescription>
            </DialogHeader>
            <CreateFormDialog onSubmit={createForm} courses={courses} />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Forms</TabsTrigger>
          <TabsTrigger value="published">Published</TabsTrigger>
          <TabsTrigger value="draft">Drafts</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <FormsList forms={forms} getStatusColor={getStatusColor} getTypeIcon={getTypeIcon} />
        </TabsContent>

        <TabsContent value="published" className="space-y-4">
          <FormsList forms={forms.filter((f) => f.status === "published")} getStatusColor={getStatusColor} getTypeIcon={getTypeIcon} />
        </TabsContent>

        <TabsContent value="draft" className="space-y-4">
          <FormsList forms={forms.filter((f) => f.status === "draft")} getStatusColor={getStatusColor} getTypeIcon={getTypeIcon} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function FormsList({ forms, getStatusColor, getTypeIcon }: { forms: Form[], getStatusColor: (status: string) => string, getTypeIcon: (type: string) => React.ReactNode }) {
  if (forms.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Forms Found</h3>
          <p className="text-muted-foreground">Create your first form to get started.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {forms.map((form) => (
        <Card key={form.id} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                {getTypeIcon(form.form_type)}
                <CardTitle className="text-lg">{form.title}</CardTitle>
              </div>
              <Badge className={getStatusColor(form.status)}>{form.status}</Badge>
            </div>
            <CardDescription>{form.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {form.course && <div className="text-sm text-muted-foreground">Course: {form.course.code} - {form.course.name}</div>}
            <div className="text-sm text-muted-foreground">Created: {new Date(form.created_at).toLocaleDateString()}</div>
            {form.due_date && <div className="text-sm text-muted-foreground">Due: {new Date(form.due_date).toLocaleDateString()}</div>}
            <div className="flex gap-2">
              <Button size="sm" variant="outline"><Eye className="h-4 w-4 mr-1" />View</Button>
              <Button size="sm" variant="outline"><Edit className="h-4 w-4 mr-1" />Edit</Button>
              <Button size="sm" variant="outline"><BarChart3 className="h-4 w-4 mr-1" />Results</Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function CreateFormDialog({ onSubmit, courses }: { onSubmit: (data: any) => void; courses: Course[] }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    form_type: "survey",
    course_id: "none",
    due_date: "",
    status: "draft",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
    setFormData({ title: "", description: "", form_type: "survey", course_id: "none", due_date: "", status: "draft" })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Form Title</Label>
        <Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="form_type">Form Type</Label>
          <Select value={formData.form_type} onValueChange={(value) => setFormData({ ...formData, form_type: value })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="survey">Survey</SelectItem>
              <SelectItem value="feedback">Feedback</SelectItem>
              <SelectItem value="evaluation">Evaluation</SelectItem>
              <SelectItem value="quiz">Quiz</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="course_id">Course (Optional)</Label>
          <Select value={formData.course_id} onValueChange={(value) => setFormData({ ...formData, course_id: value })}>
            <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No specific course</SelectItem>
              {courses.map((course) => (
                <SelectItem key={course.id} value={course.id}>{course.code} - {course.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="due_date">Due Date (Optional)</Label>
        <Input id="due_date" type="datetime-local" value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} />
      </div>

      <DialogFooter>
        <Button type="submit">Create Form</Button>
      </DialogFooter>
    </form>
  )
}
