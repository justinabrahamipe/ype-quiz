"use client";

import { useState } from "react";
import Link from "next/link";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActionArea from "@mui/material/CardActionArea";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Avatar from "@mui/material/Avatar";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import AutoStoriesRoundedIcon from "@mui/icons-material/AutoStoriesRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import PeopleRoundedIcon from "@mui/icons-material/PeopleRounded";
import QuizRoundedIcon from "@mui/icons-material/QuizRounded";
import CalendarTodayRoundedIcon from "@mui/icons-material/CalendarTodayRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import { Countdown } from "@/components/countdown";
import { EditName } from "@/components/edit-name";
import { ShareButton } from "@/components/share-button";

type QuizCard = {
  id: string;
  title: string;
  biblePortion: string;
  questionCount: number;
};

type Props = {
  isApproved?: boolean;
  isQualified: boolean;
  isStaff?: boolean;
  userName: string;
  quizzesAttempted: number;
  quizzesSkipped: number;
  quizzesCurrent: number;
  prerequisiteQuiz: QuizCard | null;
  prereqAttempted?: boolean;
  activeQuizzes: (QuizCard & { endTime: string; participants: number; attempted?: boolean })[];
  upcomingQuizzes: (QuizCard & { startTime: string })[];
  attemptedQuizzes: (QuizCard & {
    endTime: string;
    participants: number;
    userScore: number | null;
  })[];
  skippedQuizzes: (QuizCard & {
    endTime: string;
    participants: number;
  })[];
};

