"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/toaster";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";

export function DeleteQuiz({ quizId, quizTitle }: { quizId: string; quizTitle: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    const res = await fetch(`/api/admin/quiz/${quizId}`, { method: "DELETE" });
    if (res.ok) {
      toast("Quiz deleted", "success");
      router.push("/admin");
    } else {
      const data = await res.json();
      toast(data.error || "Failed to delete", "error");
    }
    setDeleting(false);
  };

  return (
    <>
      <Button
        variant="outlined"
        color="error"
        startIcon={<DeleteRoundedIcon />}
        onClick={() => { setOpen(true); setConfirmText(""); }}
        fullWidth
      >
        Delete Quiz
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ color: "error.main" }}>Delete Quiz</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            This will permanently delete <strong>{quizTitle}</strong> and all its questions, attempts, answers, and disputes. This cannot be undone.
          </Typography>
          <Typography variant="body2" sx={{ mb: 1.5 }}>
            Type <strong>DELETE</strong> to confirm:
          </Typography>
          <TextField
            autoFocus
            fullWidth
            size="small"
            placeholder="Type DELETE"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            disabled={confirmText !== "DELETE" || deleting}
            onClick={handleDelete}
          >
            {deleting ? "Deleting..." : "Delete Quiz"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
