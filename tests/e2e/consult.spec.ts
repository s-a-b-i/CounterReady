import { expect, test } from "@playwright/test";

test("blush: category switch resets the shortlist and previews run", async ({ page }) => {
  await page.goto("/consult");
  await page.getByRole("button", { name: "Blush", exact: true }).click();
  await expect(page.getByText(/blush shades? match/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Gloss" })).toHaveCount(0);
  await page.getByRole("button", { name: "Shimmer" }).click();
  await page.getByRole("button", { name: /Choose from these/i }).click();
  await page.getByRole("button", { name: /Add Sample Soft Apricot/ }).click();
  await page.getByRole("button", { name: /Continue with 1/ }).click();
  await page.getByRole("button", { name: /Use the sample photo/ }).click();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: /^Continue/ }).click();
  await page.getByRole("button", { name: "Generate previews" }).click();
  await expect(page.getByText("AI preview", { exact: true })).toHaveCount(1, { timeout: 60_000 });
  await page.getByRole("button", { name: "This is my favourite" }).click();
  await page.getByRole("button", { name: /Save my choice/ }).click();
  await expect(page.locator("dl[aria-label='Comparison receipt']")).toContainText("Blush");
  await expect(page.locator("dl[aria-label='Comparison receipt']")).toContainText("BL-03");
});

test("lipstick: budget to purchase card, in mock mode", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveAccessibleName(/what the shop actually sells/i);
  await page.getByRole("link", { name: /Start a consultation/i }).first().click();

  // Step 1: preferences. A budget too low to buy anything explains itself instead of showing over-budget items.
  await page.getByLabel("Maximum budget").fill("500");
  await expect(page.getByText("Nothing fits these filters")).toBeVisible();
  await expect(page.getByText(/budget of PKR 500 is too low/)).toBeVisible();
  await page.getByLabel("Maximum budget").fill("2000");
  await page.getByRole("button", { name: /Choose from these/i }).click();

  // Step 2: shortlist. Out-of-stock cannot be selected; the fourth pick is blocked.
  await expect(page.getByRole("button", { name: /Add Sample Coral Glow/ })).toBeDisabled();
  for (const n of ["Sample Rosewood", "Sample Cherry Pop", "Sample Petal Blush"]) {
    await page.getByRole("button", { name: new RegExp(`Add ${n} to shortlist`) }).click();
  }
  await expect(page.getByText("3 of 3 selected")).toBeVisible();
  await expect(page.getByRole("button", { name: /Add Sample Bare Silk/ })).toBeDisabled();
  await page.getByRole("button", { name: /Continue with 3/ }).click();

  // Step 3: nothing proceeds without consent.
  await page.getByRole("button", { name: /Use the sample photo/ }).click();
  await expect(page.getByAltText("Your selected photo")).toBeVisible();
  const next = page.getByRole("button", { name: /^Continue/ });
  await expect(next).toBeDisabled();
  await page.getByRole("checkbox").check();
  await next.click();

  // Step 4: explicit generate, three AI previews beside the original.
  await expect(page.getByAltText("Your original photo")).toBeVisible();
  await expect(page.getByText("Not generated yet")).toHaveCount(3);
  await page.getByRole("button", { name: "Generate previews" }).click();
  await expect(page.getByText("AI preview", { exact: true })).toHaveCount(3, { timeout: 60_000 });
  await page.getByRole("button", { name: "This is my favourite" }).first().click();
  await page.getByRole("button", { name: /Save my choice/ }).click();

  // Step 5: receipt and product-only card by default.
  await page.getByLabel(/Add a note/).fill("I prefer this shade for everyday use.");
  const receipt = page.locator("dl[aria-label='Comparison receipt']");
  await expect(receipt).toContainText("Sample Rosewood");
  await expect(receipt).toContainText("CR-04");
  await expect(receipt).toContainText("PKR 1,650");
  await expect(page.getByText("Product only: no photo of you.")).toBeVisible();
  await page.getByRole("checkbox", { name: /Show my face/ }).check();
  await expect(page.getByText("Includes your AI preview.")).toBeVisible();

  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: /Download purchase card/ }).click()]);
  expect(download.suggestedFilename()).toBe("counterready-cr-04.png");
});
