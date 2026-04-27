"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/toaster";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Tooltip from "@mui/material/Tooltip";
import Divider from "@mui/material/Divider";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";

type Question = {
  id: string;
  questionText: string;
  answerType: string;
  acceptedAnswers: string[];
  choices: string[];
  orderIndex: number;
  maxAnswerLength: number | null;
};

export function QuizQuestions({ quizId, questions: initial }: { quizId: string; questions: Question[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editType, setEditType] = useState("mcq");
  const [editAnswers, setEditAnswers] = useState<string[]>([]);
  const [editChoices, setEditChoices] = useState<string[]>([]);
  const [editCorrectIdx, setEditCorrectIdx] = useState<number>(0);
  const [editMaxLen, setEditMaxLen] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Add question
  const [addOpen, setAddOpen] = useState(false);
  const [newText, setNewText] = useState("");
  const [newType, setNewType] = useState("mcq");
  const [newAnswers, setNewAnswers] = useState([""])
  const [newChoices, setNewChoices] = useState<string[]>(["", "", "", "", "", "", "", ""]);
  const [newCorrectIdx, setNewCorrectIdx] = useState<number>(0);
  const [newMaxLen, setNewMaxLen] = useState<string>("40");

  const startEdit = (q: Question) => {
    setEditingId(q.id);
    setEditText(q.questionText);
    setEditType(q.answerType);
    setEditAnswers([...q.acceptedAnswers]);
    const choices = q.choices?.length ? [...q.choices] : ["", "", "", "", "", "", "", ""];
    setEditChoices(choices);
    const correctIdx = Math.max(0, choices.findIndex((c) => q.acceptedAnswers.includes(c)));
    setEditCorrectIdx(correctIdx);
    setEditMaxLen(q.maxAnswerLength != null ? String(q.maxAnswerLength) : "");
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async () => {
    if (!editingId || !editText.trim()) return;
    let payload: Record<string, unknown>;
    if (editType === "mcq") {
      const choices = editChoices.map((c) => c.trim()).filter((c) => c);
      if (choices.length < 2) {
        toast("MCQ needs at least 2 choices", "error");
        return;
      }
      const correct = editChoices[editCorrectIdx]?.trim();
      if (!correct) {
        toast("Pick a correct choice", "error");
        return;
      }
      payload = {
        id: editingId,
        questionText: editText.trim(),
        answerType: editType,
        acceptedAnswers: [correct],
        choices,
        maxAnswerLength: null,
      };
    } else {
      payload = {
        id: editingId,
        questionText: editText.trim(),
        answerType: editType,
        acceptedAnswers: editAnswers.filter((a) => a.trim()),
        choices: [],
        maxAnswerLength: editMaxLen.trim() === "" ? null : Number(editMaxLen),
      };
    }
    setSaving(true);
    const res = await fetch(`/api/admin/quiz/${quizId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questions: [payload] }),
    });
    if (res.ok) {
      toast("Question updated", "success");
      setEditingId(null);
      router.refresh();
    } else {
      toast("Failed to save", "error");
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setSaving(true);
    const res = await fetch(`/api/admin/quiz/${quizId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deleteQuestionId: deleteId }),
    });
    if (res.ok) {
      toast("Question deleted", "success");
      setDeleteId(null);
      router.refresh();
    } else {
      toast("Failed to delete", "error");
    }
    setSaving(false);
  };

  const handleAdd = async () => {
    if (!newText.trim()) {
      toast("Question text required", "error");
      return;
    }
    let addQuestion: Record<string, unknown>;
    if (newType === "mcq") {
      const choices = newChoices.map((c) => c.trim()).filter((c) => c);
      if (choices.length < 2) {
        toast("MCQ needs at least 2 choices", "error");
        return;
      }
      const correct = newChoices[newCorrectIdx]?.trim();
      if (!correct) {
        toast("Pick a correct choice", "error");
        return;
      }
      addQuestion = {
        questionText: newText.trim(),
        answerType: newType,
        acceptedAnswers: [correct],
        choices,
        maxAnswerLength: null,
      };
    } else {
      const validAnswers = newAnswers.filter((a) => a.trim());
      if (validAnswers.length === 0) {
        toast("At least one answer required", "error");
        return;
      }
      addQuestion = {
        questionText: newText.trim(),
        answerType: newType,
        acceptedAnswers: validAnswers,
        choices: [],
        maxAnswerLength: newMaxLen.trim() === "" ? null : Number(newMaxLen),
      };
    }
    setSaving(true);
    const res = await fetch(`/api/admin/quiz/${quizId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ addQuestion }),
    });
    if (res.ok) {
      toast("Question added", "success");
      setAddOpen(false);
      setNewText("");
      setNewType("mcq");
      setNewAnswers([""]);
      setNewChoices(["", "", "", "", "", "", "", ""]);
      setNewCorrectIdx(0);
      setNewMaxLen("40");
      router.refresh();
    } else {
      toast("Failed to add", "error");
    }
    setSaving(false);
  };

  return (
    <Accordion defaultExpanded disableGutters elevation={0} sx={{ border: "1px solid", borderColor: "divider", "&:before": { display: "none" } }}>
      <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", pr: 1 }}>
          <Typography variant="h6" fontWeight={600}>Questions ({initial.length})</Typography>
          <Button
            size="small"
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={(e) => {
              e.stopPropagation();
              setAddOpen(true);
            }}
          >
            Add Question
          </Button>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 0 }}>
        {initial.map((q, i) => (
          <Box key={q.id}>
            {i > 0 && <Divider />}
            {editingId === q.id ? (
              /* Editing mode */
              <Box sx={{ p: 2.5, display: "flex", flexDirection: "column", gap: 1.5, bgcolor: "action.hover" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                  <Typography variant="caption" fontWeight={600} color="text.secondary">Q{i + 1}</Typography>
                  {(["mcq", "text", "number"] as const).map((t) => (
                    <Chip
                      key={t}
                      label={t === "mcq" ? "MCQ" : t}
                      size="small"
                      variant={editType === t ? "filled" : "outlined"}
                      color={editType === t ? "primary" : "default"}
                      onClick={() => setEditType(t)}
                      sx={{ height: 20, fontSize: "0.6rem", cursor: "pointer" }}
                    />
                  ))}
                  {editType !== "mcq" && (
                    <TextField
                      label="Max length"
                      type="number"
                      value={editMaxLen}
                      onChange={(e) => setEditMaxLen(e.target.value)}
                      size="small"
                      inputProps={{ min: 1 }}
                      sx={{ width: 110 }}
                    />
                  )}
                </Box>
                <TextField
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  size="small"
                  fullWidth
                  multiline
                  rows={2}
                />
                {editType === "mcq" ? (
                  <>
                    <Typography variant="caption" color="text.secondary">Choices (pick the correct one)</Typography>
                    {editChoices.map((choice, cIdx) => (
                      <Box key={cIdx} sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
                        <input
                          type="radio"
                          checked={editCorrectIdx === cIdx}
                          onChange={() => setEditCorrectIdx(cIdx)}
                          style={{ width: 16, height: 16 }}
                        />
                        <TextField
                          value={choice}
                          onChange={(e) => {
                            const copy = [...editChoices];
                            copy[cIdx] = e.target.value;
                            setEditChoices(copy);
                          }}
                          size="small"
                          fullWidth
                          placeholder={`Choice ${cIdx + 1}`}
                        />
                        {editChoices.length > 2 && (
                          <IconButton size="small" onClick={() => {
                            const filtered = editChoices.filter((_, j) => j !== cIdx);
                            setEditChoices(filtered);
                            if (cIdx === editCorrectIdx) setEditCorrectIdx(0);
                            else if (cIdx < editCorrectIdx) setEditCorrectIdx(editCorrectIdx - 1);
                          }} sx={{ color: "error.main" }}>
                            <DeleteRoundedIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        )}
                      </Box>
                    ))}
                    <Button size="small" startIcon={<AddRoundedIcon sx={{ fontSize: 14 }} />} onClick={() => setEditChoices([...editChoices, ""])} sx={{ alignSelf: "flex-start", fontSize: "0.7rem" }}>
                      Add choice
                    </Button>
                  </>
                ) : (
                  <>
                    <Typography variant="caption" color="text.secondary">Accepted Answers</Typography>
                    {editAnswers.map((ans, aIdx) => (
                      <Box key={aIdx} sx={{ display: "flex", gap: 0.5 }}>
                        <TextField
                          value={ans}
                          onChange={(e) => {
                            const copy = [...editAnswers];
                            copy[aIdx] = e.target.value;
                            setEditAnswers(copy);
                          }}
                          size="small"
                          fullWidth
                          placeholder={`Answer ${aIdx + 1}`}
                        />
                        {editAnswers.length > 1 && (
                          <IconButton size="small" onClick={() => setEditAnswers(editAnswers.filter((_, j) => j !== aIdx))} sx={{ color: "error.main" }}>
                            <DeleteRoundedIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        )}
                      </Box>
                    ))}
                    <Button size="small" startIcon={<AddRoundedIcon sx={{ fontSize: 14 }} />} onClick={() => setEditAnswers([...editAnswers, ""])} sx={{ alignSelf: "flex-start", fontSize: "0.7rem" }}>
                      Add answer
                    </Button>
                  </>
                )}
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button size="small" variant="contained" startIcon={<SaveRoundedIcon sx={{ fontSize: 16 }} />} onClick={saveEdit} disabled={saving}>
                    {saving ? "Saving..." : "Save"}
                  </Button>
                  <Button size="small" onClick={cancelEdit}>Cancel</Button>
                </Box>
              </Box>
            ) : (
              /* View mode */
              <Box sx={{ px: 2.5, py: 2, display: "flex", alignItems: "flex-start", gap: 1.5, "&:hover": { bgcolor: "action.hover" } }}>
                <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ width: 28, pt: 0.5 }}>
                  Q{i + 1}
                </Typography>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={500}>{q.questionText}</Typography>
                  <Box sx={{ display: "flex", gap: 0.5, mt: 0.5, flexWrap: "wrap", alignItems: "center" }}>
                    <Chip label={q.answerType} size="small" variant="outlined" sx={{ height: 18, fontSize: "0.6rem" }} />
                    {q.acceptedAnswers.map((a, j) => (
                      <Chip key={j} icon={<CheckCircleRoundedIcon sx={{ fontSize: 12 }} />} label={a} size="small" color="success" variant="outlined" sx={{ height: 20, fontSize: "0.65rem" }} />
                    ))}
                  </Box>
                </Box>
                <Box sx={{ display: "flex", gap: 0.25 }}>
                  <Tooltip title="Edit">
                    <IconButton size="small" onClick={() => startEdit(q)}>
                      <EditRoundedIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton size="small" onClick={() => setDeleteId(q.id)} sx={{ color: "error.main" }}>
                      <DeleteRoundedIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            )}
          </Box>
        ))}
      </AccordionDetails>

      {/* Add Question Dialog */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Question</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "16px !important" }}>
          <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
            {(["mcq", "text", "number"] as const).map((t) => (
              <Chip
                key={t}
                label={t === "mcq" ? "MCQ" : t}
                variant={newType === t ? "filled" : "outlined"}
                color="primary"
                onClick={() => setNewType(t)}
              />
            ))}
            {newType !== "mcq" && (
              <TextField
                label="Max length"
                type="number"
                value={newMaxLen}
                onChange={(e) => setNewMaxLen(e.target.value)}
                size="small"
                inputProps={{ min: 1 }}
                sx={{ width: 130, ml: "auto" }}
              />
            )}
          </Box>
          <TextField
            label="Question Text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            multiline
            rows={2}
            fullWidth
          />
          {newType === "mcq" ? (
            <>
              <Typography variant="caption" color="text.secondary">Choices (pick the correct one)</Typography>
              {newChoices.map((choice, cIdx) => (
                <Box key={cIdx} sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
                  <input
                    type="radio"
                    checked={newCorrectIdx === cIdx}
                    onChange={() => setNewCorrectIdx(cIdx)}
                    style={{ width: 16, height: 16 }}
                  />
                  <TextField
                    value={choice}
                    onChange={(e) => {
                      const copy = [...newChoices];
                      copy[cIdx] = e.target.value;
                      setNewChoices(copy);
                    }}
                    size="small"
                    fullWidth
                    placeholder={`Choice ${cIdx + 1}`}
                  />
                  {newChoices.length > 2 && (
                    <IconButton size="small" onClick={() => {
                      const filtered = newChoices.filter((_, j) => j !== cIdx);
                      setNewChoices(filtered);
                      if (cIdx === newCorrectIdx) setNewCorrectIdx(0);
                      else if (cIdx < newCorrectIdx) setNewCorrectIdx(newCorrectIdx - 1);
                    }} sx={{ color: "error.main" }}>
                      <DeleteRoundedIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  )}
                </Box>
              ))}
              <Button size="small" startIcon={<AddRoundedIcon />} onClick={() => setNewChoices([...newChoices, ""])} sx={{ alignSelf: "flex-start" }}>
                Add choice
              </Button>
            </>
          ) : (
            <>
              <Typography variant="caption" color="text.secondary">Accepted Answers</Typography>
              {newAnswers.map((ans, aIdx) => (
                <Box key={aIdx} sx={{ display: "flex", gap: 0.5 }}>
                  <TextField
                    value={ans}
                    onChange={(e) => {
                      const copy = [...newAnswers];
                      copy[aIdx] = e.target.value;
                      setNewAnswers(copy);
                    }}
                    size="small"
                    fullWidth
                    placeholder={`Answer ${aIdx + 1}`}
                  />
                  {newAnswers.length > 1 && (
                    <IconButton size="small" onClick={() => setNewAnswers(newAnswers.filter((_, j) => j !== aIdx))} sx={{ color: "error.main" }}>
                      <DeleteRoundedIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  )}
                </Box>
              ))}
              <Button size="small" startIcon={<AddRoundedIcon />} onClick={() => setNewAnswers([...newAnswers, ""])} sx={{ alignSelf: "flex-start" }}>
                Add answer
              </Button>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAdd} disabled={saving}>
            {saving ? "Adding..." : "Add Question"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Question Dialog */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ color: "error.main" }}>Delete Question</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Are you sure you want to delete this question? Any existing answers for this question will also be removed.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={saving}>
            {saving ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Accordion>
  );
}
