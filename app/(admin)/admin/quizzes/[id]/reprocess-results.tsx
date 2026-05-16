"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/toaster";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Typography from "@mui/material/Typography";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Box from "@mui/material/Box";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";

export function ReprocessResults({ quizId }: { quizId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [includeOverridden, setIncludeOverridden] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleOpen = () => {
    setIncludeOverridden(false);
    setOpen(true);
  };

  const handleClose = () => {
    if (busy) return;
    setOpen(false);
  };

  const handleConfirm = async () => {
    setBusy(true);
    const res = await fetch(`/api/admin/quiz/${quizId}/reprocess`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ includeOverridden }),
    });
    if (res.ok) {
      toast(
        includeOverridden
          ? "Re-processed (including manual overrides)"
          : "Results re-processed",
        "success"
      );
      setOpen(false);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      toast(data.error || "Failed to re-process", "error");
    }
    setBusy(false);
  };

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<RefreshRoundedIcon />}
        onClick={handleOpen}
        fullWidth
      >
        Re-process Results
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <WarningAmberRoundedIcon sx={{ color: "warning.main" }} />
          Re-process results?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            This will re-grade every completed submission for this quiz and
            refresh each user&apos;s score. Submissions are evaluated in the
            language the user took the quiz in.
          </Typography>

          <Box
            sx={{
              p: 1.5,
              borderRadius: 1.5,
              bgcolor: "action.hover",
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <FormControlLabel
              control={
                <Checkbox
                  checked={includeOverridden}
                  onChange={(e) => setIncludeOverridden(e.target.checked)}
                  disabled={busy}
                />
              }
              label={
                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    Also re-grade manually overridden answers
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Any answers you flipped by hand will be reset and graded
                    automatically. Their override flag will be cleared.
                  </Typography>
                </Box>
              }
              sx={{ alignItems: "flex-start", m: 0 }}
            />
          </Box>

          {includeOverridden && (
            <Typography
              variant="caption"
              sx={{ display: "block", mt: 1.5, color: "warning.main" }}
            >
              Heads up: any manual corrections you previously made will be
              lost.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirm}
            disabled={busy}
            startIcon={<RefreshRoundedIcon />}
          >
            {busy ? "Re-processing..." : "Re-process"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
