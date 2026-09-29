export interface GpsFix {
  lat: number;
  lng: number;
  accuracyM: number | null;
  source: "exif" | "app";
}

/** Parses a decimal number or an EXIF-style DMS string such as `24 deg 13' 8.04"`. */
function parseCoordinate(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v !== "string") return null;
  const plain = Number(v);
  if (v.trim() !== "" && Number.isFinite(plain)) return plain;

  const m = v.match(/(-?\d+(?:\.\d+)?)\D+?(?:(\d+(?:\.\d+)?)\D+?)?(?:(\d+(?:\.\d+)?)\D*)?$/);
  if (!m) return null;
  const deg = Number(m[1]);
  const min = m[2] ? Number(m[2]) : 0;
  const sec = m[3] ? Number(m[3]) : 0;
  const abs = Math.abs(deg) + min / 60 + sec / 3600;
  return deg < 0 ? -abs : abs;
}

function applyRef(value: number, ref: unknown, negativeRef: string): number {
  return typeof ref === "string" && ref.trim().toUpperCase().startsWith(negativeRef) && value > 0 ? -value : value;
}

function inRange(lat: number, lng: number) {
  return Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
}

/**
 * Prefers hardware EXIF GPS (Cloudinary media_metadata). Falls back to the position the field app
 * reported in the upload context, which is weaker evidence because the client controls it.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export function extractGps(payload: any): GpsFix | null {
  const md = payload?.media_metadata ?? {};
  const rawLat = parseCoordinate(md.GPSLatitude);
  const rawLng = parseCoordinate(md.GPSLongitude);
  if (rawLat !== null && rawLng !== null) {
    const lat = applyRef(rawLat, md.GPSLatitudeRef, "S");
    const lng = applyRef(rawLng, md.GPSLongitudeRef, "W");
    if (inRange(lat, lng)) return { lat, lng, accuracyM: null, source: "exif" };
  }

  const custom = payload?.context?.custom ?? {};
  const lat = parseCoordinate(custom.gps_lat);
  const lng = parseCoordinate(custom.gps_lng);
  if (lat !== null && lng !== null && inRange(lat, lng)) {
    const acc = parseCoordinate(custom.gps_acc);
    return { lat, lng, accuracyM: acc, source: "app" };
  }
  return null;
}
