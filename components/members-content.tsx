"use client";

import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import LinearProgress from "@mui/material/LinearProgress";
import Tooltip from "@mui/material/Tooltip";
import Divider from "@mui/material/Divider";
import Chip from "@mui/material/Chip";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import PeopleRoundedIcon from "@mui/icons-material/PeopleRounded";
import { ImageShareButton } from "@/components/image-share-button";

type Member = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  score: number;
  quizzesAttempted: number;
  quizzesMissed: number;
};

export function MembersContent({ members, currentUserId }: { members: Member[]; currentUserId?: string }) {
  const maxScore = members.length > 0 ? members[0].score || 1 : 1;

  const topN = members.slice(0, Math.min(5, members.length));
  const topLines = topN
    .map((m, i) => `${i + 1}. ${m.name} — ${m.score} pts`)
    .join("\n");
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (typeof window !== "undefined" ? window.location.origin : "");
  const shareText = (topN.length
    ? `Top ${topN.length} on the YPE Bible Quiz leaderboard:\n\n${topLines}`
    : "Check out the YPE Bible Quiz leaderboard.") + `\n\n${siteUrl}`;

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", px: { xs: 1.5, sm: 3 }, py: 3, pb: 12 }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Box>
          <Typography variant="h5" className="gradient-text">Leaderboard</Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
            <PeopleRoundedIcon sx={{ fontSize: 16, color: "text.secondary" }} />
            <Typography variant="body2" color="text.secondary">
              {members.length} qualified members
            </Typography>
          </Box>
        </Box>
        <ImageShareButton
          imageUrl="/api/og/leaderboard"
          fileName="ype-leaderboard.png"
          title="YPE Bible Quiz Leaderboard"
          text={shareText}
          label="Share"
        />
      </Box>

      {/* Top 3 Podium - only show if top scorer has points */}
      {members.length >= 3 && members[0].score > 0 && (
        <Card elevation={0} sx={{ mb: 3, p: 3, bgcolor: "background.paper" }}>
          <Box sx={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 2, pt: 2 }}>
            {/* 2nd */}
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", width: 90 }}>
              <Avatar src={members[1].image || undefined} sx={{ width: 48, height: 48, mb: 1, border: "3px solid #94a3b8", bgcolor: !members[1].image ? "#78716c" : undefined }}>
                {!members[1].image && members[1].name[0].toUpperCase()}
              </Avatar>
              <Typography variant="caption" fontWeight={600} noWrap sx={{ maxWidth: 80, textAlign: "center" }}>{members[1].name}</Typography>
              <Typography variant="caption" color="text.secondary">{members[1].score} pts</Typography>
              <Box sx={{ width: "100%", height: 70, mt: 1, borderRadius: "8px 8px 0 0", background: "linear-gradient(to top, #78716c, #a8a29e)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
                <Typography variant="h6" sx={{ pb: 1, color: "white", fontWeight: 800 }}>2</Typography>
              </Box>
            </Box>
            {/* 1st */}
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", width: 90 }}>
              <EmojiEventsRoundedIcon sx={{ fontSize: 24, color: "#f59e0b", mb: 0.5 }} />
              <Avatar src={members[0].image || undefined} sx={{ width: 56, height: 56, mb: 1, border: "3px solid #f59e0b", bgcolor: !members[0].image ? "#b45309" : undefined }}>
                {!members[0].image && members[0].name[0].toUpperCase()}
              </Avatar>
              <Typography variant="caption" fontWeight={700} noWrap sx={{ maxWidth: 80, textAlign: "center" }}>{members[0].name}</Typography>
              <Typography variant="caption" color="text.secondary">{members[0].score} pts</Typography>
              <Box sx={{ width: "100%", height: 100, mt: 1, borderRadius: "8px 8px 0 0", background: "linear-gradient(to top, #b45309, #d97706)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
                <Typography variant="h5" sx={{ pb: 1, color: "white", fontWeight: 800 }}>1</Typography>
              </Box>
            </Box>
            {/* 3rd */}
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", width: 90 }}>
              <Avatar src={members[2].image || undefined} sx={{ width: 48, height: 48, mb: 1, border: "3px solid #d97706", bgcolor: !members[2].image ? "#92400e" : undefined }}>
                {!members[2].image && members[2].name[0].toUpperCase()}
              </Avatar>
              <Typography variant="caption" fontWeight={600} noWrap sx={{ maxWidth: 80, textAlign: "center" }}>{members[2].name}</Typography>
              <Typography variant="caption" color="text.secondary">{members[2].score} pts</Typography>
              <Box sx={{ width: "100%", height: 50, mt: 1, borderRadius: "8px 8px 0 0", background: "linear-gradient(to top, #92400e, #b45309)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
                <Typography variant="h6" sx={{ pb: 1, color: "white", fontWeight: 800 }}>3</Typography>
              </Box>
            </Box>
          </Box>
        </Card>
      )}

      {/* Full List */}
      <Card elevation={0}>
        {members.map((member, i) => {
          const isCurrentUser = currentUserId === member.id;
          const barWidth = maxScore > 0 ? (member.score / maxScore) * 100 : 0;
          return (
            <Box key={member.id}>
              {i > 0 && <Divider />}
              <Tooltip title={member.email} placement="left" arrow>
                <Box
                  sx={{
                    px: 2.5,
                    py: 2,
                    bgcolor: isCurrentUser ? "action.selected" : "transparent",
                    "&:hover": { bgcolor: "action.hover" },
                    transition: "background-color 0.2s",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
                    <Typography
                      variant="body2"
                      fontWeight={700}
                      sx={{
                        width: 28,
                        textAlign: "center",
                        color: i === 0 ? "#f59e0b" : i === 1 ? "#94a3b8" : i === 2 ? "#d97706" : "text.secondary",
                      }}
                    >
                      {i + 1}
                    </Typography>
                    <Avatar
                      src={member.image || undefined}
                      sx={{
                        width: 36,
                        height: 36,
                        fontSize: "0.85rem",
                        bgcolor: !member.image ? "primary.main" : undefined,
                      }}
                    >
                      {!member.image && member.name[0].toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <Typography variant="body2" fontWeight={600} noWrap>{member.name}</Typography>
                        {isCurrentUser && <Chip label="you" size="small" color="primary" sx={{ height: 18, fontSize: "0.6rem" }} />}
                      </Box>
                      <Box sx={{ display: "flex", gap: 1.5 }}>
                        <Typography variant="caption" color="text.secondary">{member.quizzesAttempted} quizzes</Typography>
                        {member.quizzesMissed > 0 && (
                          <Typography variant="caption" color="error">{member.quizzesMissed} missed</Typography>
                        )}
                      </Box>
                    </Box>
                    <Typography variant="body2" fontWeight={700} sx={{ fontVariantNumeric: "tabular-nums" }}>
                      {member.score} pts
                    </Typography>
                  </Box>
                  <Box sx={{ ml: "52px" }}>
                    <LinearProgress
                      variant="determinate"
                      value={barWidth}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        bgcolor: "action.hover",
                        "& .MuiLinearProgress-bar": {
                          background: i === 0 ? "linear-gradient(90deg, #b45309, #d97706)" : i === 1 ? "linear-gradient(90deg, #78716c, #a8a29e)" : i === 2 ? "linear-gradient(90deg, #92400e, #b45309)" : "linear-gradient(90deg, #0f766e, #14b8a6)",
                          borderRadius: 3,
                        },
                      }}
                    />
                  </Box>
                </Box>
              </Tooltip>
            </Box>
          );
        })}
      </Card>

      {members.length === 0 && (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <Typography variant="h6">No qualified members yet</Typography>
          <Typography variant="body2" color="text.secondary">Complete the prerequisite quiz to be the first!</Typography>
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
