import { Sparkles, Workflow, DownloadCloud } from "lucide-react"

const features = [
  {
    title: "Describe it. Watch it draw itself.",
    description:
      "Type what you're comparing in plain language. Diagramr reads the relationships and generates a complete, labeled diagram in seconds.",
    icon: Sparkles,
  },
  {
    title: "Smart layouts, instantly",
    description:
      "Circle size, overlap scaling, and text formatting happen automatically to match your data perfectly without any manual tweaking.",
    icon: Workflow,
  },
  {
    title: "Export & share anywhere",
    description:
      "Send a live, editable link to your team, or download your diagram as an SVG, PNG, or PDF ready for your next presentation.",
    icon: DownloadCloud,
  },
]

export default function FeaturesSection() {
  return (
    <section id="features" className="bg-white px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <h2 className="font-serif text-3xl font-medium tracking-tight text-neutral-900 sm:text-4xl md:text-5xl">
            Built for clarity.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-600">
            Diagramr turns a single sentence into a structured, beautiful
            diagram you can trust — and ship.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {features.map(({ title, description, icon: Icon }) => (
            <div
              key={title}
              className="group flex flex-col items-center rounded-2xl border border-neutral-200 bg-white p-8 text-center transition-all duration-300 hover:border-neutral-300 hover:shadow-sm"
            >
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-500 transition-colors group-hover:bg-blue-100">
                <Icon className="h-7 w-7" strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-medium text-neutral-900">{title}</h3>
              <p className="mt-3 leading-relaxed text-neutral-600">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
