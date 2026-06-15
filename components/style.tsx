import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { COLOR_MAP, FONTS } from "@/lib/data"
import { useState } from "react"
import { ScrollArea } from "./ui/scroll-area"

export interface StyleConfig {
  titleFont: string
  headerFont: string
  bodyFont: string
  circle1Fill: string
  circle1Ring: string
  circle2Fill: string
  circle2Ring: string
}

export const DEFAULT_STYLE_CONFIG: StyleConfig = {
  titleFont: "serif",
  headerFont: "sans-serif",
  bodyFont: "mono",
  circle1Fill: "blue",
  circle1Ring: "none",
  circle2Fill: "red",
  circle2Ring: "none",
}

export interface StyleProps {
  size?: "default" | "sm" | "lg" | "xs"
  variant?: "secondary" | "outline"
  config?: StyleConfig
  onChange?: (config: StyleConfig) => void
}

const COLOR_KEYS = Object.keys(COLOR_MAP).filter((c) => c !== "none")

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function ColorSelect({
  value,
  onValueChange,
  label,
  includeNone = false,
}: {
  value: string
  onValueChange: (value: string) => void
  label: string
  includeNone?: boolean
}) {
  return (
    <div className="flex flex-col gap-1">
      <Label className="font-mono text-2xs text-muted-foreground">
        {label}
      </Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger size="sm" className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {includeNone && (
            <SelectItem value="none">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-foreground shadow-xs" />
                None
              </div>
            </SelectItem>
          )}
          {COLOR_KEYS.map((c) => (
            <SelectItem key={c} value={c}>
              <div className="flex items-center gap-1.5">
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: COLOR_MAP[c] }}
                />
                {capitalize(c)}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export function Style({ size, variant, config, onChange }: StyleProps = {}) {
  const [localConfig, setLocalConfig] =
    useState<StyleConfig>(DEFAULT_STYLE_CONFIG)

  const activeConfig = config !== undefined ? config : localConfig

  const updateConfig = (key: keyof StyleConfig, value: string) => {
    const nextConfig = { ...activeConfig, [key]: value }
    if (onChange) {
      onChange(nextConfig)
    } else {
      setLocalConfig(nextConfig)
    }
  }

  const titleFont = activeConfig.titleFont
  const headerFont = activeConfig.headerFont
  const bodyFont = activeConfig.bodyFont

  const circle1Fill = activeConfig.circle1Fill
  const circle1Ring = activeConfig.circle1Ring
  const circle2Fill = activeConfig.circle2Fill
  const circle2Ring = activeConfig.circle2Ring

  const setTitleFont = (val: string) => updateConfig("titleFont", val)
  const setHeaderFont = (val: string) => updateConfig("headerFont", val)
  const setBodyFont = (val: string) => updateConfig("bodyFont", val)

  const setCircle1Fill = (val: string) => updateConfig("circle1Fill", val)
  const setCircle1Ring = (val: string) => updateConfig("circle1Ring", val)
  const setCircle2Fill = (val: string) => updateConfig("circle2Fill", val)
  const setCircle2Ring = (val: string) => updateConfig("circle2Ring", val)

  const fontConfigs = [
    {
      id: "title-font",
      label: "Title",
      value: titleFont,
      setValue: setTitleFont,
    },
    {
      id: "header-font",
      label: "Header",
      value: headerFont,
      setValue: setHeaderFont,
    },
    { id: "body-font", label: "Body", value: bodyFont, setValue: setBodyFont },
  ]

  const circleConfigs = [
    {
      id: 1,
      label: "Circle 1",
      fill: circle1Fill,
      setFill: setCircle1Fill,
      ring: circle1Ring,
      setRing: setCircle1Ring,
    },
    {
      id: 2,
      label: "Circle 2",
      fill: circle2Fill,
      setFill: setCircle2Fill,
      ring: circle2Ring,
      setRing: setCircle2Ring,
    },
  ]

  return (
    <Popover modal={true}>
      <PopoverTrigger asChild>
        <Button variant={variant} size={size}>
          Style
          <div className="flex h-3.5 w-3.5 flex-col overflow-hidden rounded-full">
            <div className="flex h-1/2 flex-row">
              <div
                className="h-full w-1/2"
                style={{ backgroundColor: COLOR_MAP[circle1Fill] }}
              />
              <div
                className="h-full w-1/2"
                style={{ backgroundColor: COLOR_MAP[circle1Ring] }}
              />
            </div>
            <div className="flex h-1/2 flex-row">
              <div
                className="h-full w-1/2"
                style={{ backgroundColor: COLOR_MAP[circle2Fill] }}
              />
              <div
                className="h-full w-1/2"
                style={{ backgroundColor: COLOR_MAP[circle2Ring] }}
              />
            </div>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-60 rounded-xl shadow-md"
        align="end"
        sideOffset={8}
      >
        <div className="rounded-lg bg-background">
          <ScrollArea className="h-80">
            <div className="flex flex-col gap-8 p-5">
              <div className="flex flex-col gap-2">
                <span className="font-mono text-xs text-muted-foreground uppercase">
                  Fonts
                </span>
                <div className="flex flex-col gap-2">
                  {fontConfigs.map((font) => (
                    <div
                      key={font.id}
                      className="flex items-center justify-between gap-2"
                    >
                      <Label htmlFor={font.id}>{font.label}</Label>
                      <div className="w-28">
                        <Select
                          value={font.value}
                          onValueChange={font.setValue}
                        >
                          <SelectTrigger
                            id={font.id}
                            size="sm"
                            className="w-full"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FONTS.map((f) => (
                              <SelectItem key={f.value} value={f.value}>
                                {f.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <span className="font-mono text-xs text-muted-foreground uppercase">
                  Colours
                </span>
                <div className="flex flex-col gap-4">
                  {circleConfigs.map((circle) => (
                    <div key={circle.id} className="flex flex-col gap-3">
                      <Label>{circle.label}</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <ColorSelect
                          value={circle.fill}
                          onValueChange={circle.setFill}
                          label="Fill"
                        />
                        <ColorSelect
                          value={circle.ring}
                          onValueChange={circle.setRing}
                          label="Ring"
                          includeNone
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  )
}
