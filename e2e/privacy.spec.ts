import { clerk } from "@clerk/testing/playwright";
import { expect, test, type Browser, type Page } from "@playwright/test";

function testUserEmail(which: "A" | "B"): string {
  const email = process.env[`E2E_USER_${which}_EMAIL`];
  if (!email) throw new Error(`E2E_USER_${which}_EMAIL must be set in .env.local`);
  return email;
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Each person gets their own browser context, like two different laptops.
async function signedInPage(browser: Browser, which: "A" | "B"): Promise<Page> {
  const page = await (await browser.newContext()).newPage();
  await page.goto("/");
  await clerk.signIn({ page, emailAddress: testUserEmail(which) });
  await page.goto("/inventory");
  await expect(
    page
      .getByRole("heading", { name: "Where does your stash live?" })
      .or(page.getByRole("tablist", { name: "Places" })),
  ).toBeVisible();
  return page;
}

function placeTab(page: Page, name: string) {
  return page.getByRole("tab", { name: new RegExp(`^${escapeRegExp(name)}`) });
}

// Adds a place, from the welcome panel on a fresh account or with the "+"
// tab otherwise, and returns its ID with the tab selected.
async function addPlace(page: Page, name: string): Promise<string> {
  const welcome = page.getByRole("heading", { name: "Where does your stash live?" });
  if (await welcome.isVisible()) {
    await page.getByLabel("Add your own").fill(name);
    await page.getByRole("button", { name: "Add", exact: true }).click();
    await expect(page.getByRole("list", { name: "Your places" }).getByText(name)).toBeVisible();
    await page.getByRole("button", { name: "Start logging" }).click();
    await placeTab(page, name).click();
  } else {
    await page.getByRole("button", { name: "Add a place" }).click();
    await page.getByLabel("Name the new place").fill(name);
    await page.getByRole("button", { name: "Add place" }).click();
  }
  const tab = placeTab(page, name);
  await expect(tab).toHaveAttribute("aria-selected", "true");
  const placeId = await tab.getAttribute("data-place-id");
  if (!placeId) throw new Error(`The ${name} tab has no data-place-id`);
  return placeId;
}

// Adds an item to the selected place and returns its ID.
async function addItem(page: Page, name: string, how: "click" | "dblclick" = "click") {
  await page.getByRole("button", { name: "Add item" }).click();
  await page.getByLabel("Name", { exact: true }).fill(name);
  await page.getByRole("button", { name: "Save", exact: true })[how]();
  const row = page.locator("[data-item-id]", { hasText: name });
  await expect(row).toHaveCount(1);
  const itemId = await row.getAttribute("data-item-id");
  if (!itemId) throw new Error(`The ${name} row has no data-item-id`);
  return itemId;
}

async function expectNothingOf(page: Page, a: { placeId: string; itemId: string; place: string; item: string }) {
  await expect(page.locator(`[data-place-id="${a.placeId}"]`)).toHaveCount(0);
  await expect(page.locator(`[data-item-id="${a.itemId}"]`)).toHaveCount(0);
  await expect(page.getByText(a.place)).toHaveCount(0);
  await expect(page.getByText(a.item)).toHaveCount(0);
}

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
