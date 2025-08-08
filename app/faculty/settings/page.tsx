"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Bell, Shield, Clock, MapPin, Phone, BookOpen, Plus, Trash2 } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

interface FacultySettings {
  office_hours: OfficeHour[]
  office_location: string
  phone: string
  bio: string
  research_interests: string[]
  notification_preferences: {
    email: boolean
    push: boolean
    assignments: boolean
    grades: boolean
  }
  grading_scale: {
    A: number
    B: number
    C: number
    D: number
    F: number
  }
}

interface OfficeHour {
  day: string
  start: string
  end: string
}

interface Profile {
  full_name: string
  email: string
  phone?: string
  address?: string
  bio?: string
}

export default function FacultySettings() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<Profile>({
    full_name: "",
    email: "",
    phone: "",
    address: "",
    bio: "",
  })
  const [settings, setSettings] = useState<FacultySettings>({
    office_hours: [],
    office_location: "",
    phone: "",
    bio: "",
    research_interests: [],
    notification_preferences: {
      email: true,
      push: true,
      assignments: true,
      grades: true,
    },
    grading_scale: {
      A: 90,
      B: 80,
      C: 70,
      D: 60,
      F: 0,
    },
  })
  const [newResearchInterest, setNewResearchInterest] = useState("")

  useEffect(() => {
    if (user) {
      fetchProfile()
      fetchSettings()
    }
  }, [user])

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user?.id).single()

      if (error && error.code !== "PGRST116") {
        // If profile doesn't exist, create one
        if (error.code === "PGRST116") {
          const { error: insertError } = await supabase.from("profiles").insert({
            id: user?.id,
            full_name: user?.user_metadata?.full_name || "",
            phone: "",
            address: "",
            bio: "",
          })

          if (insertError) throw insertError
        } else {
          throw error
        }
      }

      if (data) {
        setProfile({
          full_name: data.full_name || "",
          email: user?.email || "",
          phone: data.phone || "",
          address: data.address || "",
          bio: data.bio || "",
        })
      } else {
        // Set default values if no profile exists
        setProfile({
          full_name: user?.user_metadata?.full_name || "",
          email: user?.email || "",
          phone: "",
          address: "",
          bio: "",
        })
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
      // Set default values on error
      setProfile({
        full_name: user?.user_metadata?.full_name || "",
        email: user?.email || "",
        phone: "",
        address: "",
        bio: "",
      })
    }
  }

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase.from("faculty_settings").select("*").eq("faculty_id", user?.id).single()

      if (error && error.code !== "PGRST116") throw error

      if (data) {
        setSettings({
          office_hours: data.office_hours || [],
          office_location: data.office_location || "",
          phone: data.phone || "",
          bio: data.bio || "",
          research_interests: data.research_interests || [],
          notification_preferences: data.notification_preferences || {
            email: true,
            push: true,
            assignments: true,
            grades: true,
          },
          grading_scale: data.grading_scale || {
            A: 90,
            B: 80,
            C: 70,
            D: 60,
            F: 0,
          },
        })
      }
    } catch (error) {
      console.error("Error fetching settings:", error)
    } finally {
      setLoading(false)
    }
  }

  const saveProfile = async () => {
    setSaving(true)
    try {
      const { error } = await supabase.from("profiles").upsert({
        id: user?.id,
        full_name: profile.full_name,
        phone: profile.phone,
        address: profile.address,
        bio: profile.bio,
        updated_at: new Date().toISOString(),
      })

      if (error) throw error

      toast({
        title: "Success",
        description: "Profile updated successfully",
      })
    } catch (error) {
      console.error("Error saving profile:", error)
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      const { error } = await supabase.from("faculty_settings").upsert({
        faculty_id: user?.id,
        ...settings,
        updated_at: new Date().toISOString(),
      })

      if (error) throw error

      toast({
        title: "Success",
        description: "Settings updated successfully",
      })
    } catch (error) {
      console.error("Error saving settings:", error)
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const addOfficeHour = () => {
    setSettings({
      ...settings,
      office_hours: [...settings.office_hours, { day: "Monday", start: "09:00", end: "10:00" }],
    })
  }

  const removeOfficeHour = (index: number) => {
    setSettings({
      ...settings,
      office_hours: settings.office_hours.filter((_, i) => i !== index),
    })
  }

  const updateOfficeHour = (index: number, field: keyof OfficeHour, value: string) => {
    const updatedHours = [...settings.office_hours]
    updatedHours[index] = { ...updatedHours[index], [field]: value }
    setSettings({ ...settings, office_hours: updatedHours })
  }

  const addResearchInterest = () => {
    if (newResearchInterest.trim()) {
      setSettings({
        ...settings,
        research_interests: [...settings.research_interests, newResearchInterest.trim()],
      })
      setNewResearchInterest("")
    }
  }

  const removeResearchInterest = (index: number) => {
    setSettings({
      ...settings,
      research_interests: settings.research_interests.filter((_, i) => i !== index),
    })
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
      <div>
        <h1 className="text-3xl font-bold">Faculty Settings</h1>
        <p className="text-muted-foreground">Manage your profile and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="academic">Academic</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="grading">Grading</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
              <CardDescription>Update your personal details and contact information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${profile.full_name}`} />
                  <AvatarFallback>
                    {profile.full_name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{profile.full_name}</h3>
                  <p className="text-sm text-muted-foreground">{profile.email}</p>
                  <Button variant="outline" size="sm" className="mt-2">
                    Change Photo
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={profile.full_name}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={profile.email} disabled className="bg-muted" />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={profile.address}
                    onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                    placeholder="123 Main St, City, State"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  placeholder="Tell us about yourself..."
                  rows={4}
                />
              </div>

              <Button onClick={saveProfile} disabled={saving}>
                {saving ? "Saving..." : "Save Profile"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="academic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Academic Information
              </CardTitle>
              <CardDescription>Manage your office hours, location, and research interests</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="office_location">Office Location</Label>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="office_location"
                      value={settings.office_location}
                      onChange={(e) => setSettings({ ...settings, office_location: e.target.value })}
                      placeholder="Room 201, Building A"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="office_phone">Office Phone</Label>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="office_phone"
                      value={settings.phone}
                      onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <Label className="text-base font-semibold">Office Hours</Label>
                    <p className="text-sm text-muted-foreground">Set your weekly office hours</p>
                  </div>
                  <Button onClick={addOfficeHour} size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Hours
                  </Button>
                </div>

                <div className="space-y-3">
                  {settings.office_hours.map((hour, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <Select value={hour.day} onValueChange={(value) => updateOfficeHour(index, "day", value)}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                            <SelectItem key={day} value={day}>
                              {day}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="time"
                        value={hour.start}
                        onChange={(e) => updateOfficeHour(index, "start", e.target.value)}
                        className="w-32"
                      />
                      <span className="text-muted-foreground">to</span>
                      <Input
                        type="time"
                        value={hour.end}
                        onChange={(e) => updateOfficeHour(index, "end", e.target.value)}
                        className="w-32"
                      />
                      <Button variant="outline" size="sm" onClick={() => removeOfficeHour(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <div className="mb-4">
                  <Label className="text-base font-semibold">Research Interests</Label>
                  <p className="text-sm text-muted-foreground">Add your areas of research and expertise</p>
                </div>

                <div className="flex gap-2 mb-3">
                  <Input
                    value={newResearchInterest}
                    onChange={(e) => setNewResearchInterest(e.target.value)}
                    placeholder="Enter research interest..."
                    onKeyPress={(e) => e.key === "Enter" && addResearchInterest()}
                  />
                  <Button onClick={addResearchInterest}>Add</Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {settings.research_interests.map((interest, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {interest}
                      <button onClick={() => removeResearchInterest(index)} className="ml-1 hover:text-destructive">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <Button onClick={saveSettings} disabled={saving}>
                {saving ? "Saving..." : "Save Academic Info"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>Choose how you want to receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                  </div>
                  <Switch
                    checked={settings.notification_preferences.email}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        notification_preferences: { ...settings.notification_preferences, email: checked },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive push notifications in browser</p>
                  </div>
                  <Switch
                    checked={settings.notification_preferences.push}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        notification_preferences: { ...settings.notification_preferences, push: checked },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Assignment Notifications</Label>
                    <p className="text-sm text-muted-foreground">Get notified about new submissions</p>
                  </div>
                  <Switch
                    checked={settings.notification_preferences.assignments}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        notification_preferences: { ...settings.notification_preferences, assignments: checked },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Grade Notifications</Label>
                    <p className="text-sm text-muted-foreground">Get notified when grades are published</p>
                  </div>
                  <Switch
                    checked={settings.notification_preferences.grades}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        notification_preferences: { ...settings.notification_preferences, grades: checked },
                      })
                    }
                  />
                </div>
              </div>

              <Button onClick={saveSettings} disabled={saving}>
                {saving ? "Saving..." : "Save Notification Preferences"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="grading" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Grading Scale</CardTitle>
              <CardDescription>Set your default grading scale for assignments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                {Object.entries(settings.grading_scale).map(([grade, threshold]) => (
                  <div key={grade}>
                    <Label htmlFor={`grade-${grade}`}>Grade {grade}</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id={`grade-${grade}`}
                        type="number"
                        min="0"
                        max="100"
                        value={threshold}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            grading_scale: {
                              ...settings.grading_scale,
                              [grade]: Number.parseInt(e.target.value),
                            },
                          })
                        }
                      />
                      <span className="text-sm text-muted-foreground">%</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Grading Scale Preview</h4>
                <div className="space-y-1 text-sm">
                  <p>A: {settings.grading_scale.A}% - 100%</p>
                  <p>
                    B: {settings.grading_scale.B}% - {settings.grading_scale.A - 1}%
                  </p>
                  <p>
                    C: {settings.grading_scale.C}% - {settings.grading_scale.B - 1}%
                  </p>
                  <p>
                    D: {settings.grading_scale.D}% - {settings.grading_scale.C - 1}%
                  </p>
                  <p>F: 0% - {settings.grading_scale.D - 1}%</p>
                </div>
              </div>

              <Button onClick={saveSettings} disabled={saving}>
                {saving ? "Saving..." : "Save Grading Scale"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacy & Security
              </CardTitle>
              <CardDescription>Manage your privacy settings and account security</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-semibold">Profile Visibility</Label>
                  <p className="text-sm text-muted-foreground mb-3">Control who can see your profile information</p>
                  <Select defaultValue="students">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public - Anyone can view</SelectItem>
                      <SelectItem value="students">Students Only - Only enrolled students</SelectItem>
                      <SelectItem value="faculty">Faculty Only - Only other faculty</SelectItem>
                      <SelectItem value="private">Private - Only you</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div>
                  <Label className="text-base font-semibold">Contact Information</Label>
                  <p className="text-sm text-muted-foreground mb-3">Choose what contact information to display</p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Show email address</Label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Show phone number</Label>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Show office location</Label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Show office hours</Label>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="text-base font-semibold">Account Security</Label>
                  <p className="text-sm text-muted-foreground mb-3">Manage your account security settings</p>
                  <div className="space-y-3">
                    <Button variant="outline">Change Password</Button>
                    <Button variant="outline">Enable Two-Factor Authentication</Button>
                    <Button variant="outline">Download Account Data</Button>
                  </div>
                </div>
              </div>

              <Button onClick={saveSettings} disabled={saving}>
                {saving ? "Saving..." : "Save Privacy Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
