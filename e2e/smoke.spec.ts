import { expect, test } from "@playwright/test";

// Bilinen geçerli bir Standard Shaman kodu (base64url). Kart verisi (data/) gerektirir: npm run sync:cards
const CODE = "AAECAaoIBKiKBNC_B4LUB6iBCA39nwTTngbt5gbo_AbChwfQnQfLrQexsAfOuwePvgfDwAfJwAfJ2wcAAA";

test("landing renders prompt box and class chips", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Describe the deck");
  await expect(page.getByPlaceholder(/Build a Standard/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Shaman", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /Forge deck/ })).toBeDisabled();
});

test("shared deck page builds a deck from the code", async ({ page }) => {
  await page.goto(`/d/${CODE}`);
  await expect(page.getByText("30/30")).toBeVisible();
  await expect(page.getByText("Al'Akir, Lord of Storms")).toBeVisible();
  await expect(page.getByRole("button", { name: /Copy deck code/ }).first()).toBeVisible();
});

test("vague prompt is rejected by the API without calling the LLM", async ({ request }) => {
  const res = await request.post("/api/forge", { data: { prompt: "" } });
  expect(res.status()).toBe(400);
});
