import type { Metadata } from "next"
import "./globals.css"

import { APP_TITLE } from "@/lib/constants"

export const metadata: Metadata = {
  title: APP_TITLE,
  description: "Personal expense tracker",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  )
}
