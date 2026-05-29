"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import AutorenewRoundedIcon from "@mui/icons-material/AutorenewRounded";
import { toast } from "@/components/toaster";

export function NewSeasonButton({ currentSeason }: { currentSeason: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const nextSeason = currentSeason + 1;

  const handleConfirm = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentSeason: nextSeason }),
      });
      if (res.ok) {
        toast(`Season ${nextSeason} started`, "success");
        setOpen(false);
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        toast(data.error || "Failed to start new season", "error");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn-secondary inline-flex items-center gap-2"
      >
        <AutorenewRoundedIcon sx={{ fontSize: 16 }} />
        Start Season {nextSeason}
      </button>

      <Dialog open={open} onClose={() => !busy && setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Start Season {nextSeason}?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            All new quizzes will be assigned to Season {nextSeason}. The Season{" "}
            {currentSeason} leaderboard and scores are preserved — members can still view
            them. Nothing is deleted.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setOpen(false)} disabled={busy}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirm}
            disabled={busy}
            startIcon={<AutorenewRoundedIcon />}
          >
            {busy ? "Starting…" : `Start Season ${nextSeason}`}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
