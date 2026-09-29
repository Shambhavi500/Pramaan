"use client";

import React, { useState } from "react";
import { CldUploadWidget } from "next-cloudinary";
import { UploadCloud, CheckCircle } from "lucide-react";

export default function ImportPage() {
  const [uploaded, setUploaded] = useState<string[]>([]);

  return (
    <div className="max-w-2xl mx-auto p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bulk Ingest & Desk Import</h1>
        <p className="text-sm text-muted-foreground">Upload partner evidence bundles with preset verification rules</p>
      </div>

      <div className="p-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center bg-neutral-50 text-center">
        <UploadCloud className="h-12 w-12 text-emerald-600 mb-3" />
        <h3 className="font-semibold text-base mb-1">Upload via Authenticated Widget</h3>
        <p className="text-xs text-muted-foreground mb-4">Supports Google Drive, Dropbox, Box, and local files</p>

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
            <button
              onClick={() => open()}
              className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-sm hover:bg-emerald-700"
            >
              Open Cloudinary Ingest Widget
            </button>
          )}
        </CldUploadWidget>
      </div>

      {uploaded.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase text-muted-foreground">Recently Ingested Assets</h4>
          <div className="divide-y border rounded-xl bg-white p-3">
            {uploaded.map((id) => (
              <div key={id} className="py-2 flex items-center justify-between text-xs">
                <span className="font-mono">{id}</span>
                <span className="flex items-center gap-1 text-emerald-600 font-medium">
                  <CheckCircle className="h-3.5 w-3.5" /> Ingested
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
