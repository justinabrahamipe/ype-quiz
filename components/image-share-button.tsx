"use client";

import { useEffect, useState } from "react";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import IosShareRoundedIcon from "@mui/icons-material/IosShareRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import { toast } from "@/components/toaster";

type Props = {
  imageUrl: string;
  fileName: string;
  title: string;
  text: string;
  variant?: "icon" | "button";
  label?: string;
};

export function ImageShareButton({
  imageUrl,
  fileName,
  title,
  text,
  variant = "button",
  label = "Share",
}: Props) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const fetchImage = async (): Promise<Blob> => {
    const res = await fetch(`${imageUrl}?t=${Date.now()}`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Failed (${res.status})`);
    return res.blob();
  };

  const handleClick = async () => {
    setLoading(true);
    try {
      const b = await fetchImage();
      const file = new File([b], fileName, { type: b.type || "image/png" });

      if (
        typeof navigator !== "undefined" &&
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [file] })
      ) {
        try {
          await navigator.share({ files: [file], title, text });
          setLoading(false);
          return;
        } catch (err) {
          if ((err as DOMException)?.name === "AbortError") {
            setLoading(false);
            return;
          }
        }
      }

      setBlob(b);
      const url = URL.createObjectURL(b);
      setPreviewUrl(url);
      setOpen(true);
    } catch {
      toast("Could not generate image", "error");
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = () => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast("Image saved", "success");
  };

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast("Caption copied", "success");
    } catch {
      toast("Could not copy", "error");
    }
  };

  const handleClose = () => {
    setOpen(false);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setBlob(null);
  };

  return (
    <>
      {variant === "icon" ? (
        <IconButton
          onClick={handleClick}
          size="small"
          aria-label={label}
          disabled={loading}
          sx={{ color: "primary.main" }}
        >
          {loading ? (
            <CircularProgress size={18} color="inherit" />
          ) : (
            <IosShareRoundedIcon />
          )}
        </IconButton>
      ) : (
        <Button
          onClick={handleClick}
          startIcon={
            loading ? (
              <CircularProgress size={14} color="inherit" />
            ) : (
              <IosShareRoundedIcon />
            )
          }
          size="small"
          variant="outlined"
          disabled={loading}
        >
          {loading ? "Preparing…" : label}
        </Button>
      )}

      <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IosShareRoundedIcon color="primary" />
          Share image
        </DialogTitle>
        <DialogContent>
          {previewUrl && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                mb: 2,
                bgcolor: "action.hover",
                borderRadius: 2,
                p: 1,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Preview"
                style={{
                  maxWidth: "100%",
                  maxHeight: "55vh",
                  borderRadius: 8,
                }}
              />
            </Box>
          )}
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", whiteSpace: "pre-line" }}
          >
            {text}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1, flexWrap: "wrap" }}>
          <Button onClick={copyText} startIcon={<ContentCopyRoundedIcon />}>
            Copy caption
          </Button>
          <Button
            onClick={downloadImage}
            startIcon={<DownloadRoundedIcon />}
            variant="contained"
          >
            Save image
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
