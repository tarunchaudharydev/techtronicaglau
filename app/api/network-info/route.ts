import { isIP } from "node:net";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Vercel overwrites x-forwarded-for with the public client IP, preventing
  // callers from supplying an arbitrary address through that header.
  const forwardedFor = request.headers.get("x-forwarded-for");
  const candidate = forwardedFor?.split(",")[0]?.trim().replace(/^\[|\]$/g, "") ?? null;
  const ip = candidate && isIP(candidate) ? candidate : null;

  return Response.json(
    { ip },
    {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
        Pragma: "no-cache",
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}
