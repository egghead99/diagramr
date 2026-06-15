import { verifyWebhook } from "@clerk/nextjs/webhooks"
import { NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Clerk Billing plan slugs → generation allowances.
// Use `null` for unlimited.
const PLAN_GENERATIONS: Record<string, number | null> = {
  free_user: 5,
  starter: 100,
  unlimited: null,
}

// Service role client — bypasses RLS. Server-only, never expose this key to the client.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  let rawEvt
  try {
    rawEvt = await verifyWebhook(req)
  } catch (err) {
    console.error("Clerk webhook verification failed:", err)
    return new Response("Verification failed", { status: 400 })
  }

  // Cast to any: Clerk's SDK type union doesn't include all billing event
  // types yet (e.g. subscriptionItem.deleted), but they are valid at runtime.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const evt = rawEvt as any

  // ── Subscription cancelled ──────────────────────────────────────────
  if (evt.type === "subscriptionItem.deleted") {
    console.log(
      `[clerk-billing webhook] ${evt.type}`,
      JSON.stringify(evt.data, null, 2)
    )

    const data = evt.data as Record<string, any>
    const userId: string | undefined = data.payer?.user_id ?? data.payer_id

    if (!userId) {
      console.error(
        "[clerk-billing webhook] Could not extract userId for deletion"
      )
      return new Response("Missing userId", { status: 400 })
    }

    const freeAllowance = PLAN_GENERATIONS["free_user"]

    const { error } = await supabaseAdmin
      .from("limits")
      .upsert({
        user_id: userId,
        generations_remaining: freeAllowance,
        plan: "free_user",
      })

    if (error) {
      console.error(
        "[clerk-billing webhook] Failed to reset limits on cancellation:",
        error
      )
      return new Response("DB error", { status: 500 })
    }

    return new Response("OK", { status: 200 })
  }

  // ── Subscription activated or updated ───────────────────────────────
  if (
    evt.type === "subscriptionItem.active" ||
    evt.type === "subscriptionItem.updated"
  ) {
    console.log(
      `[clerk-billing webhook] ${evt.type}`,
      JSON.stringify(evt.data, null, 2)
    )

    const data = evt.data as Record<string, any>

    const userId: string | undefined = data.payer?.user_id ?? data.payer_id
    const planSlug: string | undefined = data.plan?.slug

    if (!userId || !planSlug) {
      console.error(
        "[clerk-billing webhook] Could not extract userId/planSlug",
        {
          userId,
          planSlug,
        }
      )
      return new Response("Missing fields", { status: 400 })
    }

    if (!(planSlug in PLAN_GENERATIONS)) {
      console.error(`[clerk-billing webhook] Unknown plan slug: ${planSlug}`)
      return new Response("Unknown plan", { status: 400 })
    }

    const allowance = PLAN_GENERATIONS[planSlug]

    if (evt.type === "subscriptionItem.active") {
      // New subscription — always set the full allowance.
      const { error } = await supabaseAdmin
        .from("limits")
        .upsert({
          user_id: userId,
          generations_remaining: allowance,
          plan: planSlug,
        })

      if (error) {
        console.error("[clerk-billing webhook] Failed to update limits:", error)
        return new Response("DB error", { status: 500 })
      }
    } else {
      // Updated — only reset credits if the plan actually changed.
      // This prevents non-plan metadata updates (e.g. billing date changes)
      // from accidentally resetting a user's consumed credits.
      const { data: current } = await supabaseAdmin
        .from("limits")
        .select("plan")
        .eq("user_id", userId)
        .single()

      if (!current || current.plan !== planSlug) {
        // Plan changed — reset credits to new plan allowance
        const { error } = await supabaseAdmin
          .from("limits")
          .upsert({
            user_id: userId,
            generations_remaining: allowance,
            plan: planSlug,
          })

        if (error) {
          console.error(
            "[clerk-billing webhook] Failed to update limits:",
            error
          )
          return new Response("DB error", { status: 500 })
        }
      }
      // Same plan → don't touch credits
    }
  }

  return new Response("OK", { status: 200 })
}
