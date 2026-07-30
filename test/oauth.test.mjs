import test from "node:test";
import assert from "node:assert/strict";

import { normalizeAuthState } from "../src/lib/oauth.js";

test("normalizeAuthState keeps custom authorization fields", () => {
  const auth = normalizeAuthState({
    type: "custom",
    customScheme: "Token",
    customValue: "abc123",
  });

  assert.equal(auth.type, "custom");
  assert.equal(auth.customScheme, "Token");
  assert.equal(auth.customValue, "abc123");
});
