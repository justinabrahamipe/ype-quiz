"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import AutoStoriesRoundedIcon from "@mui/icons-material/AutoStoriesRounded";
import { toast } from "@/components/toaster";

const QUALIFYING_QUIZ = {
  title: "Qualifying Quiz",
  biblePortion: "General Bible Knowledge",
  questionCount: 5,
  isPrerequisite: true,
  questions: [
    {
      questionText: "What is the first book of the Bible?",
      answerType: "text",
      acceptedAnswers: ["Genesis"],
    },
    {
      questionText: "Who was the first man created by God?",
      answerType: "text",
      acceptedAnswers: ["Adam"],
    },
    {
      questionText: "In which town was Jesus born?",
      answerType: "text",
      acceptedAnswers: ["Bethlehem"],
    },
    {
      questionText: "How many disciples did Jesus choose?",
      answerType: "number",
      acceptedAnswers: ["12"],
    },
    {
      questionText: "Who baptised Jesus in the river Jordan?",
      answerType: "text",
      acceptedAnswers: ["John", "John the Baptist"],
    },
  ],
};

export function QualifyingQuizButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    const now = new Date();
    const end = new Date();
    end.setFullYear(end.getFullYear() + 10);

    try {
      const res = await fetch("/api/admin/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...QUALIFYING_QUIZ,
          startDateTime: now.toISOString(),
          endDateTime: end.toISOString(),
        }),
      });

      if (res.ok) {
        toast("Qualifying quiz created", "success");
        setOpen(false);
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        toast(data.error || "Failed to create", "error");
      }
    } catch {
      toast("Failed to create", "error");
    }
    setLoading(false);
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="outlined"
        startIcon={<AutoStoriesRoundedIcon />}
        size="medium"
      >
        Create qualifying quiz
      </Button>

      <Dialog open={open} onClose={() => !loading && setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <AutoStoriesRoundedIcon sx={{ color: "primary.main" }} />
          Create qualifying quiz
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            This will publish a 5-question prerequisite quiz that stays open for
            10 years. You can edit the questions afterwards from the quiz page.
          </Typography>
          <Box
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 1,
              p: 2,
              bgcolor: "action.hover",
            }}
          >
            <Typography variant="overline" color="text.secondary" sx={{ display: "block", mb: 1 }}>
              Included questions
            </Typography>
            <Box component="ol" sx={{ m: 0, pl: 2.5, display: "flex", flexDirection: "column", gap: 0.5 }}>
              {QUALIFYING_QUIZ.questions.map((q) => (
                <Typography key={q.questionText} component="li" variant="body2">
                  {q.questionText}
                </Typography>
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={loading} variant="contained">
            {loading ? "Creating..." : "Create quiz"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
