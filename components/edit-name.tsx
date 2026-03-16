"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/toaster";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

export function EditName({ currentName }: { currentName: string }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(currentName);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toast("Name cannot be empty", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (res.ok) {
        toast("Name updated!", "success");
        setEditing(false);
        router.refresh();
      } else {
        toast("Failed to update name", "error");
      }
    } catch {
      toast("Failed to update name", "error");
    }
    setSaving(false);
  };

  if (!editing) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Typography variant="h6" fontWeight={600}>
          Welcome, {currentName || "there"}
        </Typography>
        <IconButton onClick={() => setEditing(true)} size="small" color="primary">
          <EditRoundedIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <TextField
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name"
        size="small"
        autoFocus
        onKeyDown={(e) => e.key === "Enter" && handleSave()}
        sx={{ flex: 1 }}
      />
      <Button onClick={handleSave} disabled={saving} variant="contained" size="small">
        {saving ? "..." : "Save"}
      </Button>
      <IconButton onClick={() => { setEditing(false); setName(currentName); }} size="small">
        <CloseRoundedIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}
