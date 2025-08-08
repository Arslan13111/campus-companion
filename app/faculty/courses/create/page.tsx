"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

import { useToast } from "@/hooks/use-toast" // ✅ Fix for useToast
import { useAuth } from "@/hooks/use-auth"
import { ArrowLeft, BookOpen } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"

export default function CreateCourse() {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    credits: 3,
    semester: "Fall",
    year: new Date().getFullYear(),
    department: "",
    prerequisites: "",
    max_enrollment: 30,
  })

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.code || !formData.department) {
      toast({
        title: "Missing Fields",
        description: "Please fill out course name, code, and department.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const { data: course, error: courseError } = await supabase
        .from("courses")
        .insert({
          ...formData,
          status: "active",
          created_by: user?.id,
        })
        .select()
        .single()

      if (courseError) throw courseError

      const { error: assignError } = await supabase
        .from("faculty_courses")
        .insert({
          faculty_id: user?.id,
          course_id: course.id,
          role: "instructor",
        })

      if (assignError) {
        console.warn("Warning assigning faculty:", assignError.message)
      }

      toast({ title: "Success", description: "Course created successfully!" })
      router.push("/faculty/courses")
    } catch (error: any) {
      console.error("Error creating course:", error?.message || JSON.stringify(error))
      toast({
        title: "Error",
        description: error?.message || "Failed to create course. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create New Course</h1>
          <p className="text-muted-foreground">Add a new course to your teaching portfolio</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Course Information
          </CardTitle>
          <CardDescription>Fill in the details for your new course</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Course Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="code">Course Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => handleInputChange("code", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department *</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => handleInputChange("department", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="credits">Credits</Label>
                <Select
                  value={formData.credits.toString()}
                  onValueChange={(value) => handleInputChange("credits", parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Credits" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6].map((c) => (
                      <SelectItem key={c} value={c.toString()}>{c} Credit{c > 1 ? "s" : ""}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="semester">Semester</Label>
                <Select
                  value={formData.semester}
                  onValueChange={(value) => handleInputChange("semester", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Semester" />
                  </SelectTrigger>
                  <SelectContent>
                    {["Spring", "Summer", "Fall", "Winter"].map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  type="number"
                  value={formData.year}
                  onChange={(e) => handleInputChange("year", parseInt(e.target.value))}
                  min={new Date().getFullYear()}
                  max={new Date().getFullYear() + 5}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_enrollment">Max Enrollment</Label>
                <Input
                  id="max_enrollment"
                  type="number"
                  value={formData.max_enrollment}
                  onChange={(e) => handleInputChange("max_enrollment", parseInt(e.target.value))}
                  min={1}
                  max={500}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Course Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prerequisites">Prerequisites</Label>
              <Textarea
                id="prerequisites"
                value={formData.prerequisites}
                onChange={(e) => handleInputChange("prerequisites", e.target.value)}
                rows={2}
              />
            </div>

            <div className="flex gap-4 pt-6">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Creating..." : "Create Course"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
