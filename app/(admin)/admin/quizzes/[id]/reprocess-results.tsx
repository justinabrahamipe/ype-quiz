"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/toaster";
import Button from "@mui/material/Button";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";

export function ReprocessResults({ quizId }: { quizId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const handleClick = async () => {
    if (!confirm("Re-grade every submission for this quiz? Manually overridden answers are preserved.")) return;
    setBusy(true);
    const res = await fetch(`/api/admin/quiz/${quizId}/reprocess`, { method: "POST" });
    if (res.ok) {
      toast("Results re-processed", "success");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      toast(data.error || "Failed to re-process", "error");
    }
    setBusy(false);
  };

  return (
    <Button
      variant="outlined"
      startIcon={<RefreshRoundedIcon />}
      onClick={handleClick}
      disabled={busy}
      fullWidth
    >
      {busy ? "Re-processing..." : "Re-process Results"}
    </Button>
  );
}
