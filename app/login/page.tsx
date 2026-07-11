import { LoginForm } from "@/components/LoginForm"
import { checkAllowlist } from "@/lib/auth/allowlist"
import { APP_TITLE } from "@/lib/constants"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function LoginPage() {
  const supabase = await createClient()
  const allowlist = await checkAllowlist(supabase)

  if (allowlist.allowed) {
    redirect("/welcome")
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8 sm:px-6">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow sm:p-8">
        <h1 className="text-center text-xl font-semibold leading-snug text-gray-900 sm:text-2xl">
          {APP_TITLE}
        </h1>
        <p className="mt-2 text-center text-sm text-gray-500">
          Sign in with your approved account
        </p>
        <LoginForm />
      </div>
    </main>
  )
}
