"use client"

import { VennCompiler, VennCompileError } from "@/lib/compiler"
import { useEffect, useState } from "react"
import { StyleConfig, DEFAULT_STYLE_CONFIG } from "./style"

export function parseStyleFromContent(content: string): StyleConfig {
  const config = { ...DEFAULT_STYLE_CONFIG }

  const vennMatch = content.match(/<venn\s([^>]*)>/)
  if (!vennMatch) return config

  const attrs = vennMatch[1]

  const getAttr = (name: string): string | null => {
    const match = attrs.match(new RegExp(`${name}="([^"]*)"`, "i"))
    return match ? match[1] : null
  }

  config.titleFont = getAttr("title-font") || config.titleFont
  config.headerFont = getAttr("header-font") || config.headerFont
  config.bodyFont = getAttr("body-font") || config.bodyFont
  config.circle1Fill = getAttr("color-1") || config.circle1Fill
  config.circle1Ring = getAttr("border-color-1") || config.circle1Ring
  config.circle2Fill = getAttr("color-2") || config.circle2Fill
  config.circle2Ring = getAttr("border-color-2") || config.circle2Ring

  return config
}

interface VennProps {
  children: string
  onStyleLoaded?: (config: StyleConfig) => void
}

export function Venn({ children, onStyleLoaded }: VennProps) {
  const [svg, setSvg] = useState<string | null>(null)
  const [error, setError] = useState<VennCompileError | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    try {
      const result = VennCompiler.compile(children)
      if (typeof result === "string") {
        setSvg(result)
        setError(null)
        if (onStyleLoaded) {
          const config = parseStyleFromContent(children)
          onStyleLoaded(config)
        }
      } else {
        setError(result)
        setSvg(null)
      }
    } catch (e) {
      setError({
        status: "error",
        errorType: "RUNTIME_ERROR",
        message: "An unexpected error occurred during compilation.",
        details: e instanceof Error ? e.message : String(e),
      })
      setSvg(null)
    }
  }, [children, mounted, onStyleLoaded])

  if (!mounted) return <div className="aspect-4/3 h-full w-full bg-white" />

  if (error) {
    return (
      <div className="flex aspect-4/3 h-full w-full flex-col items-center justify-center gap-1 bg-red-100">
        <h3
          className="text-lg text-red-800"
          style={{ fontFamily: "Helvetica, sans-serif" }}
        >
          {error.message}
        </h3>
        <p
          className="max-w-3/4 text-center text-sm text-red-800/60"
          style={{ fontFamily: "var(--font-jetbrains), monospace" }}
        >
          {error.details}
        </p>
      </div>
    )
  }

  if (!svg) return null

  return (
    <div
      className="h-full w-full bg-white"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
