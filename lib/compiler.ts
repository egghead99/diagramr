import { COLOR_MAP, FONT_MAP } from "./data"

export interface VennCompileError {
  status: "error"
  errorType: string
  message: string
  details: string
}

export class VennCompiler {
  static compile(vennCode: string): string | VennCompileError {
    if (typeof window === "undefined") {
      return {
        status: "error",
        errorType: "ENVIRONMENT_ERROR",
        message: "DOMParser is not available in this environment.",
        details:
          "VennCompiler requires a browser-like environment with DOM APIs.",
      }
    }

    const parser = new DOMParser()
    const doc = parser.parseFromString(vennCode, "text/xml")

    const errorNode = doc.querySelector("parsererror")
    if (errorNode) {
      return {
        status: "error",
        errorType: "XML_PARSE_FAILURE",
        message: "Syntax Error: Ensure tags are closed properly.",
        details: errorNode.textContent?.trim() || "Unknown XML parse error",
      }
    }

    const vennEl = doc.querySelector("venn")
    const getFont = (key: string | null | undefined) => {
      if (key && key in FONT_MAP) return FONT_MAP[key]
      return FONT_MAP["sans-serif"]
    }

    const tFont = getFont(vennEl?.getAttribute("title-font"))
    const hFont = getFont(vennEl?.getAttribute("header-font"))
    const bFont = getFont(vennEl?.getAttribute("body-font"))

    let svg = `<svg viewBox="0 0 800 600" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">`

    svg += `
            <style>
              .venn-title { font-size: 28px; font-family: ${tFont}; font-weight: bold; }
              .venn-subtitle { font-size: 16px; font-family: ${hFont}; fill: #666; font-style: italic; }
              .v-header-svg { font-size: 18px; font-weight: bold; fill: #333; font-family: ${hFont}; }
              .v-content-svg { fill: #111; font-family: ${bFont}; font-size: 13px; }
              .v-bold { font-weight: bold; }
              .v-italic { font-style: italic; }
            </style>
          `

    const title = doc.querySelector("title")?.textContent || ""
    const subtitle = doc.querySelector("subtitle")?.textContent || ""

    // Improved dynamic vertical centering
    const hasTitle = title.trim().length > 0
    const hasSubtitle = subtitle.trim().length > 0

    let titleY = 0
    let subtitleY = 0
    let baseCy = 300

    if (hasTitle || hasSubtitle) {
      const titleH = hasTitle ? 40 : 0
      const subtitleH = hasSubtitle ? 25 : 0
      const gap = 60
      const diagramH = 400 // 2 * radius

      const totalH = titleH + subtitleH + gap + diagramH
      const startY = (600 - totalH) / 2

      titleY = startY + (hasTitle ? 30 : 0)
      subtitleY = hasTitle ? titleY + 25 : startY + 20
      baseCy = startY + titleH + subtitleH + gap + 200
    }

    if (hasTitle) {
      svg += `<text x="400" y="${titleY}" text-anchor="middle" class="venn-title">${title}</text>`
    }
    if (hasSubtitle) {
      svg += `<text x="400" y="${subtitleY}" text-anchor="middle" class="venn-subtitle">${subtitle}</text>`
    }

    const parseItemHtml = (html: string) => {
      const tempDiv = document.createElement("div")
      tempDiv.innerHTML = html
      const segments: { text: string; classes: string[] }[] = []
      for (const node of Array.from(tempDiv.childNodes)) {
        const text = node.textContent || ""
        if (!text) continue
        if (node.nodeType === 3) {
          segments.push({ text, classes: [] })
        } else if (node.nodeType === 1) {
          const el = node as HTMLElement
          const classes: string[] = []
          if (el.tagName === "STRONG") classes.push("v-bold")
          if (el.tagName === "EM") classes.push("v-italic")
          segments.push({ text, classes })
        }
      }
      return segments
    }

    const circles = doc.querySelectorAll("circle")

    circles.forEach((circleEl, index) => {
      if (index >= 2) return
      const colorKey = vennEl?.getAttribute(`color-${index + 1}`) || ""
      const borderKey = vennEl?.getAttribute(`border-color-${index + 1}`) || ""
      const fillColor =
        COLOR_MAP[colorKey] || (index === 0 ? COLOR_MAP.blue : COLOR_MAP.red)
      const strokeColor = COLOR_MAP[borderKey] || "none"
      const strokeWidth = strokeColor === "none" ? "0" : "3"

      const cx = index === 0 ? 290 : 510
      const cy = baseCy
      const r = 200

      svg += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fillColor}" fill-opacity="0.3" stroke="${strokeColor}" stroke-width="${strokeWidth}" />`

      const headerAttr = circleEl.getAttribute("header")
      if (headerAttr) {
        svg += `<text x="${cx}" y="${cy - r - 15}" text-anchor="middle" class="v-header-svg">${headerAttr}</text>`
      }
    })

