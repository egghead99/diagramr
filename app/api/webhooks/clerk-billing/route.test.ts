import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

// ─── Hoisted mocks ────────────────────────────────────────────────────────────
// All vi.fn() instances must be created inside vi.hoisted so that they are
// available before the module-level vi.mock() factory functions run.

const {
  mockVerifyWebhook,
  mockUpsert,
  mockSingleSelect,
} = vi.hoisted(() => ({
  mockVerifyWebhook: vi.fn(),
  mockUpsert: vi.fn(),
  mockSingleSelect: vi.fn(),
}))

// ─── Module mocks ─────────────────────────────────────────────────────────────

vi.mock("@clerk/nextjs/webhooks", () => ({
  verifyWebhook: (...args: unknown[]) => mockVerifyWebhook(...args),
}))

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    from: () => ({
      upsert: mockUpsert,
      select: () => ({
        eq: () => ({
          single: mockSingleSelect,
        }),
      }),
    }),
  }),
}))

// ─── Import SUT after mocks ───────────────────────────────────────────────────
import { POST } from "./route"

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Build a minimal NextRequest (body doesn't matter; verifyWebhook is mocked). */
function buildRequest(): NextRequest {
  return new NextRequest("https://example.com/api/webhooks/clerk-billing", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({}),
  })
}

/** Build a fake verified Clerk event object. */
function buildEvent(type: string, data: Record<string, unknown>) {
  return { type, data }
}

// ─── Test suites ──────────────────────────────────────────────────────────────

