"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { signIn, resendConfirmation } from "@/lib/auth"
import { useAuth } from "@/hooks/use-auth"
import { Loader2, GraduationCap, Mail, AlertCircle, Shield } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showResendConfirmation, setShowResendConfirmation] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [showRegistrationInfo, setShowRegistrationInfo] = useState(false)
  const [showAdminBypass, setShowAdminBypass] = useState(false)
  const router = useRouter()
  const { refreshUser } = useAuth()

  const checkRegistrationStatus = async (email: string) => {
    try {
      const { data, error } = await supabase.from("registration_requests").select("*").eq("email", email).single()

      if (!error && data) {
        return data
      }
      return null
    } catch (err) {
      return null
    }
  }

  const handleAdminBypass = async () => {
    if (email !== "arslanmunawar1311@gmail.com") {
      setError("Admin bypass is only available for the administrator account.")
      return
    }

    setLoading(true)
    try {
      // Create admin user directly in the database if it doesn't exist
      const { data: authUser } = await supabase.auth.getUser()

      // Try to create/update admin user record
      const { error: adminError } = await supabase.from("users").upsert({
        id: authUser.data.user?.id || crypto.randomUUID(),
        email: email,
        full_name: "Arslan Munawar",
        role: "admin",
        is_approved: true,
      })

      if (adminError) {
        console.error("Admin bypass error:", adminError)
      }

      // Force refresh and redirect
      await refreshUser()
      router.push("/admin")
    } catch (err: any) {
      console.error("Admin bypass failed:", err)
      setError("Admin bypass failed. Please contact support.")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setShowResendConfirmation(false)
    setShowRegistrationInfo(false)
    setShowAdminBypass(false)

    try {
      await signIn(email, password)

      // Small delay to ensure auth state is updated
      await new Promise((resolve) => setTimeout(resolve, 500))

      await refreshUser()

      // Redirect to home - the auth guard will handle role-based routing
      router.push("/")
    } catch (err: any) {
      console.error("Login error:", err)
      const errorMessage = err.message || "An error occurred during login"

      if (errorMessage === "ADMIN_EMAIL_NOT_CONFIRMED") {
        setError("Admin email not confirmed. Use the bypass option below to proceed.")
        setShowAdminBypass(true)
      } else if (errorMessage === "EMAIL_NOT_CONFIRMED_APPROVED_USER") {
        setError("Your registration was approved but your email needs confirmation.")
        setShowResendConfirmation(true)
      } else if (errorMessage.includes("Invalid login credentials")) {
        // Check if user has a registration request
        const registrationData = await checkRegistrationStatus(email)

        if (registrationData) {
          if (registrationData.status === "pending") {
            setError(
              "Your registration is pending approval. You cannot log in until an administrator approves your account.",
            )
            setShowRegistrationInfo(true)
          } else if (registrationData.status === "rejected") {
            setError("Your registration request was rejected. Please contact an administrator for more information.")
            setShowRegistrationInfo(true)
          } else if (registrationData.status === "approved") {
            setError(
              "Your registration was approved but there was an issue creating your account. Please contact an administrator.",
            )
            setShowRegistrationInfo(true)
          } else {
            setError("Account not found. Please check your credentials or register for a new account.")
          }
        } else {
          setError("Invalid email or password. Please check your credentials or register for a new account.")
        }
      } else if (errorMessage.includes("confirmation") || errorMessage.includes("confirm")) {
        setError(errorMessage)
        setShowResendConfirmation(true)
      } else {
        setError(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResendConfirmation = async () => {
    if (!email) {
      setError("Please enter your email address first")
      return
    }

    setResendLoading(true)
    setError("")

    try {
      await resendConfirmation(email)
      setResendSuccess(true)
      setShowResendConfirmation(false)
    } catch (err: any) {
      setError(err.message || "Failed to resend confirmation email")
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <GraduationCap className="h-12 w-12 text-blue-600" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Student Portal</h2>
          <p className="mt-2 text-sm text-gray-600">Sign in to your account</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Sign In</CardTitle>
            <CardDescription className="text-center">Enter your credentials to access the portal</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="mt-1"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="mt-1"
                  placeholder="Enter your password"
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {resendSuccess && (
                <Alert>
                  <Mail className="h-4 w-4" />
                  <AlertDescription>
                    Confirmation email sent! Please check your inbox and click the confirmation link.
                  </AlertDescription>
                </Alert>
              )}

              {showAdminBypass && (
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription className="space-y-2">
                    <p>Admin email confirmation bypass available:</p>
                    <Button type="button" variant="outline" size="sm" onClick={handleAdminBypass} disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        "Bypass Email Confirmation (Admin Only)"
                      )}
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {showRegistrationInfo && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="space-y-2">
                    <p>If you believe this is an error, please contact the administrator.</p>
                    <div className="text-sm text-gray-600">
                      <p>Admin Email: arslanmunawar1311@gmail.com</p>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {showResendConfirmation && (
                <Alert>
                  <Mail className="h-4 w-4" />
                  <AlertDescription className="space-y-2">
                    <p>Your email address needs to be confirmed before you can sign in.</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleResendConfirmation}
                      disabled={resendLoading}
                    >
                      {resendLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        "Resend Confirmation Email"
                      )}
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">New to the portal?</span>
                </div>
              </div>

              <div className="mt-6 text-center">
                <Link href="/auth/register" className="font-medium text-blue-600 hover:text-blue-500">
                  Create an account
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Admin Login Info */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-sm font-medium text-blue-900 mb-2">Administrator Access</h3>
              <p className="text-xs text-blue-700">Admin Email: arslanmunawar1311@gmail.com</p>
              <p className="text-xs text-blue-600 mt-1">Regular users must register and wait for approval</p>
              <p className="text-xs text-blue-500 mt-1">Admin can bypass email confirmation if needed</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
