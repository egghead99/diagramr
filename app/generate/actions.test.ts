import { describe, it, expect, vi, beforeEach } from "vitest"

// ─── Hoisted mocks ────────────────────────────────────────────────────────────
const {
  mockAuth,
  mockRpc,
  mockInsert,
  mockSingleInsert,
  mockSingle,
  mockUpdate,
  mockEqUpdate,
} = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockRpc: vi.fn(),
  mockInsert: vi.fn(),
  mockSingleInsert: vi.fn(),
  mockSingle: vi.fn(),
  mockUpdate: vi.fn(),
  mockEqUpdate: vi.fn(),
}))

// ─── Module mocks ─────────────────────────────────────────────────────────────

// Mock Clerk Server Auth
vi.mock("@clerk/nextjs/server", () => ({
  auth: () => mockAuth(),
}))

// Mock AI SDK
vi.mock("ai", () => ({
  generateText: vi.fn(),
}))

vi.mock("@ai-sdk/google", () => ({
  createGoogleGenerativeAI: () => {
    return () => ({}) // mock model
  },
}))

// Mock fs/promises
vi.mock("fs/promises", () => ({
  default: {
    readFile: vi.fn().mockResolvedValue("Mock system prompt template content"),
  },
}))

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    rpc: mockRpc,
    from: (table: string) => {
      if (table === "gens") {
        return {
          insert: mockInsert,
        }
      }
      if (table === "limits") {
        return {
          select: () => ({
            eq: () => ({
              single: mockSingle,
            }),
          }),
          update: mockUpdate,
        }
      }
      return {}
    },
  }),
}))

// ─── Import SUT after mocks ───────────────────────────────────────────────────
import { generateDiagramAction } from "./actions"
import { generateText } from "ai"

// ─── Shared fixtures ──────────────────────────────────────────────────────────

const styleConfig = {
  titleFont: "serif",
  headerFont: "sans-serif",
  bodyFont: "mono",
  circle1Fill: "blue",
  circle1Ring: "none",
  circle2Fill: "red",
  circle2Ring: "none",
}

const styleConfigWithRings = {
  titleFont: "Inter",
  headerFont: "Roboto",
  bodyFont: "Mono",
  circle1Fill: "#FF0000",
  circle1Ring: "#000000",
  circle2Fill: "#00FF00",
  circle2Ring: "#FFFFFF",
}

// ─── Test suites ──────────────────────────────────────────────────────────────

describe("generateDiagramAction — Clerk authentication", () => {
  beforeEach(() => {
    vi.resetAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://mock-db.supabase.co"
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "mock-publishable-key"
    process.env.SUPABASE_SERVICE_ROLE_KEY = "mock-service-role-key"

    mockInsert.mockImplementation(() => ({
      select: vi.fn().mockImplementation(() => ({
        single: mockSingleInsert,
      })),
    }))

    mockUpdate.mockImplementation(() => ({
      eq: mockEqUpdate,
    }))
  })

  it("throws 'Unauthorized' when Clerk returns no userId", async () => {
    mockAuth.mockResolvedValue({ userId: null, getToken: vi.fn() })

    await expect(
      generateDiagramAction({ prompt: "some prompt", styleConfig })
    ).rejects.toThrow("Unauthorized")
  })

  it("throws 'Unauthorized' when userId is an empty string", async () => {
    mockAuth.mockResolvedValue({ userId: "", getToken: vi.fn() })

    await expect(
      generateDiagramAction({ prompt: "some prompt", styleConfig })
    ).rejects.toThrow("Unauthorized")
  })

  it("throws 'Unauthorized' when auth() itself rejects", async () => {
    mockAuth.mockRejectedValue(new Error("Clerk service unavailable"))

    await expect(
      generateDiagramAction({ prompt: "some prompt", styleConfig })
    ).rejects.toThrow()
  })

  it("calls auth() on every invocation (no caching between calls)", async () => {
    mockAuth.mockResolvedValue({ userId: null, getToken: vi.fn() })

    await expect(
      generateDiagramAction({ prompt: "first", styleConfig })
    ).rejects.toThrow("Unauthorized")

    await expect(
      generateDiagramAction({ prompt: "second", styleConfig })
    ).rejects.toThrow("Unauthorized")

    expect(mockAuth).toHaveBeenCalledTimes(2)
  })

  it("calls getToken() to obtain a Clerk JWT when authenticated", async () => {
    const mockGetToken = vi.fn().mockResolvedValue("clerk_jwt_abc123")
    mockAuth.mockResolvedValue({ userId: "user_123", getToken: mockGetToken })
    mockRpc.mockResolvedValue({ data: false, error: null }) // limit hit — stops early

    await expect(
      generateDiagramAction({ prompt: "prompt", styleConfig })
    ).rejects.toThrow()

    expect(mockGetToken).toHaveBeenCalledOnce()
  })

  it("does not call getToken() when userId is missing", async () => {
    const mockGetToken = vi.fn()
    mockAuth.mockResolvedValue({ userId: null, getToken: mockGetToken })

    await expect(
      generateDiagramAction({ prompt: "prompt", styleConfig })
    ).rejects.toThrow("Unauthorized")

    expect(mockGetToken).not.toHaveBeenCalled()
  })
})

