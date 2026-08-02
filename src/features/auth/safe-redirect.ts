export const DEFAULT_AUTHENTICATED_PATH = "/dashboard";

const INTERNAL_ORIGIN = "https://carsys.internal";
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/;
const PROTECTED_RETURN_PREFIXES = [
  "/dashboard",
  "/vehicles",
  "/reports",
  "/audit-logs",
  "/settings",
] as const;

const isAllowedProtectedPath = (pathname: string) =>
  PROTECTED_RETURN_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

const decodeForSafetyCheck = (value: string) => {
  let decoded = value;

  for (let index = 0; index < 3; index += 1) {
    const nextValue = decodeURIComponent(decoded);
    if (nextValue === decoded) {
      return decoded;
    }
    decoded = nextValue;
  }

  return decoded;
};

export function getSafeInternalPath(value: unknown): string {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > 2_048 ||
    value.trim() !== value
  ) {
    return DEFAULT_AUTHENTICATED_PATH;
  }

  let decoded: string;
  try {
    decoded = decodeForSafetyCheck(value);
  } catch {
    return DEFAULT_AUTHENTICATED_PATH;
  }

  if (
    CONTROL_CHARACTER_PATTERN.test(decoded) ||
    decoded.includes("\\") ||
    !decoded.startsWith("/") ||
    decoded.startsWith("//")
  ) {
    return DEFAULT_AUTHENTICATED_PATH;
  }

  let parsed: URL;
  try {
    parsed = new URL(decoded, INTERNAL_ORIGIN);
  } catch {
    return DEFAULT_AUTHENTICATED_PATH;
  }

  if (
    parsed.origin !== INTERNAL_ORIGIN ||
    !isAllowedProtectedPath(parsed.pathname)
  ) {
    return DEFAULT_AUTHENTICATED_PATH;
  }

  return `${parsed.pathname}${parsed.search}${parsed.hash}`;
}
