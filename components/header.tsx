"use client"

import { useUser, SignInButton, SignUpButton } from "@clerk/nextjs"
import { Logo } from "@/components/ui/logo"
import { Button } from "@/components/ui/button"

interface HeaderProps {
  className?: string
}

export function Header({ className }: HeaderProps) {
  const { isSignedIn, isLoaded } = useUser()

  if (!isLoaded) {
    return <header className={className} />
  }

  if (isSignedIn) {
    return null
  }

  return (
    <header className={className}>
      <div className="flex flex-row items-center justify-between px-6 py-4">
        <div className="flex flex-row items-center gap-2 font-mono text-lg tracking-tight uppercase sm:text-xl">
          <p className="font-medium">Diagramr</p>
          <Logo />
          <p className="font-extralight text-muted-foreground">AI</p>
        </div>
        <nav className="flex items-center gap-2">
          <SignInButton mode="modal">
            <Button variant="secondary" size="sm">
              Login
            </Button>
          </SignInButton>
          <SignUpButton mode="modal">
            <Button size="sm">Create Account</Button>
          </SignUpButton>
        </nav>
      </div>
    </header>
  )
}
