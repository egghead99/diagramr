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
import { ArrowUp } from "lucide-react"

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
    <div className="relative flex w-full flex-col gap-4 rounded-xl border bg-background p-4 shadow-sm">
      <textarea
        placeholder="Describe the diagram you want to create..."
        className="field-sizing-content max-h-48 resize-none bg-transparent text-base outline-none placeholder:text-muted-foreground/60"
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
      <div className="flex w-full flex-row items-center justify-end gap-2">
        <Style variant="secondary" config={config} onChange={onConfigChange} />
        <Button
          size="icon"
          className="rounded-full bg-blue-300 text-blue-800 hover:cursor-pointer hover:opacity-90 disabled:opacity-70 dark:bg-blue-700 dark:text-blue-200"
          disabled={!value.trim()}
          onClick={onSubmit}
        >
          <ArrowUp />
        </Button>
      </div>
    </div>
  )
}
