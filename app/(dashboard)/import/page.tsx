"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { CldUploadWidget } from "next-cloudinary";
import { UploadCloud, CheckCircle, Radio, FolderUp, Camera, ArrowRight, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { DEMO_UPLOAD_FOLDER } from "@/lib/demo-site";

export default function ImportPage() {
  const [uploaded, setUploaded] = useState<string[]>([]);
  const [cloudinaryConfigured, setCloudinaryConfigured] = useState<boolean | null>(null);
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/sign-upload")
      .then((res) => res.json())
      .then((data) => setCloudinaryConfigured(Boolean(data?.configured)))
      .catch(() => setCloudinaryConfigured(false));
  }, []);

  const handleDirectFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const files = Array.from(e.target.files);
    setImporting(true);
    setImportStatus(`Ingesting ${files.length} file(s) into database...`);

    const newIds: string[] = [];
    for (const file of files) {
      try {
        const buffer = await file.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
        const hashHex = Array.from(new Uint8Array(hashBuffer))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");

        const formData = new FormData();
        formData.append("file", file);
        formData.append("client_sha256", hashHex);
        formData.append("activity", "check_dam_construction");
        formData.append("phase", "during");

        const res = await fetch("/api/evidence/capture", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (data?.ok && data?.evidenceId) {
          newIds.push(data.evidenceId);
        }
      } catch (err) {
        console.error("Direct file ingest failed:", err);
      }
    }

    setUploaded((prev) => [...prev, ...newIds]);
    setImportStatus(`Successfully ingested ${newIds.length} of ${files.length} items into evidence ledger.`);
    setImporting(false);
  };

  return (
    <div className="mx-auto max-w-2xl pb-8">
      <PageHeader stage="Bring in · Import" title="Bulk ingest">
        Upload partner evidence bundles. Every file passes through the same intake preset as the field app.
      </PageHeader>

      <div className="space-y-6">
        {/* Cloudinary Mode Notice */}
        {cloudinaryConfigured === false && (
          <div className="rounded-md border border-sky-200 bg-sky-50 p-3.5 text-xs text-sky-800 space-y-1">
            <div className="flex items-center gap-1.5 font-medium">
              <Radio className="h-3.5 w-3.5 text-sky-600 animate-pulse" />
              Direct Database Ingest (Local Prototype Mode)
            </div>
            <p className="text-sky-700">
              Cloudinary widget credentials not configured. Use the direct batch intake below, or use the dedicated{" "}
              <Link href="/capture" className="font-semibold underline hover:text-sky-900">
                Capture page
              </Link>{" "}
              for hardware geotagged evidence.
            </p>
          </div>
        )}

        <div className="surface-1 flex flex-col items-center justify-center !border-dashed !border-border-strong p-10 text-center">
          <UploadCloud className="mb-3 h-12 w-12 text-sky-600" aria-hidden />
          <h2 className="mb-1 font-display text-xl">
            {cloudinaryConfigured ? "Upload via the authenticated widget" : "Direct batch file intake"}
          </h2>
          <p className="mb-5 text-xs text-ink-600">
            {cloudinaryConfigured
              ? "Google Drive, Dropbox, URL and local files"
              : "Select local images to ingest directly into Supabase and hash-chain to ledger"}
          </p>

          {cloudinaryConfigured ? (
            <CldUploadWidget
              signatureEndpoint="/api/sign-upload"
              uploadPreset="pramaan_evidence"
              options={{
                sources: ["local", "url", "camera", "google_drive", "dropbox"],
                multiple: true,
                folder: DEMO_UPLOAD_FOLDER,
              }}
              onSuccess={(result) => {
                const info = result?.info;
                if (info && typeof info === "object" && "public_id" in info) {
                  setUploaded((prev) => [...prev, (info as any).public_id]);
                }
              }}
            >
              {({ open }) => (
                <button onClick={() => open()} className="btn-primary">
                  Open upload widget
                </button>
              )}
            </CldUploadWidget>
          ) : (
            <div className="space-y-3">
              <label className="btn-primary cursor-pointer inline-flex items-center gap-2">
                {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderUp className="h-4 w-4" />}
                {importing ? "Ingesting..." : "Select images to ingest"}
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  disabled={importing}
                  className="sr-only"
                  onChange={handleDirectFiles}
                />
              </label>
              <div className="pt-2">
                <Link href="/capture" className="text-xs text-sky-600 underline hover:text-sky-700 inline-flex items-center gap-1">
                  <Camera className="h-3 w-3" /> Go to live capture page <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {importStatus && (
          <p className="text-xs text-center text-ink-700 rounded-sm bg-sky-50 border border-sky-200 py-2">
            {importStatus}
          </p>
        )}

        {uploaded.length > 0 && (
          <div className="space-y-2" aria-live="polite">
            <h3 className="overline">Recently ingested</h3>
            <ul className="surface-1 divide-y divide-cloud-100 px-4">
              {uploaded.map((id) => (
                <li key={id} className="flex items-center justify-between gap-3 py-3 text-xs">
                  <span className="mono-id min-w-0 truncate">{id}</span>
                  <span className="badge badge-verified shrink-0">
                    <CheckCircle className="h-3.5 w-3.5" aria-hidden /> Ingested
                  </span>
                </li>
              ))}
            </ul>
            <div className="pt-2">
              <Link href="/evidence" className="btn-outline text-xs inline-flex items-center gap-1">
                View in Evidence Catalog <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