describe("generateDiagramAction — Supabase generation limit (consume_generation RPC)", () => {
  beforeEach(() => {
    vi.resetAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://mock-db.supabase.co"
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "mock-publishable-key"
    process.env.SUPABASE_SERVICE_ROLE_KEY = "mock-service-role-key"

    mockAuth.mockResolvedValue({
      userId: "user_123",
      getToken: vi.fn().mockResolvedValue("mock_clerk_token"),
    })

    mockInsert.mockImplementation(() => ({
      select: vi.fn().mockImplementation(() => ({
        single: mockSingleInsert,
      })),
    }))

    mockUpdate.mockImplementation(() => ({
      eq: mockEqUpdate,
    }))
  })

  it("throws 'out of generations' when consume_generation RPC returns false", async () => {
    mockRpc.mockResolvedValue({ data: false, error: null })

    await expect(
      generateDiagramAction({ prompt: "some prompt", styleConfig })
    ).rejects.toThrow("You're out of generations. Upgrade your plan for more.")
  })

  it("throws the RPC error message when consume_generation returns a DB error", async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: "RPC function not found" },
    })

    await expect(
      generateDiagramAction({ prompt: "some prompt", styleConfig })
    ).rejects.toThrow("RPC function not found")
  })

  it("calls consume_generation RPC with the correct arguments", async () => {
    mockRpc.mockResolvedValue({ data: false, error: null })

    await expect(
      generateDiagramAction({ prompt: "any", styleConfig })
    ).rejects.toThrow()

    expect(mockRpc).toHaveBeenCalledWith("consume_generation", {
      p_user_id: "user_123",
    })
  })

  it("does not call generateText when consume_generation returns false", async () => {
    mockRpc.mockResolvedValue({ data: false, error: null })

    await expect(
      generateDiagramAction({ prompt: "any", styleConfig })
    ).rejects.toThrow()

    expect(generateText).not.toHaveBeenCalled()
  })

  it("does not call generateText when consume_generation returns a DB error", async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: "DB error" } })

    await expect(
      generateDiagramAction({ prompt: "any", styleConfig })
    ).rejects.toThrow()

    expect(generateText).not.toHaveBeenCalled()
  })

  it("proceeds to call generateText when consume_generation returns true", async () => {
    mockRpc.mockResolvedValue({ data: true, error: null })
    vi.mocked(generateText).mockResolvedValue({
      text: "<title>Test</title>",
      finishReason: "stop",
      usage: { promptTokens: 10, completionTokens: 10 },
      warnings: [],
    } as any)
    mockSingleInsert.mockResolvedValue({
      data: { id: "gen_1", name: "Test" },
      error: null,
    })

    await generateDiagramAction({ prompt: "any", styleConfig })

    expect(generateText).toHaveBeenCalledOnce()
  })
})

