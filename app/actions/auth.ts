"use server"

import { redirect } from "next/navigation"

import { checkAllowlist } from "@/lib/auth/allowlist"
import { createClient } from "@/lib/supabase/server"

export type AuthActionState = {
  error?: string
}

const INVALID_CREDENTIALS = "Invalid email or password"
const ACCESS_DENIED = "Access denied. Contact your administrator."
const GENERIC_ERROR = "Something went wrong. Please try again."

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export async function login(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = formData.get("email")
  const password = formData.get("password")

  if (typeof email !== "string" || typeof password !== "string") {
    return { error: INVALID_CREDENTIALS }
  }

  if (!email.trim() || !password) {
    return { error: INVALID_CREDENTIALS }
  }

  try {
    const supabase = await createClient()

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: normalizeEmail(email),
      password,
    })

    if (signInError) {
      return { error: INVALID_CREDENTIALS }
    }

    const allowlist = await checkAllowlist(supabase)

    if (!allowlist.allowed) {
      await supabase.auth.signOut()
      return { error: ACCESS_DENIED }
    }
  } catch {
    return { error: GENERIC_ERROR }
  }

  redirect("/welcome")
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}
