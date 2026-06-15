import { describe, it, expect } from "vitest"
import { cn } from "./utils"

describe("cn utility", () => {
  it("should merge class names correctly", () => {
    expect(cn("a", "b")).toBe("a b")
    expect(cn("a", false && "b", "c")).toBe("a c")
    expect(cn("p-4 bg-red-500", "p-6")).toBe("bg-red-500 p-6")
  })
})
