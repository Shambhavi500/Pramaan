"use client";

import React, { useState } from "react";
import { Camera, MapPin, ShieldCheck, UploadCloud, RefreshCw } from "lucide-react";
import { ACTIVITIES, PHASES, type Activity, type Phase } from "@/lib/activities";

const FOLDER = "pramaan/green-aravalli/GA-17";

export default function CapturePage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [gps, setGps] = useState<{ lat: number; lng: number; acc: number } | null>(null);
  const [sha256, setSha256] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [activity, setActivity] = useState<Activity>("check_dam_construction");
  const [phase, setPhase] = useState<Phase>("before");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const selectedFile = e.target.files[0];
    if (preview) URL.revokeObjectURL(preview);
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    setGps(null);
    setStatus("Computing integrity hash & locking GPS...");

    const buffer = await selectedFile.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    const hashHex = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    setSha256(hashHex);

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude, acc: pos.coords.accuracy });
          setStatus("Ready to submit authentic evidence.");
        },
        () => setStatus("GPS unavailable. Upload will be flagged for review.")
      );
    } else {
      setStatus("GPS unavailable. Upload will be flagged for review.");
    }
  };

  const handleUpload = async () => {
    if (!file || !sha256) return;
    setUploading(true);
    setStatus("Requesting HMAC signature...");

    try {
      const timestamp = Math.round(Date.now() / 1000);
      // Every parameter sent alongside the file (except api_key) must be part of the signature.
      const contextParts = [`client_sha256=${sha256}`, `activity=${activity}`, `phase=${phase}`];
      if (gps) {
        contextParts.push(`gps_lat=${gps.lat.toFixed(6)}`, `gps_lng=${gps.lng.toFixed(6)}`, `gps_acc=${Math.round(gps.acc)}`);
      }
      const context = contextParts.join("|");
      const signRes = await fetch("/api/sign-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paramsToSign: { upload_preset: "pramaan_evidence", timestamp, folder: FOLDER, context },
        }),
      });
      if (!signRes.ok) throw new Error(await signRes.text());
      const { signature, apiKey } = await signRes.json();

      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", apiKey);
      formData.append("timestamp", String(timestamp));
      formData.append("signature", signature);
      formData.append("upload_preset", "pramaan_evidence");
      formData.append("folder", FOLDER);
      formData.append("context", context);

      setStatus("Uploading directly to Cloudinary Evidence Engine...");
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error?.message ?? "Upload failed");
      }
      setStatus("Upload successful! Evidence sent to verification queue.");
      setFile(null);
      setPreview(null);
      setSha256(null);
    } catch (err) {
      setStatus(`Error: ${err instanceof Error ? err.message : "Upload failed"}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-6 pb-4">
      <div className="space-y-2">
        <span className="chip-lime">Field capture</span>
        <h1 className="flex items-center gap-2 text-4xl font-light tracking-tight">
          <Camera className="h-7 w-7 text-lime" aria-hidden /> Capture evidence
        </h1>
        <p className="text-sm text-soft">Site GA-17 · Kotra Check Dam</p>
      </div>

      <label className="panel relative flex h-64 cursor-pointer flex-col items-center justify-center overflow-hidden border-dashed">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Capture preview" className="h-full w-full object-cover" />
        ) : (
          <div className="p-4 text-center">
            <Camera className="mx-auto mb-2 h-10 w-10 text-link" aria-hidden />
            <p className="text-base font-normal">Tap to capture field evidence</p>
            <p className="text-xs text-muted">Camera with hardware geotagging</p>
          </div>
        )}
        <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
      </label>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <label className="space-y-1">
          <span className="font-medium text-soft">Activity</span>
          <select
            value={activity}
            onChange={(e) => setActivity(e.target.value as Activity)}
            disabled={uploading}
            className="field"
          >
            {ACTIVITIES.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="font-medium text-soft">Phase</span>
          <select
            value={phase}
            onChange={(e) => setPhase(e.target.value as Phase)}
            disabled={uploading}
            className="field"
          >
            {PHASES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {sha256 && (
        <div className="panel-flat space-y-2 p-3 text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 shrink-0 text-good" aria-hidden />
            <span className="truncate font-mono">SHA-256: {sha256}</span>
          </div>
          {gps && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-link" aria-hidden />
              <span>
                GPS: {gps.lat.toFixed(4)}°N, {gps.lng.toFixed(4)}°E (±{Math.round(gps.acc)}m)
              </span>
            </div>
          )}
        </div>
      )}

      {status && (
        <p role="status" className={`text-center text-xs font-medium ${status.startsWith("Error") ? "text-bad" : "text-lime"}`}>
          {status}
        </p>
      )}

      <button disabled={!file || !sha256 || uploading} onClick={handleUpload} className="btn-lime w-full py-3">
        {uploading ? <RefreshCw className="h-5 w-5 animate-spin" aria-hidden /> : <UploadCloud className="h-5 w-5" aria-hidden />}
        {uploading ? "Verifying with Cloudinary..." : "Submit proof"}
      </button>
    </div>
  );
}
