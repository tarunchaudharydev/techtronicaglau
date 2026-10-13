export const dynamic = "force-dynamic";

const payloadSize = 2 * 1024 * 1024;

export async function GET() {
  // Generate incompressible bytes so transport compression does not inflate
  // the reported speed. The route is only called after a visitor taps the test.
  const payload = new Uint8Array(payloadSize);
  let state = 0x6d2b79f5;
  for (let index = 0; index < payload.length; index += 1) {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    payload[index] = state & 0xff;
  }

  return new Response(payload, {
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "Content-Length": String(payloadSize),
      "Content-Type": "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
