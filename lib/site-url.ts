import { headers } from "next/headers";

// The `Origin` request header is only sent on certain request types (form
// POSTs, fetch/XHR); a plain page load omits it, which made the invite
// link render as a broken relative path. `Host` is always present, so
// derive the base URL from that instead.
export async function getBaseUrl(): Promise<string> {
  const headersList = await headers();
  const host = headersList.get("host");
  const protocol =
    headersList.get("x-forwarded-proto") ??
    (host?.startsWith("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}
