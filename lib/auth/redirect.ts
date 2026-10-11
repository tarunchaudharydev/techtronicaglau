export function safeRedirectPath(value: string | null, fallback = "/account") {
  if (!value || !value.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u001f]/.test(value)) {
    return fallback;
  }

  try {
    const parsed = new URL(value, "https://techtronica.invalid");
    return parsed.origin === "https://techtronica.invalid"
      ? `${parsed.pathname}${parsed.search}${parsed.hash}`
      : fallback;
  } catch {
    return fallback;
  }
}

