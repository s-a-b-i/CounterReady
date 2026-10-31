import { chromium } from "@playwright/test";

const base = process.env.BASE ?? "http://localhost:3102";

async function main() {
  const browser = await chromium.launch();
  for (const [name, w, h] of [["desktop", 1280, 800], ["mobile", 375, 800]] as const) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h } });
    const page = await ctx.newPage();
    await page.goto(base);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `test-results/landing-${name}.png`, fullPage: name === "mobile" });
    if (name === "desktop") {
      await page.getByRole("button", { name: "Blue and red" }).click();
      await page.waitForTimeout(900);
      await page.screenshot({ path: "test-results/landing-blue.png" });
      await page.getByRole("button", { name: "Red on white" }).click();
      await page.waitForTimeout(900);
      await page.screenshot({ path: "test-results/landing-red.png" });
      await page.getByRole("button", { name: "Black and white" }).click();
      await page.mouse.wheel(0, 900);
      await page.waitForTimeout(1200);
      await page.screenshot({ path: `test-results/landing-${name}-2.png` });
    }
    await ctx.close();
  }
  await browser.close();
}
main();