export function QuizzesDashboard(props: Props) {
  const {
    isApproved = true, isQualified, isStaff = false, userName,
    quizzesAttempted, quizzesSkipped, quizzesCurrent,
    prerequisiteQuiz, prereqAttempted, activeQuizzes, upcomingQuizzes,
    attemptedQuizzes, skippedQuizzes,
  } = props;
  const [attemptedOpen, setAttemptedOpen] = useState(true);
  const [skippedOpen, setSkippedOpen] = useState(false);

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", px: { xs: 1.5, sm: 3 }, py: 3, pb: 12, display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Pending approval banner */}
      {!isApproved && (
        <Card
          elevation={0}
          sx={{
            border: "1px solid",
            borderColor: "warning.main",
            bgcolor: (theme) =>
              theme.palette.mode === "dark"
                ? "rgba(251,191,36,0.08)"
                : "rgba(217,119,6,0.08)",
          }}
        >
          <CardContent sx={{ py: 2 }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ color: "warning.main" }}>
              Awaiting admin approval
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
              You can take the qualifying quiz now. Once an admin approves your
              account, regular weekly quizzes will unlock.
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* User Stats */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <EditName currentName={userName} />
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: { xs: 1, sm: 2 } }}>
          <Card elevation={0} sx={{ bgcolor: "background.paper" }}>
            <CardContent>
              <Typography variant="overline" color="text.secondary" sx={{ fontSize: "0.65rem" }}>Attempted</Typography>
              <Typography variant="h4" sx={{ color: "success.main", mt: 0.5 }}>
                {quizzesAttempted}
              </Typography>
            </CardContent>
          </Card>
          <Card elevation={0} sx={{ bgcolor: "background.paper" }}>
            <CardContent>
              <Typography variant="overline" color="text.secondary" sx={{ fontSize: "0.65rem" }}>Skipped</Typography>
              <Typography variant="h4" sx={{ color: quizzesSkipped > 0 ? "error.main" : "text.secondary", mt: 0.5 }}>
                {quizzesSkipped}
              </Typography>
            </CardContent>
          </Card>
          <Card elevation={0} sx={{ bgcolor: "background.paper" }}>
            <CardContent>
              <Typography variant="overline" color="text.secondary" sx={{ fontSize: "0.65rem" }}>Current</Typography>
              <Typography variant="h4" sx={{ color: quizzesCurrent > 0 ? "primary.main" : "text.secondary", mt: 0.5 }}>
                {quizzesCurrent}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Prerequisite Quiz */}
      {!isQualified && prerequisiteQuiz && (
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
            <ShieldRoundedIcon sx={{ fontSize: 18, color: "warning.main" }} />
            <Typography variant="overline" color="text.secondary">Qualification Required</Typography>
          </Box>
          <Card elevation={0} sx={{ position: "relative", border: "1px solid", borderColor: "warning.main", boxShadow: "0 0 0 1px rgba(245,158,11,0.2), 0 4px 20px rgba(245,158,11,0.08)" }}>
            <CardActionArea component={Link} href={`/quiz/${prerequisiteQuiz.id}`}>
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2, pr: 4 }}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600}>{prerequisiteQuiz.title}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Score at least 70% to unlock all quizzes
                    </Typography>
                  </Box>
                  <Chip
                    label={prereqAttempted === true ? "Retry" : prereqAttempted === false ? "Continue" : "Take Quiz"}
                    color="warning"
                    size="small"
                  />
                </Box>
                <Box sx={{ display: "flex", gap: 2, mt: 1.5 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <QuizRoundedIcon sx={{ fontSize: 14 }} /> {prerequisiteQuiz.questionCount} questions
                  </Typography>
                  <Typography variant="caption" color="text.secondary">70% to pass</Typography>
                </Box>
              </CardContent>
            </CardActionArea>
            <Box sx={{ position: "absolute", top: 6, right: 6, zIndex: 1 }}>
              <ShareButton
                variant="icon"
                title={`${prerequisiteQuiz.title} · YPE Bible Quiz`}
                text={`Take the ${prerequisiteQuiz.title} quiz (${prerequisiteQuiz.biblePortion}, ${prerequisiteQuiz.questionCount} questions) on the YPE Bible Quiz.`}
                url={`${typeof window !== "undefined" ? window.location.origin : ""}/q/${prerequisiteQuiz.id}`}
                label="Share quiz"
              />
            </Box>
          </Card>
        </Box>
      )}

      {/* Active Quizzes */}
      {activeQuizzes.length > 0 && (
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "success.main", animation: "pulse 2s infinite" }} />
            <Typography variant="overline" color="text.secondary">Current</Typography>
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {activeQuizzes.map((quiz) => {
              const canAccess = isApproved && isQualified;
              const href = canAccess
                ? quiz.attempted === true
                  ? `/quiz/${quiz.id}/submitted`
                  : `/quiz/${quiz.id}`
                : "#";
              const lockLabel = !isApproved ? "Pending" : !isQualified ? "Locked" : null;
              return (
                <Card key={quiz.id} elevation={0} sx={{ position: "relative", border: "1px solid", borderColor: "success.main", opacity: canAccess ? 1 : 0.6, boxShadow: "0 0 0 1px rgba(16,185,129,0.2), 0 4px 16px rgba(16,185,129,0.08)" }}>
                  <CardActionArea
                    component={Link}
                    href={href}
                    disabled={!canAccess}
                    onClick={!canAccess ? (e: React.MouseEvent) => e.preventDefault() : undefined}
                  >
                    <CardContent>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2, pr: 4 }}>
                        <Box>
                          <Typography variant="subtitle1" fontWeight={600}>{quiz.title}</Typography>
                          <Typography variant="body2" color="text.secondary">{quiz.biblePortion}</Typography>
                        </Box>
                        <Chip
                          size="small"
                          icon={lockLabel ? <LockRoundedIcon /> : undefined}
                          label={lockLabel ?? (quiz.attempted === true ? "Completed" : quiz.attempted === false ? "Continue" : "Start")}
                          color={lockLabel ? "default" : quiz.attempted === true ? "success" : quiz.attempted === false ? "warning" : "success"}
                          variant={quiz.attempted === true || lockLabel ? "outlined" : "filled"}
                        />
                      </Box>
                      <Box sx={{ display: "flex", gap: 2, mt: 1.5, flexWrap: "wrap" }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <QuizRoundedIcon sx={{ fontSize: 14 }} /> {quiz.questionCount} questions
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <PeopleRoundedIcon sx={{ fontSize: 14 }} /> {quiz.participants}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <AccessTimeRoundedIcon sx={{ fontSize: 14 }} /> <Countdown endTime={quiz.endTime} />
                        </Typography>
                      </Box>
                    </CardContent>
                  </CardActionArea>
                  <Box sx={{ position: "absolute", top: 6, right: 6, zIndex: 1 }}>
                    <ShareButton
                      variant="icon"
                      title={`${quiz.title} · YPE Bible Quiz`}
                      text={`${quiz.title} — ${quiz.biblePortion} · ${quiz.questionCount} questions. Open now on the YPE Bible Quiz.`}
                      url={`${typeof window !== "undefined" ? window.location.origin : ""}/q/${quiz.id}`}
                      label="Share quiz"
                    />
                  </Box>
                </Card>
              );
            })}
          </Box>
        </Box>
      )}

      {/* Upcoming */}
      {upcomingQuizzes.length > 0 && (
        <Box>
          <Typography variant="overline" color="text.secondary" sx={{ mb: 1.5, display: "block" }}>Upcoming</Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {upcomingQuizzes.map((quiz) => {
              const cardInner = (
                <CardContent>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2, pr: 4 }}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={600}>{quiz.title}</Typography>
                      <Typography variant="body2" color="text.secondary">{quiz.biblePortion}</Typography>
                    </Box>
                    <Chip
                      size="small"
                      label={isStaff ? "Preview" : "Inactive"}
                      variant="outlined"
                      color={isStaff ? "primary" : "default"}
                    />
                  </Box>
                  <Box sx={{ display: "flex", gap: 2, mt: 1.5 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <QuizRoundedIcon sx={{ fontSize: 14 }} /> {quiz.questionCount} questions
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <CalendarTodayRoundedIcon sx={{ fontSize: 14 }} /> Starts {new Date(quiz.startTime).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                    </Typography>
                  </Box>
                </CardContent>
              );
              return (
                <Card
                  key={quiz.id}
                  elevation={0}
                  sx={{
                    position: "relative",
                    cursor: isStaff ? "pointer" : "default",
                    opacity: isStaff ? 1 : 0.75,
                    border: "1px solid",
                    borderColor: "divider",
                    transition: "border-color 0.2s",
                    ...(isStaff ? { "&:hover": { borderColor: "primary.main" } } : {}),
                  }}
                >
                  {isStaff ? (
                    <CardActionArea component={Link} href={`/quiz/${quiz.id}`} sx={{ display: "block" }}>
                      {cardInner}
                    </CardActionArea>
                  ) : (
                    cardInner
                  )}
                  <Box sx={{ position: "absolute", top: 6, right: 6, zIndex: 1 }}>
                    <ShareButton
                      variant="icon"
                      title={`${quiz.title} · YPE Bible Quiz`}
                      text={`${quiz.title} — ${quiz.biblePortion} · opens ${new Date(quiz.startTime).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}. YPE Bible Quiz.`}
                      url={`${typeof window !== "undefined" ? window.location.origin : ""}/q/${quiz.id}`}
                      label="Share quiz"
                    />
                  </Box>
                </Card>
              );
            })}
          </Box>
        </Box>
      )}

      {/* Attempted (past completed) */}
      {attemptedQuizzes.length > 0 && (
        <Box>
          <SectionToggle
            icon={<CheckCircleRoundedIcon sx={{ fontSize: 18, color: "success.main" }} />}
            label="Attempted"
            count={attemptedQuizzes.length}
            open={attemptedOpen}
            onToggle={() => setAttemptedOpen((v) => !v)}
          />
          <Collapse in={attemptedOpen} timeout="auto" unmountOnExit>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 1.5 }}>
              {attemptedQuizzes.map((quiz) => (
                <Card
                  key={quiz.id}
                  elevation={0}
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    transition: "border-color 0.2s",
                    "&:hover": { borderColor: "primary.main" },
                  }}
                >
                  <CardActionArea
                    component={Link}
                    href={`/quiz/${quiz.id}/review`}
                    sx={{ display: "block" }}
                  >
                    <PastQuizContent
                      quiz={quiz}
                      chip={
                        <Chip
                          size="small"
                          icon={<CheckCircleRoundedIcon />}
                          label={quiz.userScore != null ? `${quiz.userScore} pts` : "Completed"}
                          color="success"
                          variant="outlined"
                        />
                      }
                    />
                  </CardActionArea>
                </Card>
              ))}
            </Box>
          </Collapse>
        </Box>
      )}

      {/* Skipped (past not attempted) */}
      {skippedQuizzes.length > 0 && (
        <Box>
          <SectionToggle
            icon={<CancelRoundedIcon sx={{ fontSize: 18, color: "error.main" }} />}
            label="Skipped"
            count={skippedQuizzes.length}
            open={skippedOpen}
            onToggle={() => setSkippedOpen((v) => !v)}
          />
          <Collapse in={skippedOpen} timeout="auto" unmountOnExit>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 1.5 }}>
              {skippedQuizzes.map((quiz) => (
                <Card
                  key={quiz.id}
                  elevation={0}
                  sx={{
                    opacity: 0.75,
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <PastQuizContent
                    quiz={quiz}
                    chip={
                      <Chip
                        size="small"
                        label="Missed"
                        color="default"
                        variant="outlined"
                      />
                    }
                  />
                </Card>
              ))}
            </Box>
          </Collapse>
        </Box>
      )}

      {/* Empty state */}
      {activeQuizzes.length === 0 &&
        upcomingQuizzes.length === 0 &&
        attemptedQuizzes.length === 0 &&
        skippedQuizzes.length === 0 &&
        !prerequisiteQuiz && (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <Avatar
              sx={{
                mx: "auto",
                mb: 2,
                width: 64,
                height: 64,
                bgcolor: "action.hover",
              }}
            >
              <AutoStoriesRoundedIcon
                sx={{ color: "primary.main", fontSize: 32 }}
              />
            </Avatar>
            <Typography variant="h6">No quizzes yet</Typography>
            <Typography variant="body2" color="text.secondary">
              Check back soon!
            </Typography>
          </Box>
        )}
    </Box>
  );
}