describe("generateDiagramAction — Supabase diagram insertion (gens table)", () => {
  beforeEach(() => {
    vi.resetAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://mock-db.supabase.co"
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "mock-publishable-key"
    process.env.SUPABASE_SERVICE_ROLE_KEY = "mock-service-role-key"

    mockAuth.mockResolvedValue({
      userId: "user_123",
      getToken: vi.fn().mockResolvedValue("mock_token"),
    })
    mockRpc.mockResolvedValue({ data: true, error: null })

    mockInsert.mockImplementation(() => ({
      select: vi.fn().mockImplementation(() => ({
        single: mockSingleInsert,
      })),
    }))

    mockUpdate.mockImplementation(() => ({
      eq: mockEqUpdate,
    }))
  })

  it("successfully inserts a diagram and returns the data", async () => {
    vi.mocked(generateText).mockResolvedValue({
      text: "<title>My Venn</title>",
      finishReason: "stop",
      usage: { promptTokens: 10, completionTokens: 10 },
      warnings: [],
    } as any)

    mockSingleInsert.mockResolvedValue({
      data: { id: "gen_123", name: "My Venn", content: "<venn>...</venn>" },
      error: null,
    })

    const result = await generateDiagramAction({ prompt: "My Venn Prompt", styleConfig })

    expect(result.id).toBe("gen_123")
    expect(result.name).toBe("My Venn")
  })

  it("inserts a row into gens with the correct prompt value", async () => {
    const testPrompt = "Show me a unique diagram"
    vi.mocked(generateText).mockResolvedValue({
      text: "<title>Unique</title>",
      finishReason: "stop",
      usage: { promptTokens: 5, completionTokens: 5 },
      warnings: [],
    } as any)
    mockSingleInsert.mockResolvedValue({
      data: { id: "gen_p", name: "Unique", content: "" },
      error: null,
    })

    await generateDiagramAction({ prompt: testPrompt, styleConfig })

    const insertArgs = mockInsert.mock.calls[0][0]
    expect(insertArgs.prompt).toBe(testPrompt)
  })

  it("extracts the diagram title from the AI-generated <title> tag for the row name", async () => {
    vi.mocked(generateText).mockResolvedValue({
      text: "<title>Extracted Title</title><circle header='A'></circle>",
      finishReason: "stop",
      usage: { promptTokens: 5, completionTokens: 5 },
      warnings: [],
    } as any)
    mockSingleInsert.mockResolvedValue({
      data: { id: "gen_t", name: "Extracted Title" },
      error: null,
    })

    await generateDiagramAction({ prompt: "test", styleConfig })

    const insertArgs = mockInsert.mock.calls[0][0]
    expect(insertArgs.name).toBe("Extracted Title")
  })

  it("falls back to 'Untitled diagram' when the AI output has no <title> tag", async () => {
    vi.mocked(generateText).mockResolvedValue({
      text: "<circle header='A'></circle>",
      finishReason: "stop",
      usage: { promptTokens: 5, completionTokens: 5 },
      warnings: [],
    } as any)
    mockSingleInsert.mockResolvedValue({
      data: { id: "gen_nt", name: "Untitled diagram" },
      error: null,
    })

    await generateDiagramAction({ prompt: "test", styleConfig })

    const insertArgs = mockInsert.mock.calls[0][0]
    expect(insertArgs.name).toBe("Untitled diagram")
  })

  it("inserts type='venn' on the row", async () => {
    vi.mocked(generateText).mockResolvedValue({
      text: "<title>T</title>",
      finishReason: "stop",
      usage: { promptTokens: 1, completionTokens: 1 },
      warnings: [],
    } as any)
    mockSingleInsert.mockResolvedValue({
      data: { id: "gen_type", name: "T" },
      error: null,
    })

    await generateDiagramAction({ prompt: "test", styleConfig })

    const insertArgs = mockInsert.mock.calls[0][0]
    expect(insertArgs.type).toBe("venn")
  })

  it("inserts the correct user_id from Clerk auth on the row", async () => {
    vi.mocked(generateText).mockResolvedValue({
      text: "<title>T</title>",
      finishReason: "stop",
      usage: { promptTokens: 1, completionTokens: 1 },
      warnings: [],
    } as any)
    mockSingleInsert.mockResolvedValue({
      data: { id: "gen_uid", name: "T" },
      error: null,
    })

    await generateDiagramAction({ prompt: "test", styleConfig })

    const insertArgs = mockInsert.mock.calls[0][0]
    expect(insertArgs.user_id).toBe("user_123")
  })

  it("wraps AI output in <venn ...>...</venn> tags in the content field", async () => {
    const aiOutput = "<title>Wrapped</title><circle header='X'></circle>"
    vi.mocked(generateText).mockResolvedValue({
      text: aiOutput,
      finishReason: "stop",
      usage: { promptTokens: 1, completionTokens: 1 },
      warnings: [],
    } as any)
    mockSingleInsert.mockResolvedValue({
      data: { id: "gen_wrap", name: "Wrapped" },
      error: null,
    })

    await generateDiagramAction({ prompt: "test", styleConfig })

    const insertArgs = mockInsert.mock.calls[0][0]
    expect(insertArgs.content).toMatch(/^<venn /)
    expect(insertArgs.content).toContain(aiOutput.trim())
    expect(insertArgs.content).toContain("</venn>")
  })

  it("includes border-color-1 and border-color-2 attributes when rings are not 'none'", async () => {
    vi.mocked(generateText).mockResolvedValue({
      text: "<title>Ring</title>",
      finishReason: "stop",
      usage: { promptTokens: 1, completionTokens: 1 },
      warnings: [],
    } as any)
    mockSingleInsert.mockResolvedValue({
      data: { id: "gen_ring", name: "Ring" },
      error: null,
    })

    await generateDiagramAction({ prompt: "test", styleConfig: styleConfigWithRings })

    const insertArgs = mockInsert.mock.calls[0][0]
    expect(insertArgs.content).toContain('border-color-1="#000000"')
    expect(insertArgs.content).toContain('border-color-2="#FFFFFF"')
  })

  it("does NOT include border-color attributes when rings are 'none'", async () => {
    vi.mocked(generateText).mockResolvedValue({
      text: "<title>NoRing</title>",
      finishReason: "stop",
      usage: { promptTokens: 1, completionTokens: 1 },
      warnings: [],
    } as any)
    mockSingleInsert.mockResolvedValue({
      data: { id: "gen_noring", name: "NoRing" },
      error: null,
    })

    await generateDiagramAction({ prompt: "test", styleConfig })

    const insertArgs = mockInsert.mock.calls[0][0]
    expect(insertArgs.content).not.toContain("border-color-1")
    expect(insertArgs.content).not.toContain("border-color-2")
  })

  it("throws the DB error message when Supabase insert fails", async () => {
    vi.mocked(generateText).mockResolvedValue({
      text: "<title>Fail</title>",
      finishReason: "stop",
      usage: { promptTokens: 1, completionTokens: 1 },
      warnings: [],
    } as any)
    mockSingleInsert.mockResolvedValue({
      data: null,
      error: { message: "Unique constraint failed" },
    })

    // Refund path: single() must return something
    mockSingle.mockResolvedValue({
      data: { generations_remaining: 3 },
      error: null,
    })
    mockEqUpdate.mockResolvedValue({ error: null })

    await expect(
      generateDiagramAction({ prompt: "test", styleConfig })
    ).rejects.toThrow("Unique constraint failed")
  })
})

