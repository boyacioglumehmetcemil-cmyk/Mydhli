/**
 * Authenticated PDF download helper.
 *
 * The browser does not attach the `Authorization` header on plain
 * `<a href>` navigation or `window.open()` calls, so any auth-gated
 * `application/pdf` endpoint returns 401 when opened that way.
 *
 * This helper fetches the PDF with the Bearer token, wraps the bytes
 * in a Blob, and triggers a programmatic download. Same pattern used
 * by the Print Label button and the <ShipmentDocuments /> tiles.
 */
import { toast } from "sonner";

const TOKEN_KEY = "dhl_auth_token";
const BACKEND = process.env.REACT_APP_BACKEND_URL;

export async function downloadAuthedPdf({ path, filename, niceLabel = "PDF" }) {
  const token = localStorage.getItem(TOKEN_KEY);
  const url = path.startsWith("http") ? path : `${BACKEND}${path}`;
  try {
    const res = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      let detail = "";
      try { detail = (await res.json())?.detail || ""; } catch { /* ignore */ }
      throw new Error(`HTTP ${res.status}${detail ? ` — ${detail}` : ""}`);
    }
    const blob = await res.blob();
    const obj = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = obj;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(obj), 1000);
    toast.success(`${niceLabel} downloaded`);
    return true;
  } catch (e) {
    toast.error(`Could not download ${niceLabel}`, {
      description: String(e?.message || e),
    });
    return false;
  }
}
