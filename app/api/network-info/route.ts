import { isIP } from "node:net";

export const dynamic = "force-dynamic";

function safeHeader(value: string | null, maxLength: number) {
  if (!value) return null;
  try {
    const decoded = decodeURIComponent(value).replace(/[\u0000-\u001f\u007f]/g, "").trim();
    return decoded ? decoded.slice(0, maxLength) : null;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  // Vercel overwrites x-forwarded-for with the public client IP, preventing
  // callers from supplying an arbitrary address through that header.
  const forwardedFor = request.headers.get("x-forwarded-for");
  const candidate = forwardedFor?.split(",")[0]?.trim().replace(/^\[|\]$/g, "") ?? null;
  const ip = candidate && isIP(candidate) ? candidate : null;

  const city = safeHeader(request.headers.get("x-vercel-ip-city"), 80);
  const region = safeHeader(request.headers.get("x-vercel-ip-country-region"), 16);
  const rawCountry = request.headers.get("x-vercel-ip-country")?.trim().toUpperCase() ?? "";
  const countryCode = /^[A-Z]{2}$/.test(rawCountry) ? rawCountry : null;
  const countryName = countryCode
    ? new Intl.DisplayNames(["en"], { type: "region" }).of(countryCode) ?? countryCode
    : null;
  const location = [city, region, countryName].filter(Boolean).join(", ") || null;

  return Response.json(
    { ip, location },
    {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
        Pragma: "no-cache",
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}