describe("generateDiagramAction — credit refund on failure", () => {
  beforeEach(() => {
    vi.resetAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://mock-db.supabase.co"
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "mock-publishable-key"
    process.env.SUPABASE_SERVICE_ROLE_KEY = "mock-service-role-key"

    mockAuth.mockResolvedValue({
      userId: "user_123",
      getToken: vi.fn().mockResolvedValue("mock_clerk_token"),
    })
    mockRpc.mockResolvedValue({ data: true, error: null })

    mockInsert.mockImplementation(() => ({
      select: vi.fn().mockImplementation(() => ({
        single: mockSingleInsert,
      })),
    }))

    mockUpdate.mockImplementation(() => ({
      eq: mockEqUpdate,
    }))
  })

  it("refunds 1 credit when AI generation (generateText) throws", async () => {
    vi.mocked(generateText).mockRejectedValue(new Error("AI Model failed"))

    mockSingle.mockResolvedValue({
      data: { generations_remaining: 10 },
      error: null,
    })
    mockEqUpdate.mockResolvedValue({ error: null })

    await expect(
      generateDiagramAction({ prompt: "failing prompt", styleConfig })
    ).rejects.toThrow("AI Model failed")

    expect(mockSingle).toHaveBeenCalledOnce()
    expect(mockUpdate).toHaveBeenCalledWith({ generations_remaining: 11 })
    expect(mockEqUpdate).toHaveBeenCalledWith("user_id", "user_123")
  })

  it("refunds 1 credit when Supabase diagram insert fails", async () => {
    vi.mocked(generateText).mockResolvedValue({
      text: "<title>Fail Insert</title>",
      finishReason: "stop",
      usage: { promptTokens: 1, completionTokens: 1 },
      warnings: [],
    } as any)
    mockSingleInsert.mockResolvedValue({
      data: null,
      error: { message: "Insert failed" },
    })

    mockSingle.mockResolvedValue({
      data: { generations_remaining: 5 },
      error: null,
    })
    mockEqUpdate.mockResolvedValue({ error: null })

    await expect(
      generateDiagramAction({ prompt: "test", styleConfig })
    ).rejects.toThrow("Insert failed")

    expect(mockUpdate).toHaveBeenCalledWith({ generations_remaining: 6 })
    expect(mockEqUpdate).toHaveBeenCalledWith("user_id", "user_123")
  })

  it("does NOT refund credit when generations_remaining is null (unlimited plan)", async () => {
    vi.mocked(generateText).mockRejectedValue(new Error("AI Model failed"))

    // null means unlimited — no refund should be applied
    mockSingle.mockResolvedValue({
      data: { generations_remaining: null },
      error: null,
    })

    await expect(
      generateDiagramAction({ prompt: "unlimited user fails", styleConfig })
    ).rejects.toThrow("AI Model failed")

    expect(mockUpdate).not.toHaveBeenCalled()
    expect(mockEqUpdate).not.toHaveBeenCalled()
  })

  it("does not crash (and still rethrows the original error) if refund query itself fails", async () => {
    vi.mocked(generateText).mockRejectedValue(new Error("Primary failure"))

    // Simulate refund query throwing
    mockSingle.mockRejectedValue(new Error("Refund DB connection lost"))

    await expect(
      generateDiagramAction({ prompt: "double fail", styleConfig })
    ).rejects.toThrow("Primary failure")
  })

  it("uses the admin Supabase client (service role) for the refund, not the user client", async () => {
    // Both clients are mocked via the same createClient mock, but we verify
    // the refund path calls the limits table with admin-level access (i.e. mockSingle + mockUpdate are called).
    vi.mocked(generateText).mockRejectedValue(new Error("AI error"))

    mockSingle.mockResolvedValue({
      data: { generations_remaining: 7 },
      error: null,
    })
    mockEqUpdate.mockResolvedValue({ error: null })

    await expect(
      generateDiagramAction({ prompt: "admin refund test", styleConfig })
    ).rejects.toThrow("AI error")

    // The refund path must have queried the limits table
    expect(mockSingle).toHaveBeenCalledOnce()
    expect(mockUpdate).toHaveBeenCalledWith({ generations_remaining: 8 })
  })

  it("correctly increments generations_remaining by exactly 1", async () => {
    vi.mocked(generateText).mockRejectedValue(new Error("AI error"))

    const currentRemaining = 42
    mockSingle.mockResolvedValue({
      data: { generations_remaining: currentRemaining },
      error: null,
    })
    mockEqUpdate.mockResolvedValue({ error: null })

    await expect(
      generateDiagramAction({ prompt: "increment test", styleConfig })
    ).rejects.toThrow()

    expect(mockUpdate).toHaveBeenCalledWith({
      generations_remaining: currentRemaining + 1,
    })
  })

  it("does not perform any refund when consume_generation fails (no credit was consumed)", async () => {
    mockRpc.mockResolvedValue({ data: false, error: null })

    await expect(
      generateDiagramAction({ prompt: "limit hit", styleConfig })
    ).rejects.toThrow()

    // No credit consumed → no refund needed
    expect(mockSingle).not.toHaveBeenCalled()
    expect(mockUpdate).not.toHaveBeenCalled()
  })
})

