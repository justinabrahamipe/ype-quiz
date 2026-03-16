"use client";

import Link from "next/link";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActionArea from "@mui/material/CardActionArea";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Avatar from "@mui/material/Avatar";
import LinearProgress from "@mui/material/LinearProgress";
import Tooltip from "@mui/material/Tooltip";
import Divider from "@mui/material/Divider";
import AutoStoriesRoundedIcon from "@mui/icons-material/AutoStoriesRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import PeopleRoundedIcon from "@mui/icons-material/PeopleRounded";
import QuizRoundedIcon from "@mui/icons-material/QuizRounded";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import CalendarTodayRoundedIcon from "@mui/icons-material/CalendarTodayRounded";
import { Countdown } from "@/components/countdown";
import { EditName } from "@/components/edit-name";

type QuizCard = {
  id: string;
  title: string;
  biblePortion: string;
  questionCount: number;
};

type Props = {
  isLoggedIn: boolean;
  isQualified: boolean;
  userId?: string;
  userName: string;
  userRank: number;
  userScore: number;
  prerequisiteQuiz: (QuizCard & {}) | null;
  prereqAttempted?: boolean;
  activeQuizzes: (QuizCard & { endTime: string; participants: number; attempted?: boolean })[];
  upcomingQuizzes: (QuizCard & { startTime: string })[];
  pastQuizzes: (QuizCard & { participants: number; resultsProcessed: boolean; attempted?: boolean })[];
  leaderboard: { userId: string; name: string; email: string; image: string | null; score: number }[];
};

