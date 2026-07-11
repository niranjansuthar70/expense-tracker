export type GreetingPeriod = "Morning" | "Afternoon" | "Evening" | "Night"

export function getGreeting(date: Date): GreetingPeriod {
  const hour = date.getHours()

  if (hour >= 5 && hour < 12) return "Morning"
  if (hour >= 12 && hour < 17) return "Afternoon"
  if (hour >= 17 && hour < 22) return "Evening"
  return "Night"
}

export function formatGreeting(name: string, date = new Date()): string {
  return `${getGreeting(date)} ${name}`
}
