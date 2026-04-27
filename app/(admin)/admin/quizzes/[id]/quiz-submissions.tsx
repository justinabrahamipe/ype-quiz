"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/toaster";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Divider from "@mui/material/Divider";
import Collapse from "@mui/material/Collapse";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import SwapHorizRoundedIcon from "@mui/icons-material/SwapHorizRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";

type Answer = {
  id: string;
  submittedText: string | null;
  isCorrect: boolean | null;
  questionId: string;
};

type Submission = {
  attemptId: string;
  userId: string;
  userName: string;
  userEmail: string;
  userImage: string | null;
  completedAt: string;
  rawScore: number;
  answers: Answer[];
};

type Question = {
  id: string;
  questionText: string;
  acceptedAnswers: string[];
  orderIndex: number;
};

export function QuizSubmissions({
  submissions,
  questions,
  canDelete = false,
  title = "Submissions",
  defaultExpanded = true,
  emptyMessage = "None yet.",
}: {
  quizId?: string;
  submissions: Submission[];
  questions: Question[];
  canDelete?: boolean;
  title?: string;
  defaultExpanded?: boolean;
  emptyMessage?: string;
}) {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Submission | null>(null);
  const [deleting, setDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await fetch(`/api/admin/attempts/${deleteTarget.attemptId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      toast("Submission removed", "success");
      setDeleteTarget(null);
      router.refresh();
    } else {
      toast("Failed to remove", "error");
    }
    setDeleting(false);
  };

  const toggleAnswer = async (answerId: string, userId: string) => {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggle_answer", answerId }),
    });
    if (res.ok) {
      toast("Answer updated!", "success");
      router.refresh();
    } else {
      toast("Failed to update", "error");
    }
  };

  return (
    <Accordion defaultExpanded={defaultExpanded} disableGutters elevation={0} sx={{ border: "1px solid", borderColor: "divider", "&:before": { display: "none" } }}>
      <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
        <Typography variant="h6" fontWeight={600}>
          {title} ({submissions.length})
        </Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 0 }}>
        {submissions.length === 0 ? (
          <Box sx={{ px: 2.5, py: 3 }}>
            <Typography variant="body2" color="text.secondary">
              {emptyMessage}
            </Typography>
          </Box>
        ) : null}
        {submissions.map((sub, i) => {
          const isExpanded = expandedId === sub.attemptId;
          const total = sub.rawScore;
          return (
            <Box key={sub.attemptId}>
              {i > 0 && <Divider />}
              {/* Header row */}
              <Box
                sx={{
                  px: 2.5,
                  py: 1.5,
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  cursor: "pointer",
                  "&:hover": { bgcolor: "action.hover" },
                }}
                onClick={() => setExpandedId(isExpanded ? null : sub.attemptId)}
              >
                <Avatar
                  src={sub.userImage || undefined}
                  sx={{
                    width: 32,
                    height: 32,
                    fontSize: "0.8rem",
                    bgcolor: !sub.userImage ? "primary.main" : undefined,
                  }}
                >
                  {!sub.userImage && (sub.userName || "?")[0].toUpperCase()}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={600} noWrap>
                    {sub.userName || "—"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {sub.userEmail}
                  </Typography>
                </Box>
                <Chip
                  label={`${total} pts`}
                  size="small"
                  color={total > 0 ? "primary" : "default"}
                  variant="outlined"
                  sx={{ height: 22, fontSize: "0.65rem" }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ display: { xs: "none", sm: "block" } }}>
                  {sub.completedAt && new Date(sub.completedAt).toLocaleString()}
                </Typography>
                {canDelete && (
                  <Tooltip title="Remove submission (archives it; user can retry)">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(sub);
                      }}
                      sx={{ color: "error.main" }}
                    >
                      <DeleteOutlineRoundedIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                )}
                <ExpandMoreRoundedIcon
                  sx={{
                    fontSize: 20,
                    color: "text.secondary",
                    transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s",
                  }}
                />
              </Box>

              {/* Expanded answers */}
              <Collapse in={isExpanded}>
                <Box sx={{ px: 2.5, pb: 2 }}>
                  {questions.map((q, qi) => {
                    const ans = sub.answers.find((a) => a.questionId === q.id);
                    return (
                      <Box
                        key={q.id}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          py: 1,
                          borderTop: qi > 0 ? "1px solid" : "none",
                          borderColor: "divider",
                        }}
                      >
                        <Typography variant="caption" color="text.secondary" sx={{ width: 24, textAlign: "center", fontWeight: 600 }}>
                          {qi + 1}
                        </Typography>
                        {ans?.isCorrect === true ? (
                          <CheckCircleRoundedIcon sx={{ fontSize: 18, color: "success.main" }} />
                        ) : ans?.isCorrect === false ? (
                          <CancelRoundedIcon sx={{ fontSize: 18, color: "error.main" }} />
                        ) : (
                          <Box sx={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid", borderColor: "text.disabled" }} />
                        )}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="caption" noWrap>{q.questionText}</Typography>
                          <Box sx={{ display: "flex", gap: 1.5 }}>
                            <Typography
                              variant="caption"
                              color={ans?.isCorrect === true ? "success.main" : ans?.isCorrect === false ? "error.main" : "text.secondary"}
                            >
                              {ans?.submittedText || "(empty)"}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Correct: {q.acceptedAnswers.join(", ")}
                            </Typography>
                          </Box>
                        </Box>
                        {ans && (
                          <Tooltip title={ans.isCorrect ? "Mark wrong" : "Mark correct"}>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleAnswer(ans.id, sub.userId);
                              }}
                              sx={{ color: "primary.main" }}
                            >
                              <SwapHorizRoundedIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    );
                  })}
                </Box>
              </Collapse>
            </Box>
          );
        })}
      </AccordionDetails>

      <Dialog open={!!deleteTarget} onClose={() => !deleting && setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Remove submission?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            <b>{deleteTarget?.userName || deleteTarget?.userEmail}</b>&apos;s attempt
            will be archived and their overall score recalculated. The user
            won&apos;t see this attempt and can try again — at which point the
            archived record is cleared.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting}>
            Cancel
          </Button>
          <Button onClick={confirmDelete} color="error" variant="contained" disabled={deleting}>
            {deleting ? "Removing..." : "Remove"}
          </Button>
        </DialogActions>
      </Dialog>
    </Accordion>
  );
}
