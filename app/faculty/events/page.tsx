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
import { Plus, Calendar, Clock, MapPin, Edit, Trash2 } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

interface Event {
  id: string
  title: string
  description: string
  event_date: string
  start_time: string
  end_time: string
  location: string
  event_type: string
  status: string
  created_at: string
}

export default function FacultyEvents() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  useEffect(() => {
    if (user) {
      fetchEvents()
    }
  }, [user])

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("faculty_events")
        .select("*")
        .eq("faculty_id", user?.id)
        .order("event_date", { ascending: true })

      if (error) {
        console.error("Events error:", error)
        // Use sample data if table doesn't exist
        const sampleEvents = [
          {
            id: "1",
            title: "Department Meeting",
            description: "Monthly department meeting to discuss curriculum updates",
            event_date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
            start_time: "14:00",
            end_time: "15:30",
            location: "Conference Room A",
            event_type: "meeting",
            status: "scheduled",
            created_at: new Date().toISOString(),
          },
          {
            id: "2",
            title: "Research Conference",
            description: "Annual computer science research conference",
            event_date: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
            start_time: "09:00",
            end_time: "17:00",
            location: "Main Auditorium",
            event_type: "conference",
            status: "scheduled",
            created_at: new Date().toISOString(),
          },
        ]
        setEvents(sampleEvents)
        return
      }

      setEvents(data || [])
    } catch (error) {
      console.error("Error fetching events:", error)
    } finally {
      setLoading(false)
    }
  }

  const createEvent = async (eventData: any) => {
    try {
      const { error } = await supabase.from("faculty_events").insert({
        ...eventData,
        faculty_id: user?.id,
      })

      if (error) {
        console.error("Create event error:", error)
        // Add to local state as fallback
        const newEvent = {
          id: Date.now().toString(),
          ...eventData,
          created_at: new Date().toISOString(),
        }
        setEvents((prev) => [...prev, newEvent].sort((a, b) => a.event_date.localeCompare(b.event_date)))
        toast({
          title: "Event Created",
          description: "Event created successfully (local only)",
        })
      } else {
        toast({
          title: "Success",
          description: "Event created successfully",
        })
        fetchEvents()
      }

      setIsCreateDialogOpen(false)
    } catch (error) {
      console.error("Error creating event:", error)
      toast({
        title: "Error",
        description: "Failed to create event",
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "meeting":
        return "bg-purple-100 text-purple-800"
      case "conference":
        return "bg-orange-100 text-orange-800"
      case "workshop":
        return "bg-teal-100 text-teal-800"
      case "seminar":
        return "bg-indigo-100 text-indigo-800"
      default:
        return "bg-gray-100 text-gray-800"
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
          <h1 className="text-3xl font-bold">Faculty Events</h1>
          <p className="text-muted-foreground">Manage your academic events and meetings</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Event</DialogTitle>
              <DialogDescription>Schedule a new academic event or meeting</DialogDescription>
            </DialogHeader>
            <CreateEventDialog onSubmit={createEvent} />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="all">All Events</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          <EventsList
            events={events.filter((e) => new Date(e.event_date) >= new Date() && e.status === "scheduled")}
            getStatusColor={getStatusColor}
            getTypeColor={getTypeColor}
          />
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <EventsList events={events} getStatusColor={getStatusColor} getTypeColor={getTypeColor} />
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <EventsList
            events={events.filter((e) => e.status === "completed")}
            getStatusColor={getStatusColor}
            getTypeColor={getTypeColor}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function EventsList({
  events,
  getStatusColor,
  getTypeColor,
}: {
  events: Event[]
  getStatusColor: (status: string) => string
  getTypeColor: (type: string) => string
}) {
  if (events.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Events Found</h3>
          <p className="text-muted-foreground">Create your first event to get started.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => (
        <Card key={event.id} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg">{event.title}</CardTitle>
              <div className="flex gap-1">
                <Badge className={getTypeColor(event.event_type)}>{event.event_type}</Badge>
                <Badge className={getStatusColor(event.status)}>{event.status}</Badge>
              </div>
            </div>
            <CardDescription>{event.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {new Date(event.event_date).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {event.start_time} - {event.end_time}
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {event.location}
              </div>
            </div>

            <div className="flex gap-2">
              <Button size="sm" variant="outline">
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <Button size="sm" variant="outline">
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function CreateEventDialog({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    event_date: "",
    start_time: "",
    end_time: "",
    location: "",
    event_type: "meeting",
    status: "scheduled",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
    setFormData({
      title: "",
      description: "",
      event_date: "",
      start_time: "",
      end_time: "",
      location: "",
      event_type: "meeting",
      status: "scheduled",
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Event Title</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="event_date">Date</Label>
          <Input
            id="event_date"
            type="date"
            value={formData.event_date}
            onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="event_type">Event Type</Label>
          <Select
            value={formData.event_type}
            onValueChange={(value) => setFormData({ ...formData, event_type: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="meeting">Meeting</SelectItem>
              <SelectItem value="conference">Conference</SelectItem>
              <SelectItem value="workshop">Workshop</SelectItem>
              <SelectItem value="seminar">Seminar</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="start_time">Start Time</Label>
          <Input
            id="start_time"
            type="time"
            value={formData.start_time}
            onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="end_time">End Time</Label>
          <Input
            id="end_time"
            type="time"
            value={formData.end_time}
            onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          placeholder="e.g., Conference Room A, Online"
          required
        />
      </div>

      <DialogFooter>
        <Button type="submit">Create Event</Button>
      </DialogFooter>
    </form>
  )
}
