import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types
export type UserRole = "admin" | "faculty" | "student"

export interface User {
  id: string
  email: string
  full_name: string
  role: UserRole
  student_id?: string
  department?: string
  year_level?: number
  phone?: string
  avatar_url?: string
  is_approved: boolean
  created_at: string
  updated_at: string
}

export interface RegistrationRequest {
  id: string
  email: string
  full_name: string
  role: UserRole
  student_id?: string
  department?: string
  year_level?: number
  phone?: string
  status: "pending" | "approved" | "rejected"
  created_at: string
  reviewed_at?: string
  reviewed_by?: string
}

export interface Form {
  id: string
  title: string
  description?: string
  type: "survey" | "feedback" | "request" | "application"
  category: string
  questions: any[]
  target_roles: UserRole[]
  status: "draft" | "active" | "inactive" | "archived"
  created_by: string
  created_at: string
  updated_at: string
  due_date?: string
  max_submissions?: number
  allow_multiple_submissions: boolean
}

export interface FormSubmission {
  id: string
  form_id: string
  user_id: string
  responses: Record<string, any>
  status: "draft" | "submitted" | "reviewed"
  submitted_at: string
  reviewed_at?: string
  reviewed_by?: string
  feedback?: string
}

export interface Announcement {
  id: string
  title: string
  content: string
  target_roles: UserRole[]
  is_urgent: boolean
  created_by: string
  created_at: string
  updated_at: string
  expires_at?: string
}

export interface Event {
  id: string
  title: string
  description?: string
  location?: string
  start_time: string
  end_time: string
  target_roles: UserRole[]
  max_participants?: number
  created_by: string
  created_at: string
  updated_at: string
}

export interface EventRegistration {
  id: string
  event_id: string
  user_id: string
  registered_at: string
  status: "registered" | "attended" | "cancelled"
}

export interface Course {
  id: string
  code: string
  name: string
  description?: string
  credits: number
  department: string
  semester: string
  year: number
  instructor_id?: string
  created_at: string
  updated_at: string
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: "info" | "success" | "warning" | "error"
  is_read: boolean
  created_at: string
  action_url?: string
}
