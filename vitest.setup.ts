import "@testing-library/jest-dom"
import { vi } from "vitest"

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter() {
    return {
      prefetch: () => null,
      push: vi.fn(),
      replace: vi.fn(),
      refresh: vi.fn(),
      back: vi.fn(),
    }
  },
  usePathname() {
    return "/generate"
  },
}))

// Mock useIsMobile hook
vi.mock("@/hooks/use-mobile", () => ({
  useIsMobile: vi.fn().mockReturnValue(false),
}))

// Mock window.matchMedia for JSDOM
const mockMatchMedia = (query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
})

if (typeof window !== "undefined") {
  window.matchMedia = vi.fn().mockImplementation(mockMatchMedia)
}
if (typeof global !== "undefined") {
  (global as any).matchMedia = vi.fn().mockImplementation(mockMatchMedia)
}
if (typeof globalThis !== "undefined") {
  (globalThis as any).matchMedia = vi.fn().mockImplementation(mockMatchMedia)
}
