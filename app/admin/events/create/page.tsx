"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AuthGuard } from "@/components/auth/auth-guard"
import { AdminLayout } from "@/components/layouts/admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { CalendarIcon, ArrowLeftIcon } from "lucide-react"

export default function CreateEvent() {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    start_time: "",
    end_time: "",
    location: "",
    max_participants: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.from("events").insert({
        title: formData.title,
        description: formData.description,
        start_time: formData.start_time,
        end_time: formData.end_time,
        location: formData.location,
        max_participants: Number.parseInt(formData.max_participants) || 0,
        created_by: user?.id,
        status: "upcoming",
      })

      if (error) throw error

      toast({
        title: "Success",
        description: "Event created successfully!",
      })

      router.push("/admin/events")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  return (
    <AuthGuard allowedRoles={["admin"]}>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeftIcon className="h-4 w-4 mr-2 text-gray-100" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-100">Create Event</h1>
              <p className="text-gray-400">Create a new university event</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-100">
                <CalendarIcon className="h-5 w-5" />
                Event Details
              </CardTitle>
              <CardDescription className="text-gray-400">Fill in the details for the new event</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-gray-100">
                      Event Title *
                    </Label>
                    <Input
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      required
                      className="text-gray-100 placeholder:text-gray-400 bg-gray-800 border-gray-700"
                      placeholder="Enter event title"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location" className="text-gray-100">
                      Location *
                    </Label>
                    <Input
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      required
                      className="text-gray-100 placeholder:text-gray-400 bg-gray-800 border-gray-700"
                      placeholder="Enter event location"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="start_time" className="text-gray-100">
                      Start Date & Time *
                    </Label>
                    <Input
                      id="start_time"
                      name="start_time"
                      type="datetime-local"
                      value={formData.start_time}
                      onChange={handleChange}
                      required
                      className="text-gray-100 bg-gray-800 border-gray-700"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="end_time" className="text-gray-100">
                      End Date & Time *
                    </Label>
                    <Input
                      id="end_time"
                      name="end_time"
                      type="datetime-local"
                      value={formData.end_time}
                      onChange={handleChange}
                      required
                      className="text-gray-100 bg-gray-800 border-gray-700"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max_participants" className="text-gray-100">
                      Max Participants
                    </Label>
                    <Input
                      id="max_participants"
                      name="max_participants"
                      type="number"
                      value={formData.max_participants}
                      onChange={handleChange}
                      className="text-gray-100 placeholder:text-gray-400 bg-gray-800 border-gray-700"
                      placeholder="0 for unlimited"
                      min="0"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-gray-100">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    className="text-gray-100 placeholder:text-gray-400 bg-gray-800 border-gray-700"
                    placeholder="Enter event description"
                  />
                </div>

                <div className="flex justify-end space-x-4">
                  <Button type="button" variant="outline" onClick={() => router.back()}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Creating..." : "Create Event"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </AuthGuard>
  )
}