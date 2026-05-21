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
import NotificationsActiveRoundedIcon from "@mui/icons-material/NotificationsActiveRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import FileDownloadRoundedIcon from "@mui/icons-material/FileDownloadRounded";

type Member = { name: string | null; email: string };

export function RemindNonAttendees({
  quizId,
  quizTitle,
}: {
  quizId: string;
  quizTitle: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/quiz/${quizId}/non-attendees`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast(data.error || "Failed to load list", "error");
        setMembers([]);
        return;
      }
      const data: { members: Member[] } = await res.json();
      setMembers(data.members);
    } catch {
      toast("Failed to load list", "error");
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = async () => {
    setOpen(true);
    await fetchList();
  };

  const emails = members.map((m) => m.email);
  const joined = emails.join(", ");

  const handleCopy = async () => {
    if (!joined) return;
    try {
      await navigator.clipboard.writeText(joined);
      toast(
        `Copied ${emails.length} email${emails.length === 1 ? "" : "s"}`,
        "success"
      );
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
    a.download = `ype-quiz-pending-${safeTitle}-${new Date()
      .toISOString()
      .slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="px-5 py-2.5 rounded-xl text-sm font-medium border border-[var(--card-border)] bg-[var(--card)] hover:bg-[var(--surface)] transition-colors inline-flex items-center gap-2"
      >
        <NotificationsActiveRoundedIcon sx={{ fontSize: 18 }} />
        Remind pending members
      </button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <NotificationsActiveRoundedIcon /> Pending members
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Qualified members who have not attempted{" "}
            <strong>{quizTitle}</strong> yet. Paste these into the BCC field of
            your email client to send a reminder.
          </Typography>

          <Box
            sx={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              mb: 1,
            }}
          >
            <Typography variant="body2" fontWeight={600}>
              {loading
                ? "Loading..."
                : `${members.length} pending member${
                    members.length === 1 ? "" : "s"
                  }`}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Comma-separated
            </Typography>
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
            placeholder={
              loading
                ? "Loading..."
                : "All qualified members have attempted this quiz"
            }
          />

          {!loading && members.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mb: 0.5 }}
              >
                Names
              </Typography>
              <Box
                sx={{
                  maxHeight: 180,
                  overflowY: "auto",
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1,
                  px: 1.5,
                  py: 1,
                  fontSize: "0.85rem",
                  fontFamily: "monospace",
                }}
              >
                {members.map((m) => (
                  <div key={m.email}>
                    {m.name || "(no name)"} — {m.email}
                  </div>
                ))}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1, flexWrap: "wrap" }}>
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
