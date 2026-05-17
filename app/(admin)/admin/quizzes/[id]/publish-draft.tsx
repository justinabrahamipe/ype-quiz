"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/toaster";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import RocketLaunchRoundedIcon from "@mui/icons-material/RocketLaunchRounded";

export function PublishDraft({ quizId }: { quizId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const handlePublish = async () => {
    setBusy(true);
    const res = await fetch(`/api/admin/quiz/${quizId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDraft: false }),
    });
    if (res.ok) {
      toast("Quiz published", "success");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      toast(data.error || "Failed to publish", "error");
    }
    setBusy(false);
  };

  return (
    <Box
      sx={{
        p: 2.5,
        borderRadius: 2,
        border: "1px dashed",
        borderColor: "warning.main",
        background: "rgba(245,158,11,0.06)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
        flexWrap: "wrap",
      }}
    >
      <Box>
        <Typography variant="subtitle2" fontWeight={700}>
          This quiz is a draft
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Only admins and quizmasters can see it. Publish when you&apos;ve
          finished adding questions.
        </Typography>
      </Box>
      <Button
        variant="contained"
        color="warning"
        startIcon={<RocketLaunchRoundedIcon />}
        onClick={handlePublish}
        disabled={busy}
      >
        {busy ? "Publishing..." : "Publish quiz"}
      </Button>
    </Box>
  );
}