describe("POST /api/webhooks/clerk-billing", () => {
  beforeEach(() => {
    vi.resetAllMocks()

    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://mock-db.supabase.co"
    process.env.SUPABASE_SERVICE_ROLE_KEY = "mock-service-role-key"

    // Default: upsert succeeds
    mockUpsert.mockResolvedValue({ error: null })

    // Default: select/single returns a "free_user" row
    mockSingleSelect.mockResolvedValue({
      data: { plan: "free_user" },
      error: null,
    })
  })

  // ══════════════════════════════════════════════════════════════════════════
  // Clerk webhook signature verification
  // ══════════════════════════════════════════════════════════════════════════

  describe("Clerk webhook signature verification", () => {
    it("returns 400 and 'Verification failed' when verifyWebhook throws", async () => {
      mockVerifyWebhook.mockRejectedValue(new Error("Bad signature"))

      const res = await POST(buildRequest())

      expect(res.status).toBe(400)
      expect(await res.text()).toBe("Verification failed")
    })

    it("does not interact with Supabase when verification fails", async () => {
      mockVerifyWebhook.mockRejectedValue(new Error("Tampered payload"))

      await POST(buildRequest())

      expect(mockUpsert).not.toHaveBeenCalled()
      expect(mockSingleSelect).not.toHaveBeenCalled()
    })

    it("calls verifyWebhook with the raw NextRequest object", async () => {
      mockVerifyWebhook.mockResolvedValue(
        buildEvent("subscriptionItem.active", {
          payer: { user_id: "user_abc" },
          plan: { slug: "starter" },
        })
      )

      const req = buildRequest()
      await POST(req)

      expect(mockVerifyWebhook).toHaveBeenCalledWith(req)
    })

    it("proceeds to process the event when verifyWebhook resolves successfully", async () => {
      mockVerifyWebhook.mockResolvedValue(
        buildEvent("subscriptionItem.active", {
          payer: { user_id: "user_valid" },
          plan: { slug: "starter" },
        })
      )

      const res = await POST(buildRequest())

      expect(res.status).toBe(200)
      expect(mockUpsert).toHaveBeenCalledOnce()
    })
  })

  // ══════════════════════════════════════════════════════════════════════════
  // Unhandled / unknown event types
  // ══════════════════════════════════════════════════════════════════════════

  describe("Unhandled / unknown event types", () => {
    it("returns 200 OK and ignores 'session.created' without touching Supabase", async () => {
      mockVerifyWebhook.mockResolvedValue(
        buildEvent("session.created", { session_id: "sess_xyz" })
      )

      const res = await POST(buildRequest())

      expect(res.status).toBe(200)
      expect(await res.text()).toBe("OK")
      expect(mockUpsert).not.toHaveBeenCalled()
    })

    it("returns 200 OK and ignores 'user.created' without touching Supabase", async () => {
      mockVerifyWebhook.mockResolvedValue(
        buildEvent("user.created", { id: "user_new" })
      )

      const res = await POST(buildRequest())

      expect(res.status).toBe(200)
      expect(mockUpsert).not.toHaveBeenCalled()
    })

    it("returns 200 OK and ignores 'organization.created' without touching Supabase", async () => {
      mockVerifyWebhook.mockResolvedValue(
        buildEvent("organization.created", { org_id: "org_123" })
      )

      const res = await POST(buildRequest())

      expect(res.status).toBe(200)
      expect(mockUpsert).not.toHaveBeenCalled()
    })
  })

  // ══════════════════════════════════════════════════════════════════════════
  // subscriptionItem.deleted — subscription cancellation
  // ══════════════════════════════════════════════════════════════════════════

  describe("subscriptionItem.deleted (cancellation → reset to free_user)", () => {
    it("resets limits to free_user plan with 5 generations via Supabase upsert", async () => {
      mockVerifyWebhook.mockResolvedValue(
        buildEvent("subscriptionItem.deleted", {
          payer: { user_id: "user_cancel" },
        })
      )

      const res = await POST(buildRequest())

      expect(res.status).toBe(200)
      expect(mockUpsert).toHaveBeenCalledOnce()
      expect(mockUpsert).toHaveBeenCalledWith({
        user_id: "user_cancel",
        generations_remaining: 5,
        plan: "free_user",
      })
    })

    it("uses payer_id as fallback when payer.user_id is absent", async () => {
      mockVerifyWebhook.mockResolvedValue(
        buildEvent("subscriptionItem.deleted", {
          payer_id: "user_fallback_cancel",
        })
      )

      const res = await POST(buildRequest())

      expect(res.status).toBe(200)
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({ user_id: "user_fallback_cancel" })
      )
    })

    it("returns 400 'Missing userId' when neither payer.user_id nor payer_id present", async () => {
      mockVerifyWebhook.mockResolvedValue(
        buildEvent("subscriptionItem.deleted", { random_field: "value" })
      )

      const res = await POST(buildRequest())

      expect(res.status).toBe(400)
      expect(await res.text()).toBe("Missing userId")
      expect(mockUpsert).not.toHaveBeenCalled()
    })

    it("returns 400 when data.payer exists but has no user_id and no payer_id at top level", async () => {
      mockVerifyWebhook.mockResolvedValue(
        buildEvent("subscriptionItem.deleted", {
          payer: { email: "user@example.com" }, // no user_id here
        })
      )

      const res = await POST(buildRequest())

      expect(res.status).toBe(400)
      expect(await res.text()).toBe("Missing userId")
    })

    it("returns 500 'DB error' when Supabase upsert fails", async () => {
      mockVerifyWebhook.mockResolvedValue(
        buildEvent("subscriptionItem.deleted", {
          payer: { user_id: "user_db_fail" },
        })
      )
      mockUpsert.mockResolvedValue({ error: { message: "DB constraint violation" } })

      const res = await POST(buildRequest())

      expect(res.status).toBe(500)
      expect(await res.text()).toBe("DB error")
    })

    it("hardcodes generations_remaining to exactly 5 (free_user allowance)", async () => {
      mockVerifyWebhook.mockResolvedValue(
        buildEvent("subscriptionItem.deleted", {
          payer: { user_id: "user_allowance_check" },
        })
      )

      await POST(buildRequest())

      const upsertArg = mockUpsert.mock.calls[0][0]
      expect(upsertArg.generations_remaining).toBe(5)
      expect(upsertArg.plan).toBe("free_user")
    })

    it("does not perform a select query to check current plan before resetting", async () => {
      mockVerifyWebhook.mockResolvedValue(
        buildEvent("subscriptionItem.deleted", {
          payer: { user_id: "user_no_select" },
        })
      )

      await POST(buildRequest())

      expect(mockSingleSelect).not.toHaveBeenCalled()
    })
  })

  // ══════════════════════════════════════════════════════════════════════════
  // subscriptionItem.active — new subscription activation
  // ══════════════════════════════════════════════════════════════════════════

  describe("subscriptionItem.active (new subscription → full allowance)", () => {
    it("upserts 100 generations for 'starter' plan", async () => {
      mockVerifyWebhook.mockResolvedValue(
        buildEvent("subscriptionItem.active", {
          payer: { user_id: "user_starter" },
          plan: { slug: "starter" },
        })
      )

      const res = await POST(buildRequest())

      expect(res.status).toBe(200)
      expect(mockUpsert).toHaveBeenCalledWith({
        user_id: "user_starter",
        generations_remaining: 100,
        plan: "starter",
      })
    })

    it("upserts null generations_remaining for 'unlimited' plan", async () => {
      mockVerifyWebhook.mockResolvedValue(
        buildEvent("subscriptionItem.active", {
          payer: { user_id: "user_unlimited" },
          plan: { slug: "unlimited" },
        })
      )

      const res = await POST(buildRequest())

      expect(res.status).toBe(200)
      expect(mockUpsert).toHaveBeenCalledWith({
        user_id: "user_unlimited",
        generations_remaining: null,
        plan: "unlimited",
      })
    })

    it("upserts 5 generations for 'free_user' plan", async () => {
      mockVerifyWebhook.mockResolvedValue(
        buildEvent("subscriptionItem.active", {
          payer: { user_id: "user_free" },
          plan: { slug: "free_user" },
        })
      )

      const res = await POST(buildRequest())

      expect(res.status).toBe(200)
      expect(mockUpsert).toHaveBeenCalledWith({
        user_id: "user_free",
        generations_remaining: 5,
        plan: "free_user",
      })
    })

    it("returns 400 'Missing fields' when userId is absent", async () => {
      mockVerifyWebhook.mockResolvedValue(
        buildEvent("subscriptionItem.active", {
          plan: { slug: "starter" },
        })
      )

      const res = await POST(buildRequest())

      expect(res.status).toBe(400)
      expect(await res.text()).toBe("Missing fields")
      expect(mockUpsert).not.toHaveBeenCalled()
    })

    it("returns 400 'Missing fields' when planSlug is absent", async () => {
      mockVerifyWebhook.mockResolvedValue(
        buildEvent("subscriptionItem.active", {
          payer: { user_id: "user_noslug" },
        })
      )

      const res = await POST(buildRequest())

      expect(res.status).toBe(400)
      expect(await res.text()).toBe("Missing fields")
      expect(mockUpsert).not.toHaveBeenCalled()
    })

    it("returns 400 'Missing fields' when both userId and planSlug are absent", async () => {
      mockVerifyWebhook.mockResolvedValue(
        buildEvent("subscriptionItem.active", { other: "data" })
      )

      const res = await POST(buildRequest())

      expect(res.status).toBe(400)
      expect(await res.text()).toBe("Missing fields")
    })

    it("returns 400 'Unknown plan' for an unrecognised plan slug", async () => {
      mockVerifyWebhook.mockResolvedValue(
        buildEvent("subscriptionItem.active", {
          payer: { user_id: "user_unknown" },
          plan: { slug: "enterprise_v99" },
        })
      )

      const res = await POST(buildRequest())

      expect(res.status).toBe(400)
      expect(await res.text()).toBe("Unknown plan")
      expect(mockUpsert).not.toHaveBeenCalled()
    })

    it("returns 400 'Missing fields' for an empty string plan slug (falsy — caught before plan lookup)", async () => {
      mockVerifyWebhook.mockResolvedValue(
        buildEvent("subscriptionItem.active", {
          payer: { user_id: "user_empty_slug" },
          plan: { slug: "" },
        })
      )

      const res = await POST(buildRequest())

      // Empty string is falsy, so `!planSlug` is true → "Missing fields" is
      // returned before the PLAN_GENERATIONS lookup is reached.
      expect(res.status).toBe(400)
      expect(await res.text()).toBe("Missing fields")
    })

    it("returns 500 'DB error' when Supabase upsert fails", async () => {
      mockVerifyWebhook.mockResolvedValue(
        buildEvent("subscriptionItem.active", {
          payer: { user_id: "user_db_err" },
          plan: { slug: "starter" },
        })
      )
      mockUpsert.mockResolvedValue({ error: { message: "write failed" } })

      const res = await POST(buildRequest())

      expect(res.status).toBe(500)
      expect(await res.text()).toBe("DB error")
    })

    it("uses payer_id as fallback when payer.user_id is not present", async () => {
      mockVerifyWebhook.mockResolvedValue(
        buildEvent("subscriptionItem.active", {
          payer_id: "user_payer_id_fallback",
          plan: { slug: "unlimited" },
        })
      )

      const res = await POST(buildRequest())

      expect(res.status).toBe(200)
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({ user_id: "user_payer_id_fallback" })
      )
    })

    it("does NOT perform a Supabase select query (no plan-change check on .active)", async () => {
      mockVerifyWebhook.mockResolvedValue(
        buildEvent("subscriptionItem.active", {
          payer: { user_id: "user_active_no_select" },
          plan: { slug: "starter" },
        })
      )

      await POST(buildRequest())

      expect(mockSingleSelect).not.toHaveBeenCalled()
    })

    it("always overwrites credits regardless of current DB state on .active", async () => {
      mockVerifyWebhook.mockResolvedValue(
        buildEvent("subscriptionItem.active", {
          payer: { user_id: "user_always_upsert" },
          plan: { slug: "starter" },
        })
      )
      // Even if DB says unlimited, .active should overwrite
      mockSingleSelect.mockResolvedValue({ data: { plan: "unlimited" }, error: null })

      await POST(buildRequest())

      expect(mockUpsert).toHaveBeenCalledWith({
        user_id: "user_always_upsert",
        generations_remaining: 100,
        plan: "starter",
      })
    })
  })

  // ══════════════════════════════════════════════════════════════════════════
  // subscriptionItem.updated — plan change guard
  // ══════════════════════════════════════════════════════════════════════════

  describe("subscriptionItem.updated (plan change guard)", () => {
    it("resets credits when upgrading from free_user → starter", async () => {
      mockVerifyWebhook.mockResolvedValue(
        buildEvent("subscriptionItem.updated", {
          payer: { user_id: "user_upgrade_to_starter" },
          plan: { slug: "starter" },
        })
      )
      mockSingleSelect.mockResolvedValue({ data: { plan: "free_user" }, error: null })

      const res = await POST(buildRequest())

      expect(res.status).toBe(200)
      expect(mockUpsert).toHaveBeenCalledWith({
        user_id: "user_upgrade_to_starter",
        generations_remaining: 100,
        plan: "starter",
      })
    })

    it("resets credits when upgrading from starter → unlimited", async () => {
      mockVerifyWebhook.mockResolvedValue(
        buildEvent("subscriptionItem.updated", {
          payer: { user_id: "user_to_unlimited" },
          plan: { slug: "unlimited" },
        })
      )
      mockSingleSelect.mockResolvedValue({ data: { plan: "starter" }, error: null })

      const res = await POST(buildRequest())

      expect(res.status).toBe(200)
      expect(mockUpsert).toHaveBeenCalledWith({
        user_id: "user_to_unlimited",
        generations_remaining: null,
        plan: "unlimited",
      })
    })

    it("resets credits when downgrading from unlimited → starter", async () => {
      mockVerifyWebhook.mockResolvedValue(
        buildEvent("subscriptionItem.updated", {
          payer: { user_id: "user_downgrade" },
          plan: { slug: "starter" },
        })
      )
      mockSingleSelect.mockResolvedValue({ data: { plan: "unlimited" }, error: null })

      const res = await POST(buildRequest())

      expect(res.status).toBe(200)
      expect(mockUpsert).toHaveBeenCalledWith({
        user_id: "user_downgrade",
        generations_remaining: 100,
        plan: "starter",
      })
    })

    it("does NOT reset credits when the plan slug is unchanged (idempotency guard)", async () => {
      mockVerifyWebhook.mockResolvedValue(
        buildEvent("subscriptionItem.updated", {
          payer: { user_id: "user_same_plan" },
          plan: { slug: "starter" },
        })
      )
      mockSingleSelect.mockResolvedValue({ data: { plan: "starter" }, error: null })

      const res = await POST(buildRequest())

      expect(res.status).toBe(200)
      expect(mockUpsert).not.toHaveBeenCalled()
    })

    it("does NOT reset credits when the unlimited plan is unchanged", async () => {
      mockVerifyWebhook.mockResolvedValue(
        buildEvent("subscriptionItem.updated", {
          payer: { user_id: "user_still_unlimited" },
          plan: { slug: "unlimited" },
        })
      )
      mockSingleSelect.mockResolvedValue({ data: { plan: "unlimited" }, error: null })

      const res = await POST(buildRequest())

      expect(res.status).toBe(200)
      expect(mockUpsert).not.toHaveBeenCalled()
    })

    it("resets credits when no row exists yet (null current plan)", async () => {
      mockVerifyWebhook.mockResolvedValue(
        buildEvent("subscriptionItem.updated", {
          payer: { user_id: "user_new_row" },
          plan: { slug: "starter" },
        })
      )
      mockSingleSelect.mockResolvedValue({ data: null, error: null })

      const res = await POST(buildRequest())

      expect(res.status).toBe(200)
      expect(mockUpsert).toHaveBeenCalledWith({
        user_id: "user_new_row",
        generations_remaining: 100,
        plan: "starter",
      })
    })

    it("returns 400 'Missing fields' when userId is absent", async () => {
      mockVerifyWebhook.mockResolvedValue(
        buildEvent("subscriptionItem.updated", {
          plan: { slug: "starter" },
        })
      )

      const res = await POST(buildRequest())

      expect(res.status).toBe(400)
      expect(await res.text()).toBe("Missing fields")
    })

    it("returns 400 'Missing fields' when planSlug is absent", async () => {
      mockVerifyWebhook.mockResolvedValue(
        buildEvent("subscriptionItem.updated", {
          payer: { user_id: "user_noslug_update" },
        })
      )

      const res = await POST(buildRequest())

      expect(res.status).toBe(400)
      expect(await res.text()).toBe("Missing fields")
    })

    it("returns 400 'Unknown plan' for unrecognised plan slug on update", async () => {
      mockVerifyWebhook.mockResolvedValue(
        buildEvent("subscriptionItem.updated", {
          payer: { user_id: "user_bad_slug" },
          plan: { slug: "mystery_plan" },
        })
      )

      const res = await POST(buildRequest())

      expect(res.status).toBe(400)
      expect(await res.text()).toBe("Unknown plan")
    })

    it("returns 500 'DB error' when Supabase upsert fails during plan change", async () => {
      mockVerifyWebhook.mockResolvedValue(
        buildEvent("subscriptionItem.updated", {
          payer: { user_id: "user_upsert_fail" },
          plan: { slug: "unlimited" },
        })
      )
      mockSingleSelect.mockResolvedValue({ data: { plan: "starter" }, error: null })
      mockUpsert.mockResolvedValue({ error: { message: "upsert failed" } })

      const res = await POST(buildRequest())

      expect(res.status).toBe(500)
      expect(await res.text()).toBe("DB error")
    })

    it("performs a Supabase select filtered by user_id before deciding to upsert", async () => {
      mockVerifyWebhook.mockResolvedValue(
        buildEvent("subscriptionItem.updated", {
          payer: { user_id: "user_select_check" },
          plan: { slug: "unlimited" },
        })
      )
      mockSingleSelect.mockResolvedValue({ data: { plan: "free_user" }, error: null })

      await POST(buildRequest())

      expect(mockSingleSelect).toHaveBeenCalledOnce()
    })

    it("falls back to payer_id on updated events", async () => {
      mockVerifyWebhook.mockResolvedValue(
        buildEvent("subscriptionItem.updated", {
          payer_id: "user_payer_fallback_update",
          plan: { slug: "starter" },
        })
      )
      mockSingleSelect.mockResolvedValue({ data: { plan: "free_user" }, error: null })

      const res = await POST(buildRequest())

      expect(res.status).toBe(200)
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({ user_id: "user_payer_fallback_update" })
      )
    })
  })

  // ══════════════════════════════════════════════════════════════════════════
  // PLAN_GENERATIONS constant correctness
  // ══════════════════════════════════════════════════════════════════════════

  describe("PLAN_GENERATIONS allowance mapping", () => {
    const planCases: Array<[string, number | null]> = [
      ["free_user", 5],
      ["starter", 100],
      ["unlimited", null],
    ]

    it.each(planCases)(
      "plan '%s' maps to %s generations on .active event",
      async (slug, expectedAllowance) => {
        mockVerifyWebhook.mockResolvedValue(
          buildEvent("subscriptionItem.active", {
            payer: { user_id: `user_plan_${slug}` },
            plan: { slug },
          })
        )

        await POST(buildRequest())

        expect(mockUpsert).toHaveBeenCalledWith(
          expect.objectContaining({ generations_remaining: expectedAllowance })
        )
      }
    )

    it.each(planCases)(
      "plan '%s' maps to %s generations on .deleted (cancellation always resets to free_user=5)",
      async () => {
        // Cancellation always resets to free_user regardless of previous plan
        mockVerifyWebhook.mockResolvedValue(
          buildEvent("subscriptionItem.deleted", {
            payer: { user_id: "user_cancel_any" },
          })
        )

        await POST(buildRequest())

        expect(mockUpsert).toHaveBeenCalledWith(
          expect.objectContaining({ generations_remaining: 5, plan: "free_user" })
        )
      }
    )
  })

  // ══════════════════════════════════════════════════════════════════════════
  // HTTP response format
  // ══════════════════════════════════════════════════════════════════════════

  describe("HTTP response format", () => {
    it("returns 'OK' body with status 200 on successful cancellation", async () => {
      mockVerifyWebhook.mockResolvedValue(
        buildEvent("subscriptionItem.deleted", {
          payer: { user_id: "user_ok" },
        })
      )

      const res = await POST(buildRequest())

      expect(res.status).toBe(200)
      expect(await res.text()).toBe("OK")
    })

    it("returns 'OK' body with status 200 on successful .active event", async () => {
      mockVerifyWebhook.mockResolvedValue(
        buildEvent("subscriptionItem.active", {
          payer: { user_id: "user_ok2" },
          plan: { slug: "starter" },
        })
      )

      const res = await POST(buildRequest())

      expect(res.status).toBe(200)
      expect(await res.text()).toBe("OK")
    })

    it("returns 'OK' body with status 200 when plan is unchanged on .updated", async () => {
      mockVerifyWebhook.mockResolvedValue(
        buildEvent("subscriptionItem.updated", {
          payer: { user_id: "user_nochange" },
          plan: { slug: "starter" },
        })
      )
      mockSingleSelect.mockResolvedValue({ data: { plan: "starter" }, error: null })

      const res = await POST(buildRequest())

      expect(res.status).toBe(200)
      expect(await res.text()).toBe("OK")
    })

    it("returns 'OK' body with status 200 when plan changes on .updated", async () => {
      mockVerifyWebhook.mockResolvedValue(
        buildEvent("subscriptionItem.updated", {
          payer: { user_id: "user_changed" },
          plan: { slug: "unlimited" },
        })
      )
      mockSingleSelect.mockResolvedValue({ data: { plan: "starter" }, error: null })

      const res = await POST(buildRequest())

      expect(res.status).toBe(200)
      expect(await res.text()).toBe("OK")
    })

    it("returns 'Verification failed' body with status 400 on invalid signature", async () => {
      mockVerifyWebhook.mockRejectedValue(new Error("Signature mismatch"))

      const res = await POST(buildRequest())

      expect(res.status).toBe(400)
      expect(await res.text()).toBe("Verification failed")
    })
  })

  // ══════════════════════════════════════════════════════════════════════════
  // Supabase call count assertions
  // ══════════════════════════════════════════════════════════════════════════

  describe("Supabase call count correctness", () => {
    it("calls upsert exactly once on .deleted event", async () => {
      mockVerifyWebhook.mockResolvedValue(
        buildEvent("subscriptionItem.deleted", {
          payer: { user_id: "user_once_deleted" },
        })
      )

      await POST(buildRequest())

      expect(mockUpsert).toHaveBeenCalledTimes(1)
    })

    it("calls upsert exactly once on .active event", async () => {
      mockVerifyWebhook.mockResolvedValue(
        buildEvent("subscriptionItem.active", {
          payer: { user_id: "user_once_active" },
          plan: { slug: "starter" },
        })
      )

      await POST(buildRequest())

      expect(mockUpsert).toHaveBeenCalledTimes(1)
    })

    it("calls upsert exactly once on .updated when plan changes", async () => {
      mockVerifyWebhook.mockResolvedValue(
        buildEvent("subscriptionItem.updated", {
          payer: { user_id: "user_once_updated" },
          plan: { slug: "unlimited" },
        })
      )
      mockSingleSelect.mockResolvedValue({ data: { plan: "starter" }, error: null })

      await POST(buildRequest())

      expect(mockUpsert).toHaveBeenCalledTimes(1)
    })

    it("calls upsert zero times on .updated when plan is unchanged", async () => {
      mockVerifyWebhook.mockResolvedValue(
        buildEvent("subscriptionItem.updated", {
          payer: { user_id: "user_zero_upsert" },
          plan: { slug: "unlimited" },
        })
      )
      mockSingleSelect.mockResolvedValue({ data: { plan: "unlimited" }, error: null })

      await POST(buildRequest())

      expect(mockUpsert).toHaveBeenCalledTimes(0)
    })

    it("calls select exactly once on .updated event", async () => {
      mockVerifyWebhook.mockResolvedValue(
        buildEvent("subscriptionItem.updated", {
          payer: { user_id: "user_select_once" },
          plan: { slug: "starter" },
        })
      )
      mockSingleSelect.mockResolvedValue({ data: { plan: "free_user" }, error: null })

      await POST(buildRequest())

      expect(mockSingleSelect).toHaveBeenCalledTimes(1)
    })
  })
})
