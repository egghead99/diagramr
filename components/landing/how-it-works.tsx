"use client"

import { useEffect, useRef } from "react"
import { Venn } from "@/components/venn"

const STEPS = [
  {
    number: "01",
    title: "Describe what you need",
    description:
      "Type a prompt in plain language — 'Show the overlap between marketing, product, and sales teams'. No syntax, no rules.",
    id: "step-describe",
  },
  {
    number: "02",
    title: "AI generates the structure",
    description:
      "Diagramr parses your intent, infers relationships, and produces a perfectly structured diagram with smart sizing and labeling.",
    id: "step-generate",
  },
  {
    number: "03",
    title: "Customize & export",
    description:
      "Tweak colors, fonts, and labels. When you're happy, export as SVG, PNG, PDF — or share a live link.",
    id: "step-export",
  },
]

const DEMO_DIAGRAM = `
<venn title-font="sans-serif" header-font="sans-serif" body-font="mono" color-1="teal" color-2="blue">
  <title>Perfect Diagrams</title>
  <circle header="Your Ideas">
      <item>Complex thoughts</item>
      <item>Raw data</item>
      <item>Vague concepts</item>
  </circle>
  <circle header="AI Precision">
      <item>Clean layout</item>
      <item>Smart structure</item>
      <item>Styled output</item>
  </circle>
  <overlap>
      <item>Clarity</item>
  </overlap>
</venn>
`

function StepItem({
  number,
  title,
  description,
  id,
  index,
}: (typeof STEPS)[number] & { index: number }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = "1"
          el.style.transform = "translateX(0)"
          obs.disconnect()
        }
      },
      { threshold: 0.2 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div
      id={id}
      ref={ref}
      className="flex gap-5"
      style={{
        opacity: 0,
        transform: "translateX(-20px)",
        transition: `opacity 0.55s ease ${index * 120}ms, transform 0.55s ease ${index * 120}ms`,
      }}
    >
      <div className="flex flex-col items-center">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-600 text-sm font-bold text-white">
          {number}
        </div>
        {index < STEPS.length - 1 && (
          <div className="mt-2 h-full w-px bg-teal-100" aria-hidden />
        )}
      </div>
      <div className="pb-10">
        <h3 className="mb-1.5 text-lg font-semibold text-neutral-900">
          {title}
        </h3>
        <p className="text-sm leading-relaxed text-neutral-500">
          {description}
        </p>
      </div>
    </div>
  )
}

export default function HowItWorksSection() {
  const headRef = useRef<HTMLDivElement>(null)
  const diagramRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    for (const el of [headRef.current, diagramRef.current]) {
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
    <section id="how-it-works" className="bg-white px-4 py-24 sm:px-6 lg:px-8">
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
          <span className="mb-4 inline-block rounded-full bg-orange-50 px-4 py-1.5 text-xs font-semibold tracking-widest text-orange-500 uppercase">
            How it works
          </span>
          <h2 className="font-serif text-4xl font-medium tracking-tight text-neutral-900 sm:text-5xl">
            Three steps to clarity.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-neutral-500">
            From idea to diagram in under 10 seconds.
          </p>
        </div>

        {/* Content grid */}
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20">
          {/* Steps */}
          <div>
            {STEPS.map((step, i) => (
              <StepItem key={step.id} {...step} index={i} />
            ))}
          </div>

          {/* Diagram preview */}
          <div
            ref={diagramRef}
            className="overflow-hidden rounded-3xl border border-neutral-100 bg-neutral-50 shadow-xl shadow-neutral-500/5"
            style={{
              opacity: 0,
              transform: "translateY(32px)",
              transition: "opacity 0.7s ease 0.2s, transform 0.7s ease 0.2s",
            }}
          >
            {/* Fake browser chrome */}
            <div className="flex items-center gap-1.5 border-b border-neutral-100 bg-white px-4 py-3">
              <div
                className="h-2.5 w-2.5 rounded-full bg-red-300"
                aria-hidden
              />
              <div
                className="h-2.5 w-2.5 rounded-full bg-amber-300"
                aria-hidden
              />
              <div
                className="h-2.5 w-2.5 rounded-full bg-green-300"
                aria-hidden
              />
              <div className="ml-3 flex-1 rounded-lg bg-neutral-100 px-3 py-1 text-xs text-neutral-400">
                app.diagramr.ai/generate
              </div>
            </div>

            {/* Prompt bar */}
            <div className="border-b border-neutral-100 bg-white px-4 py-3">
              <div className="flex items-center justify-between gap-2 rounded-lg bg-neutral-50 px-3 py-2 text-sm text-neutral-400">
                <span className="italic">
                  Visualize where our ideas meet AI precision...
                </span>
                <span className="cursor-default rounded-full bg-teal-600 px-2 py-1 text-xs text-white">
                  Generate
                </span>
              </div>
            </div>

            {/* Diagram output */}
            <div className="min-h-64 bg-white">
              <Venn>{DEMO_DIAGRAM}</Venn>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
