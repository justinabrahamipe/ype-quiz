"use client";

import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import LinearProgress from "@mui/material/LinearProgress";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import QuizRoundedIcon from "@mui/icons-material/QuizRounded";
import { EditName } from "@/components/edit-name";
import Link from "next/link";
import CardActionArea from "@mui/material/CardActionArea";

type Props = {
  name: string;
  email: string;
  image: string | null;
  isQualified: boolean;
  joinedAt: string;
  totalScore: number;
  quizzesAttempted: number;
  quizzesMissed: number;
  rank: number;
  totalMembers: number;
  recentAttempts: {
    id: string;
    quizId: string;
    quizTitle: string;
    isPrerequisite: boolean;
    score: number | null;
    completedAt: string;
  }[];
};

export function YouContent(props: Props) {
  const {
    name, email, image, isQualified, joinedAt,
    totalScore, quizzesAttempted, quizzesMissed,
    rank, totalMembers, recentAttempts,
  } = props;

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", px: { xs: 1.5, sm: 3 }, py: 3, pb: 12, display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Profile Card */}
      <Card elevation={0} sx={{ bgcolor: "background.paper" }}>
        <CardContent sx={{ display: "flex", alignItems: "center", gap: 2, py: 3 }}>
          <Avatar
            src={image || undefined}
            sx={{
              width: 64,
              height: 64,
              fontSize: "1.5rem",
              bgcolor: !image ? "primary.main" : undefined,
              border: "3px solid",
              borderColor: "primary.main",
            }}
          >
            {!image && (name || "?")[0].toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <EditName currentName={name} />
            <Typography variant="body2" color="text.secondary" noWrap>{email}</Typography>
            <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
              <Chip
                label={isQualified ? "Qualified" : "Not Qualified"}
                color={isQualified ? "success" : "warning"}
                size="small"
                icon={isQualified ? <CheckCircleRoundedIcon /> : <CancelRoundedIcon />}
              />
              {joinedAt && (
                <Typography variant="caption" color="text.secondary" sx={{ display: "flex", alignItems: "center" }}>
                  Joined {new Date(joinedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                </Typography>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
        <Card elevation={0}>
          <CardContent sx={{ textAlign: "center" }}>
            <EmojiEventsRoundedIcon sx={{ color: "#f59e0b", fontSize: 28, mb: 0.5 }} />
            <Typography variant="h4" fontWeight={700} sx={{ color: "primary.main" }}>
              {rank > 0 ? `#${rank}` : "—"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Rank {totalMembers > 0 ? `of ${totalMembers}` : ""}
            </Typography>
          </CardContent>
        </Card>
        <Card elevation={0}>
          <CardContent sx={{ textAlign: "center" }}>
            <TrendingUpRoundedIcon sx={{ color: "primary.main", fontSize: 28, mb: 0.5 }} />
            <Typography variant="h4" fontWeight={700} sx={{ color: "primary.main" }}>
              {totalScore}
            </Typography>
            <Typography variant="caption" color="text.secondary">Total Points</Typography>
          </CardContent>
        </Card>
        <Card elevation={0}>
          <CardContent sx={{ textAlign: "center" }}>
            <CheckCircleRoundedIcon sx={{ color: "success.main", fontSize: 28, mb: 0.5 }} />
            <Typography variant="h4" fontWeight={700}>
              {quizzesAttempted}
            </Typography>
            <Typography variant="caption" color="text.secondary">Quizzes Taken</Typography>
          </CardContent>
        </Card>
        <Card elevation={0}>
          <CardContent sx={{ textAlign: "center" }}>
            <CancelRoundedIcon sx={{ color: "error.main", fontSize: 28, mb: 0.5 }} />
            <Typography variant="h4" fontWeight={700}>
              {quizzesMissed}
            </Typography>
            <Typography variant="caption" color="text.secondary">Quizzes Missed</Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Progress Bar */}
      {totalMembers > 0 && rank > 0 && (
        <Card elevation={0}>
          <CardContent>
            <Typography variant="overline" color="text.secondary">Your Standing</Typography>
            <Box sx={{ mt: 1 }}>
              <LinearProgress
                variant="determinate"
                value={Math.max(5, ((totalMembers - rank + 1) / totalMembers) * 100)}
                sx={{
                  height: 12,
                  borderRadius: 6,
                  bgcolor: "action.hover",
                  "& .MuiLinearProgress-bar": {
                    bgcolor: "primary.main",
                    borderRadius: 6,
                  },
                }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                You are ahead of {Math.round(((totalMembers - rank) / totalMembers) * 100)}% of members
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Recent Attempts */}
      {recentAttempts.length > 0 && (
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
            <QuizRoundedIcon sx={{ fontSize: 18, color: "text.secondary" }} />
            <Typography variant="overline" color="text.secondary">Recent Quizzes</Typography>
          </Box>
          <Card elevation={0}>
            {recentAttempts.map((attempt, i) => (
              <Box key={attempt.id}>
                {i > 0 && <Divider />}
                <CardActionArea
                  component={Link}
                  href={`/quiz/${attempt.quizId}/submitted`}
                >
                  <Box sx={{ px: 2.5, py: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {attempt.quizTitle}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {attempt.completedAt && new Date(attempt.completedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </Typography>
                    </Box>
                    <Chip
                      label={attempt.score !== null ? `${attempt.score} pts` : "Pending"}
                      size="small"
                      color={attempt.score === null ? "default" : attempt.isPrerequisite ? "warning" : "primary"}
                      variant="outlined"
                    />
                  </Box>
                </CardActionArea>
              </Box>
            ))}
          </Card>
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
