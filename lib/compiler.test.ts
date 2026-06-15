import { describe, it, expect } from "vitest"
import { VennCompiler } from "./compiler"

describe("VennCompiler", () => {
  it("should compile a valid Venn diagram XML into SVG", () => {
    const validXML = `
      <venn title-font="sans-serif" header-font="mono" color-1="blue" color-2="purple">
        <title>Test Title</title>
        <subtitle>Test Subtitle</subtitle>
        <circle header="A">
          <item>Item A</item>
        </circle>
        <circle header="B">
          <item>Item B</item>
        </circle>
        <overlap>
          <item>Item Overlap</item>
        </overlap>
      </venn>
    `
    const result = VennCompiler.compile(validXML)
    expect(typeof result).toBe("string")
    const svg = result as string
    expect(svg).toContain("<svg")
    expect(svg).toContain("Test Title")
    expect(svg).toContain("Test Subtitle")
    expect(svg).toContain("Item A")
    expect(svg).toContain("Item B")
    expect(svg).toContain("Item Overlap")
    expect(svg).toContain('fill="#4285F4"') // blue
    expect(svg).toContain('fill="#9C27B0"') // purple
  })

  it("should return parsing failure error for invalid XML", () => {
    const invalidXML = `
      <venn>
        <title>Malformed Diagram
      </venn>
    `
    const result = VennCompiler.compile(invalidXML)
    expect(typeof result).toBe("object")
    if (typeof result === "object" && result !== null) {
      expect(result.status).toBe("error")
      expect(result.errorType).toBe("XML_PARSE_FAILURE")
      expect(result.message).toContain("Syntax Error")
    }
  })

  it("should handle default fonts and colors when attributes are omitted", () => {
    const minXML = `
      <venn>
        <circle header="Left"></circle>
        <circle header="Right"></circle>
      </venn>
    `
    const result = VennCompiler.compile(minXML)
    expect(typeof result).toBe("string")
    const svg = result as string
    expect(svg).toContain('fill="#4285F4"') // default first circle is blue
    expect(svg).toContain('fill="#EA4335"') // default second circle is red
  })
})
