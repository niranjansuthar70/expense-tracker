import { checkAllowlist } from "@/lib/auth/allowlist"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function Home() {
  const supabase = await createClient()
  const allowlist = await checkAllowlist(supabase)

  if (allowlist.allowed) {
    redirect("/welcome")
  }

  redirect("/login")
}
