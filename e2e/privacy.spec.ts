import { expect, test } from "@playwright/test";
import { addItem, addPlace, expectNothingOf, signedInPage } from "./helpers";


test("two people can't see each other's places or items", async ({ browser }) => {
  const stamp = Date.now();
  const a = await signedInPage(browser, "A");
  const place = `Shelf A ${stamp}`;
  const item = `Notebook A ${stamp}`;
  const placeId = await addPlace(a, place);
  const itemId = await addItem(a, item);
  const fromA = { placeId, itemId, place, item };

  const b = await signedInPage(browser, "B");
  await addPlace(b, `Shelf B ${stamp}`);
  await expectNothingOf(b, fromA);

  await b.goto(`/inventory?place=${placeId}&item=${itemId}`);
  await expect(b.getByRole("tablist", { name: "Places" })).toBeVisible();
  await expectNothingOf(b, fromA);
});

test("a signed-out visitor is sent to sign-in", async ({ page }) => {
  await page.goto("/inventory");
  await page.waitForURL((url) => url.pathname !== "/inventory");
  await expect(page.locator("[data-item-id]")).toHaveCount(0);
});

test("double-clicking Save on a new item saves one item", async ({ browser }) => {
  const stamp = Date.now();
  const a = await signedInPage(browser, "A");
  await addPlace(a, `Box A ${stamp}`);
  await addItem(a, `Pen A ${stamp}`);
  const before = await a.locator("[data-item-id]").count();

  await addItem(a, `Pencil A ${stamp}`, "dblclick");
  await expect(a.locator("[data-item-id]")).toHaveCount(before + 1);

  await a.reload();
  await expect(a.locator("[data-item-id]")).toHaveCount(before + 1);
});
