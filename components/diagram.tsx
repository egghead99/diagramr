import { useState, useRef, useCallback, ReactNode } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Generation } from "@/lib/samples"
import { Venn, parseStyleFromContent } from "./venn"
import { Style, StyleConfig } from "./style"
import { timeAgo } from "./app-sidebar"
import { useSession } from "@clerk/nextjs"
import { createClient } from "@supabase/supabase-js"

/**
 * Apply a StyleConfig back into the venn content markup by replacing/adding
 * attributes on the `<venn>` tag.
 */
function applyStyleToContent(content: string, config: StyleConfig): string {
  const attrMap: Record<string, string> = {
    "title-font": config.titleFont,
    "header-font": config.headerFont,
    "body-font": config.bodyFont,
    "color-1": config.circle1Fill,
    "border-color-1": config.circle1Ring,
    "color-2": config.circle2Fill,
    "border-color-2": config.circle2Ring,
  }

  return content.replace(/<venn\s([^>]*)>/, (_match, existingAttrs: string) => {
    let attrs = existingAttrs

    for (const [attrName, attrValue] of Object.entries(attrMap)) {
      const attrRegex = new RegExp(`${attrName}="[^"]*"`, "i")
      const isBorderColor = attrName.startsWith("border-color")
      if (isBorderColor && attrValue === "none") {
        // Remove the attribute entirely if it exists
        attrs = attrs.replace(attrRegex, "").replace(/\s+/g, " ").trim()
      } else if (attrRegex.test(attrs)) {
        attrs = attrs.replace(attrRegex, `${attrName}="${attrValue}"`)
      } else {
        attrs = attrs.trimEnd() + ` ${attrName}="${attrValue}"`
      }
    }

    return `<venn ${attrs}>`
  })
}

