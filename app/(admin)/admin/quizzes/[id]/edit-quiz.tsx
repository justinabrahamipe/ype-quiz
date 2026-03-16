"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/toaster";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Collapse from "@mui/material/Collapse";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";

type Question = {
  id: string;
  questionText: string;
  answerType: string;
  acceptedAnswers: string[];
  orderIndex: number;
};

type Props = {
  quizId: string;
  initialTitle: string;
  initialBiblePortion: string;
  questions: Question[];
};

export function EditQuiz({ quizId, initialTitle, initialBiblePortion, questions: initialQuestions }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [biblePortion, setBiblePortion] = useState(initialBiblePortion);
  const [questions, setQuestions] = useState(initialQuestions.map((q) => ({
    ...q,
    acceptedAnswers: [...q.acceptedAnswers],
  })));

  const updateQuestion = (idx: number, field: string, value: string) => {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };

  const updateAnswer = (qIdx: number, aIdx: number, value: string) => {
    setQuestions((prev) => {
      const copy = [...prev];
      const answers = [...copy[qIdx].acceptedAnswers];
      answers[aIdx] = value;
      copy[qIdx] = { ...copy[qIdx], acceptedAnswers: answers };
      return copy;
    });
  };

  const addAnswer = (qIdx: number) => {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[qIdx] = { ...copy[qIdx], acceptedAnswers: [...copy[qIdx].acceptedAnswers, ""] };
      return copy;
    });
  };

  const removeAnswer = (qIdx: number, aIdx: number) => {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[qIdx] = {
        ...copy[qIdx],
        acceptedAnswers: copy[qIdx].acceptedAnswers.filter((_, i) => i !== aIdx),
      };
      return copy;
    });
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast("Title is required", "error");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/quiz/${quizId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          biblePortion: biblePortion.trim(),
          questions: questions.map((q) => ({
            id: q.id,
            questionText: q.questionText,
            answerType: q.answerType,
            acceptedAnswers: q.acceptedAnswers.filter((a) => a.trim()),
          })),
        }),
      });

      if (res.ok) {
        toast("Quiz updated!", "success");
        setEditing(false);
        router.refresh();
      } else {
        const data = await res.json();
        toast(data.error || "Failed to save", "error");
      }
    } catch {
      toast("Failed to save", "error");
    }
    setSaving(false);
  };

  const handleCancel = () => {
    setEditing(false);
    setTitle(initialTitle);
    setBiblePortion(initialBiblePortion);
    setQuestions(initialQuestions.map((q) => ({ ...q, acceptedAnswers: [...q.acceptedAnswers] })));
  };

  if (!editing) {
    return (
      <Button
        variant="outlined"
        startIcon={<EditRoundedIcon />}
        onClick={() => setEditing(true)}
        size="small"
      >
        Edit Quiz
      </Button>
    );
  }

  return (
    <Card elevation={0} sx={{ border: "2px solid", borderColor: "primary.main" }}>
      <CardContent sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="subtitle1" fontWeight={600}>Edit Quiz</Typography>
          <IconButton size="small" onClick={handleCancel}>
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </Box>

        <TextField
          label="Quiz Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          size="small"
          fullWidth
        />
        <TextField
          label="Bible Portion"
          value={biblePortion}
          onChange={(e) => setBiblePortion(e.target.value)}
          size="small"
          fullWidth
        />

        <Typography variant="overline" color="text.secondary">Questions</Typography>

        {questions.map((q, qIdx) => (
          <Card key={q.id} variant="outlined" sx={{ p: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Q{qIdx + 1}
              </Typography>
              <Chip
                label={q.answerType}
                size="small"
                variant="outlined"
                sx={{ height: 20, fontSize: "0.6rem" }}
                onClick={() => updateQuestion(qIdx, "answerType", q.answerType === "text" ? "number" : "text")}
              />
            </Box>

            <TextField
              value={q.questionText}
              onChange={(e) => updateQuestion(qIdx, "questionText", e.target.value)}
              size="small"
              fullWidth
              multiline
              rows={2}
              placeholder="Question text"
              sx={{ mb: 1.5 }}
            />

            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
              Accepted Answers
            </Typography>
            {q.acceptedAnswers.map((ans, aIdx) => (
              <Box key={aIdx} sx={{ display: "flex", gap: 1, mb: 0.5 }}>
                <TextField
                  value={ans}
                  onChange={(e) => updateAnswer(qIdx, aIdx, e.target.value)}
                  size="small"
                  fullWidth
                  placeholder={`Answer ${aIdx + 1}`}
                />
                {q.acceptedAnswers.length > 1 && (
                  <IconButton size="small" onClick={() => removeAnswer(qIdx, aIdx)} sx={{ color: "error.main" }}>
                    <DeleteRoundedIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                )}
              </Box>
            ))}
            <Button
              size="small"
              startIcon={<AddRoundedIcon sx={{ fontSize: 14 }} />}
              onClick={() => addAnswer(qIdx)}
              sx={{ mt: 0.5, fontSize: "0.7rem" }}
            >
              Add answer
            </Button>
          </Card>
        ))}

        <Box sx={{ display: "flex", gap: 1.5 }}>
          <Button
            variant="contained"
            startIcon={<SaveRoundedIcon />}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
          <Button variant="outlined" onClick={handleCancel}>
            Cancel
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
