"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser, SignUpButton } from "@clerk/nextjs"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Venn } from "@/components/venn"
import Ripple from "@/components/ripple"

export default function Home() {
  const { isSignedIn, isLoaded } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace("/generate")
    }
  }, [isLoaded, isSignedIn, router])

  // If still loading auth state, or if the user is signed in (redirecting), show a minimal loader or blank page matching layout
  if (!isLoaded || isSignedIn) {
    return (
      <main className="flex h-screen w-full items-center justify-center bg-transparent">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </main>
    )
  }

  // Sample diagram content to display in the preview
  const previewDiagramContent = `
    <venn title-font="sans-serif" header-font="sans-serif" body-font="mono" color-1="blue" color-2="purple">
      <title>Diagramr AI</title>
      <circle header="Your Ideas">
          <item>Complex thoughts</item>
          <item>Raw data</item>
          <item>Vague concepts</item>
      </circle>
      <circle header="AI Precision">
          <item>Clean layout</item>
          <item>Smart structure</item>
          <item>Interactive styling</item>
      </circle>
      <overlap>
          <item>Perfect diagrams</item>
      </overlap>
    </venn>
  `

  return (
    <main className="relative flex min-h-screen w-full flex-col bg-transparent">
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 md:py-24">
        <div className="z-10 flex w-full max-w-4xl flex-col items-center gap-12 text-center">
          {/* Hero Content */}
          <div className="flex flex-col items-center gap-6">
            <h1 className="max-w-4xl font-serif text-4xl sm:text-5xl md:text-6xl">
              Beautiful diagrams from natural language
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground sm:text-xl">
              Turn your thoughts, comparisons, and concepts into precise,
              aesthetic diagrams instantly with Diagramr AI.
            </p>
            <div className="mt-4">
              <SignUpButton mode="modal">
                <Button size="xl">Get started for free</Button>
              </SignUpButton>
            </div>
          </div>

          {/* Graphic Preview */}
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-white shadow-xl dark:bg-zinc-950/50">
            <div className="flex items-center justify-between border-b bg-muted/50 px-4 py-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-green-400/80" />
              </div>
            </div>
            <div className="aspect-video max-h-[360px] min-h-[280px] w-full">
              <Venn>{previewDiagramContent}</Venn>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative background grid/elements */}
      <Ripple className="absolute inset-0 h-full w-full" />
    </main>
  )
}
