"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, Loader2, GraduationCap } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function ConfirmPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        const token_hash = searchParams.get("token_hash")
        const type = searchParams.get("type")

        if (token_hash && type) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash,
            type: type as any,
          })

          if (error) {
            throw error
          }

          setStatus("success")
          setMessage("Your email has been confirmed successfully! You can now sign in to your account.")
        } else {
          throw new Error("Invalid confirmation link")
        }
      } catch (error: any) {
        console.error("Email confirmation error:", error)
        setStatus("error")
        setMessage(error.message || "Failed to confirm email. Please try again or contact support.")
      }
    }

    handleEmailConfirmation()
  }, [searchParams])

  const handleContinue = () => {
    router.push("/auth/login")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <GraduationCap className="h-12 w-12 text-blue-600" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Student Portal</h2>
          <p className="mt-2 text-sm text-gray-600">Email Confirmation</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              {status === "loading" && "Confirming Email..."}
              {status === "success" && "Email Confirmed!"}
              {status === "error" && "Confirmation Failed"}
            </CardTitle>
            <CardDescription className="text-center">
              {status === "loading" && "Please wait while we confirm your email address"}
              {status === "success" && "Your account is now ready to use"}
              {status === "error" && "There was an issue confirming your email"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center">
              {status === "loading" && <Loader2 className="h-12 w-12 animate-spin text-blue-600" />}
              {status === "success" && <CheckCircle className="h-12 w-12 text-green-600" />}
              {status === "error" && <XCircle className="h-12 w-12 text-red-600" />}
            </div>

            <Alert variant={status === "error" ? "destructive" : "default"}>
              <AlertDescription className="text-center">{message}</AlertDescription>
            </Alert>

            {status !== "loading" && (
              <Button onClick={handleContinue} className="w-full">
                {status === "success" ? "Continue to Sign In" : "Back to Sign In"}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
