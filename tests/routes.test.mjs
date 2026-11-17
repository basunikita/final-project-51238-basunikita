import assert from "node:assert/strict";
import test from "node:test";
import { redirectsSignedOutVisitors } from "../lib/routes.ts";

test("opening /inventory signed out goes to sign-in", () => {
  assert.equal(redirectsSignedOutVisitors("/inventory", false), true);
  assert.equal(redirectsSignedOutVisitors("/inventory/x", false), true);
});

test("a server action posted to /inventory answers for itself", () => {
  assert.equal(redirectsSignedOutVisitors("/inventory", true), false);
});

test("the home page and /proposal stay public", () => {
  assert.equal(redirectsSignedOutVisitors("/", false), false);
  assert.equal(redirectsSignedOutVisitors("/proposal", false), false);
  assert.equal(redirectsSignedOutVisitors("/inventoryx", false), false);
  assert.equal(redirectsSignedOutVisitors("/sign-in", false), false);
});
