"use client";

import React, { useState } from "react";
import { CldUploadWidget } from "next-cloudinary";
import { UploadCloud, CheckCircle } from "lucide-react";

export default function ImportPage() {
  const [uploaded, setUploaded] = useState<string[]>([]);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="space-y-2">
        <span className="chip-cyan">Desk import</span>
        <h1 className="text-4xl font-light tracking-tight">Bulk ingest</h1>
        <p className="text-soft">Upload partner evidence bundles. Every file passes through the same intake preset as the field app.</p>
      </div>

      <div className="panel flex flex-col items-center justify-center border-dashed p-10 text-center">
        <UploadCloud className="mb-3 h-12 w-12 text-link" aria-hidden />
        <h2 className="mb-1 text-xl font-normal">Upload via the authenticated widget</h2>
        <p className="mb-5 text-xs text-muted">Google Drive, Dropbox, URL and local files</p>

        <CldUploadWidget
          signatureEndpoint="/api/sign-upload"
          uploadPreset="pramaan_evidence"
          options={{
            sources: ["local", "url", "camera", "google_drive", "dropbox"],
            multiple: true,
            folder: "pramaan/green-aravalli/GA-17",
          }}
          onSuccess={(result) => {
            const info = result?.info;
            if (info && typeof info === "object" && "public_id" in info) {
              setUploaded((prev) => [...prev, info.public_id]);
            }
          }}
        >
          {({ open }) => (
            <button onClick={() => open()} className="btn-lime">
              Open upload widget
            </button>
          )}
        </CldUploadWidget>
      </div>

      {uploaded.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Recently ingested</h3>
          <div className="panel-flat divide-y divide-white/10 px-4">
            {uploaded.map((id) => (
              <div key={id} className="flex items-center justify-between py-3 text-xs">
                <span className="font-mono">{id}</span>
                <span className="flex items-center gap-1 font-medium text-good">
                  <CheckCircle className="h-3.5 w-3.5" aria-hidden /> Ingested
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
