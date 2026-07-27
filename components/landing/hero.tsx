"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { SignUpButton } from "@clerk/nextjs"
import { ArrowRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/ui/logo"
import Ripple from "@/components/ripple"

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "/pricing" },
]

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <nav
      className={`fixed top-4 left-1/2 z-50 -translate-x-1/2 transition-all duration-300 ${
        scrolled
          ? "w-[min(90vw,900px)] rounded-2xl border border-neutral-100 bg-white/80 shadow-lg shadow-neutral-900/5 backdrop-blur-lg"
          : "w-[min(90vw,900px)] rounded-2xl bg-transparent"
      }`}
    >
      <div className="flex items-center justify-between px-5 py-3">
        <Link
          href="/"
          className="flex items-center gap-2 font-logo text-2xl tracking-tight text-neutral-900"
          aria-label="Diagramr home"
        >
          <Logo />
          <span className="font-mono uppercase">Diagramr</span>
        </Link>

        <ul className="hidden items-center gap-7 md:flex">
          {NAV_LINKS.map(({ label, href }) => (
            <li key={label}>
              <Link
                href={href}
                className="text-sm font-medium text-neutral-600 transition-colors duration-150 hover:text-teal-600"
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>

        <SignUpButton mode="modal">
          <button
            id="nav-cta"
            className="cursor-pointer rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-teal-700 hover:shadow-md active:scale-95"
          >
            Get started free
          </button>
        </SignUpButton>
      </div>
    </nav>
  )
}

export function HeroSection() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 text-center">
      {/* Background */}
      <Ripple
        className="absolute inset-0 h-full w-full"
        lineColor="rgba(13,148,136,0.15)"
        levels={18}
      />

      {/* Subtle radial gradient overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(240,253,250,0.95) 0%, rgba(240,253,250,0.7) 50%, transparent 100%)",
        }}
        aria-hidden
      />

      {/* Content */}
      <div className="relative z-10 mt-10 flex flex-col items-center gap-2">
        {/* Badge */}
        <a
          href="#"
          id="hero-badge"
          className="group flex cursor-pointer items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-4 py-1.5 text-sm font-medium text-teal-700 transition-all duration-200 hover:border-teal-300 hover:bg-teal-100"
        >
          <span
            className="flex h-2 w-2 rounded-full bg-teal-500 shadow-[0_0_6px_2px_rgba(20,184,166,0.5)]"
            aria-hidden
          />
          Diagramr 2.0
          <span className="text-teal-500">See what's new</span>
          <ArrowRight
            className="h-3.5 w-3.5 text-teal-500 transition-transform duration-200 group-hover:translate-x-0.5"
            aria-hidden
          />
        </a>

        {/* Headline */}
        <h1 className="mb-2 max-w-4xl font-serif text-5xl leading-tight font-medium tracking-tight text-neutral-900 sm:text-6xl md:text-7xl lg:text-8xl">
          Turn ideas into{" "}
          <span className="relative inline-block text-teal-600">
            beautiful
            <svg
              className="absolute -bottom-3 left-0 w-full"
              viewBox="0 0 120 12"
              preserveAspectRatio="none"
              aria-hidden
            >
              <path
                d="M0 6 C5 0, 10 0, 15 6 S25 12, 30 6 S40 0, 45 6 S55 12, 60 6 S70 0, 75 6 S85 12, 90 6 S100 0, 105 6 S115 12, 120 6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className="text-teal-300"
              />
            </svg>{" "}
          </span>{" "}
          diagrams
        </h1>

        {/* Sub */}
        <p className="mx-auto mb-4 max-w-2xl text-lg leading-relaxed text-neutral-600 sm:text-xl">
          Describe what you want to visualize in plain English, and Diagramr
          generates clean, structured diagrams instantly. No design skills
          needed.
        </p>

        {/* CTAs */}
        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <SignUpButton mode="modal">
            <button
              id="hero-cta-primary"
              className="group flex cursor-pointer items-center gap-2 rounded-xl bg-teal-600 px-7 py-3.5 text-base font-semibold text-white shadow-md transition-all duration-200 hover:bg-teal-700 hover:shadow-lg hover:shadow-teal-500/20 active:scale-95"
            >
              Start for free
              <ArrowRight
                className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                aria-hidden
              />
            </button>
          </SignUpButton>

          <a
            href="#how-it-works"
            id="hero-cta-secondary"
            className="flex cursor-pointer items-center gap-2 rounded-xl border border-neutral-200 bg-white px-7 py-3.5 text-base font-semibold text-neutral-700 shadow-sm transition-all duration-200 hover:border-neutral-300 hover:bg-neutral-50 active:scale-95"
          >
            See how it works
          </a>
        </div>

        {/* Social proof */}
        <p className="text-sm text-neutral-400">
          No credit card required · Free forever plan available
        </p>
      </div>
    </section>
  )
}
