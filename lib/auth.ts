import { supabase } from "./supabase"
import type { User, UserRole } from "./supabase"

export async function signUp(
  email: string,
  password: string,
  userData: {
    full_name: string
    role: UserRole
    student_id?: string
    department?: string
    year_level?: number
    phone?: string
  },
) {
  const isAdmin = email === "arslanmunawar1311@gmail.com"

  // For admin, create the auth user without email confirmation requirement
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: userData,
      emailRedirectTo: `${window.location.origin}/auth/confirm`,
    },
  })

  if (error) throw error

  if (data.user) {
    if (isAdmin) {
      // For admin, create user record directly and confirm email programmatically
      const { error: userError } = await supabase.from("users").upsert({
        id: data.user.id,
        email,
        full_name: userData.full_name,
        role: "admin",
        is_approved: true,
        department: userData.department,
        phone: userData.phone,
      })

      if (userError) {
        console.error("Error creating admin user:", userError)
      }
    } else {
      // For non-admin users, create registration request
      const { error: requestError } = await supabase.from("registration_requests").insert({
        email,
        full_name: userData.full_name,
        role: userData.role,
        student_id: userData.student_id,
        department: userData.department,
        year_level: userData.year_level,
        phone: userData.phone,
      })

      if (requestError) {
        console.error("Error creating registration request:", requestError)
      }
    }
  }

  return data
}

export async function signIn(email: string, password: string) {
  // First, try normal sign in
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    // Handle specific error cases
    if (error.message === "Email not confirmed") {
      // Check if this is an admin or if user has approved registration
      if (email === "arslanmunawar1311@gmail.com") {
        // For admin, try to confirm email automatically
        try {
          // Get the user's confirmation token (this is a workaround)
          console.log("Admin login - attempting to bypass email confirmation")

          // Create a temporary session for admin
          const { data: adminData, error: adminError } = await supabase.auth.signInWithPassword({
            email,
            password,
          })

          if (adminError && adminError.message === "Email not confirmed") {
            // For development/testing, we'll allow admin to proceed
            throw new Error("ADMIN_EMAIL_NOT_CONFIRMED")
          }

          return adminData
        } catch (adminErr) {
          throw new Error("ADMIN_EMAIL_NOT_CONFIRMED")
        }
      } else {
        // For regular users, check if they have an approved registration
        const { data: requestData } = await supabase
          .from("registration_requests")
          .select("*")
          .eq("email", email)
          .single()

        if (requestData && requestData.status === "approved") {
          throw new Error("EMAIL_NOT_CONFIRMED_APPROVED_USER")
        } else {
          throw new Error("Please check your email and click the confirmation link before signing in.")
        }
      }
    }

    // For invalid credentials, provide more context
    if (error.message === "Invalid login credentials") {
      throw new Error("Invalid login credentials")
    }

    throw error
  }

  // For admin, ensure user record exists
  if (data.user && email === "arslanmunawar1311@gmail.com") {
    const { error: upsertError } = await supabase.from("users").upsert({
      id: data.user.id,
      email: email,
      full_name: "Arslan Munawar",
      role: "admin",
      is_approved: true,
    })

    if (upsertError) {
      console.error("Error ensuring admin user exists:", upsertError)
    }
  }

  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !authUser) {
      return null
    }

    // For admin, ensure user record exists before querying
    if (authUser.email === "arslanmunawar1311@gmail.com") {
      const { error: upsertError } = await supabase.from("users").upsert({
        id: authUser.id,
        email: authUser.email,
        full_name: "Arslan Munawar",
        role: "admin",
        is_approved: true,
      })

      if (upsertError) {
        console.error("Error upserting admin user:", upsertError)
      }
    }

    // Try to get the user data from our users table
    const { data: userData, error: userError } = await supabase.from("users").select("*").eq("id", authUser.id).single()

    if (userError) {
      console.error("Error fetching user data:", userError)

      // If user doesn't exist in our users table, check if they have a registration
      if (userError.code === "PGRST116") {
        // Check for registration request by email
        const { data: requestData, error: requestError } = await supabase
          .from("registration_requests")
          .select("*")
          .eq("email", authUser.email)
          .single()

        if (!requestError && requestData) {
          if (requestData.status === "pending") {
            // Sign out the user since they can't access the system yet
            await supabase.auth.signOut()
            throw new Error("PENDING_APPROVAL")
          } else if (requestData.status === "rejected") {
            // Sign out the user since they were rejected
            await supabase.auth.signOut()
            throw new Error("REGISTRATION_REJECTED")
          } else if (requestData.status === "approved") {
            // Registration was approved but user record doesn't exist, create it
            const { data: newUser, error: createError } = await supabase
              .from("users")
              .insert({
                id: authUser.id,
                email: authUser.email,
                full_name: requestData.full_name,
                role: requestData.role,
                student_id: requestData.student_id,
                department: requestData.department,
                year_level: requestData.year_level,
                phone: requestData.phone,
                is_approved: true,
              })
              .select()
              .single()

            if (createError) {
              console.error("Error creating approved user:", createError)
              await supabase.auth.signOut()
              throw new Error("ACCOUNT_CREATION_ERROR")
            }

            return newUser
          }
        }

        // No registration request found - this shouldn't happen for valid users
        await supabase.auth.signOut()
        throw new Error("NO_REGISTRATION_FOUND")
      }

      return null
    }

    // Check if user is approved
    if (!userData.is_approved) {
      await supabase.auth.signOut()
      throw new Error("PENDING_APPROVAL")
    }

    return userData
  } catch (error) {
    console.error("Error in getCurrentUser:", error)
    throw error
  }
}

export async function updateUserProfile(userId: string, updates: Partial<User>) {
  const { data, error } = await supabase.from("users").update(updates).eq("id", userId).select().single()

  if (error) throw error
  return data
}

export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  })

  if (error) throw error
}

export async function resendConfirmation(email: string) {
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/confirm`,
    },
  })

  if (error) throw error
}

export async function confirmEmail(token: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: token,
    type: "email",
  })

  if (error) throw error
  return data
}
