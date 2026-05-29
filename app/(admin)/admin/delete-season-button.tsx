"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { toast } from "@/components/toaster";

type Props = {
  season: number;
  quizCount: number;
  isCurrent?: boolean;
  previousSeason?: number;
};

export function DeleteSeasonButton({ season, quizCount, isCurrent, previousSeason }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleConfirm = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/seasons/${season}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        const suffix = isCurrent ? ` — Season ${previousSeason} is now active` : "";
        toast(`Season ${season} deleted${suffix}`, "success");
        setOpen(false);
        router.refresh();
      } else {
        toast(data.error || "Failed to delete season", "error");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        title={`Delete Season ${season}`}
      >
        <DeleteOutlineRoundedIcon sx={{ fontSize: 14 }} />
        Delete
      </button>

      <Dialog open={open} onClose={() => !busy && setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ color: "error.main" }}>Delete Season {season}?</DialogTitle>
        <DialogContent>
          <DialogContentText component="div">
            {quizCount > 0 ? (
              <>
                This will permanently delete all{" "}
                <strong>{quizCount} {quizCount === 1 ? "quiz" : "quizzes"}</strong> and every
                submission from Season {season}.{" "}
                <strong>This cannot be undone.</strong>
              </>
            ) : (
              <>Season {season} has no quizzes. It will be removed.</>
            )}
            {isCurrent && (
              <Box component="div" sx={{ mt: 1.5, p: 1.5, borderRadius: 1, bgcolor: "warning.light", color: "warning.dark" }}>
                Season {previousSeason} will become the active season.
              </Box>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setOpen(false)} disabled={busy}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirm}
            disabled={busy}
            startIcon={<DeleteOutlineRoundedIcon />}
          >
            {busy ? "Deleting…" : `Delete Season ${season}`}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
