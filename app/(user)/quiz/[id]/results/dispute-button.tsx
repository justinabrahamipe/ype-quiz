"use client";

import { useState } from "react";
import { toast } from "@/components/toaster";

export function DisputeButton({ answerId }: { answerId: string }) {
  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer_id: answerId, comment }),
      });
      if (res.ok) {
        setSubmitted(true);
        setOpen(false);
        toast("Your dispute has been submitted. The admin will review it.", "success");
      } else {
        const data = await res.json();
        toast(data.error || "Failed to submit", "error");
      }
    } catch {
      toast("Failed to submit dispute", "error");
    }
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <p className="text-xs mt-2 text-blue-600 dark:text-blue-400">
        Dispute submitted
      </p>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
      >
        Dispute this answer
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-semibold">Dispute Answer</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Explain why you think your answer should be accepted.
            </p>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:border-blue-500 focus:outline-none text-sm"
              placeholder="Your explanation..."
            />
            <div className="flex gap-3">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !comment.trim()}
                className="flex-1 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit Dispute"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
