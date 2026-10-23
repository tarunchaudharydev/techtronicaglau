import assert from "node:assert/strict";
import test from "node:test";
import { readJsonBodyLimited } from "../../lib/security/read-json-body.mjs";

function jsonRequest(body, headers = {}) {
  return new Request("http://localhost/api/test", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body,
  });
}

test("accepts a JSON body exactly at the byte limit", async () => {
  const body = '{"ok":true}';
  const size = new TextEncoder().encode(body).byteLength;
  const result = await readJsonBodyLimited(jsonRequest(body), size);

  assert.deepEqual(result, { ok: true, value: { ok: true } });
});

test("rejects oversized streamed bodies when Content-Length is absent", async () => {
  const result = await readJsonBodyLimited(jsonRequest('{"message":"this is too large"}'), 8);

  assert.deepEqual(result, { ok: false, reason: "too_large" });
});

test("uses actual bytes when Content-Length understates the request", async () => {
  const result = await readJsonBodyLimited(jsonRequest('{"message":"this is too large"}', {
    "content-length": "1",
  }), 8);

  assert.deepEqual(result, { ok: false, reason: "too_large" });
});

test("rejects an oversized declared length before reading the body", async () => {
  const result = await readJsonBodyLimited(jsonRequest("{}", { "content-length": "12001" }), 12000);

  assert.deepEqual(result, { ok: false, reason: "too_large" });
});

test("rejects malformed JSON and invalid UTF-8", async () => {
  const malformed = await readJsonBodyLimited(jsonRequest("{"), 8);
  const invalidUtf8 = await readJsonBodyLimited(jsonRequest(new Uint8Array([0x7b, 0xff, 0x7d])), 8);

  assert.deepEqual(malformed, { ok: false, reason: "invalid_json" });
  assert.deepEqual(invalidUtf8, { ok: false, reason: "invalid_json" });
});

test("rejects non-JSON content types", async () => {
  const request = new Request("http://localhost/api/test", {
    method: "POST",
    headers: { "content-type": "text/plain" },
    body: "{}",
  });

  assert.deepEqual(await readJsonBodyLimited(request, 8), { ok: false, reason: "invalid_json" });
});
