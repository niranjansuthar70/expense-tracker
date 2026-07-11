import type { SupabaseClient } from "@supabase/supabase-js"

export type AllowlistResult =
  | { allowed: true; name: string }
  | { allowed: false }

type AdminUserRow = {
  name: string
  is_active: boolean
}

export async function checkAllowlist(
  supabase: SupabaseClient
): Promise<AllowlistResult> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user?.email) {
    return { allowed: false }
  }

  const { data, error } = await supabase
    .from("admin_users")
    .select("name, is_active")
    .maybeSingle()

  if (error || !data) {
    return { allowed: false }
  }

  const row = data as AdminUserRow

  if (!row.is_active) {
    return { allowed: false }
  }

  return { allowed: true, name: row.name }
}
