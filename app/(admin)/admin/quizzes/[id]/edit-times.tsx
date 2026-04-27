"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/toaster";

function toLocalDateTimeString(date: string) {
  const d = new Date(date);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

export function EditTimes({
  quizId,
  startTime,
  endTime,
  secondsPerQuestion,
  isPrerequisite = false,
}: {
  quizId: string;
  startTime: string;
  endTime: string;
  secondsPerQuestion: number;
  isPrerequisite?: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [start, setStart] = useState(toLocalDateTimeString(startTime));
  const [end, setEnd] = useState(toLocalDateTimeString(endTime));
  const [seconds, setSeconds] = useState(String(secondsPerQuestion));
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!isPrerequisite && new Date(end) <= new Date(start)) {
      toast("End time must be after start time", "error");
      return;
    }
    const parsedSeconds = parseInt(seconds, 10);
    if (!Number.isFinite(parsedSeconds) || parsedSeconds <= 0) {
      toast("Seconds per question must be a positive number", "error");
      return;
    }

    setSaving(true);
    try {
      const body: Record<string, unknown> = { secondsPerQuestion: parsedSeconds };
      if (!isPrerequisite) {
        body.startTime = new Date(start).toISOString();
        body.endTime = new Date(end).toISOString();
      }
      const res = await fetch(`/api/admin/quiz/${quizId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast("Settings updated!", "success");
        setEditing(false);
        router.refresh();
      } else {
        const data = await res.json();
        toast(data.error || "Failed to update", "error");
      }
    } catch {
      toast("Failed to update", "error");
    }
    setSaving(false);
  };

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="text-xs text-[var(--accent)] hover:underline font-medium"
      >
        Edit settings
      </button>
    );
  }

  return (
    <div className="card p-5 space-y-4">
      <h3 className="text-sm font-semibold">Edit Quiz Settings</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {!isPrerequisite && (
          <>
            <div>
              <label className="block text-xs font-medium text-[var(--muted)] mb-1">
                Start Date & Time
              </label>
              <input
                type="datetime-local"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--card)] focus:border-indigo-500 focus:outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--muted)] mb-1">
                End Date & Time
              </label>
              <input
                type="datetime-local"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--card)] focus:border-indigo-500 focus:outline-none text-sm"
              />
            </div>
          </>
        )}
        <div>
          <label className="block text-xs font-medium text-[var(--muted)] mb-1">
            Seconds per Question
          </label>
          <input
            type="number"
            min={1}
            value={seconds}
            onChange={(e) => setSeconds(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--card)] focus:border-indigo-500 focus:outline-none text-sm"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary text-xs !py-2"
        >
          {saving ? "Saving..." : "Save"}
        </button>
        <button
          onClick={() => {
            setEditing(false);
            setStart(toLocalDateTimeString(startTime));
            setEnd(toLocalDateTimeString(endTime));
            setSeconds(String(secondsPerQuestion));
          }}
          className="px-4 py-2 rounded-xl text-xs font-medium border border-[var(--card-border)] hover:bg-[var(--surface)] transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
