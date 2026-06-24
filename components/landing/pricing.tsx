"use client"

import { useEffect, useRef } from "react"
import { SignUpButton } from "@clerk/nextjs"
import { Check, ArrowRight } from "lucide-react"
import Link from "next/link"

const PLANS = [
  {
    id: "plan-free",
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for individuals exploring AI diagramming.",
    cta: "Get started",
    featured: false,
    features: [
      "5 diagrams per month",
      "Venn diagrams",
      "PNG export",
      "Shareable links",
    ],
  },
  {
    id: "plan-pro",
    name: "Pro",
    price: "$12",
    period: "per month",
    description: "For professionals who need unlimited diagramming power.",
    cta: "Start free trial",
    featured: true,
    features: [
      "Unlimited diagrams",
      "All diagram types",
      "SVG, PNG & PDF export",
      "Custom styles & themes",
      "Priority generation",
      "Team sharing",
    ],
  },
  {
    id: "plan-team",
    name: "Team",
    price: "$39",
    period: "per month",
    description: "Collaborate and keep your whole team aligned.",
    cta: "Contact sales",
    featured: false,
    features: [
      "Everything in Pro",
      "Up to 10 team members",
      "Admin dashboard",
      "SSO & audit logs",
      "Dedicated support",
    ],
  },
]

function PlanCard({
  plan,
  index,
}: {
  plan: (typeof PLANS)[number]
  index: number
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = "1"
          el.style.transform = "translateY(0) scale(1)"
          obs.disconnect()
        }
      },
      { threshold: 0.15 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div
      id={plan.id}
      ref={ref}
      className={`relative flex flex-col rounded-3xl p-7 transition-shadow duration-300 ${
        plan.featured
          ? "border-2 border-teal-500 bg-teal-600 text-white shadow-2xl shadow-teal-500/30"
          : "border border-gray-100 bg-white shadow-sm hover:shadow-md"
      }`}
      style={{
        opacity: 0,
        transform: `translateY(32px) scale(${plan.featured ? 1.02 : 1})`,
        transition: `opacity 0.55s ease ${index * 100}ms, transform 0.55s ease ${index * 100}ms, box-shadow 0.2s ease`,
      }}
    >
      {plan.featured && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-orange-500 px-4 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-md">
          Most popular
        </div>
      )}

      <div className="mb-6">
        <p
          className={`mb-1 text-sm font-semibold uppercase tracking-wider ${plan.featured ? "text-teal-200" : "text-gray-400"}`}
        >
          {plan.name}
        </p>
        <div className="flex items-baseline gap-1">
          <span
            className={`text-4xl font-bold ${plan.featured ? "text-white" : "text-gray-900"}`}
          >
            {plan.price}
          </span>
          <span
            className={`text-sm ${plan.featured ? "text-teal-200" : "text-gray-400"}`}
          >
            /{plan.period}
          </span>
        </div>
        <p
          className={`mt-2 text-sm ${plan.featured ? "text-teal-100" : "text-gray-500"}`}
        >
          {plan.description}
        </p>
      </div>

      <ul className="mb-8 flex flex-col gap-3">
        {plan.features.map((feat) => (
          <li key={feat} className="flex items-start gap-2.5">
            <Check
              className={`mt-0.5 h-4 w-4 shrink-0 ${plan.featured ? "text-teal-200" : "text-teal-500"}`}
              strokeWidth={2.5}
              aria-hidden
            />
            <span
              className={`text-sm ${plan.featured ? "text-teal-50" : "text-gray-600"}`}
            >
              {feat}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-auto">
        {plan.id === "plan-team" ? (
          <Link
            href="/pricing"
            className={`flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all duration-200 active:scale-95 ${
              plan.featured
                ? "bg-white text-teal-700 hover:bg-teal-50"
                : "border border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            {plan.cta}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        ) : (
          <SignUpButton mode="modal">
            <button
              className={`flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all duration-200 active:scale-95 ${
                plan.featured
                  ? "bg-white text-teal-700 hover:bg-teal-50"
                  : "border border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              {plan.cta}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          </SignUpButton>
        )}
      </div>
    </div>
  )
}

export default function PricingSection() {
  const headRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = headRef.current
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
    <section id="pricing" className="bg-gray-50 px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div
          ref={headRef}
          className="mb-16 text-center"
          style={{
            opacity: 0,
            transform: "translateY(24px)",
            transition: "opacity 0.6s ease, transform 0.6s ease",
          }}
        >
          <span className="mb-4 inline-block rounded-full bg-teal-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-teal-600">
            Pricing
          </span>
          <h2 className="font-serif text-4xl font-medium tracking-tight text-gray-900 sm:text-5xl">
            Simple, honest pricing.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-lg text-gray-500">
            Start free, scale when you're ready. No hidden fees.
          </p>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 items-start gap-6 sm:grid-cols-3">
          {PLANS.map((plan, i) => (
            <PlanCard key={plan.id} plan={plan} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
