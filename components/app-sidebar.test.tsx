import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import React from "react"
import { AppSidebar, timeAgo } from "./app-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"

// Mock Clerk hooks
const mockHas = vi.fn()
const mockOpenUserProfile = vi.fn()
const mockGetToken = vi.fn()

vi.mock("@clerk/nextjs", () => {
  return {
    useAuth: () => ({
      has: mockHas,
    }),
    useClerk: () => ({
      openUserProfile: mockOpenUserProfile,
    }),
    useUser: () => ({
      isSignedIn: true,
      isLoaded: true,
      user: { id: "test_user_id" },
    }),
    useSession: () => ({
      session: {
        getToken: mockGetToken,
      },
    }),
    UserButton: () => <div data-testid="user-button">User Button</div>,
  }
})

// Mock Supabase
const mockOrder = vi.fn()
const mockSingle = vi.fn()

vi.mock("@supabase/supabase-js", () => {
  return {
    createClient: () => {
      return {
        from: vi.fn().mockImplementation((table) => {
          return {
            select: vi.fn().mockImplementation(() => {
              if (table === "gens") {
                return {
                  order: mockOrder,
                }
              }
              if (table === "limits") {
                return {
                  single: mockSingle,
                }
              }
              return {}
            }),
          }
        }),
      }
    },
  }
})

describe("timeAgo", () => {
  it("formats relative times correctly", () => {
    const now = new Date()
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)
    expect(timeAgo(fiveMinutesAgo)).toBe("5 minutes ago")

    const justNow = new Date(now.getTime() - 500)
    expect(timeAgo(justNow)).toBe("Just now")
  })
})

describe("AppSidebar component", () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockGetToken.mockResolvedValue("mock_token")
    mockOrder.mockResolvedValue({ data: [], error: null })
  })

  it("renders the free plan layout correctly", async () => {
    mockHas.mockReturnValue(false) // Not starter, not unlimited
    mockSingle.mockResolvedValue({
      data: { generations_remaining: 3 },
      error: null,
    })

    render(
      <SidebarProvider>
        <AppSidebar />
      </SidebarProvider>
    )

    await waitFor(() => {
      expect(screen.getByText("Free plan")).toBeInTheDocument()
      expect(screen.getByText("3 credits")).toBeInTheDocument()
    })
  })

  it("renders the starter plan layout correctly", async () => {
    mockHas.mockImplementation((params) => params.plan === "starter")
    mockSingle.mockResolvedValue({
      data: { generations_remaining: 45 },
      error: null,
    })

    render(
      <SidebarProvider>
        <AppSidebar />
      </SidebarProvider>
    )

    await waitFor(() => {
      expect(screen.getByText("Starter plan")).toBeInTheDocument()
      expect(screen.getByText("45 credits")).toBeInTheDocument()
    })
  })

  it("renders the unlimited plan layout correctly", async () => {
    mockHas.mockImplementation((params) => params.plan === "unlimited")
    mockSingle.mockResolvedValue({
      data: { generations_remaining: null },
      error: null,
    })

    render(
      <SidebarProvider>
        <AppSidebar />
      </SidebarProvider>
    )

    await waitFor(() => {
      expect(screen.getByText("Unlimited plan")).toBeInTheDocument()
      expect(screen.getByText("No limits")).toBeInTheDocument()
    })
  })
})
