import axios from "axios";

const apiBase =
  import.meta.env.VITE_API_URL != null
    ? `${import.meta.env.VITE_API_URL.replace(/\/$/, "")}/api/v1`
    : "http://localhost:8001/api/v1";

const isNgrok = /ngrok-free\.app|\.ngrok\.(io|dev)/.test(
  import.meta.env.VITE_API_URL ?? ""
);

const api = axios.create({
  baseURL: apiBase,
});

// Free ngrok shows an HTML interstitial for browser requests; API calls need this
// header to receive the actual JSON response instead.
if (isNgrok) {
  api.defaults.headers.common["ngrok-skip-browser-warning"] = "true";
}

/** Use for profile image src when VITE_API_URL is set (ngrok), so /static is proxied with the skip header. */
export function getProfileImageUrl(profileImage: string | null | undefined): string | null {
  if (!profileImage) return null;
  if (profileImage.startsWith("http")) return profileImage;
  if (isNgrok) return profileImage; // relative: same-origin request goes through Vite proxy
  return `${api.defaults.baseURL?.replace("/api/v1", "") ?? ""}${profileImage}`;
}

export default api;
