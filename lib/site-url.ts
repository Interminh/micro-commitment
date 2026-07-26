import { headers } from "next/headers";

// `Origin` only shows up on some requests (form posts, fetch), so a plain
// page load left it blank and broke the invite link. `Host` is always
// there, so build the URL from that instead.
export async function getBaseUrl(): Promise<string> {
  const headersList = await headers();
  const host = headersList.get("host");
  const protocol =
    headersList.get("x-forwarded-proto") ??
    (host?.startsWith("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}
