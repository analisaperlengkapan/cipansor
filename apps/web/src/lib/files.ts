/**
 * The API serves /uploads behind authentication (files hold student photos
 * and documents). Browser-native fetches — <img src>, <a href>, window.open,
 * <object data> — cannot send an Authorization header, so the access token is
 * passed as a ?token= query parameter instead; the API's uploadsAuth
 * middleware accepts either form.
 *
 * Wrap any URL that may point at /uploads with this helper before handing it
 * to the browser. Non-upload URLs (external links, data URIs) pass through
 * untouched.
 */
export function authFileUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (!url.includes("/uploads/")) return url;
  if (typeof window === "undefined") return url;

  const token = localStorage.getItem("accessToken");
  if (!token) return url;

  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}token=${encodeURIComponent(token)}`;
}
