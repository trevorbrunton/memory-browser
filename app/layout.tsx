import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { QueryProvider } from "./query-provider"
import { ClerkProvider } from "@clerk/nextjs";

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "cronicle",
  description: "Tell your story, your way",
};

export default function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
      <ClerkProvider dynamic>
          <QueryProvider>{children}</QueryProvider>
      </ClerkProvider>
      </body>
    </html>
  )
}
