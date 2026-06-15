import { describe, it, expect, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import React from "react"
import { Venn, parseStyleFromContent } from "./venn"

describe("parseStyleFromContent", () => {
  it("should extract attributes correctly", () => {
    const content = '<venn title-font="mono" color-1="red" border-color-2="blue"></venn>'
    const config = parseStyleFromContent(content)
    expect(config.titleFont).toBe("mono")
    expect(config.circle1Fill).toBe("red")
    expect(config.circle2Ring).toBe("blue")
  })

  it("should return defaults for unstyled diagrams", () => {
    const config = parseStyleFromContent("<venn></venn>")
    expect(config.titleFont).toBe("serif")
    expect(config.circle1Fill).toBe("blue")
  })
})

describe("Venn Component", () => {
  it("renders error state when compilation fails", async () => {
    const malformedVenn = `
      <venn>
        <title>Bad XML
      </venn>
    `
    render(<Venn>{malformedVenn}</Venn>)

    // Compilation happens in a useEffect, so we wait for the error UI
    await waitFor(() => {
      expect(screen.getByText(/Syntax Error/i)).toBeInTheDocument()
    })
  })

  it("renders SVG successfully", async () => {
    const validVenn = `
      <venn>
        <title>Valid Diagram</title>
        <circle header="One"></circle>
        <circle header="Two"></circle>
      </venn>
    `
    const { container } = render(<Venn>{validVenn}</Venn>)

    await waitFor(() => {
      expect(container.querySelector("svg")).toBeInTheDocument()
    })
  })
})
