"use client";

import { useState } from "react";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import IosShareRoundedIcon from "@mui/icons-material/IosShareRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import WhatsApp from "@mui/icons-material/WhatsApp";
import Email from "@mui/icons-material/Email";
import { toast } from "@/components/toaster";

type Props = {
  title: string;
  text: string;
  url?: string;
  variant?: "icon" | "button";
  label?: string;
};

export function ShareButton({ title, text, url, variant = "button", label = "Share" }: Props) {
  const [open, setOpen] = useState(false);

  const shareUrl =
    url ||
    (typeof window !== "undefined" ? window.location.href : "");

  const fullMessage = `${text}\n\n${shareUrl}`;

  const handleClick = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text, url: shareUrl });
        return;
      } catch {
        // fall through to dialog if user cancels
      }
    }
    setOpen(true);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullMessage);
      toast("Copied to clipboard", "success");
      setOpen(false);
    } catch {
      toast("Failed to copy", "error");
    }
  };

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(fullMessage)}`;
  const emailHref = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(fullMessage)}`;

  return (
    <>
      {variant === "icon" ? (
        <IconButton onClick={handleClick} size="small" aria-label={label}>
          <IosShareRoundedIcon />
        </IconButton>
      ) : (
        <Button onClick={handleClick} startIcon={<IosShareRoundedIcon />} size="small" variant="outlined">
          {label}
        </Button>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IosShareRoundedIcon color="primary" />
          Share
        </DialogTitle>
        <DialogContent>
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.5 }}>
            {title}
          </Typography>
          <TextField
            value={fullMessage}
            multiline
            rows={4}
            fullWidth
            size="small"
            InputProps={{ readOnly: true }}
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1 }}>
            <Button
              onClick={copyLink}
              startIcon={<ContentCopyRoundedIcon />}
              variant="outlined"
              size="small"
            >
              Copy
            </Button>
            <Button
              component="a"
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              startIcon={<WhatsApp />}
              variant="outlined"
              size="small"
              sx={{ color: "#25d366", borderColor: "#25d366" }}
            >
              WhatsApp
            </Button>
            <Button
              component="a"
              href={emailHref}
              startIcon={<Email />}
              variant="outlined"
              size="small"
            >
              Email
            </Button>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
