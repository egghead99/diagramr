import { PricingTable } from "@clerk/nextjs"

export default function PricingPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 p-16">
      <p className="text-4xl font-medium">Pricing</p>
      <PricingTable highlightedPlan="starter" />
    </div>
  )
}
