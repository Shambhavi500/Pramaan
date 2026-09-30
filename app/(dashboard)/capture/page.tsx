"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Camera, MapPin, ShieldCheck, UploadCloud, RefreshCw, CheckCircle2, AlertTriangle, ArrowRight, Radio } from "lucide-react";
import { DEMO_SITE_CODE, DEMO_SITE_NAME, DEMO_SITE_COORDS } from "@/lib/demo-site";
import { PageHeader } from "@/components/ui/PageHeader";
import { ACTIVITIES, PHASES, type Activity, type Phase } from "@/lib/activities";

interface CaptureResult {
  evidenceId: string;
  trustScore: number;
  trustStatus: string;
  sha256: string;
  message: string;
  mode: string;
}

export default function CapturePage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [deviceGps, setDeviceGps] = useState<{ lat: number; lng: number; acc: number } | null>(null);
  const [useSimulatedGps, setUseSimulatedGps] = useState(false);
  const [sha256, setSha256] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [statusType, setStatusType] = useState<"info" | "error" | "success">("info");
  const [activity, setActivity] = useState<Activity>("check_dam_construction");
  const [phase, setPhase] = useState<Phase>("before");
  const [cloudinaryConfigured, setCloudinaryConfigured] = useState<boolean | null>(null);
  const [result, setResult] = useState<CaptureResult | null>(null);

  // Check Cloudinary configuration status on mount
  useEffect(() => {
    fetch("/api/sign-upload")
      .then((res) => res.json())
      .then((data) => setCloudinaryConfigured(Boolean(data?.configured)))
      .catch(() => setCloudinaryConfigured(false));
  }, []);

  // Compute active GPS coordinates based on mode
  const activeGps = useSimulatedGps
    ? { lat: DEMO_SITE_COORDS.lat, lng: DEMO_SITE_COORDS.lng, acc: 5, simulated: true }
    : deviceGps
      ? { ...deviceGps, simulated: false }
      : null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const selectedFile = e.target.files[0];
    if (preview) URL.revokeObjectURL(preview);
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    setResult(null);
    setStatus("Computing integrity hash & acquiring GPS...");
    setStatusType("info");

    try {
      const buffer = await selectedFile.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
      const hashHex = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      setSha256(hashHex);

      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setDeviceGps({ lat: pos.coords.latitude, lng: pos.coords.longitude, acc: pos.coords.accuracy });
            setStatus("Ready to submit authentic evidence.");
            setStatusType("info");
          },
          (err) => {
            console.warn("Geolocation notice:", err.message);
            setStatus("Device GPS unavailable. Toggle site simulation or submit without GPS.");
            setStatusType("info");
          },
          { enableHighAccuracy: true, timeout: 8000 }
        );
      } else {
        setStatus("Device GPS not supported. Simulated on-site coordinates available below.");
        setStatusType("info");
      }
    } catch (err) {
      console.error("Hashing failed:", err);
      setStatus("Failed to compute SHA-256 file hash.");
      setStatusType("error");
    }
  };

  const handleUpload = async () => {
    if (!file || !sha256) return;
    setUploading(true);
    setResult(null);
    setStatus("Authenticating evidence with Pramaan Ingest Engine...");
    setStatusType("info");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("client_sha256", sha256);
      formData.append("activity", activity);
      formData.append("phase", phase);

      if (activeGps) {
        formData.append("gps_lat", activeGps.lat.toFixed(6));
        formData.append("gps_lng", activeGps.lng.toFixed(6));
        formData.append("gps_acc", Math.round(activeGps.acc).toString());
      }

      const res = await fetch("/api/evidence/capture", {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        const errorMsg = data?.error ?? (res.status === 503 ? "Verification service is not configured." : "Upload failed.");
        throw new Error(errorMsg);
      }

      setResult(data);
      setStatus(data.message ?? "Evidence submitted successfully!");
      setStatusType("success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Evidence submission failed.";
      setStatus(`Error: ${msg}`);
      setStatusType("error");
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setSha256(null);
    setResult(null);
    setStatus("");
  };

  return (
    <div className="mx-auto max-w-md pb-6">
      <PageHeader stage="Bring in · Capture" title="Capture evidence">
        Site {DEMO_SITE_CODE} · {DEMO_SITE_NAME}
      </PageHeader>

      {/* Cloudinary Mode Banner */}
      {cloudinaryConfigured === false && (
        <div className="mb-4 rounded-md border border-sky-200 bg-sky-50 p-3 text-xs text-sky-800">
          <div className="flex items-center gap-1.5 font-medium">
            <Radio className="h-3.5 w-3.5 text-sky-600 animate-pulse" />
            Direct Database Ingest (Local Prototype Mode)
          </div>
          <p className="mt-1 text-sky-700">
            Cloudinary keys not set in <code className="font-mono text-[11px]">.env.local</code>. Media, SHA-256 hashes, and geofence decisions persist directly into Supabase PostGIS and the audit ledger.
          </p>
        </div>
      )}

      <div className="space-y-5">
        {/* Photo Selection / Camera */}
        <label className="surface-1 relative flex h-64 cursor-pointer flex-col items-center justify-center overflow-hidden border-dashed !border-border-strong focus-within:outline-2 focus-within:outline-focus">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Capture preview" className="h-full w-full object-cover" />
          ) : (
            <div className="p-4 text-center">
              <Camera className="mx-auto mb-2 h-10 w-10 text-sky-600" aria-hidden />
              <p className="text-base font-medium">Tap to select or capture field photo</p>
              <p className="text-xs text-ink-600">Hardware hash &amp; GPS geofence locked on intake</p>
            </div>
          )}
          <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={handleFileChange} />
        </label>

        {/* Activity & Phase Selectors */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <label className="space-y-1">
            <span className="overline">Activity</span>
            <select
              value={activity}
              onChange={(e) => setActivity(e.target.value as Activity)}
              disabled={uploading}
              className="input"
            >
              {ACTIVITIES.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="overline">Phase</span>
            <select
              value={phase}
              onChange={(e) => setPhase(e.target.value as Phase)}
              disabled={uploading}
              className="input"
            >
              {PHASES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* SHA-256 & Location Panel */}
        {sha256 && (
          <div className="surface-1 space-y-3 p-3 text-xs">
            {/* SHA-256 Display */}
            <div className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-verified" aria-hidden />
              <div className="min-w-0">
                <span className="overline block">SHA-256 Evidence Hash</span>
                <span className="hash !block font-mono text-[11px] break-all">{sha256}</span>
              </div>
            </div>

            {/* GPS Coordinates & Simulation Toggle */}
            <div className="space-y-1.5 border-t border-cloud-100 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-sky-600" aria-hidden />
                  <span className="overline">Location Coordinates</span>
                </div>
                <button
                  type="button"
                  onClick={() => setUseSimulatedGps((prev) => !prev)}
                  className="text-[11px] text-sky-700 underline hover:text-sky-800"
                >
                  {useSimulatedGps ? "Switch to device GPS" : "Simulate on-site GPS (JH-04)"}
                </button>
              </div>

              {activeGps ? (
                <div className="flex items-center justify-between text-[11px] text-ink-700">
                  <span className="font-mono">
                    {activeGps.lat.toFixed(4)}°N, {activeGps.lng.toFixed(4)}°E (±{Math.round(activeGps.acc)}m)
                  </span>
                  <span className="text-[10px] text-ink-500">
                    {useSimulatedGps ? "On-site simulated" : "Device hardware"}
                  </span>
                </div>
              ) : (
                <p className="text-[11px] text-ink-500">
                  No GPS acquired yet.{" "}
                  <button
                    type="button"
                    onClick={() => setUseSimulatedGps(true)}
                    className="text-sky-600 underline"
                  >
                    Use Check Dam JH-04 coordinates
                  </button>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Status Message */}
        {status && (
          <div
            role="status"
            className={`rounded-sm border px-3 py-2 text-center text-[13px] ${
              statusType === "error"
                ? "border-flagged-line bg-flagged-bg text-flagged-fg"
                : statusType === "success"
                  ? "border-verified-line bg-verified-bg text-verified-fg"
                  : "border-sky-200 bg-sky-50 text-sky-700"
            }`}
          >
            {status}
          </div>
        )}

        {/* Success Action Card */}
        {result && (
          <div className="surface-2 rounded-md border border-verified-line p-4 space-y-3 enter">
            <div className="flex items-center gap-2 text-verified-fg font-medium text-sm">
              <CheckCircle2 className="h-5 w-5 text-verified" />
              <span>Evidence Record Persisted</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-ink-700">
              <div>
                <span className="overline block text-[10px]">Evidence ID</span>
                <span className="font-mono">{result.evidenceId}</span>
              </div>
              <div>
                <span className="overline block text-[10px]">Trust Score</span>
                <span className="font-semibold text-ink-900">{result.trustScore}/100 ({result.trustStatus})</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pt-1 border-t border-cloud-100">
              <Link href="/evidence" className="btn-primary !py-1.5 !px-3 text-xs flex items-center gap-1">
                View in Evidence Catalog <ArrowRight className="h-3 w-3" />
              </Link>
              <Link href="/review" className="btn-outline !py-1.5 !px-3 text-xs">
                Review Queue
              </Link>
              <button
                type="button"
                onClick={resetForm}
                className="btn-ghost !py-1.5 !px-3 text-xs ml-auto"
              >
                Capture Another
              </button>
            </div>
          </div>
        )}

        {/* Submit Button */}
        {!result && (
          <button
            disabled={!file || !sha256 || uploading}
            onClick={handleUpload}
            className="btn-primary w-full py-3"
          >
            {uploading ? (
              <RefreshCw className="h-5 w-5 animate-spin" aria-hidden />
            ) : (
              <UploadCloud className="h-5 w-5" aria-hidden />
            )}
            {uploading ? "Authenticating with Pramaan..." : "Submit proof"}
          </button>
        )}
      </div>
    </div>
  );
}
