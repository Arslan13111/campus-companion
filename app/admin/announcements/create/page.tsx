"use client"

import type React from "react"
import { useState, useRef, ChangeEvent } from "react"
import { useRouter } from "next/navigation"
import { AuthGuard } from "@/components/auth/auth-guard"
import { AdminLayout } from "@/components/layouts/admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { MegaphoneIcon, ArrowLeftIcon, ImageIcon, Trash2Icon } from "lucide-react"

export default function CreateAnnouncement() {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    priority: "medium",
    target_audience: "all",
    is_published: false,
    expires_at: "",
    image_url: ""
  })

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      
      // Validate file type
      const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload a JPEG, PNG, GIF, or WebP image",
          variant: "destructive",
        })
        return
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Maximum file size is 5MB",
          variant: "destructive",
        })
        return
      }
      
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let imageUrl = ""
      
      // Upload image if selected
      if (imageFile) {
        const fileName = `${Date.now()}-${imageFile.name}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("announcements")
          .upload(`images/${fileName}`, imageFile, {
            cacheControl: "3600",
            upsert: false
          })

        if (uploadError) throw uploadError
        
        // Get public URL
        const { data: urlData } = supabase.storage
          .from("announcements")
          .getPublicUrl(uploadData.path)
        
        imageUrl = urlData.publicUrl
      }

      // CORRECTED TABLE NAME: "announcements" instead of "announcement"
      const { error } = await supabase.from("announcements").insert({
        title: formData.title,
        content: formData.content,
        priority: formData.priority,
        target_audience: formData.target_audience,
        is_published: formData.is_published,
        published_at: formData.is_published ? new Date().toISOString() : null,
        expires_at: formData.expires_at || null,
        created_by: user?.id,
        image_url: imageUrl
      })

      if (error) throw error

      toast({
        title: "Success",
        description: "Announcement created successfully!",
      })

      router.push("/admin/announcements")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create announcement",
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
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Create Announcement</h1>
              <p className="text-muted-foreground">Create a new university announcement</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MegaphoneIcon className="h-5 w-5" />
                Announcement Details
              </CardTitle>
              <CardDescription>Fill in the details for the new announcement</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">
                    Title *
                  </Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    placeholder="Enter announcement title"
                  />
                </div>

                {/* Image Upload Section */}
                <div className="space-y-2">
                  <Label>Announcement Image (Optional)</Label>
                  <div className="flex flex-col sm:flex-row items-start gap-4">
                    <div className="relative">
                      <Input
                        ref={fileInputRef}
                        id="image"
                        name="image"
                        type="file"
                        onChange={handleImageChange}
                        className="hidden"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                      />
                      <Label 
                        htmlFor="image"
                        className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg w-40 h-40 cursor-pointer hover:bg-accent"
                      >
                        {imagePreview ? (
                          <div className="relative w-full h-full">
                            <img 
                              src={imagePreview} 
                              alt="Preview" 
                              className="w-full h-full object-cover rounded-md"
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                removeImage()
                              }}
                              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground p-1 rounded-full shadow-sm"
                            >
                              <Trash2Icon className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center p-4">
                            <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                            <span className="text-muted-foreground text-sm text-center">
                              Upload image
                            </span>
                          </div>
                        )}
                      </Label>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1 sm:mt-0">
                      <p>Add an image to make your announcement more engaging.</p>
                      <p className="mt-1">Recommended size: 1200×630 pixels</p>
                      <p className="mt-1 text-xs">Formats: JPEG, PNG, GIF, WEBP</p>
                      <p className="text-xs">Max size: 5MB</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">
                    Content *
                  </Label>
                  <Textarea
                    id="content"
                    name="content"
                    value={formData.content}
                    onChange={handleChange}
                    required
                    rows={6}
                    placeholder="Enter announcement content"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, priority: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Target Audience</Label>
                    <Select
                      value={formData.target_audience}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, target_audience: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select audience" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        <SelectItem value="students">Students</SelectItem>
                        <SelectItem value="faculty">Faculty</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expires_at">
                      Expiry Date (Optional)
                    </Label>
                    <Input
                      id="expires_at"
                      name="expires_at"
                      type="datetime-local"
                      value={formData.expires_at}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="flex items-center space-x-2 pt-6">
                    <Switch
                      id="is_published"
                      checked={formData.is_published}
                      onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_published: checked }))}
                    />
                    <Label htmlFor="is_published">
                      Publish immediately
                    </Label>
                  </div>
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                  <Button type="button" variant="outline" onClick={() => router.back()}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Creating..." : "Create Announcement"}
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