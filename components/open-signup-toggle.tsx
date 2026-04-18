"use client";

import { useState } from "react";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { toast } from "@/components/toaster";

export function OpenSignupToggle({ initialOpen }: { initialOpen: boolean }) {
  const [open, setOpen] = useState(initialOpen);
  const [saving, setSaving] = useState(false);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.checked;
    setOpen(next);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ openSignup: next }),
      });
      if (!res.ok) throw new Error();
      toast(next ? "Anyone can now join" : "New signups need approval", "success");
    } catch {
      setOpen(!next);
      toast("Failed to update setting", "error");
    }
    setSaving(false);
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        p: 2,
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
      }}
    >
      <Box>
        <Typography variant="subtitle2" fontWeight={600}>
          Open signup
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", maxWidth: 360 }}>
          When on, anyone who signs in is admitted automatically. When off, new
          sign-ins land in Pending and must be approved before they can take
          regular quizzes. The qualifying quiz is always available.
        </Typography>
      </Box>
      <FormControlLabel
        control={<Switch checked={open} onChange={handleChange} disabled={saving} />}
        label={open ? "On" : "Off"}
        sx={{ ml: 2 }}
      />
    </Box>
  );
}
