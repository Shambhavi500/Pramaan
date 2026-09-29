"use client";

import React, { useEffect, useState } from "react";
import { Check, X, AlertTriangle, ShieldAlert } from "lucide-react";

// Demo queue: static sample items so the moderation UI can be shown without live uploads.
const INITIAL_QUEUE = [
  {
    id: "ev_01J9Z6Q2",
    publicId: "pramaan/green-aravalli/GA-17/check_dam_fake",
    score: 34,
    status: "flagged",
    reason: "Recapture detected: Screen bezel and LCD moiré interference observed.",
    imageUrl: "https://res.cloudinary.com/demo/image/upload/c_fill,w_600,h_400/sample.jpg",
  },
  {
    id: "ev_01J9Z8K1",
    publicId: "pramaan/green-aravalli/GA-18/recycled_photo",
    score: 31,
    status: "flagged",
    reason: "Near-duplicate: pHash Hamming distance of 2 to Project Sunrise (2024).",
    imageUrl: "https://res.cloudinary.com/demo/image/upload/c_fill,w_600,h_400/landscapes/beach-boat.jpg",
  },
];

export default function ReviewPage() {
  const [queue, setQueue] = useState(INITIAL_QUEUE);
  const [notice, setNotice] = useState("");

  const handleDecision = (decision: "verified" | "rejected") => {
    setNotice(`${queue[0].id} marked ${decision.toUpperCase()} (demo queue: not persisted).`);
    setQueue((prev) => prev.slice(1));
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key.toLowerCase() === "r") handleDecision("rejected");
      if (e.key.toLowerCase() === "v") handleDecision("verified");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue]);

  const item = queue[0];

  if (!item) {
    return (
      <div className="p-16 text-center max-w-md mx-auto">
        <h2 className="text-xl font-bold">Review Queue Cleared</h2>
        <p className="text-sm text-muted-foreground mt-1">All incoming field assets have been triaged.</p>
        {notice && <p className="text-xs text-emerald-700 mt-3">{notice}</p>}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Evidence Moderation Queue</h1>
          <p className="text-sm text-muted-foreground">{queue.length} items requiring review</p>
        </div>
        <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-bold rounded-full flex items-center gap-1">
          <ShieldAlert className="h-3.5 w-3.5" /> HARD FLAG
        </span>
      </div>

      {notice && <p className="text-xs text-emerald-700">{notice}</p>}

      <div className="border rounded-2xl overflow-hidden bg-white shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.imageUrl} alt="Review item" className="w-full h-80 object-cover" />
        <div className="p-5 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-mono text-muted-foreground">{item.id}</span>
            <span className="text-lg font-bold text-red-600">Trust: {item.score} / 100</span>
          </div>
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-900 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
            <span>{item.reason}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => handleDecision("rejected")}
          className="py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2"
        >
          <X className="h-5 w-5" /> Reject (R)
        </button>
        <button
          onClick={() => handleDecision("verified")}
          className="py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2"
        >
          <Check className="h-5 w-5" /> Override & Verify (V)
        </button>
      </div>
    </div>
  );
}
