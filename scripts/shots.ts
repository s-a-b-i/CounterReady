/* Usage: BASE=http://localhost:3102 npx tsx scripts/shots.ts  (server should run with YOUCAM_MOCK=1)
 * Walks the whole flow and saves screenshots of each step to test-results/. */
import { chromium } from "@playwright/test";

const base = process.env.BASE ?? "http://localhost:3102";

async function main() {
  const browser = await chromium.launch();
  for (const [name, w, h] of [["desktop", 1280, 860], ["mobile", 390, 844]] as const) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h } });
    const page = await ctx.newPage();
    const shot = (n: string, full = true) => page.screenshot({ path: `test-results/${name}-${n}.png`, fullPage: full });

    await page.goto(base);
    await page.waitForTimeout(800);
    await shot("0-landing");
    await page.goto(`${base}/consult`);
    await shot("1-prefs");
    await page.getByLabel("Maximum budget").fill("500");
    await shot("1b-empty", false);
    await page.getByLabel("Maximum budget").fill("2000");
    await page.getByRole("button", { name: /Choose from these/i }).click();
    for (const n of ["Sample Rosewood", "Sample Cherry Pop", "Sample Petal Blush"]) await page.getByRole("button", { name: new RegExp(`Add ${n} to shortlist`) }).click();
    await shot("2-products");
    await page.getByRole("button", { name: /Continue with 3/ }).click();
    await page.getByRole("button", { name: /Use the sample photo/ }).click();
    await page.getByRole("checkbox").check();
    await shot("3-photo");
    await page.getByRole("button", { name: /^Continue/ }).click();
    await page.getByRole("button", { name: "Generate previews" }).click();
    await page.waitForTimeout(1500);
    await shot("4a-generating", false);
    await page.getByText("AI preview", { exact: true }).nth(2).waitFor({ timeout: 60000 });
    await page.waitForFunction(() => [...document.images].every((i) => i.complete && i.naturalWidth > 0), null, { timeout: 15000 });
    await page.getByRole("button", { name: "This is my favourite" }).first().click();
    await shot("4b-compare");
    await page.getByRole("button", { name: /Save my choice/ }).click();
    await page.getByLabel(/Add a note/).fill("I prefer this shade for everyday use.");
    await page.waitForTimeout(500);
    await shot("5-decide");
    await page.goto(`${base}/privacy`);
    await shot("6-privacy");
    await ctx.close();
  }
  await browser.close();
}
main();