describe("generateDiagramAction — consume_generation / AI / insert call ordering", () => {
  beforeEach(() => {
    vi.resetAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://mock-db.supabase.co"
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "mock-publishable-key"
    process.env.SUPABASE_SERVICE_ROLE_KEY = "mock-service-role-key"

    mockAuth.mockResolvedValue({
      userId: "user_order",
      getToken: vi.fn().mockResolvedValue("mock_token"),
    })

    mockInsert.mockImplementation(() => ({
      select: vi.fn().mockImplementation(() => ({
        single: mockSingleInsert,
      })),
    }))

    mockUpdate.mockImplementation(() => ({
      eq: mockEqUpdate,
    }))
  })

  it("calls consume_generation before generateText (credit is consumed first)", async () => {
    const callOrder: string[] = []

    mockRpc.mockImplementation(async () => {
      callOrder.push("rpc")
      return { data: true, error: null }
    })

    vi.mocked(generateText).mockImplementation(async () => {
      callOrder.push("generateText")
      return {
        text: "<title>T</title>",
        finishReason: "stop",
        usage: { promptTokens: 1, completionTokens: 1 },
        warnings: [],
      } as any
    })

    mockSingleInsert.mockResolvedValue({
      data: { id: "gen_order", name: "T" },
      error: null,
    })

    await generateDiagramAction({ prompt: "order test", styleConfig })

    expect(callOrder[0]).toBe("rpc")
    expect(callOrder[1]).toBe("generateText")
  })

  it("calls generateText before inserting into gens table", async () => {
    const callOrder: string[] = []

    mockRpc.mockResolvedValue({ data: true, error: null })

    vi.mocked(generateText).mockImplementation(async () => {
      callOrder.push("generateText")
      return {
        text: "<title>T</title>",
        finishReason: "stop",
        usage: { promptTokens: 1, completionTokens: 1 },
        warnings: [],
      } as any
    })

    mockInsert.mockImplementation(() => {
      callOrder.push("insert")
      return {
        select: vi.fn().mockImplementation(() => ({
          single: vi.fn().mockResolvedValue({
            data: { id: "gen_order2", name: "T" },
            error: null,
          }),
        })),
      }
    })

    await generateDiagramAction({ prompt: "order test 2", styleConfig })

    expect(callOrder[0]).toBe("generateText")
    expect(callOrder[1]).toBe("insert")
  })
})
