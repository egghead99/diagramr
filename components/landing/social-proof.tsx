"use client"

import { useEffect, useRef } from "react"

const TESTIMONIALS = [
  {
    id: "testimonial-1",
    quote:
      "Diagramr cut our meeting prep time in half. I describe the concept, it draws it — done.",
    name: "Alex Chen",
    role: "Product Manager, Vercel",
    initials: "AC",
    color: "teal",
  },
  {
    id: "testimonial-2",
    quote:
      "I've tried Miro, Figma, Lucidchart — Diagramr is the only one that actually understands what I'm saying.",
    name: "Sarah Kim",
    role: "Head of Design, Linear",
    initials: "SK",
    color: "orange",
  },
  {
    id: "testimonial-3",
    quote:
      "We use it for system architecture diagrams. The AI always gets the hierarchy right on the first try.",
    name: "Marcus Obi",
    role: "Staff Engineer, Stripe",
    initials: "MO",
    color: "teal",
  },
]

const STATS = [
  { value: "10k+", label: "Diagrams generated" },
  { value: "3,000+", label: "Active users" },
  { value: "< 5s", label: "Average generation time" },
  { value: "4.9★", label: "User satisfaction" },
]

function TestimonialCard({
  quote,
  name,
  role,
  initials,
  color,
  id,
  index,
}: (typeof TESTIMONIALS)[number] & { index: number }) {
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
      { threshold: 0.15 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div
      id={id}
      ref={ref}
      className="group flex flex-col rounded-2xl border border-gray-100 bg-white p-7 shadow-sm transition-all duration-300 hover:border-teal-100 hover:shadow-lg hover:shadow-teal-500/5"
      style={{
        opacity: 0,
        transform: "translateY(24px)",
        transition: `opacity 0.55s ease ${index * 100}ms, transform 0.55s ease ${index * 100}ms, box-shadow 0.2s ease`,
      }}
    >
      {/* Stars */}
      <div className="mb-5 flex gap-0.5" aria-label="5 stars">
        {[...Array(5)].map((_, i) => (
          <svg
            key={i}
            className="h-4 w-4 text-amber-400"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>

      <p className="mb-6 flex-1 text-sm leading-relaxed text-gray-600 italic">
        "{quote}"
      </p>

      <div className="flex items-center gap-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${
            color === "teal" ? "bg-teal-500" : "bg-orange-400"
          }`}
          aria-hidden
        >
          {initials}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">{name}</p>
          <p className="text-xs text-gray-400">{role}</p>
        </div>
      </div>
    </div>
  )
}

export default function SocialProofSection() {
  const statsRef = useRef<HTMLDivElement>(null)
  const headRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    for (const el of [statsRef.current, headRef.current]) {
      if (!el) continue
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            el.style.opacity = "1"
            el.style.transform = "translateY(0)"
            obs.disconnect()
          }
        },
        { threshold: 0.15 }
      )
      obs.observe(el)
    }
  }, [])

  return (
    <section id="social-proof" className="bg-white px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Stats */}
        <div
          ref={statsRef}
          className="mb-20 grid grid-cols-2 gap-6 sm:grid-cols-4"
          style={{
            opacity: 0,
            transform: "translateY(24px)",
            transition: "opacity 0.6s ease, transform 0.6s ease",
          }}
        >
          {STATS.map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="font-serif text-4xl font-medium text-teal-600">
                {value}
              </p>
              <p className="mt-1 text-sm text-gray-400">{label}</p>
            </div>
          ))}
        </div>

        {/* Header */}
        <div
          ref={headRef}
          className="mb-12 text-center"
          style={{
            opacity: 0,
            transform: "translateY(24px)",
            transition: "opacity 0.6s ease 0.1s, transform 0.6s ease 0.1s",
          }}
        >
          <span className="mb-4 inline-block rounded-full bg-orange-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-orange-500">
            Loved by teams
          </span>
          <h2 className="font-serif text-4xl font-medium tracking-tight text-gray-900 sm:text-5xl">
            What our users say.
          </h2>
        </div>

        {/* Testimonials */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <TestimonialCard key={t.id} {...t} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
