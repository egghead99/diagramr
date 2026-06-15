"use server"

import fs from "fs/promises"
import path from "path"
import { generateText } from "ai"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { auth } from "@clerk/nextjs/server"
import { createClient } from "@supabase/supabase-js"

const googleProvider = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
})

// Service role client for credit refunds — bypasses RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function getSystemPrompt() {
  const filePath = path.join(process.cwd(), "lib", "prompt.md")
  return await fs.readFile(filePath, "utf-8")
}

export async function generateDiagramAction({
  prompt,
  styleConfig,
}: {
  prompt: string
  styleConfig: {
    titleFont: string
    headerFont: string
    bodyFont: string
    circle1Fill: string
    circle1Ring: string
    circle2Fill: string
    circle2Ring: string
  }
}) {
  const { userId, getToken } = await auth()
  if (!userId) {
    throw new Error("Unauthorized")
  }

  // Initialize Supabase client using Clerk access token
  const token = await getToken()
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      async accessToken() {
        return token
      },
    }
  )

  // Check and consume a generation before calling the AI
  const { data: allowed, error: limitError } = await supabase.rpc(
    "consume_generation",
    { p_user_id: userId }
  )

  if (limitError) {
    throw new Error(limitError.message)
  }

  if (!allowed) {
    throw new Error("You're out of generations. Upgrade your plan for more.")
  }

  try {
    const systemPrompt = await getSystemPrompt()
    const { text: aiText } = await generateText({
      model: googleProvider("gemini-2.5-flash-lite"),
      prompt: prompt,
      system: systemPrompt,
    })

    // Construct the wrapped content with the venn tags
    let vennAttrs = `title-font="${styleConfig.titleFont}" header-font="${styleConfig.headerFont}" body-font="${styleConfig.bodyFont}" color-1="${styleConfig.circle1Fill}" color-2="${styleConfig.circle2Fill}"`
    if (styleConfig.circle1Ring !== "none") {
      vennAttrs += ` border-color-1="${styleConfig.circle1Ring}"`
    }
    if (styleConfig.circle2Ring !== "none") {
      vennAttrs += ` border-color-2="${styleConfig.circle2Ring}"`
    }
    const content = `<venn ${vennAttrs}>${aiText.trim()}</venn>`

    // Extract diagram title for row name
    const titleMatch = content.match(/<title>([^<]*)<\/title>/i)
    const name = titleMatch ? titleMatch[1].trim() : "Untitled diagram"

    const now = new Date()
    const { data, error } = await supabase
      .from("gens")
      .insert({
        name,
        content,
        prompt,
        type: "venn",
        user_id: userId,
        created_at: now.toISOString(),
      })
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return data
  } catch (err) {
    // Refund the consumed credit since the generation failed.
    // Uses the admin client to bypass RLS.
    try {
      const { data: limitData } = await supabaseAdmin
        .from("limits")
        .select("generations_remaining")
        .eq("user_id", userId)
        .single()

      // Only refund if the user has a finite credit count (not unlimited)
      if (limitData && limitData.generations_remaining !== null) {
        await supabaseAdmin
          .from("limits")
          .update({
            generations_remaining: limitData.generations_remaining + 1,
          })
          .eq("user_id", userId)
      }
    } catch (refundErr) {
      console.error(
        "[generateDiagramAction] Failed to refund credit:",
        refundErr
      )
    }

    throw err
  }
}
