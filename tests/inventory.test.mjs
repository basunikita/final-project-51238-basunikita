import assert from "node:assert/strict";
import test from "node:test";
import {
  checkItemName,
  checkPlaceName,
  deletePlaceBlockedMessage,
  failureMessage,
  isItemState,
  isKind,
  itemCounts,
  resolveSelection,
  waitingLabel,
} from "../lib/inventory.ts";

const bookshelf = { id: 1, name: "Bookshelf", createdAt: "2026-11-17T10:00:00Z" };

test("a place name is trimmed", () => {
  assert.deepEqual(checkPlaceName(" My room ", []), { ok: true, value: "My room" });
});

test("a blank place name asks for a name", () => {
  assert.deepEqual(checkPlaceName("   ", []), { ok: false, message: "Give the place a name." });
});

test("place names stop at 40 characters", () => {
  assert.deepEqual(checkPlaceName("x".repeat(41), []), {
    ok: false,
    message: "Keep place names to 40 characters.",
  });
  assert.deepEqual(checkPlaceName("x".repeat(40), []), { ok: true, value: "x".repeat(40) });
});

test("a place name already used, ignoring case and spaces, is refused by name", () => {
  assert.deepEqual(checkPlaceName(" bookshelf ", [bookshelf]), {
    ok: false,
    message: "You already have a place called Bookshelf.",
  });
});

test("renaming a place to its own name in different case is fine", () => {
  assert.deepEqual(checkPlaceName("BOOKSHELF", [bookshelf], 1), { ok: true, value: "BOOKSHELF" });
});

test("item names must be 1 to 80 characters", () => {
  assert.deepEqual(checkItemName(""), { ok: false, message: "Give the item a name." });
  assert.deepEqual(checkItemName("   "), { ok: false, message: "Give the item a name." });
  assert.deepEqual(checkItemName("x".repeat(81)), {
    ok: false,
    message: "Keep item names to 80 characters.",
  });
  assert.deepEqual(checkItemName("x".repeat(80)), { ok: true, value: "x".repeat(80) });
  assert.deepEqual(checkItemName(" LAMY Safari "), { ok: true, value: "LAMY Safari" });
});

test("the waiting label counts whole days", () => {
  const created = "2026-11-01T09:00:00Z";
  const at = (ms) => new Date(Date.parse(created) + ms);
  const hour = 3_600_000;
  assert.equal(waitingLabel(created, at(0)), "Waiting since today");
  assert.equal(waitingLabel(created, at(23 * hour)), "Waiting since today");
  assert.equal(waitingLabel(created, at(24 * hour)), "Waiting 1 day");
  assert.equal(waitingLabel(created, at(12 * 24 * hour + 5 * 60_000)), "Waiting 12 days");
});

const places = [
  { id: 1, name: "Bookshelf", createdAt: "2026-11-17T10:00:00Z" },
  { id: 2, name: "Home desk", createdAt: "2026-11-17T10:01:00Z" },
];
const item = (id, placeId) => ({
  id,
  placeId,
  name: `Item ${id}`,
  kind: "pen",
  state: "unused",
  createdAt: "2026-11-17T10:02:00Z",
});
const items = [item(10, 1), item(11, 1), item(20, 2)];

test("with no selection, the first place and its first item are selected", () => {
  assert.deepEqual(resolveSelection(places, items, {}), { placeId: 1, itemId: 10 });
});

test("a place in the URL selects that place and its first item", () => {
  assert.deepEqual(resolveSelection(places, items, { place: "2" }), { placeId: 2, itemId: 20 });
});

test("an unknown place in the URL falls back to the first place", () => {
  assert.deepEqual(resolveSelection(places, items, { place: "999" }), { placeId: 1, itemId: 10 });
});

test("an item from another place falls back to the place's first item", () => {
  assert.deepEqual(resolveSelection(places, items, { place: "1", item: "20" }), {
    placeId: 1,
    itemId: 10,
  });
});

test("an item in the URL is selected when it is in the selected place", () => {
  assert.deepEqual(resolveSelection(places, items, { place: "1", item: "11" }), {
    placeId: 1,
    itemId: 11,
  });
});

test("junk in the URL falls back to the first place and item", () => {
  assert.deepEqual(resolveSelection(places, items, { place: "abc", item: "x" }), {
    placeId: 1,
    itemId: 10,
  });
});

test("an empty place selects no item", () => {
  const withEmpty = [...places, { id: 3, name: "Small box", createdAt: "2026-11-17T10:03:00Z" }];
  assert.deepEqual(resolveSelection(withEmpty, items, { place: "3" }), { placeId: 3, itemId: null });
});

test("no places selects nothing", () => {
  assert.deepEqual(resolveSelection([], [], { place: "1", item: "10" }), {
    placeId: null,
    itemId: null,
  });
});

test("a place with items can't be deleted, and the message counts them", () => {
  assert.equal(
    deletePlaceBlockedMessage("Bookshelf", 3),
    "Move or delete the 3 items in Bookshelf first.",
  );
  assert.equal(
    deletePlaceBlockedMessage("Bookshelf", 1),
    "Move or delete the 1 item in Bookshelf first.",
  );
});

test("item counts are per place", () => {
  const counts = itemCounts(items);
  assert.equal(counts.get(1), 2);
  assert.equal(counts.get(2), 1);
  assert.equal(counts.get(3), undefined);
});

test("only the four types and three states are accepted", () => {
  assert.equal(isKind("pen"), true);
  assert.equal(isKind("eraser"), false);
  assert.equal(isKind(undefined), false);
  assert.equal(isItemState("in_use"), true);
  assert.equal(isItemState("lost"), false);
});

test("an expired session says so, and anything else says try again", () => {
  assert.equal(failureMessage("PGRST301"), "Your session ended. Sign in again.");
  assert.equal(failureMessage("PGRST303"), "Your session ended. Sign in again.");
  assert.equal(failureMessage(undefined), "Couldn't save. Try again.");
  assert.equal(failureMessage("42501"), "Couldn't save. Try again.");
  assert.equal(failureMessage("23514"), "Couldn't save. Try again.");
});
