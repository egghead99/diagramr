# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: generate.spec.ts >> Generate Page E2E >> should load the generate page with prompt textarea and suggestions
- Location: e2e/generate.spec.ts:4:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=diagram generator')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('text=diagram generator')

```

```yaml
- heading "Sign in to Diagramr" [level=1]
- paragraph: Welcome back! Please sign in to continue
- button "Sign in with Google Continue with Google": Continue with Google
- paragraph: or
- text: Email address
- textbox "Email address":
  - /placeholder: Enter your email address
- text: Password
- textbox "Password":
  - /placeholder: Enter your password
- button "Show password":
  - img
- button "Continue":
  - text: Continue
  - img
- text: Don’t have an account?
- link "Sign up":
  - /url: https://charmed-ostrich-98.accounts.dev/sign-up#/?redirect_url=http%3A%2F%2Flocalhost%3A3000%2Fgenerate
- paragraph: Secured by
- link "Clerk logo":
  - /url: https://go.clerk.com/components
  - img
- paragraph: Development mode
- alert
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test"
  2  | 
  3  | test.describe("Generate Page E2E", () => {
  4  |   test("should load the generate page with prompt textarea and suggestions", async ({ page }) => {
  5  |     await page.goto("/generate")
  6  |     
  7  |     // Check main title
> 8  |     await expect(page.locator("text=diagram generator")).toBeVisible()
     |                                                          ^ Error: expect(locator).toBeVisible() failed
  9  | 
  10 |     // Check textarea placeholder
  11 |     const textarea = page.locator("textarea")
  12 |     await expect(textarea).toBeVisible()
  13 | 
  14 |     // Check suggestion buttons are visible
  15 |     const cellBtn = page.getByRole("button", { name: "Differentiate cell types" })
  16 |     await expect(cellBtn).toBeVisible()
  17 | 
  18 |     // Click suggestion and verify it populates the prompt input
  19 |     await cellBtn.click()
  20 |     await expect(textarea).toHaveValue(
  21 |       "Show me a diagram of different types of cells, including prokaryotic and eukaryotic cells, with their key components."
  22 |     )
  23 |   })
  24 | })
  25 | 
```