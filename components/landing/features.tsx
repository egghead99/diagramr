"use client"

import { useEffect, useRef } from "react"
import {
  Sparkles,
  Workflow,
  DownloadCloud,
  Zap,
  Layers,
  Share2,
} from "lucide-react"

const FEATURES = [
  {
    icon: Sparkles,
    title: "Describe it. Watch it draw itself.",
    description:
      "Type what you're comparing in plain language. Diagramr reads relationships and generates a complete, labeled diagram in seconds.",
    color: "teal",
    id: "feature-ai",
  },
  {
    icon: Zap,
    title: "Instant, intelligent layouts",
    description:
      "Circle size, overlap scaling, and text formatting happen automatically to match your data — no manual tweaking required.",
    color: "orange",
    id: "feature-layout",
  },
  {
    icon: Layers,
    title: "Multiple diagram types",
    description:
      "Venn diagrams, flowcharts, mind maps, and more. One prompt, countless output formats tailored to your content.",
    color: "teal",
    id: "feature-types",
  },
  {
    icon: Share2,
    title: "Share & collaborate",
    description:
      "Send a live, editable link to your team or embed your diagram anywhere. Real-time updates, zero friction.",
    color: "orange",
    id: "feature-share",
  },
  {
    icon: DownloadCloud,
    title: "Export anywhere",
    description:
      "Download as SVG, PNG, or PDF — pixel-perfect and ready for your deck, doc, or design tool.",
    color: "teal",
    id: "feature-export",
  },
  {
    icon: Workflow,
    title: "Fully customizable",
    description:
      "Tweak fonts, colors, labels, and layout styles after generation. Your diagram, your way.",
    color: "orange",
    id: "feature-custom",
  },
]

function FeatureCard({
  icon: Icon,
  title,
  description,
  color,
  id,
  index,
}: (typeof FEATURES)[number] & { index: number }) {
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

  const isTeal = color === "teal"

  return (
    <div
      id={id}
      ref={ref}
      className="group cursor-default rounded-2xl border border-neutral-100 bg-white p-7 transition-all duration-300 hover:border-neutral-100 hover:shadow-xl hover:shadow-neutral-500/5"
      style={{
        opacity: 0,
        transform: "translateY(24px)",
        transition: `opacity 0.5s ease ${index * 80}ms, transform 0.5s ease ${index * 80}ms, box-shadow 0.2s ease, border-color 0.2s ease`,
      }}
    >
      <div
        className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl transition-colors duration-200 ${
          isTeal
            ? "bg-teal-50 text-teal-600 group-hover:bg-teal-100"
            : "bg-orange-50 text-orange-500 group-hover:bg-orange-100"
        }`}
      >
        <Icon className="h-6 w-6" strokeWidth={1.75} aria-hidden />
      </div>
      <h3 className="mb-2 text-base font-semibold text-neutral-900">{title}</h3>
      <p className="text-sm leading-relaxed text-neutral-500">{description}</p>
    </div>
  )
}

export default function FeaturesSection() {
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
    <section id="features" className="bg-neutral-50 px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
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
          <span className="mb-4 inline-block rounded-full bg-teal-50 px-4 py-1.5 text-xs font-semibold tracking-widest text-teal-600 uppercase">
            Features
          </span>
          <h2 className="font-serif text-4xl font-medium tracking-tight text-neutral-900 sm:text-5xl">
            Built for clarity.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-neutral-500">
            From a single sentence to a production-ready diagram — in seconds.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, i) => (
            <FeatureCard key={feature.id} {...feature} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
