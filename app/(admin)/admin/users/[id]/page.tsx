"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { toast } from "@/components/toaster";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Divider from "@mui/material/Divider";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import SwapHorizRoundedIcon from "@mui/icons-material/SwapHorizRounded";
import Link from "next/link";

type Answer = {
  id: string;
  submittedText: string | null;
  isCorrect: boolean | null;
  question: {
    questionText: string;
    acceptedAnswers: string[];
    answerType: string;
    orderIndex: number;
  };
};

type Attempt = {
  id: string;
  rawScore: string | null;
  bonusPoints: string;
  completedAt: string | null;
  quiz: { title: string; questionCount: number; isPrerequisite: boolean };
  answers: Answer[];
};

type UserDetail = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string;
  isQualified: boolean;
  overallScore: { totalScore: string } | null;
  attempts: Attempt[];
};

export default function UserDetailPage() {
  const { id: userId } = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = () => {
    fetch(`/api/admin/users/${userId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          toast(data.error, "error");
          router.push("/admin/users");
        } else {
          setUser(data);
        }
        setLoading(false);
      })
      .catch(() => { setLoading(false); router.push("/admin/users"); });
  };

  useEffect(() => { fetchUser(); }, [userId]);

  const toggleAnswer = async (answerId: string) => {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggle_answer", answerId }),
    });
    if (res.ok) {
      toast("Answer updated!", "success");
      fetchUser();
    } else {
      toast("Failed to update", "error");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <Box sx={{ maxWidth: 900, mx: "auto", p: 3, textAlign: "center" }}>
          <Typography color="text.secondary">Loading...</Typography>
        </Box>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Box sx={{ maxWidth: 900, mx: "auto", px: { xs: 1.5, sm: 3 }, py: 3 }}>
        {/* Back + User Header */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
          <IconButton component={Link} href="/admin/users" size="small">
            <ArrowBackRoundedIcon />
          </IconButton>
          <Avatar
            src={user.image || undefined}
            sx={{ width: 48, height: 48, background: !user.image ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : undefined }}
          >
            {!user.image && (user.name || "?")[0].toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" fontWeight={700}>{user.name || "—"}</Typography>
            <Typography variant="body2" color="text.secondary">{user.email}</Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 0.5 }}>
            <Chip label={user.role} size="small" color={user.role === "admin" ? "primary" : user.role === "quizmaster" ? "secondary" : "default"} />
            <Chip
              label={user.isQualified ? "Qualified" : "Not Qualified"}
              size="small"
              color={user.isQualified ? "success" : "warning"}
              variant="outlined"
            />
            <Chip
              label={`${user.overallScore ? Number(user.overallScore.totalScore) : 0} pts`}
              size="small"
              variant="outlined"
            />
          </Box>
        </Box>

        {/* Quiz Attempts */}
        {user.attempts.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <Typography color="text.secondary">No quiz attempts</Typography>
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {user.attempts.map((attempt) => {
              const score = Number(attempt.rawScore ?? 0);
              const bonus = Number(attempt.bonusPoints ?? 0);
              return (
                <Card key={attempt.id} elevation={0}>
                  <CardContent sx={{ pb: 1 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {attempt.quiz.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {attempt.completedAt && new Date(attempt.completedAt).toLocaleString()}
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", gap: 0.5 }}>
                        <Chip label={`${score}/${attempt.quiz.questionCount}`} size="small" color="primary" />
                        {bonus > 0 && <Chip label={`+${bonus} bonus`} size="small" color="success" variant="outlined" />}
                        {attempt.quiz.isPrerequisite && <Chip label="Prerequisite" size="small" color="warning" variant="outlined" />}
                      </Box>
                    </Box>
                  </CardContent>

                  {/* Answers */}
                  {attempt.answers.map((ans, i) => (
                    <Box key={ans.id}>
                      <Divider />
                      <Box sx={{ px: 2.5, py: 1.5, display: "flex", alignItems: "center", gap: 1.5, "&:hover": { bgcolor: "action.hover" } }}>
                        <Typography variant="caption" color="text.secondary" sx={{ width: 24, textAlign: "center", fontWeight: 600 }}>
                          {i + 1}
                        </Typography>

                        {ans.isCorrect === true ? (
                          <CheckCircleRoundedIcon sx={{ fontSize: 20, color: "success.main" }} />
                        ) : ans.isCorrect === false ? (
                          <CancelRoundedIcon sx={{ fontSize: 20, color: "error.main" }} />
                        ) : (
                          <Box sx={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid", borderColor: "text.disabled" }} />
                        )}

                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" noWrap>{ans.question.questionText}</Typography>
                          <Box sx={{ display: "flex", gap: 2, mt: 0.25 }}>
                            <Typography variant="caption" color={ans.isCorrect ? "success.main" : ans.isCorrect === false ? "error.main" : "text.secondary"}>
                              Answer: {ans.submittedText || "(empty)"}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Correct: {ans.question.acceptedAnswers.join(", ")}
                            </Typography>
                          </Box>
                        </Box>

                        <Tooltip title={ans.isCorrect ? "Mark as wrong" : "Mark as correct"}>
                          <IconButton
                            size="small"
                            onClick={() => toggleAnswer(ans.id)}
                            sx={{ color: "primary.main" }}
                          >
                            <SwapHorizRoundedIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  ))}
                </Card>
              );
            })}
          </Box>
        )}
      </Box>
    </div>
  );
}
