"use client"

/**
 * ContourRippleBackground
 * -------------------------------------------------------------------------
 * Animated topographic contour-line background. A 2D noise field drives
 * organic, slowly-shifting contour lines (marching squares over a scalar
 * field — same idea as a topo map). Moving the cursor injects a radial
 * ripple that propagates outward through the field and decays, perturbing
 * the contours like a stone dropped in water.
 *
 * Usage:
 *   <ContourRippleBackground className="absolute inset-0 -z-10" />
 *
 * Drop this behind your hero content (position the wrapper, this fills it).
 * Pure Canvas2D — no deps. Respects prefers-reduced-motion and pauses when
 * the tab/page is not visible.
 * -------------------------------------------------------------------------
 */

import { useEffect, useRef } from "react"

type ContourRippleBackgroundProps = {
  className?: string
  /** CSS color for the contour lines, e.g. "rgba(40,40,40,0.35)" */
  lineColor?: string
  /** Distance in px between sampled scalar field grid points. Lower = smoother but slower. */
  cellSize?: number
  /** Number of contour bands drawn across the field's value range. */
  levels?: number
  /** Base noise scale — smaller = larger, lazier contour shapes. */
  noiseScale?: number
  /** How fast the base field drifts over time (idle animation). */
  driftSpeed?: number
  /** How fast an injected ripple ring expands outward, in px/sec. */
  rippleSpeed?: number
  /** How long (ms) a ripple's influence lasts before fully decaying. */
  rippleLifetime?: number
  /** Peak amplitude a single ripple adds to the field. */
  rippleAmplitude?: number
  /** Minimum ms between ripple injections while the cursor moves (perf throttle). */
  rippleThrottleMs?: number
}

// ---- tiny deterministic 2D value-noise (no external deps) ----------------
// Not "true" simplex noise, but smooth, seamless-enough, and cheap.
function makeNoise2D(seed = 1337) {
  // simple hash-based pseudo-random gradient noise
  const rand = (x: number, y: number) => {
    const s = Math.sin(x * 127.1 + y * 311.7 + seed) * 43758.5453123
    return s - Math.floor(s)
  }
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t
  const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10)

  return (x: number, y: number) => {
    const x0 = Math.floor(x)
    const y0 = Math.floor(y)
    const x1 = x0 + 1
    const y1 = y0 + 1
    const sx = fade(x - x0)
    const sy = fade(y - y0)

    const n00 = rand(x0, y0)
    const n10 = rand(x1, y0)
    const n01 = rand(x0, y1)
    const n11 = rand(x1, y1)

    const ix0 = lerp(n00, n10, sx)
    const ix1 = lerp(n01, n11, sx)
    return lerp(ix0, ix1, sy) // 0..1
  }
}

type Ripple = { x: number; y: number; start: number }

