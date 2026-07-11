import { LogoutButton } from "@/components/LogoutButton"
import { WelcomeGreeting } from "@/components/WelcomeGreeting"
import { checkAllowlist } from "@/lib/auth/allowlist"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function WelcomePage() {
  const supabase = await createClient()
  const allowlist = await checkAllowlist(supabase)

  if (!allowlist.allowed) {
    await supabase.auth.signOut()
    redirect("/login")
  }

  return (
    <main className="flex min-h-screen flex-col bg-gray-50">
      <header className="flex flex-col gap-3 border-b border-gray-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <WelcomeGreeting name={allowlist.name} />
        <LogoutButton />
      </header>
      <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-lg text-center">
          <h1 className="text-3xl font-semibold text-gray-900 sm:text-4xl">
            Welcome
          </h1>
          <p className="mt-3 text-base text-gray-600 sm:text-lg">
            You&apos;re logged in. Expense tracker coming soon.
          </p>
        </div>
      </div>
    </main>
  )
}
