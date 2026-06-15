import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import React from "react"
import { Diagram } from "./diagram"
import { Generation } from "@/lib/samples"

const mockGetToken = vi.fn()
vi.mock("@clerk/nextjs", () => {
  return {
    useSession: () => ({
      session: {
        getToken: mockGetToken,
      },
    }),
  }
})

const mockUpdate = vi.fn()
const mockDelete = vi.fn()
const mockEq = vi.fn()

vi.mock("@supabase/supabase-js", () => {
  return {
    createClient: () => {
      return {
        from: vi.fn().mockImplementation(() => {
          return {
            update: mockUpdate,
            delete: mockDelete,
            eq: mockEq,
          }
        }),
      }
    },
  }
})

describe("Diagram Dialog Component", () => {
  const mockGen: Generation = {
    id: "gen_123",
    name: "Original Name",
    type: "venn",
    prompt: "Compare apples and oranges",
    content: "<venn><title>Original Name</title></venn>",
    userId: "user_123",
    createdAt: new Date(),
  }

  beforeEach(() => {
    vi.resetAllMocks()
    mockGetToken.mockResolvedValue("mock_token")
    mockUpdate.mockReturnValue({ error: null })
    mockDelete.mockReturnValue({ error: null })
    mockEq.mockReturnValue({ error: null })
  })

  it("opens the edit dialog when trigger is clicked and displays diagram details", async () => {
    render(
      <Diagram gen={mockGen}>
        <button data-testid="trigger">Open Diagram</button>
      </Diagram>
    )

    const trigger = screen.getByTestId("trigger")
    fireEvent.click(trigger)

    expect(screen.getByText("Original Name", { selector: "p" })).toBeInTheDocument()
    expect(screen.getByText("Compare apples and oranges")).toBeInTheDocument()
  })

  it("triggers rename editing mode and updates the state on input change", async () => {
    render(
      <Diagram gen={mockGen}>
        <button data-testid="trigger">Open Diagram</button>
      </Diagram>
    )

    fireEvent.click(screen.getByTestId("trigger"))

    const titleText = screen.getByText("Original Name", { selector: "p" })
    fireEvent.click(titleText)

    // After clicking the title text, it switches to an input field
    const input = screen.getByDisplayValue("Original Name")
    fireEvent.change(input, { target: { value: "New Title Name" } })
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" })

    // Input loses focus/submits, reverts back to custom text style
    expect(screen.getByText("New Title Name", { selector: "p" })).toBeInTheDocument()
  })
})
