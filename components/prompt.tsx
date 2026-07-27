import { Style, StyleConfig } from "./style"
import { Button } from "./ui/button"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowRight } from "lucide-react"
import { Kbd } from "./ui/kbd"

interface PromptProps {
  value: string
  onChange: (value: string) => void
  config?: StyleConfig
  onConfigChange?: (config: StyleConfig) => void
  onSubmit?: () => void
}

export function Prompt({
  value,
  onChange,
  config,
  onConfigChange,
  onSubmit,
}: PromptProps) {
  return (
    <div className="relative flex h-full w-full flex-col justify-between gap-4 rounded-xl border bg-neutral-50 p-4 shadow-xl shadow-neutral-200/25">
      <textarea
        placeholder="e.g., React vs Vue vs Angular, or Introvert vs Extrovert..."
        className="h-auto resize-none bg-transparent text-base outline-none placeholder:text-muted-foreground/60"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            if (value.trim() && onSubmit) {
              onSubmit()
            }
          }
        }}
      />
      <div className="flex w-full flex-row items-center justify-between gap-2">
        <Style variant="outline" config={config} onChange={onConfigChange} />
        <div className="flex flex-row items-center gap-2">
          <Kbd className="gap-0.5 px-2 py-1 text-sm">
            Enter <span className="text-xs text-neutral-400">⏎</span>
          </Kbd>
          <Button
            className="gap-1 rounded-full bg-blue-500 px-3 text-white transition-colors hover:cursor-pointer hover:italic hover:opacity-90 disabled:opacity-70"
            disabled={!value.trim()}
            onClick={onSubmit}
          >
            Generate <ArrowRight />
          </Button>
        </div>
      </div>
    </div>
  )
}