export function HomeContent(props: Props) {
  const {
    isLoggedIn, isQualified, userId, userName, userRank, userScore,
    prerequisiteQuiz, prereqAttempted, activeQuizzes, upcomingQuizzes, pastQuizzes, leaderboard,
  } = props;

  const maxScore = leaderboard.length > 0 ? leaderboard[0].score : 1;

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", px: { xs: 1.5, sm: 3 }, py: 3, pb: 12, display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Guest Banner */}
      {!isLoggedIn && (
        <Card elevation={0}>
          <CardContent sx={{ textAlign: "center", py: 4 }}>
            <Avatar sx={{ mx: "auto", mb: 2, width: 52, height: 52, bgcolor: "primary.main" }}>
              <AutoStoriesRoundedIcon />
            </Avatar>
            <Typography variant="h6" gutterBottom>Welcome to Mahanaim Bible Quiz</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
              Test your Bible knowledge and compete with your church
            </Typography>
            <Button component={Link} href="/login" variant="contained" size="large">
              Sign in to participate
            </Button>
          </CardContent>
        </Card>
      )}

      {/* User Stats */}
      {isLoggedIn && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <EditName currentName={userName} />
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <Card elevation={0} sx={{ bgcolor: "background.paper" }}>
              <CardContent>
                <Typography variant="overline" color="text.secondary" sx={{ fontSize: "0.65rem" }}>Your Rank</Typography>
                <Typography variant="h4" sx={{ color: "primary.main", mt: 0.5 }}>
                  {userRank > 0 ? `#${userRank}` : "—"}
                </Typography>
              </CardContent>
            </Card>
            <Card elevation={0} sx={{ bgcolor: "background.paper" }}>
              <CardContent>
                <Typography variant="overline" color="text.secondary" sx={{ fontSize: "0.65rem" }}>Total Score</Typography>
                <Typography variant="h4" sx={{ color: "primary.main", mt: 0.5 }}>
                  {userScore}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Box>
      )}

      {/* Prerequisite Quiz */}
      {isLoggedIn && !isQualified && prerequisiteQuiz && (
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
            <ShieldRoundedIcon sx={{ fontSize: 18, color: "warning.main" }} />
            <Typography variant="overline" color="text.secondary">Qualification Required</Typography>
          </Box>
          <Card elevation={0} sx={{ border: "1px solid", borderColor: "warning.main", boxShadow: "0 0 0 1px rgba(245,158,11,0.2), 0 4px 20px rgba(245,158,11,0.08)" }}>
            <CardActionArea component={Link} href={`/quiz/${prerequisiteQuiz.id}`}>
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2 }}>
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
          </Card>
        </Box>
      )}

      {/* Active Quizzes */}
      {activeQuizzes.length > 0 && (
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "success.main", animation: "pulse 2s infinite" }} />
            <Typography variant="overline" color="text.secondary">Active Now</Typography>
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {activeQuizzes.map((quiz) => {
              const canAccess = isLoggedIn && isQualified;
              const href = canAccess
                ? quiz.attempted === true ? `/quiz/${quiz.id}/results` : `/quiz/${quiz.id}`
                : isLoggedIn ? "#" : "/login";
              return (
                <Card key={quiz.id} elevation={0} sx={{ border: "1px solid", borderColor: "success.main", opacity: canAccess || !isLoggedIn ? 1 : 0.6, boxShadow: "0 0 0 1px rgba(16,185,129,0.2), 0 4px 16px rgba(16,185,129,0.08)" }}>
                  <CardActionArea
                    component={Link}
                    href={href}
                    disabled={!canAccess && isLoggedIn}
                    onClick={!canAccess && isLoggedIn ? (e: React.MouseEvent) => e.preventDefault() : undefined}
                  >
                    <CardContent>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2 }}>
                        <Box>
                          <Typography variant="subtitle1" fontWeight={600}>{quiz.title}</Typography>
                          <Typography variant="body2" color="text.secondary">{quiz.biblePortion}</Typography>
                        </Box>
                        <Chip
                          size="small"
                          icon={!canAccess && isLoggedIn ? <LockRoundedIcon /> : undefined}
                          label={!isLoggedIn ? "Sign in" : !isQualified ? "Locked" : quiz.attempted === true ? "Completed" : quiz.attempted === false ? "Continue" : "Start"}
                          color={!isLoggedIn ? "primary" : !isQualified ? "default" : quiz.attempted === true ? "success" : quiz.attempted === false ? "warning" : "success"}
                          variant={quiz.attempted === true || (!isLoggedIn || !isQualified) ? "outlined" : "filled"}
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
            {upcomingQuizzes.map((quiz) => (
              <Card key={quiz.id} elevation={0}>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={600}>{quiz.title}</Typography>
                  <Typography variant="body2" color="text.secondary">{quiz.biblePortion}</Typography>
                  <Box sx={{ display: "flex", gap: 2, mt: 1.5 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <QuizRoundedIcon sx={{ fontSize: 14 }} /> {quiz.questionCount} questions
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <CalendarTodayRoundedIcon sx={{ fontSize: 14 }} /> Starts {new Date(quiz.startTime).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box>
      )}

      {/* Past Quizzes */}
      {pastQuizzes.length > 0 && (
        <Box>
          <Typography variant="overline" color="text.secondary" sx={{ mb: 1.5, display: "block" }}>Past Quizzes</Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {pastQuizzes.map((quiz) => {
              const canAccess = isLoggedIn && isQualified;
              return (
                <Card key={quiz.id} elevation={0} sx={{ opacity: canAccess ? 1 : 0.6 }}>
                  <CardActionArea
                    component={Link}
                    href={canAccess ? (quiz.resultsProcessed ? `/quiz/${quiz.id}/results` : `/quiz/${quiz.id}/submitted`) : "#"}
                    disabled={!canAccess}
                    onClick={!canAccess ? (e: React.MouseEvent) => e.preventDefault() : undefined}
                  >
                    <CardContent>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2 }}>
                        <Box>
                          <Typography variant="subtitle1" fontWeight={600}>{quiz.title}</Typography>
                          <Typography variant="body2" color="text.secondary">{quiz.biblePortion}</Typography>
                        </Box>
                        <Chip
                          size="small"
                          label={!canAccess ? "Locked" : quiz.attempted != null ? "Attempted" : "Missed"}
                          color={!canAccess ? "default" : quiz.attempted != null ? "primary" : "error"}
                          variant="outlined"
                        />
                      </Box>
                      <Box sx={{ display: "flex", gap: 2, mt: 1.5 }}>
                        <Typography variant="caption" color="text.secondary">{quiz.questionCount} questions</Typography>
                        <Typography variant="caption" color="text.secondary">{quiz.participants} participants</Typography>
                        {quiz.resultsProcessed && canAccess && (
                          <Typography variant="caption" color="primary">View results</Typography>
                        )}
                      </Box>
                    </CardContent>
                  </CardActionArea>
                </Card>
              );
            })}
          </Box>
        </Box>
      )}

      {/* Empty state */}
      {activeQuizzes.length === 0 && upcomingQuizzes.length === 0 && pastQuizzes.length === 0 && !prerequisiteQuiz && (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <Avatar sx={{ mx: "auto", mb: 2, width: 64, height: 64, bgcolor: "action.hover" }}>
            <AutoStoriesRoundedIcon sx={{ color: "primary.main", fontSize: 32 }} />
          </Avatar>
          <Typography variant="h6">No quizzes yet</Typography>
          <Typography variant="body2" color="text.secondary">Check back soon!</Typography>
        </Box>
      )}

      <Box sx={{ textAlign: "center", pt: 4 }}>
        <Typography variant="caption" color="text.secondary">
          Mahanaim Bible Quiz
        </Typography>
      </Box>
    </Box>
  );
}