function SectionToggle({
  icon,
  label,
  count,
  open,
  onToggle,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <Box
      onClick={onToggle}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        cursor: "pointer",
        userSelect: "none",
        py: 0.5,
        px: 1,
        mx: -1,
        borderRadius: 1,
        "&:hover": { bgcolor: "action.hover" },
      }}
    >
      {icon}
      <Typography variant="overline" color="text.secondary">
        {label}
      </Typography>
      <Chip
        label={count}
        size="small"
        sx={{ height: 18, fontSize: "0.65rem", fontWeight: 700 }}
      />
      <Box sx={{ flexGrow: 1 }} />
      <IconButton
        size="small"
        sx={{
          transform: open ? "rotate(180deg)" : "rotate(0deg)",
          transition: "transform 0.2s",
        }}
        aria-label={open ? "Collapse" : "Expand"}
      >
        <ExpandMoreRoundedIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}

function PastQuizContent({
  quiz,
  chip,
}: {
  quiz: { title: string; biblePortion: string; questionCount: number; participants: number; endTime: string };
  chip: React.ReactNode;
}) {
  return (
    <CardContent>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="subtitle1" fontWeight={600}>
            {quiz.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {quiz.biblePortion}
          </Typography>
        </Box>
        {chip}
      </Box>
      <Box
        sx={{
          display: "flex",
          gap: 2,
          mt: 1.5,
          flexWrap: "wrap",
        }}
      >
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
        >
          <QuizRoundedIcon sx={{ fontSize: 14 }} /> {quiz.questionCount} questions
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
        >
          <PeopleRoundedIcon sx={{ fontSize: 14 }} /> {quiz.participants}
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
        >
          <CalendarTodayRoundedIcon sx={{ fontSize: 14 }} /> Closed{" "}
          {new Date(quiz.endTime).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
          })}
        </Typography>
      </Box>
    </CardContent>
  );
}
