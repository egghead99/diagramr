"use client"

import { useState } from "react"
import { Prompt } from "@/components/prompt"
import { StyleConfig, DEFAULT_STYLE_CONFIG } from "@/components/style"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectItemLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Header } from "@/components/header"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Spinner } from "@/components/ui/spinner"
import { Venn } from "@/components/venn"
import { Diagram } from "@/components/diagram"
import { Generation } from "@/lib/samples"
import { Check } from "lucide-react"

import { generateDiagramAction } from "./actions"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useEffect } from "react"

const SUGGESTED_PROMPTS = [
  {
    name: "Differentiate cell types",
    prompt:
      "Show me a diagram of different types of cells, including prokaryotic and eukaryotic cells, with their key components.",
  },
  {
    name: "Contrast economic systems",
    prompt:
      "Create a Venn diagram comparing capitalism, socialism, and communism, highlighting their unique and shared characteristics.",
  },
  {
    name: "Compare the largest countries",
    prompt:
      "Generate a diagram of the top 5 largest countries by land area, showing their flags and approximate square mileage.",
  },
]

export default function Generate() {
  const [prompt, setPrompt] = useState("")
  const [diagramType, setDiagramType] = useState("venn")
  const [styleConfig, setStyleConfig] =
    useState<StyleConfig>(DEFAULT_STYLE_CONFIG)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCreditDialog, setShowCreditDialog] = useState(false)
  const [generatedResult, setGeneratedResult] = useState<Generation | null>(
    null
  )
  const router = useRouter()
  const { isSignedIn } = useUser()

  const handlePromptSubmit = async () => {
    if (!prompt.trim()) return
    setError(null)
    setGeneratedResult(null)
    setIsGenerating(true)
    try {
      const data = await generateDiagramAction({ prompt, styleConfig })
      // Build the Generation object from the returned data
      const gen: Generation = {
        id: data.id,
        name: data.name,
        type: data.type,
        prompt: data.prompt,
        content: data.content,
        userId: data.user_id,
        createdAt: new Date(data.created_at),
      }
      setGeneratedResult(gen)
      setIsGenerating(false)
      // Refresh sidebar data in the background
      router.refresh()
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("diagrams-changed"))
      }
    } catch (err: unknown) {
      console.error("Failed to generate diagram:", err)
      const errorMessage =
        err instanceof Error
          ? err.message
          : "An error occurred during generation"

      if (errorMessage.includes("out of generations")) {
        setShowCreditDialog(true)
        setIsGenerating(false)
        return
      }

      setError(errorMessage)
      setIsGenerating(false)
    }
  }

  const handleReset = () => {
    setGeneratedResult(null)
    setPrompt("")
    setIsGenerating(false)
    setError(null)
  }

  useEffect(() => {
    const onReset = () => handleReset()
    window.addEventListener("reset-generate", onReset)
    return () => window.removeEventListener("reset-generate", onReset)
  }, [])

  // Loading state
  if (isGenerating) {
    return (
      <main className="relative flex h-full w-full flex-1 flex-col">
        <Header className="w-full" />
        {isSignedIn && (
          <div className="absolute top-4 left-4 z-50">
            <SidebarTrigger />
          </div>
        )}
        <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden">
          {error ? (
            <div className="flex flex-col items-center gap-2 text-center font-medium text-destructive">
              <p>Failed to generate diagram</p>
              <p className="text-sm font-normal text-muted-foreground">
                {error}
              </p>
              <Button
                variant="secondary"
                onClick={() => {
                  setError(null)
                  setIsGenerating(false)
                }}
              >
                Try again
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <Spinner />
              <p className="text-muted-foreground">
                Generating your diagram...
              </p>
            </div>
          )}
        </div>
      </main>
    )
  }

  // Completion state — diagram was generated successfully
  if (generatedResult) {
    return (
      <main className="relative flex h-full w-full flex-1 flex-col">
        <Header className="w-full" />
        {isSignedIn && (
          <div className="absolute top-4 left-4 z-50">
            <SidebarTrigger />
          </div>
        )}
        <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden">
          <div className="flex w-full max-w-md flex-col items-center gap-6 px-6">
            {/* Success indicator */}
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                <Check className="h-5 w-5" />
              </div>
              <p className="text-lg font-medium">Diagram generated</p>
              <p className="text-center text-sm text-pretty text-muted-foreground">
                &ldquo;{generatedResult.name}&rdquo; is ready. Click the preview
                to view details.
              </p>
            </div>

            <Diagram
              gen={generatedResult}
              onSave={() => router.refresh()}
              onDelete={() => {
                handleReset()
                router.refresh()
              }}
            >
              <div className="group w-full cursor-pointer overflow-hidden rounded-xl border border-border bg-white transition-all hover:shadow-sm">
                <div className="aspect-4/3 w-full">
                  <Venn>{generatedResult.content as string}</Venn>
                </div>
                <div className="border-t bg-secondary px-4 py-3">
                  <p className="truncate text-sm font-medium">
                    {generatedResult.name}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Click to edit, export, or style
                  </p>
                </div>
              </div>
            </Diagram>

            {/* Actions */}
            <div className="flex flex-row gap-2">
              <Button size="sm" onClick={handleReset}>
                Generate another
              </Button>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="relative flex h-full w-full flex-1 flex-col">
      <Header className="w-full" />
      {isSignedIn && (
        <div className="absolute top-4 left-4 z-50">
          <SidebarTrigger />
        </div>
      )}
      <div className="relative flex h-full flex-1 flex-col overflow-hidden px-10 py-20">
        <div className="relative z-10 flex h-full w-full flex-col items-center gap-10 px-6">
          {/* Hero */}
          <div className="flex w-full flex-col gap-6 text-left">
            <div className="flex flex-row items-center gap-4">
              <span className="w-fit font-serif text-6xl text-blue-500">
                What are you comparing today?
              </span>
            </div>
            <p className="w-fit text-left text-lg">
              Type a comparison, list of topics, or concepts. Our AI will
              automatically extract sets, overlaps, and generate a pixel-perfect
              diagram.
            </p>
          </div>

          <div className="flex h-full w-full flex-col gap-4">
            {/* Prompt */}
            <Prompt
              value={prompt}
              onChange={setPrompt}
              config={styleConfig}
              onConfigChange={setStyleConfig}
              onSubmit={handlePromptSubmit}
            />

            {/* Suggested prompts */}
            <div className="flex flex-row justify-center gap-2">
              {SUGGESTED_PROMPTS.map((item) => (
                <Button
                  key={item.name}
                  onClick={() => {
                    setPrompt(item.prompt)
                  }}
                  size="lg"
                  variant="outline"
                >
                  {item.name}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showCreditDialog} onOpenChange={setShowCreditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Out of credits</DialogTitle>
            <DialogDescription>
              You've used all your available diagram generations. Upgrade your
              plan to get more credits and continue generating.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreditDialog(false)}
            >
              Cancel
            </Button>
            <Button asChild>
              <Link href="/pricing">Upgrade Plan</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
