"use client"

import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/auth/auth-guard"
import { AdminLayout } from "@/components/layouts/admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { SettingsIcon, SaveIcon, ShieldIcon, BellIcon, UsersIcon, DatabaseIcon, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface SystemSettings {
  allow_registration: boolean
  maintenance_mode: boolean
  email_notifications: boolean
  system_name: string
  system_description: string
  max_file_size: number
  session_timeout: number
}

export default function AdminSettings() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [tableExists, setTableExists] = useState(true)
  const [settings, setSettings] = useState<SystemSettings>({
    allow_registration: true,
    maintenance_mode: false,
    email_notifications: true,
    system_name: "Student Portal",
    system_description: "University Student Management System",
    max_file_size: 10,
    session_timeout: 30,
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const checkTableExists = async () => {
    try {
      const { error } = await supabase.from("system_settings").select("id").limit(1)

      if (error && error.code === "42P01") {
        // Table doesn't exist
        setTableExists(false)
        return false
      }

      setTableExists(true)
      return true
    } catch (error) {
      console.error("Error checking table:", error)
      setTableExists(false)
      return false
    }
  }

  const createTable = async () => {
    try {
      const { error } = await supabase.rpc("exec_sql", {
        sql: `
          CREATE TABLE IF NOT EXISTS system_settings (
            id INTEGER PRIMARY KEY DEFAULT 1,
            allow_registration BOOLEAN DEFAULT true,
            maintenance_mode BOOLEAN DEFAULT false,
            email_notifications BOOLEAN DEFAULT true,
            system_name TEXT DEFAULT 'Student Portal',
            system_description TEXT DEFAULT 'University Student Management System',
            max_file_size INTEGER DEFAULT 10,
            session_timeout INTEGER DEFAULT 30,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
          );
          
          INSERT INTO system_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
          
          ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
          
          DROP POLICY IF EXISTS "Admin can manage system settings" ON system_settings;
          CREATE POLICY "Admin can manage system settings" ON system_settings
            FOR ALL USING (
              EXISTS (
                SELECT 1 FROM users 
                WHERE users.id = auth.uid() 
                AND users.role = 'admin'
                AND users.status = 'approved'
              )
            );
        `,
      })

      if (error) throw error

      setTableExists(true)
      toast({
        title: "Success",
        description: "System settings table created successfully",
      })

      // Load settings after creating table
      loadSettings()
    } catch (error: any) {
      console.error("Error creating table:", error)
      toast({
        title: "Error",
        description: "Failed to create system settings table",
        variant: "destructive",
      })
    }
  }

  const loadSettings = async () => {
    try {
      const exists = await checkTableExists()
      if (!exists) {
        return
      }

      const { data, error } = await supabase.from("system_settings").select("*").eq("id", 1).single()

      if (error && error.code !== "PGRST116") {
        throw error
      }

      if (data) {
        setSettings({
          allow_registration: data.allow_registration ?? true,
          maintenance_mode: data.maintenance_mode ?? false,
          email_notifications: data.email_notifications ?? true,
          system_name: data.system_name ?? "Student Portal",
          system_description: data.system_description ?? "University Student Management System",
          max_file_size: data.max_file_size ?? 10,
          session_timeout: data.session_timeout ?? 30,
        })
      }
    } catch (error: any) {
      console.error("Error loading settings:", error)
      if (error.message?.includes("does not exist")) {
        setTableExists(false)
      } else {
        toast({
          title: "Error",
          description: "Failed to load settings",
          variant: "destructive",
        })
      }
    }
  }

  const saveSettings = async () => {
    setLoading(true)
    try {
      const exists = await checkTableExists()
      if (!exists) {
        toast({
          title: "Error",
          description: "System settings table does not exist. Please create it first.",
          variant: "destructive",
        })
        return
      }

      const { error } = await supabase.from("system_settings").upsert({
        id: 1,
        ...settings,
        updated_at: new Date().toISOString(),
      })

      if (error) throw error

      toast({
        title: "Success",
        description: "Settings saved successfully",
      })
    } catch (error: any) {
      console.error("Error saving settings:", error)
      toast({
        title: "Error",
        description: "Failed to save settings: " + error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!tableExists) {
    return (
      <AuthGuard allowedRoles={["admin"]}>
        <AdminLayout>
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">System Settings</h1>
              <p className="text-gray-600">Configure system-wide settings and preferences</p>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                The system settings table does not exist. Click the button below to create it.
              </AlertDescription>
            </Alert>

            <Card className="bg-white border border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900">Setup Required</CardTitle>
                <CardDescription className="text-gray-600">
                  The system settings table needs to be created before you can manage settings.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={createTable} className="bg-blue-600 hover:bg-blue-700 text-white">
                  <DatabaseIcon className="mr-2 h-4 w-4" />
                  Create System Settings Table
                </Button>
              </CardContent>
            </Card>
          </div>
        </AdminLayout>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard allowedRoles={["admin"]}>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">System Settings</h1>
              <p className="text-gray-600">Configure system-wide settings and preferences</p>
            </div>
            <Button onClick={saveSettings} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
              <SaveIcon className="mr-2 h-4 w-4" />
              {loading ? "Saving..." : "Save Settings"}
            </Button>
          </div>

          <div className="grid gap-6">
            {/* General Settings */}
            <Card className="bg-white border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900">
                  <SettingsIcon className="mr-2 h-5 w-5" />
                  General Settings
                </CardTitle>
                <CardDescription className="text-gray-600">Basic system configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="system_name" className="text-gray-800">
                      System Name
                    </Label>
                    <Input
                      id="system_name"
                      value={settings.system_name}
                      onChange={(e) => setSettings({ ...settings, system_name: e.target.value })}
                      className="text-gray-900 bg-white border-gray-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max_file_size" className="text-gray-800">
                      Max File Size (MB)
                    </Label>
                    <Input
                      id="max_file_size"
                      type="number"
                      value={settings.max_file_size}
                      onChange={(e) => setSettings({ ...settings, max_file_size: Number.parseInt(e.target.value) })}
                      className="text-gray-900 bg-white border-gray-300"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="system_description" className="text-gray-800">
                    System Description
                  </Label>
                  <Textarea
                    id="system_description"
                    value={settings.system_description}
                    onChange={(e) => setSettings({ ...settings, system_description: e.target.value })}
                    rows={3}
                    className="text-gray-900 bg-white border-gray-300"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card className="bg-white border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900">
                  <ShieldIcon className="mr-2 h-5 w-5" />
                  Security Settings
                </CardTitle>
                <CardDescription className="text-gray-600">Security and access control settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-gray-800">Allow New Registrations</Label>
                    <p className="text-sm text-gray-600">Allow new users to register for accounts</p>
                  </div>
                  <Switch
                    checked={settings.allow_registration}
                    onCheckedChange={(checked) => setSettings({ ...settings, allow_registration: checked })}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-gray-800">Maintenance Mode</Label>
                    <p className="text-sm text-gray-600">Put the system in maintenance mode</p>
                  </div>
                  <Switch
                    checked={settings.maintenance_mode}
                    onCheckedChange={(checked) => setSettings({ ...settings, maintenance_mode: checked })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="session_timeout" className="text-gray-800">
                    Session Timeout (minutes)
                  </Label>
                  <Input
                    id="session_timeout"
                    type="number"
                    value={settings.session_timeout}
                    onChange={(e) => setSettings({ ...settings, session_timeout: Number.parseInt(e.target.value) })}
                    className="text-gray-900 bg-white border-gray-300"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card className="bg-white border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900">
                  <BellIcon className="mr-2 h-5 w-5" />
                  Notification Settings
                </CardTitle>
                <CardDescription className="text-gray-600">Configure system notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-gray-800">Email Notifications</Label>
                    <p className="text-sm text-gray-600">Send email notifications for important events</p>
                  </div>
                  <Switch
                    checked={settings.email_notifications}
                    onCheckedChange={(checked) => setSettings({ ...settings, email_notifications: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* System Information */}
            <Card className="bg-white border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900">
                  <DatabaseIcon className="mr-2 h-5 w-5" />
                  System Information
                </CardTitle>
                <CardDescription className="text-gray-600">Current system status and information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <UsersIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-blue-600">--</p>
                    <p className="text-sm text-gray-700">Total Users</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                    <DatabaseIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-green-600">Online</p>
                    <p className="text-sm text-gray-700">System Status</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <SettingsIcon className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-purple-600">v1.0</p>
                    <p className="text-sm text-gray-700">Version</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </AdminLayout>
    </AuthGuard>
  )
}
