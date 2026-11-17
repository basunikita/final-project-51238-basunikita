import { expect, type Page, test } from "@playwright/test";
import { addItem, addPlace, signedInPage } from "./helpers";

const detailHeading = (page: Page) => page.locator("#detail-heading");

async function centreOf(page: Page, selector: string) {
  const box = await page.locator(selector).boundingBox();
  if (!box) throw new Error(`${selector} is not on screen`);
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

test("a keyboard user who picks an item with Enter reaches that item's Edit button", async ({
  browser,
}) => {
  const stamp = Date.now();
  const a = await signedInPage(browser, "A");
  await addPlace(a, `Keys A ${stamp}`);
  const first = await addItem(a, `First ${stamp}`);
  await addItem(a, `Second ${stamp}`);
  await addItem(a, `Third ${stamp}`);

  await a.locator(`[data-item-id="${first}"]`).focus();
  await a.keyboard.press("Enter");
  const edit = a.getByRole("button", { name: "Edit", exact: true });
  for (let presses = 0; presses < 10; presses++) {
    if (await edit.evaluate((button) => button === document.activeElement)) break;
    await a.keyboard.press("Tab");
  }
  await expect(edit).toBeFocused();
  await expect(detailHeading(a)).toContainText(`First ${stamp}`);
});

test("moving the mouse from a clicked row to Edit keeps that row selected", async ({
  browser,
}) => {
  const stamp = Date.now();
  const a = await signedInPage(browser, "A");
  await addPlace(a, `Mouse A ${stamp}`);
  const first = await addItem(a, `First ${stamp}`);
  await addItem(a, `Second ${stamp}`);
  const third = await addItem(a, `Third ${stamp}`);

  const row = await centreOf(a, `[data-item-id="${first}"]`);
  await a.mouse.click(row.x, row.y);
  await expect(detailHeading(a)).toContainText(`First ${stamp}`);

  // On the way to Edit the pointer crosses the other rows.
  const across = await centreOf(a, `[data-item-id="${third}"]`);
  await a.mouse.move(across.x, across.y, { steps: 10 });
  const edit = a.getByRole("button", { name: "Edit", exact: true });
  const target = await edit.boundingBox();
  if (!target) throw new Error("Edit is not on screen");
  await a.mouse.move(target.x + target.width / 2, target.y + target.height / 2, { steps: 10 });
  await expect(detailHeading(a)).toContainText(`First ${stamp}`);
});

test("renaming a 40-character place on a phone doesn't scroll sideways", async ({ browser }) => {
  const a = await signedInPage(browser, "A", { viewport: { width: 375, height: 812 } });
  const name = `${"W".repeat(27)}${Date.now()}`;
  expect(name).toHaveLength(40);
  await addPlace(a, name);
  await a.getByRole("button", { name: `Options for ${name}` }).click();
  await a.getByRole("button", { name: "Rename" }).click();
  await expect(a.getByLabel(`Rename ${name}`)).toBeVisible();

  const sideways = await a.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(sideways).toBe(0);
});
