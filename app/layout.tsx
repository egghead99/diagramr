import {
  JetBrains_Mono,
  Geist,
  Space_Grotesk,
  Instrument_Serif,
} from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"
import { TooltipProvider } from "@/components/ui/tooltip"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { ClerkProvider } from "@clerk/nextjs"

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: "400",
})

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-logo",
})

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "font-sans antialiased",
        jetbrainsMono.variable,
        geist.variable,
        spaceGrotesk.variable,
        instrumentSerif.variable
      )}
    >
      <body>
        <ClerkProvider>
          <ThemeProvider>
            <TooltipProvider>
              <SidebarProvider>
                <AppSidebar />
                <SidebarInset>{children}</SidebarInset>
              </SidebarProvider>
            </TooltipProvider>
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  )
}
