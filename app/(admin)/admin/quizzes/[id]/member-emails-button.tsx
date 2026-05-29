"use client";

import { useState } from "react";
import { toast } from "@/components/toaster";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import FileDownloadRoundedIcon from "@mui/icons-material/FileDownloadRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import NotificationsActiveRoundedIcon from "@mui/icons-material/NotificationsActiveRounded";

type Props = {
  quizId: string;
  quizTitle: string;
  type: "attended" | "pending";
};

export function MemberEmailsButton({ quizId, quizTitle, type }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emails, setEmails] = useState<string[]>([]);

  const isAttended = type === "attended";
  const endpoint = isAttended
    ? `/api/admin/quiz/${quizId}/attendees`
    : `/api/admin/quiz/${quizId}/non-attendees`;

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await fetch(endpoint);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast(data.error || "Failed to load list", "error");
        setEmails([]);
        return;
      }
      const data = await res.json();
      setEmails(data.emails ?? []);
    } catch {
      toast("Failed to load list", "error");
      setEmails([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = async () => {
    setOpen(true);
    await fetchList();
  };

  const joined = emails.join(", ");

  const handleCopy = async () => {
    if (!joined) return;
    try {
      await navigator.clipboard.writeText(joined);
      toast(`Copied ${emails.length} email${emails.length === 1 ? "" : "s"}`, "success");
    } catch {
      toast("Copy failed — select the text manually", "error");
    }
  };

  const handleDownload = () => {
    if (!joined) return;
    const blob = new Blob([joined], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safeTitle = quizTitle.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    a.download = `ype-quiz-${isAttended ? "attended" : "pending"}-${safeTitle}-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const label = isAttended ? "Attended emails" : "Pending emails";
  const Icon = isAttended ? CheckCircleOutlineRoundedIcon : NotificationsActiveRoundedIcon;
  const emptyMsg = isAttended
    ? "No completed submissions yet"
    : "All qualified members have attempted this quiz";

  return (
    <>
      <button
        onClick={handleOpen}
        className="px-4 py-2 rounded-xl text-sm font-medium border border-[var(--card-border)] bg-[var(--card)] hover:bg-[var(--surface)] transition-colors inline-flex items-center gap-2"
      >
        <Icon sx={{ fontSize: 16 }} />
        {label}
      </button>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Icon />
          {isAttended ? "Attended members" : "Pending members"}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {isAttended
              ? <>Members who completed <strong>{quizTitle}</strong>. Paste into BCC to reach them.</>
              : <>Qualified members who have not attempted <strong>{quizTitle}</strong> yet. Paste into BCC to send a reminder.</>}
          </Typography>

          <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", mb: 1 }}>
            <Typography variant="body2" fontWeight={600}>
              {loading ? "Loading…" : `${emails.length} email${emails.length === 1 ? "" : "s"}`}
            </Typography>
            <Typography variant="caption" color="text.secondary">Comma-separated</Typography>
          </Box>

          <TextField
            multiline
            minRows={6}
            maxRows={14}
            fullWidth
            value={joined}
            slotProps={{
              input: {
                readOnly: true,
                sx: { fontFamily: "monospace", fontSize: "0.85rem" },
              },
            }}
            placeholder={loading ? "Loading…" : emptyMsg}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={() => setOpen(false)}>Close</Button>
          <Box sx={{ flex: 1 }} />
          <Button
            onClick={handleDownload}
            disabled={loading || emails.length === 0}
            startIcon={<FileDownloadRoundedIcon />}
          >
            Download .txt
          </Button>
          <Button
            variant="contained"
            onClick={handleCopy}
            disabled={loading || emails.length === 0}
            startIcon={<ContentCopyRoundedIcon />}
          >
            Copy to clipboard
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
