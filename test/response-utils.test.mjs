import test from "node:test";
import assert from "node:assert/strict";

import {
  extensionFromContentType,
  getHeaderValue,
  getResponseDownloadName,
  parseContentDispositionFilename
} from "../src/lib/response-utils.js";

test("getHeaderValue reads headers case insensitively", () => {
  assert.equal(getHeaderValue({ "Content-Type": "application/json" }, "content-type"), "application/json");
});

test("parseContentDispositionFilename handles plain and encoded filenames", () => {
  assert.equal(parseContentDispositionFilename('attachment; filename="report.json"'), "report.json");
  assert.equal(parseContentDispositionFilename("attachment; filename*=UTF-8''hello%20world.txt"), "hello world.txt");
});

test("getResponseDownloadName sanitizes unsafe filenames", () => {
  assert.equal(
    getResponseDownloadName({ headers: { "content-disposition": 'attachment; filename="bad:name?.json"' } }),
    "bad_name_.json"
  );
});

test("extensionFromContentType maps common response media types", () => {
  assert.equal(extensionFromContentType("application/problem+json"), "json");
  assert.equal(extensionFromContentType("text/html; charset=utf-8"), "html");
  assert.equal(extensionFromContentType("application/unknown", "txt"), "txt");
});

test("getResponseDownloadName falls back to content type", () => {
  assert.equal(
    getResponseDownloadName({ isBinary: false, headers: { "content-type": "text/csv" } }),
    "response.csv"
  );
});