export default function Ripple({
  className,
  lineColor = "rgba(60, 60, 60, 0.1)",
  cellSize = 6,
  levels = 22,
  noiseScale = 0.0045,
  driftSpeed = 0.00006,
  rippleSpeed = 220,
  rippleLifetime = 500,
  rippleAmplitude = 0.05,
  rippleThrottleMs = 60,
}: ContourRippleBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches

    const noise2D = makeNoise2D()
    const ripples: Ripple[] = []
    let lastRippleAt = 0
    let mouseX = -9999
    let mouseY = -9999

    let width = 0
    let height = 0
    let dpr = Math.min(window.devicePixelRatio || 1, 2)
    let cols = 0
    let rows = 0
    let field: Float32Array = new Float32Array(0)

    const resize = () => {
      const parent = canvas.parentElement
      const rect = parent
        ? parent.getBoundingClientRect()
        : { width: window.innerWidth, height: window.innerHeight }
      width = Math.max(1, Math.floor(rect.width))
      height = Math.max(1, Math.floor(rect.height))
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      cols = Math.ceil(width / cellSize) + 1
      rows = Math.ceil(height / cellSize) + 1
      field = new Float32Array(cols * rows)
    }

    const sampleField = (px: number, py: number, t: number) => {
      // base drifting noise, two octaves for organic variation
      let v =
        noise2D(px * noiseScale, py * noiseScale + t * driftSpeed * 0.6) *
          0.65 +
        noise2D(
          px * noiseScale * 2.3 + 100,
          py * noiseScale * 2.3 + t * driftSpeed
        ) *
          0.35

      // ripple contributions
      for (let i = 0; i < ripples.length; i++) {
        const r = ripples[i]
        const age = t - r.start
        if (age < 0 || age > rippleLifetime) continue
        const dx = px - r.x
        const dy = py - r.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        const ringRadius = (age / 1000) * rippleSpeed
        const decay = 1 - age / rippleLifetime
        const ringWidth = 36
        const falloff = Math.exp(
          -((dist - ringRadius) * (dist - ringRadius)) /
            (2 * ringWidth * ringWidth)
        )
        const wave = Math.sin((dist - ringRadius) * 0.07)
        v += wave * falloff * decay * decay * rippleAmplitude
      }

      return v
    }

    const updateField = (t: number) => {
      for (let j = 0; j < rows; j++) {
        const py = j * cellSize
        const rowOffset = j * cols
        for (let i = 0; i < cols; i++) {
          const px = i * cellSize
          field[rowOffset + i] = sampleField(px, py, t)
        }
      }
    }

    // marching squares: draw contour lines for `levels` thresholds across [0,1]
    const drawContours = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, width, height)
      ctx.strokeStyle = lineColor
      ctx.lineWidth = 1
      ctx.beginPath()

      for (let lvl = 1; lvl <= levels; lvl++) {
        const threshold = lvl / (levels + 1)

        for (let j = 0; j < rows - 1; j++) {
          const rowOffset = j * cols
          const nextRowOffset = (j + 1) * cols
          const py = j * cellSize
          for (let i = 0; i < cols - 1; i++) {
            const px = i * cellSize

            const tl = field[rowOffset + i]
            const tr = field[rowOffset + i + 1]
            const br = field[nextRowOffset + i + 1]
            const bl = field[nextRowOffset + i]

            let caseIdx = 0
            if (tl > threshold) caseIdx |= 8
            if (tr > threshold) caseIdx |= 4
            if (br > threshold) caseIdx |= 2
            if (bl > threshold) caseIdx |= 1
            if (caseIdx === 0 || caseIdx === 15) continue

            const lerpEdge = (
              v1: number,
              v2: number,
              p1: number,
              p2: number
            ) => {
              const denom = v2 - v1
              const t = denom !== 0 ? (threshold - v1) / denom : 0.5
              return p1 + (p2 - p1) * t
            }

            const topX = lerpEdge(tl, tr, px, px + cellSize)
            const rightY = lerpEdge(tr, br, py, py + cellSize)
            const bottomX = lerpEdge(bl, br, px, px + cellSize)
            const leftY = lerpEdge(tl, bl, py, py + cellSize)

            const top: [number, number] = [topX, py]
            const right: [number, number] = [px + cellSize, rightY]
            const bottom: [number, number] = [bottomX, py + cellSize]
            const left: [number, number] = [px, leftY]

            const seg = (a: [number, number], b: [number, number]) => {
              ctx.moveTo(a[0], a[1])
              ctx.lineTo(b[0], b[1])
            }

            switch (caseIdx) {
              case 1:
                seg(left, bottom)
                break
              case 2:
                seg(bottom, right)
                break
              case 3:
                seg(left, right)
                break
              case 4:
                seg(top, right)
                break
              case 5:
                seg(left, top)
                seg(bottom, right)
                break
              case 6:
                seg(top, bottom)
                break
              case 7:
                seg(left, top)
                break
              case 8:
                seg(left, top)
                break
              case 9:
                seg(top, bottom)
                break
              case 10:
                seg(left, bottom)
                seg(top, right)
                break
              case 11:
                seg(top, right)
                break
              case 12:
                seg(left, right)
                break
              case 13:
                seg(bottom, right)
                break
              case 14:
                seg(left, bottom)
                break
            }
          }
        }
      }

      ctx.stroke()
    }

    let rafId = 0
    let running = true

    let lastPrune = 0

    const frame = (t: number) => {
      if (!running) return
      updateField(t)
      drawContours()
      // prune dead ripples occasionally
      if (ripples.length > 0 && t - lastPrune > 1000) {
        lastPrune = t
        for (let i = ripples.length - 1; i >= 0; i--) {
          if (t - ripples[i].start > rippleLifetime) ripples.splice(i, 1)
        }
      }
      rafId = requestAnimationFrame(frame)
    }
    const handlePointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouseX = e.clientX - rect.left
      mouseY = e.clientY - rect.top
      const now = performance.now()
      if (now - lastRippleAt < rippleThrottleMs) return
      lastRippleAt = now
      ripples.push({ x: mouseX, y: mouseY, start: now })
      if (ripples.length > 24) ripples.shift()
    }

    const handleVisibility = () => {
      if (document.hidden) {
        running = false
        cancelAnimationFrame(rafId)
      } else if (!prefersReducedMotion) {
        running = true
        rafId = requestAnimationFrame(frame)
      }
    }

    resize()
    const ro = new ResizeObserver(resize)
    if (canvas.parentElement) ro.observe(canvas.parentElement)

    window.addEventListener("pointermove", handlePointerMove, { passive: true })
    document.addEventListener("visibilitychange", handleVisibility)

    if (prefersReducedMotion) {
      // draw a single static frame, no animation loop, no ripples
      updateField(0)
      drawContours()
    } else {
      rafId = requestAnimationFrame(frame)
    }

    return () => {
      running = false
      cancelAnimationFrame(rafId)
      ro.disconnect()
      window.removeEventListener("pointermove", handlePointerMove)
      document.removeEventListener("visibilitychange", handleVisibility)
    }
  }, [
    lineColor,
    cellSize,
    levels,
    noiseScale,
    driftSpeed,
    rippleSpeed,
    rippleLifetime,
    rippleAmplitude,
    rippleThrottleMs,
  ])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ pointerEvents: "none", display: "block" }}
      aria-hidden="true"
    />
  )
}
