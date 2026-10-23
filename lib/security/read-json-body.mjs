/**
 * @typedef {{ ok: true, value: unknown } | { ok: false, reason: "too_large" | "invalid_json" }} LimitedJsonResult
 */

/**
 * Read and parse a JSON request without trusting Content-Length. The stream is
 * stopped as soon as the actual UTF-8 payload exceeds maxBytes.
 *
 * @param {Request} request
 * @param {number} maxBytes
 * @returns {Promise<LimitedJsonResult>}
 */
export async function readJsonBodyLimited(request, maxBytes) {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 0) {
    throw new RangeError("maxBytes must be a non-negative safe integer.");
  }

  const contentType = request.headers.get("content-type");
  if (contentType && contentType.split(";", 1)[0].trim().toLowerCase() !== "application/json") {
    return { ok: false, reason: "invalid_json" };
  }

  const declaredLength = request.headers.get("content-length")?.trim();
  if (declaredLength && /^\d+$/.test(declaredLength) && Number(declaredLength) > maxBytes) {
    return { ok: false, reason: "too_large" };
  }

  const reader = request.body?.getReader();
  if (!reader) return { ok: false, reason: "invalid_json" };

  /** @type {Uint8Array[]} */
  const chunks = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        try {
          await reader.cancel("Request body exceeds the configured limit.");
        } catch {
          // The request may already be closing; the size limit is still enforced.
        }
        return { ok: false, reason: "too_large" };
      }

      chunks.push(value);
    }
  } catch {
    return { ok: false, reason: "invalid_json" };
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false, reason: "invalid_json" };
  }
}
