"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Header } from "@/components/header";
import { toast } from "@/components/toaster";

type DisputeItem = {
  id: string;
  comment: string;
  status: string;
  adminNote: string | null;
  user: { name: string | null; email: string };
  answer: {
    submittedText: string | null;
    question: {
      questionText: string;
      acceptedAnswers: string[];
    };
  };
};

export default function DisputesPage() {
  const { id: quizId } = useParams<{ id: string }>();
  const [disputes, setDisputes] = useState<DisputeItem[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const fetchDisputes = () => {
    setLoading(true);
    fetch(`/api/admin/quiz/${quizId}/disputes`)
      .then((r) => r.json())
      .then((data) => {
        setDisputes(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchDisputes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId]);

  const handleResolve = async (
    disputeId: string,
    status: "approved" | "rejected",
    adminNote: string
  ) => {
    const res = await fetch(`/api/admin/disputes/${disputeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, admin_note: adminNote }),
    });

    if (res.ok) {
      toast(`Dispute ${status}`, "success");
      fetchDisputes();
    } else {
      toast("Failed to update", "error");
    }
  };

  const filtered = disputes.filter(
    (d) => filter === "all" || d.status === filter
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-2xl font-bold">Disputes</h1>

        <div className="flex gap-2">
          {["all", "pending", "approved", "rejected"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize ${
                filter === f
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 dark:bg-slate-800"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-32 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            No disputes found.
          </p>
        ) : (
          <div className="space-y-4">
            {filtered.map((d) => (
              <DisputeCard
                key={d.id}
                dispute={d}
                onResolve={handleResolve}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function DisputeCard({
  dispute,
  onResolve,
}: {
  dispute: DisputeItem;
  onResolve: (id: string, status: "approved" | "rejected", note: string) => void;
}) {
  const [note, setNote] = useState("");

  return (
    <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-medium">{dispute.user.name || dispute.user.email}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {dispute.user.email}
          </p>
        </div>
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
            dispute.status === "pending"
              ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
              : dispute.status === "approved"
              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
              : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
          }`}
        >
          {dispute.status}
        </span>
      </div>

      <div className="text-sm space-y-1">
        <p>
          <strong>Question:</strong> {dispute.answer.question.questionText}
        </p>
        <p>
          <strong>Submitted:</strong> {dispute.answer.submittedText || "(empty)"}
        </p>
        <p className="text-green-600 dark:text-green-400">
          <strong>Correct answers:</strong>{" "}
          {dispute.answer.question.acceptedAnswers.join(", ")}
        </p>
        <p>
          <strong>Comment:</strong> {dispute.comment}
        </p>
        {dispute.adminNote && (
          <p>
            <strong>Admin note:</strong> {dispute.adminNote}
          </p>
        )}
      </div>

      {dispute.status === "pending" && (
        <div className="space-y-2">
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Admin note (optional)"
            className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:border-blue-500 focus:outline-none"
          />
          <div className="flex gap-2">
            <button
              onClick={() => onResolve(dispute.id, "approved", note)}
              className="flex-1 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700"
            >
              Approve
            </button>
            <button
              onClick={() => onResolve(dispute.id, "rejected", note)}
              className="flex-1 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700"
            >
              Reject
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
