"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { Infinity, MoreHorizontal, Search } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useUser, UserButton, useAuth, useClerk } from "@clerk/nextjs"
import { Logo } from "@/components/ui/logo"
import { Venn } from "@/components/venn"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
  ItemMedia,
  ItemActions,
} from "@/components/ui/item"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { Diagram } from "./diagram"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"

import { useSession } from "@clerk/nextjs"
import { createClient } from "@supabase/supabase-js"
import { Generation } from "@/lib/samples"

export function timeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" })

  const intervals: { label: Intl.RelativeTimeFormatUnit; seconds: number }[] = [
    { label: "year", seconds: 31536000 },
    { label: "month", seconds: 2592000 },
    { label: "day", seconds: 86400 },
    { label: "hour", seconds: 3600 },
    { label: "minute", seconds: 60 },
    { label: "second", seconds: 1 },
  ]

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds)
    if (count >= 1) {
      const formatted = rtf.format(-count, interval.label)
      return formatted.charAt(0).toUpperCase() + formatted.slice(1)
    }
  }
  return "Just now"
}

export function AppSidebar() {
  const { has } = useAuth()
  const { openUserProfile } = useClerk()
  const hasUnlimitedPlan = has ? has({ plan: "unlimited" }) : false
  const hasStarterPlan = has ? has({ plan: "starter" }) : false

  // The `useUser()` hook is used to ensure that Clerk has loaded data about the signed in user
  const { user, isSignedIn, isLoaded } = useUser()
  // The `useSession()` hook is used to get the Clerk session object
  // The session object is used to get the Clerk session token
  const { session } = useSession()

  const pathname = usePathname()
  const [searchQuery, setSearchQuery] = useState("")
  const [gens, setGens] = useState<Generation[]>([])
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null)
  const [creditsLoaded, setCreditsLoaded] = useState(false)
  // Create a custom Supabase client that injects the Clerk session token into the request headers
  const createClerkSupabaseClient = useCallback(() => {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        async accessToken() {
          return session?.getToken() ?? null
        },
      }
    )
  }, [session])

  const loadTasks = useCallback(async () => {
    if (!isLoaded || !user) {
      return
    }
    const client = createClerkSupabaseClient()
    const { data, error } = await client
      .from("gens")
      .select()
      .order("created_at", { ascending: false })

    if (!error && data) {
      setGens(
        data.map(
          (item: {
            id: string
            name: string
            content: string
            prompt: string
            type: "venn" | "force" | "circuit"
            user_id: string
            created_at: string
          }) => ({
            ...item,
            createdAt: new Date(item.created_at),
            userId: item.user_id,
          })
        )
      )
    }

    const { data: limitData, error: limitError } = await client
      .from("limits")
      .select("generations_remaining")
      .single()

    if (!limitError && limitData) {
      setCreditsRemaining(limitData.generations_remaining)
    }
    setCreditsLoaded(true)
  }, [isLoaded, user, createClerkSupabaseClient])

  // Clear gens when user signs out or switches accounts
  useEffect(() => {
    if (!isLoaded) return
    if (!user) {
      setGens([])
      setCreditsRemaining(null)
      setCreditsLoaded(false)
    }
  }, [isLoaded, user])

  useEffect(() => {
    if (!isLoaded || !user) {
      return
    }

    loadTasks()

    const handleDiagramsChanged = () => {
      loadTasks()
    }

    window.addEventListener("diagrams-changed", handleDiagramsChanged)
    return () => {
      window.removeEventListener("diagrams-changed", handleDiagramsChanged)
    }
  }, [isLoaded, user, loadTasks, pathname])

  const filteredGenerations = useMemo(() => {
    return gens.filter((gen) =>
      gen.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [searchQuery, gens])

  if (!isLoaded || !isSignedIn) {
    return null
  }

  return (
    <Sidebar>
      <SidebarHeader className="mb-0 gap-3 pt-4">
        <div className="mx-2 mb-2 flex flex-col gap-2">
          <div className="mb-1 flex flex-row items-center justify-between px-2">
            <Link
              className="flex flex-row items-center gap-2 font-mono text-xl uppercase"
              href="/"
            >
              <p className="font-medium">Diagramr</p>
              <Logo />
              <p className="font-extralight">AI</p>
            </Link>
          </div>
          <InputGroup className="bg-background">
            <InputGroupInput
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
          </InputGroup>
        </div>
      </SidebarHeader>

      <SidebarContent className="flex flex-col gap-4 overflow-hidden px-4">
        <SidebarGroup className="flex min-h-0 flex-1 flex-col gap-3 p-0">
          <ScrollArea className="flex-1 overflow-auto">
            <div className="flex flex-col gap-2">
              {filteredGenerations.length > 0 ? (
                filteredGenerations.map((gen) => (
                  <Diagram
                    key={gen.id}
                    gen={gen}
                    onSave={loadTasks}
                    onDelete={loadTasks}
                  >
                    <Item
                      variant="muted"
                      className="group cursor-pointer bg-transparent transition-none last:mb-4 hover:bg-foreground/3"
                    >
                      <ItemMedia variant="image" className="border">
                        <Venn>{gen.content as string}</Venn>
                      </ItemMedia>
                      <ItemContent>
                        <ItemTitle className="line-clamp-2">
                          {gen.name}
                        </ItemTitle>
                        <ItemDescription>
                          {timeAgo(gen.createdAt)}
                        </ItemDescription>
                      </ItemContent>
                      <ItemActions className="self-start">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          className="opacity-0 transition-colors group-hover/item:opacity-100 group-data-[state=open]/item:opacity-100 hover:bg-foreground/5"
                        >
                          <MoreHorizontal />
                        </Button>
                      </ItemActions>
                    </Item>
                  </Diagram>
                ))
              ) : (
                <Empty className="h-full bg-muted">
                  <EmptyHeader>
                    <EmptyTitle>No diagrams found</EmptyTitle>
                    <EmptyDescription className="max-w-xs text-pretty">
                      Your generated diagrams will appear here.
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/generate">Get started</Link>
                    </Button>
                  </EmptyContent>
                </Empty>
              )}
            </div>
          </ScrollArea>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="flex flex-col gap-2 border-t px-2 pt-5 pb-3">
        <div className="mx-2 flex flex-row items-center gap-2">
          <Button
            variant="default"
            className="flex-1 rounded-full [word-spacing:-0.2rem]"
            asChild
          >
            <Link href="/generate">Generate new diagram</Link>
          </Button>
          <UserButton />
        </div>
        <HoverCard openDelay={50} closeDelay={50}>
          <HoverCardTrigger>
            {hasUnlimitedPlan ? (
              <div className="mx-1 flex cursor-pointer flex-col gap-2 rounded-lg px-3 pt-2 pb-3 hover:bg-foreground/3">
                <div className="flex flex-row items-end justify-between">
                  <p className="text-sm">Unlimited plan</p>
                  <p className="flex flex-row gap-1 font-mono text-xs text-muted-foreground">
                    No limits
                  </p>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-foreground/5">
                  <div className="h-2 w-full bg-blue-500 dark:bg-blue-600" />
                </div>
              </div>
            ) : hasStarterPlan ? (
              <div className="mx-1 flex cursor-pointer flex-col gap-2 rounded-lg px-3 pt-2 pb-3 hover:bg-foreground/3">
                <div className="flex flex-row items-end justify-between">
                  <p className="text-sm">Starter plan</p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {!creditsLoaded ? (
                      <span className="inline-block h-3 w-10 animate-pulse rounded bg-foreground/10" />
                    ) : (
                      `${creditsRemaining ?? 0} credits`
                    )}
                  </p>
                </div>
                {!creditsLoaded ? (
                  <div className="h-2 w-full animate-pulse rounded-full bg-foreground/10" />
                ) : (
                  <div className="h-2 w-full overflow-hidden rounded-full bg-foreground/5">
                    <div
                      className="h-2 bg-blue-500 transition-all duration-500 dark:bg-blue-600"
                      style={{
                        width: `${Math.min(100, Math.max(0, ((creditsRemaining ?? 0) / 100) * 100))}%`,
                      }}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="mx-1 flex cursor-pointer flex-col gap-2 rounded-lg px-3 pt-2 pb-3 hover:bg-foreground/3">
                <div className="flex flex-row items-end justify-between">
                  <p className="text-sm">Free plan</p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {!creditsLoaded ? (
                      <span className="inline-block h-3 w-10 animate-pulse rounded bg-foreground/10" />
                    ) : (
                      `${creditsRemaining ?? 5} credits`
                    )}
                  </p>
                </div>
                {!creditsLoaded ? (
                  <div className="h-2 w-full animate-pulse rounded-full bg-foreground/10" />
                ) : (
                  <div className="h-2 w-full overflow-hidden rounded-full bg-foreground/5">
                    <div
                      className="h-2 bg-blue-500 transition-all duration-500 dark:bg-blue-600"
                      style={{
                        width: `${Math.min(100, Math.max(0, ((creditsRemaining ?? 5) / 5) * 100))}%`,
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </HoverCardTrigger>
          <HoverCardContent
            className="flex w-48 flex-col gap-0.5"
            side="right"
            align="end"
          >
            <p className="text-xs">
              Credits are consumed when diagrams are generated.{" "}
              {hasUnlimitedPlan && "You have unlimited credits."}
              <a
                href="/pricing"
                className="cursor-pointer text-left text-blue-500 underline"
              >
                {hasStarterPlan &&
                  !hasUnlimitedPlan &&
                  "Upgrade to unlimited for no credit limits."}
                {!hasUnlimitedPlan &&
                  !hasStarterPlan &&
                  "Upgrade for more credits."}
              </a>
            </p>
          </HoverCardContent>
        </HoverCard>
      </SidebarFooter>
    </Sidebar>
  )
}
