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
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import MailOutlineRoundedIcon from "@mui/icons-material/MailOutlineRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import FileDownloadRoundedIcon from "@mui/icons-material/FileDownloadRounded";

type Scope = "approved" | "qualified" | "all";

export function ExportEmailsButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scope, setScope] = useState<Scope>("approved");
  const [emails, setEmails] = useState<string[]>([]);

  const fetchEmails = async (s: Scope) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/emails?scope=${s}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast(data.error || "Failed to load emails", "error");
        setEmails([]);
        return;
      }
      const data: { emails: string[] } = await res.json();
      setEmails(data.emails);
    } catch {
      toast("Failed to load emails", "error");
      setEmails([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = async () => {
    setOpen(true);
    await fetchEmails(scope);
  };

  const handleScopeChange = async (
    _e: React.MouseEvent<HTMLElement>,
    next: Scope | null
  ) => {
    if (!next || next === scope) return;
    setScope(next);
    await fetchEmails(next);
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
    a.download = `ype-quiz-emails-${scope}-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="px-5 py-2.5 rounded-xl text-sm font-medium border border-[var(--card-border)] bg-[var(--card)] hover:bg-[var(--surface)] transition-colors inline-flex items-center gap-2"
      >
        <MailOutlineRoundedIcon sx={{ fontSize: 18 }} />
        Export emails
      </button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <MailOutlineRoundedIcon /> Export member emails
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Paste these into the BCC field of your email client. Recipients
            will not see each other&apos;s addresses.
          </Typography>

          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
              Audience
            </Typography>
            <ToggleButtonGroup
              size="small"
              exclusive
              value={scope}
              onChange={handleScopeChange}
              disabled={loading}
              fullWidth
            >
              <ToggleButton value="qualified">Qualified</ToggleButton>
              <ToggleButton value="approved">Approved</ToggleButton>
              <ToggleButton value="all">All members</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", mb: 1 }}>
            <Typography variant="body2" fontWeight={600}>
              {loading ? "Loading..." : `${emails.length} email${emails.length === 1 ? "" : "s"}`}
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
            placeholder={loading ? "Loading..." : "No members match this filter"}
          />
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
