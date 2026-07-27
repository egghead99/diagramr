"use client"

import { useEffect, useRef } from "react"
import { SignUpButton } from "@clerk/nextjs"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { Logo } from "@/components/ui/logo"

const FOOTER_LINKS = [
  {
    heading: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "How it works", href: "#how-it-works" },
      { label: "Pricing", href: "#pricing" },
      { label: "Changelog", href: "#" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy Policy", href: "#" },
      { label: "Terms of Service", href: "#" },
    ],
  },
]

export function CtaSection() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = "1"
          el.style.transform = "translateY(0)"
          obs.disconnect()
        }
      },
      { threshold: 0.2 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <section className="bg-white px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div
          ref={ref}
          className="relative overflow-hidden rounded-3xl bg-teal-600 px-8 py-16 text-center shadow-2xl shadow-teal-500/20"
          style={{
            opacity: 0,
            transform: "translateY(32px)",
            transition: "opacity 0.7s ease, transform 0.7s ease",
          }}
        >
          {/* Decorative circles */}
          <div
            className="pointer-events-none absolute -top-16 -right-16 h-64 w-64 rounded-full bg-teal-500/30"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-teal-700/40"
            aria-hidden
          />

          <div className="relative z-10">
            <p className="mb-3 text-sm font-semibold tracking-widest text-teal-200 uppercase">
              Get started today
            </p>
            <h2 className="font-serif text-4xl font-medium text-white sm:text-5xl">
              Your ideas deserve better than a whiteboard.
            </h2>
            <p className="mx-auto mt-4 max-w-md text-lg text-teal-100">
              Join thousands of teams using Diagramr to turn complex ideas into
              clear, shareable diagrams instantly.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <SignUpButton mode="modal">
                <button
                  id="cta-final"
                  className="group flex cursor-pointer items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-base font-semibold text-teal-700 shadow-md transition-all duration-200 hover:bg-teal-50 hover:shadow-lg active:scale-95"
                >
                  Start for free
                  <ArrowRight
                    className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </button>
              </SignUpButton>

              <Link
                href="#pricing"
                id="cta-pricing"
                className="flex cursor-pointer items-center gap-2 rounded-xl border border-teal-300/60 px-7 py-3.5 text-base font-semibold text-white transition-all duration-200 hover:border-teal-300/40 hover:bg-teal-500 active:scale-95"
              >
                View pricing
              </Link>
            </div>

            <p className="mt-5 text-sm text-teal-300">
              No credit card required · Cancel anytime
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export function LandingFooter() {
  return (
    <footer className="border-t border-neutral-100 bg-white px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-1">
            <Link
              href="/"
              className="mb-4 flex items-center gap-2"
              aria-label="Diagramr home"
            >
              <Logo />
              <span className="font-mono text-xl text-neutral-900 uppercase">
                Diagramr
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-neutral-500">
              AI-powered diagram generation for modern teams.
            </p>
          </div>

          {/* Links */}
          {FOOTER_LINKS.map(({ heading, links }) => (
            <div key={heading}>
              <p className="mb-4 text-xs font-semibold tracking-wider text-neutral-400 uppercase">
                {heading}
              </p>
              <ul className="flex flex-col gap-2.5">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-sm text-neutral-500 transition-colors duration-150 hover:text-teal-600"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-neutral-100 pt-6 sm:flex-row">
          <p className="text-xs text-neutral-400">
            © {new Date().getFullYear()} Diagramr. All rights reserved.
          </p>
          <p className="text-xs text-neutral-400">
            Made with love for visual thinkers.
          </p>
        </div>
      </div>
    </footer>
  )
}
