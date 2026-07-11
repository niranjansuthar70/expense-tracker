"use client"

import { formatGreeting } from "@/lib/greeting"

type WelcomeGreetingProps = {
  name: string
}

export function WelcomeGreeting({ name }: WelcomeGreetingProps) {
  return (
    <p className="text-base font-medium text-gray-900">
      {formatGreeting(name)}
    </p>
  )
}
