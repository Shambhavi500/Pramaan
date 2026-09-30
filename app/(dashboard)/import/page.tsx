"use client";

import React, { useState } from "react";
import { CldUploadWidget } from "next-cloudinary";
import { UploadCloud, CheckCircle } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { DEMO_UPLOAD_FOLDER } from "@/lib/demo-site";

export default function ImportPage() {
  const [uploaded, setUploaded] = useState<string[]>([]);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader stage="Bring in · Import" title="Bulk ingest">
        Upload partner evidence bundles. Every file passes through the same intake preset as the field app.
      </PageHeader>

      <div className="space-y-6">
        <div className="surface-1 flex flex-col items-center justify-center !border-dashed !border-border-strong p-10 text-center">
          <UploadCloud className="mb-3 h-12 w-12 text-sky-600" aria-hidden />
          <h2 className="mb-1 font-display text-xl">Upload via the authenticated widget</h2>
          <p className="mb-5 text-xs text-ink-600">Google Drive, Dropbox, URL and local files</p>

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
                setUploaded((prev) => [...prev, info.public_id]);
              }
            }}
          >
            {({ open }) => (
              <button onClick={() => open()} className="btn-primary">
                Open upload widget
              </button>
            )}
          </CldUploadWidget>
        </div>

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
          </div>
        )}
      </div>
    </div>
  );
}
