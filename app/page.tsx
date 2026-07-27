"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"

import { LandingNav, HeroSection } from "@/components/landing/hero"
import FeaturesSection from "@/components/landing/features"
import HowItWorksSection from "@/components/landing/how-it-works"
import SocialProofSection from "@/components/landing/social-proof"
import PricingSection from "@/components/landing/pricing"
import { CtaSection, LandingFooter } from "@/components/landing/cta-footer"

export default function Home() {
  const { isSignedIn, isLoaded } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace("/generate")
    }
  }, [isLoaded, isSignedIn, router])

  // If still loading auth state, or if the user is signed in (redirecting), show a minimal loader
  if (!isLoaded || isSignedIn) {
    return (
      <main className="flex h-screen w-full items-center justify-center bg-transparent">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
      </main>
    )
  }

  return (
    <>
      <LandingNav />
      <main
        className="w-full"
        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      >
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <SocialProofSection />
        <PricingSection />
        <CtaSection />
        <LandingFooter />
      </main>
    </>
  )
}