    const renderTextSection = (
      node: Element | null,
      centerX: number,
      centerY: number,
      maxChars = 25,
      maxHeight = 300
    ) => {
      if (!node) return ""
      const items = node.getElementsByTagName("item")

      const buildVisualLines = (fSize: number) => {
        const effectiveMaxChars = Math.floor(maxChars * (13 / fSize))
        const lineStep = fSize * 1.3
        const itemSpacing = 4
        const allVisualLines: {
          segments: { text: string; classes: string[] }[]
          isEndOfItem: boolean
        }[] = []
        let numItems = 0

        for (let i = 0; i < items.length; i++) {
          numItems++
          const itemSegments = parseItemHtml(items[i].innerHTML)

          let currentVisualLineSegments: { text: string; classes: string[] }[] =
            []
          let currentVisualLinePlaintextLength = 0

          for (let segIdx = 0; segIdx < itemSegments.length; segIdx++) {
            const segment = itemSegments[segIdx]
            // Split by whitespace, keeping whitespace as separate "words"
            const words = segment.text
              .split(/(\s+)/)
              .filter((w) => w.length > 0)

            for (let wordIdx = 0; wordIdx < words.length; wordIdx++) {
              const word = words[wordIdx]

              if (
                currentVisualLinePlaintextLength + word.length >
                effectiveMaxChars &&
                currentVisualLinePlaintextLength > 0
              ) {
                allVisualLines.push({
                  segments: currentVisualLineSegments,
                  isEndOfItem: false,
                })
                currentVisualLineSegments = []
                currentVisualLinePlaintextLength = 0
              }

              // Merge with previous segment if same style, otherwise add new
              const lastSeg =
                currentVisualLineSegments[currentVisualLineSegments.length - 1]
              if (
                lastSeg &&
                lastSeg.classes.length === segment.classes.length &&
                lastSeg.classes.every((c, i) => c === segment.classes[i])
              ) {
                lastSeg.text += word
              } else {
                currentVisualLineSegments.push({
                  text: word,
                  classes: segment.classes,
                })
              }
              currentVisualLinePlaintextLength += word.length
            }
          }
          if (currentVisualLineSegments.length > 0) {
            allVisualLines.push({
              segments: currentVisualLineSegments,
              isEndOfItem: true,
            })
            currentVisualLineSegments = []
            currentVisualLinePlaintextLength = 0
          } else if (itemSegments.length === 0) {
            allVisualLines.push({
              segments: [{ text: "", classes: [] }],
              isEndOfItem: true,
            })
          }
        }

        const totalHeight =
          allVisualLines.length * lineStep +
          (numItems > 0 ? (numItems - 1) * itemSpacing : 0) // Only add item spacing if there's more than one item
        return { allVisualLines, totalHeight, lineStep, itemSpacing }
      }

      let fontSize = 13
      let result = buildVisualLines(fontSize)
      while (result.totalHeight > maxHeight && fontSize > 5) {
        fontSize -= 0.5
        result = buildVisualLines(fontSize)
      }

      const { allVisualLines, totalHeight, lineStep, itemSpacing } = result
      let currentY = centerY - totalHeight / 2 + fontSize

      let tspanElements = ""
      allVisualLines.forEach((lineObj, lineIdx) => {
        lineObj.segments.forEach((segment, segIdx) => {
          const classAttr = segment.classes.length
            ? ` class="${segment.classes.join(" ")}"`
            : ""
          if (segIdx === 0) {
            tspanElements += `<tspan x="${centerX}" y="${currentY}"${classAttr}>${segment.text}</tspan>`
          } else {
            tspanElements += `<tspan${classAttr}>${segment.text}</tspan>`
          }
        })
        currentY += lineStep
        if (lineObj.isEndOfItem && lineIdx < allVisualLines.length - 1)
          currentY += itemSpacing
      })

      return `<text text-anchor="middle" font-size="${fontSize}" class="v-content-svg">${tspanElements}</text>`
    }

    if (circles[0]) svg += renderTextSection(circles[0], 220, baseCy, 22, 320)
    if (circles[1]) svg += renderTextSection(circles[1], 580, baseCy, 22, 320)

    const overlap = doc.querySelector("overlap")
    if (overlap) {
      svg += renderTextSection(overlap, 400, baseCy, 20, 260)
    }

    svg += `</svg>`
    return svg
  }
}