export function Diagram({
  gen,
  children,
  onSave,
  onDelete,
}: {
  gen: Generation
  children: ReactNode
  onSave?: () => void
  onDelete?: () => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [showAlert, setShowAlert] = useState(false)
  const [showDeleteAlert, setShowDeleteAlert] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(gen.name)
  const [content, setContent] = useState(gen.content as string)
  const [styleConfig, setStyleConfig] = useState<StyleConfig | null>(null)
  const [updatedAt, setUpdatedAt] = useState(gen.createdAt)

  // Track whether anything has been modified
  const originalNameRef = useRef(gen.name)
  const originalContentRef = useRef(gen.content as string)

  const hasChanges =
    name.trim() !== originalNameRef.current ||
    content !== originalContentRef.current

  const { session } = useSession()

  function createClerkSupabaseClient() {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        async accessToken() {
          return session?.getToken() ?? null
        },
      }
    )
  }

  const handleRename = () => {
    const trimmedName = name.trim()
    const finalName = trimmedName || "Untitled diagram"
    setName(finalName)
    setIsEditing(false)
  }

  const handleStyleChange = useCallback(
    (newConfig: StyleConfig) => {
      setStyleConfig(newConfig)
      const newContent = applyStyleToContent(content, newConfig)
      setContent(newContent)
    },
    [content]
  )

  const handleStyleLoaded = useCallback((config: StyleConfig) => {
    setStyleConfig((prev) => {
      if (prev && JSON.stringify(prev) === JSON.stringify(config)) {
        return prev
      }
      return config
    })
  }, [])

  const saveToSupabase = useCallback(
    async (finalName: string, finalContent: string) => {
      const hasChanged =
        finalName !== originalNameRef.current ||
        finalContent !== originalContentRef.current

      if (!hasChanged) return

      const client = createClerkSupabaseClient()
      const now = new Date()

      const { error } = await client
        .from("gens")
        .update({
          name: finalName,
          content: finalContent,
          created_at: now.toISOString(),
        })
        .eq("id", gen.id)

      if (!error) {
        setUpdatedAt(now)
        // Update refs so subsequent opens know the new baseline
        originalNameRef.current = finalName
        originalContentRef.current = finalContent
        onSave?.()
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("diagrams-changed"))
        }
      }
    },
    [gen.id, session, onSave]
  )

  const handleSave = useCallback(async () => {
    const finalName = name.trim() || "Untitled diagram"
    setName(finalName)
    setIsEditing(false)
    await saveToSupabase(finalName, content)
    setIsOpen(false)
    setStyleConfig(null)
  }, [name, content, saveToSupabase])

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        const hasUnsavedChanges =
          name.trim() !== originalNameRef.current ||
          content !== originalContentRef.current

        if (hasUnsavedChanges) {
          setShowAlert(true)
        } else {
          setIsOpen(false)
          setStyleConfig(null)
        }
      } else {
        setIsOpen(true)
      }
    },
    [name, content]
  )

  const handleSaveAlert = useCallback(async () => {
    const finalName = name.trim() || "Untitled diagram"
    setName(finalName)
    setIsEditing(false)
    await saveToSupabase(finalName, content)
    setShowAlert(false)
    setIsOpen(false)
    setStyleConfig(null)
  }, [name, content, saveToSupabase])

  const handleDiscard = useCallback(() => {
    setName(originalNameRef.current)
    setContent(originalContentRef.current)
    setStyleConfig(null)
    setShowAlert(false)
    setIsOpen(false)
  }, [])

  const handleCancelAlert = useCallback(() => {
    setShowAlert(false)
  }, [])

  const handleDelete = useCallback(async () => {
    const client = createClerkSupabaseClient()
    const { error } = await client.from("gens").delete().eq("id", gen.id)

    if (!error) {
      setShowDeleteAlert(false)
      setIsOpen(false)
      setStyleConfig(null)
      onDelete?.()
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("diagrams-changed"))
      }
    } else {
      console.error("Failed to delete diagram:", error)
    }
  }, [gen.id, session, onDelete])

  const handleExport = useCallback(
    (format: "png" | "svg") => {
      // Find the SVG element inside the venn preview container
      const container = document.getElementById(`venn-preview-${gen.id}`)
      if (!container) return
      const svgEl = container.querySelector("svg")
      if (!svgEl) return

      if (format === "svg") {
        const serializer = new XMLSerializer()
        const svgStr = serializer.serializeToString(svgEl)
        const blob = new Blob([svgStr], { type: "image/svg+xml" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${name || "diagram"}.svg`
        a.click()
        URL.revokeObjectURL(url)
      } else {
        const serializer = new XMLSerializer()
        const svgStr = serializer.serializeToString(svgEl)
        const svgBlob = new Blob([svgStr], {
          type: "image/svg+xml;charset=utf-8",
        })
        const url = URL.createObjectURL(svgBlob)
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement("canvas")
          canvas.width =
            svgEl.viewBox?.baseVal?.width || svgEl.clientWidth || 800
          canvas.height =
            svgEl.viewBox?.baseVal?.height || svgEl.clientHeight || 600
          const ctx = canvas.getContext("2d")
          if (!ctx) return
          ctx.fillStyle = "#ffffff"
          ctx.fillRect(0, 0, canvas.width, canvas.height)
          ctx.drawImage(img, 0, 0)
          URL.revokeObjectURL(url)
          const pngUrl = canvas.toDataURL("image/png")
          const a = document.createElement("a")
          a.href = pngUrl
          a.download = `${name || "diagram"}.png`
          a.click()
        }
        img.src = url
      }
    },
    [gen.id, name]
  )

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            {isEditing ? (
              <div className="-mx-2.5 -my-1.5 flex w-fit flex-row items-center gap-2 rounded-md border px-2 py-1">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleRename()}
                  onBlur={handleRename}
                  autoFocus
                  className="field-sizing-content text-base font-medium outline-none"
                />
              </div>
            ) : (
              <p
                className="-mx-2.5 -my-1.5 w-fit cursor-pointer items-center rounded-md border border-transparent px-2 py-1 text-base font-medium hover:bg-secondary"
                onClick={() => setIsEditing(true)}
              >
                {name}
              </p>
            )}
            <DialogTitle className="sr-only">Edit diagram</DialogTitle>
            <p className="text-xs">Updated {timeAgo(updatedAt)}</p>
            <DialogDescription className="line-clamp-4">
              {gen.prompt}
            </DialogDescription>
          </DialogHeader>
          <div
            id={`venn-preview-${gen.id}`}
            className="relative overflow-hidden rounded-lg border"
          >
            <Venn onStyleLoaded={handleStyleLoaded}>{content}</Venn>
            {styleConfig && (
              <div className="absolute top-2 right-2">
                <Style
                  variant="secondary"
                  size="sm"
                  config={styleConfig}
                  onChange={handleStyleChange}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <div className="flex w-full flex-row justify-between">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteAlert(true)}
              >
                Delete
              </Button>
              <div className="flex flex-row gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleExport("png")}>
                      Export as PNG
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport("svg")}>
                      Export as SVG
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSave}
                  disabled={!hasChanges}
                >
                  Save
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAlert} onOpenChange={setShowAlert}>
        <DialogContent className="sm:max-w-xs" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Unsaved changes</DialogTitle>
            <DialogDescription>
              Would you like to save your changes to "{name}" before closing?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={handleDiscard}
              className="sm:mr-auto"
            >
              Discard
            </Button>
            <Button variant="outline" onClick={handleCancelAlert}>
              Cancel
            </Button>
            <Button onClick={handleSaveAlert}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <DialogContent className="sm:max-w-xs" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Delete diagram</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{name}"? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteAlert(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
