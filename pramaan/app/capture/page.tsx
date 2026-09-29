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
    <div className="max-w-md mx-auto p-4 space-y-6">
      <div className="border-b pb-3">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Camera className="h-5 w-5 text-emerald-600" /> Pramaan Field Capture
        </h1>
        <p className="text-xs text-muted-foreground">Site GA-17 · Kotra Check Dam</p>
      </div>

      <label className="border-2 border-dashed rounded-2xl h-64 flex flex-col items-center justify-center cursor-pointer bg-neutral-50 overflow-hidden relative">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Capture preview" className="h-full w-full object-cover" />
        ) : (
          <div className="text-center p-4">
            <Camera className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm font-semibold">Tap to capture field evidence</p>
            <p className="text-xs text-muted-foreground">Camera with hardware geotagging</p>
          </div>
        )}
        <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
      </label>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <label className="space-y-1">
          <span className="font-semibold">Activity</span>
          <select
            value={activity}
            onChange={(e) => setActivity(e.target.value as Activity)}
            disabled={uploading}
            className="w-full border rounded-lg bg-white px-2 py-2"
          >
            {ACTIVITIES.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="font-semibold">Phase</span>
          <select
            value={phase}
            onChange={(e) => setPhase(e.target.value as Phase)}
            disabled={uploading}
            className="w-full border rounded-lg bg-white px-2 py-2"
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
        <div className="bg-neutral-100 p-3 rounded-lg space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="font-mono truncate">SHA-256: {sha256}</span>
          </div>
          {gps && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-blue-600" />
              <span>
                GPS: {gps.lat.toFixed(4)}°N, {gps.lng.toFixed(4)}°E (±{Math.round(gps.acc)}m)
              </span>
            </div>
          )}
        </div>
      )}

      {status && <p className="text-xs text-center font-medium text-emerald-700">{status}</p>}

      <button
        disabled={!file || !sha256 || uploading}
        onClick={handleUpload}
        className="w-full bg-emerald-600 text-white font-semibold py-3 rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {uploading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <UploadCloud className="h-5 w-5" />}
        {uploading ? "Verifying with Cloudinary..." : "Submit Proof"}
      </button>
    </div>
  );
}
