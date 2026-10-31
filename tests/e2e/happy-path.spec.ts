import { expect, test } from "@playwright/test";
import path from "node:path";

const selfie = path.join(__dirname, "../../public/examples/pre-generated-before.jpg");

test("brief → pieces → photo → try-on → compare → card (mock mode)", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Looks right");
  await page.screenshot({ path: "test-results/01-landing.png", fullPage: false });

  await page.getByRole("link", { name: "Try my first earring" }).click();
  await expect(page.getByRole("heading", { name: /right for me/ })).toBeVisible();
  await page.screenshot({ path: "test-results/02-brief.png" });
  await page.getByRole("button", { name: "See the pieces" }).click();

  await expect(page.getByRole("heading", { name: "Pick up to three." })).toBeVisible();
  const adds = page.getByRole("button", { name: /Add to shortlist/ });
  await adds.nth(0).click();
  await adds.nth(0).click();
  await page.screenshot({ path: "test-results/03-pieces.png", fullPage: true });
  await page.getByRole("button", { name: /Continue with 2/ }).click();

  await expect(page.getByRole("heading", { name: "Now, your ear." })).toBeVisible();
  await page.locator('input[aria-label="Upload a photo"]').setInputFiles(selfie);
  await page.getByRole("checkbox").check();
  await page.screenshot({ path: "test-results/04-photo.png" });
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page.getByRole("heading", { name: /You press go/ })).toBeVisible();
  const gen = page.getByRole("button", { name: "Generate preview" });
  await gen.first().click();
  await page.screenshot({ path: "test-results/05-generating.png" });
  await expect(page.getByText("Preview ready.").first()).toBeVisible({ timeout: 40_000 });
  await page.getByRole("button", { name: "Generate preview" }).first().click();
  await expect(page.getByText(/Preview ready|Reused a matching/)).toHaveCount(2, { timeout: 40_000 });
  await page.getByRole("button", { name: /Compare 2 previews/ }).click();

  await expect(page.getByRole("heading", { name: "Looks vs. facts." })).toBeVisible();
  await page.getByRole("radiogroup", { name: /Verdict for/ }).first().getByRole("radio", { name: "buy" }).click();
  await page.getByRole("radiogroup", { name: /Verdict for/ }).nth(1).getByRole("radio", { name: "skip" }).click();
  await page.screenshot({ path: "test-results/06-compare.png", fullPage: true });
  await page.getByRole("button", { name: "Make my decision card" }).click();

  await expect(page.getByRole("heading", { name: "Decision made." })).toBeVisible();
  await expect(page.getByRole("img", { name: /Verdict: BUY/ })).toBeVisible();
  await page.screenshot({ path: "test-results/07-card.png", fullPage: true });

  await page.getByRole("button", { name: "Copy share link" }).click();
  await expect(page.getByRole("status")).toContainText(/Link copied|Couldn't/);
  const link = await page.locator("p.num.break-all").textContent();
  expect(link).toMatch(/\/d\//);
  await page.goto(link!);
  await expect(page.getByText("Decision card")).toBeVisible();
});
