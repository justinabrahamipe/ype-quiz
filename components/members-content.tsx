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
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";
import MilitaryTechRoundedIcon from "@mui/icons-material/MilitaryTechRounded";
import PeopleRoundedIcon from "@mui/icons-material/PeopleRounded";
import { ShareButton } from "@/components/share-button";

type Member = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  score: number;
  quizzesAttempted: number;
  quizzesMissed: number;
  rank: number;
};

const MEDAL = {
  gold: {
    main: "#F5B301",
    deep: "#B8860B",
    light: "#FDE68A",
    gradient: "linear-gradient(180deg, #FDE68A 0%, #F5B301 55%, #B8860B 100%)",
    badge: "linear-gradient(135deg, #FDE68A 0%, #F5B301 50%, #B8860B 100%)",
    bar: "linear-gradient(90deg, #B8860B, #F5B301, #FDE68A)",
    glow: "0 8px 24px rgba(245,179,1,0.35)",
    rowBg: "linear-gradient(90deg, rgba(245,179,1,0.18) 0%, rgba(245,179,1,0.04) 100%)",
    rowBorder: "#F5B301",
    text: "#92400E",
  },
  silver: {
    main: "#A8B0BC",
    deep: "#6B7280",
    light: "#F1F5F9",
    gradient: "linear-gradient(180deg, #F1F5F9 0%, #A8B0BC 55%, #6B7280 100%)",
    badge: "linear-gradient(135deg, #F1F5F9 0%, #A8B0BC 50%, #6B7280 100%)",
    bar: "linear-gradient(90deg, #6B7280, #A8B0BC, #F1F5F9)",
    glow: "0 8px 24px rgba(148,163,184,0.30)",
    rowBg: "linear-gradient(90deg, rgba(148,163,184,0.18) 0%, rgba(148,163,184,0.04) 100%)",
    rowBorder: "#A8B0BC",
    text: "#475569",
  },
  bronze: {
    main: "#CD7F32",
    deep: "#7C3F12",
    light: "#E8A87C",
    gradient: "linear-gradient(180deg, #E8A87C 0%, #CD7F32 55%, #7C3F12 100%)",
    badge: "linear-gradient(135deg, #E8A87C 0%, #CD7F32 50%, #7C3F12 100%)",
    bar: "linear-gradient(90deg, #7C3F12, #CD7F32, #E8A87C)",
    glow: "0 8px 24px rgba(205,127,50,0.30)",
    rowBg: "linear-gradient(90deg, rgba(205,127,50,0.18) 0%, rgba(205,127,50,0.04) 100%)",
    rowBorder: "#CD7F32",
    text: "#7C3F12",
  },
};

function medalForRank(rank: number) {
  return rank === 1 ? MEDAL.gold : rank === 2 ? MEDAL.silver : rank === 3 ? MEDAL.bronze : null;
}

export function MembersContent({ members, currentUserId }: { members: Member[]; currentUserId?: string }) {
  const maxScore = members.length > 0 ? members[0].score || 1 : 1;

  const topN = members.slice(0, Math.min(5, members.length));
  const topLines = topN
    .map((m) => `${m.rank}. ${m.name} — ${m.score} pts`)
    .join("\n");

  // Only show the 3-tier podium when 1st / 2nd / 3rd are clearly distinct.
  // If any of the top three are tied, skip the podium and let the list below
  // show the shared ranks instead.
  const showPodium =
    members.length >= 3 &&
    members[0].score > 0 &&
    members[0].rank === 1 &&
    members[1].rank === 2 &&
    members[2].rank === 3;
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (typeof window !== "undefined" ? window.location.origin : "");
  const shareText = [
    "Mahanaim YPE Quiz",
    "Leaderboard",
    "",
    topN.length ? topLines : "Be the first to qualify!",
    "",
    siteUrl,
  ]
    .filter((l) => l !== undefined)
    .join("\n");

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
        <ShareButton
          title="YPE Bible Quiz Leaderboard"
          text={shareText}
          url={`${
            typeof window !== "undefined" ? window.location.origin : ""
          }/leaderboard`}
          label="Share"
        />
      </Box>

      {/* Top 3 Podium - only when the top three are distinct ranks */}
      {showPodium && (
        <Card elevation={0} sx={{ mb: 3, p: 3, bgcolor: "background.paper" }}>
          <Box sx={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: { xs: 1.5, sm: 2.5 }, pt: 3 }}>
            {/* 2nd */}
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", width: 96 }}>
              <WorkspacePremiumRoundedIcon sx={{ fontSize: 22, color: MEDAL.silver.deep, mb: 0.5 }} />
              <Avatar
                src={members[1].image || undefined}
                sx={{
                  width: 52,
                  height: 52,
                  mb: 1,
                  border: `3px solid ${MEDAL.silver.main}`,
                  bgcolor: !members[1].image ? MEDAL.silver.deep : undefined,
                  boxShadow: MEDAL.silver.glow,
                }}
              >
                {!members[1].image && members[1].name[0].toUpperCase()}
              </Avatar>
              <Typography variant="caption" fontWeight={700} noWrap sx={{ maxWidth: 88, textAlign: "center" }}>{members[1].name}</Typography>
              <Typography variant="caption" sx={{ color: MEDAL.silver.text, fontWeight: 600 }}>{members[1].score} pts</Typography>
              <Box
                sx={{
                  width: "100%",
                  height: 78,
                  mt: 1,
                  borderRadius: "10px 10px 0 0",
                  background: MEDAL.silver.gradient,
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "center",
                  boxShadow: "inset 0 2px 0 rgba(255,255,255,0.4)",
                }}
              >
                <Typography variant="h6" sx={{ pb: 1, color: "white", fontWeight: 800, textShadow: "0 1px 2px rgba(0,0,0,0.25)" }}>2</Typography>
              </Box>
            </Box>
            {/* 1st */}
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", width: 104 }}>
              <EmojiEventsRoundedIcon sx={{ fontSize: 30, color: MEDAL.gold.main, mb: 0.5, filter: `drop-shadow(0 2px 6px ${MEDAL.gold.main}66)` }} />
              <Avatar
                src={members[0].image || undefined}
                sx={{
                  width: 64,
                  height: 64,
                  mb: 1,
                  border: `3px solid ${MEDAL.gold.main}`,
                  bgcolor: !members[0].image ? MEDAL.gold.deep : undefined,
                  boxShadow: MEDAL.gold.glow,
                }}
              >
                {!members[0].image && members[0].name[0].toUpperCase()}
              </Avatar>
              <Typography variant="caption" fontWeight={800} noWrap sx={{ maxWidth: 96, textAlign: "center" }}>{members[0].name}</Typography>
              <Typography variant="caption" sx={{ color: MEDAL.gold.text, fontWeight: 700 }}>{members[0].score} pts</Typography>
              <Box
                sx={{
                  width: "100%",
                  height: 110,
                  mt: 1,
                  borderRadius: "10px 10px 0 0",
                  background: MEDAL.gold.gradient,
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "center",
                  boxShadow: "inset 0 2px 0 rgba(255,255,255,0.5)",
                }}
              >
                <Typography variant="h5" sx={{ pb: 1, color: "white", fontWeight: 800, textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}>1</Typography>
              </Box>
            </Box>
            {/* 3rd */}
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", width: 96 }}>
              <MilitaryTechRoundedIcon sx={{ fontSize: 22, color: MEDAL.bronze.main, mb: 0.5 }} />
              <Avatar
                src={members[2].image || undefined}
                sx={{
                  width: 52,
                  height: 52,
                  mb: 1,
                  border: `3px solid ${MEDAL.bronze.main}`,
                  bgcolor: !members[2].image ? MEDAL.bronze.deep : undefined,
                  boxShadow: MEDAL.bronze.glow,
                }}
              >
                {!members[2].image && members[2].name[0].toUpperCase()}
              </Avatar>
              <Typography variant="caption" fontWeight={700} noWrap sx={{ maxWidth: 88, textAlign: "center" }}>{members[2].name}</Typography>
              <Typography variant="caption" sx={{ color: MEDAL.bronze.text, fontWeight: 600 }}>{members[2].score} pts</Typography>
              <Box
                sx={{
                  width: "100%",
                  height: 56,
                  mt: 1,
                  borderRadius: "10px 10px 0 0",
                  background: MEDAL.bronze.gradient,
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "center",
                  boxShadow: "inset 0 2px 0 rgba(255,255,255,0.35)",
                }}
              >
                <Typography variant="h6" sx={{ pb: 1, color: "white", fontWeight: 800, textShadow: "0 1px 2px rgba(0,0,0,0.25)" }}>3</Typography>
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
          const medal = medalForRank(member.rank);
          return (
            <Box key={member.id}>
              {i > 0 && !medal && <Divider />}
              <Tooltip title={member.email} placement="left" arrow>
                <Box
                  sx={{
                    position: "relative",
                    px: 2.5,
                    py: medal ? 2.25 : 2,
                    background: medal
                      ? medal.rowBg
                      : isCurrentUser
                      ? undefined
                      : "transparent",
                    bgcolor: !medal && isCurrentUser ? "action.selected" : undefined,
                    borderLeft: medal ? `4px solid ${medal.rowBorder}` : "4px solid transparent",
                    "&:hover": { filter: medal ? "brightness(1.03)" : undefined, bgcolor: !medal ? "action.hover" : undefined },
                    transition: "background-color 0.2s, filter 0.2s",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
                    {medal ? (
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          background: medal.badge,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: `${medal.glow}, inset 0 1px 0 rgba(255,255,255,0.5)`,
                          flexShrink: 0,
                        }}
                      >
                        <Typography
                          sx={{
                            color: "white",
                            fontWeight: 800,
                            fontSize: "0.95rem",
                            textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                            lineHeight: 1,
                          }}
                        >
                          {member.rank}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography
                        variant="body2"
                        fontWeight={700}
                        sx={{ width: 32, textAlign: "center", color: "text.secondary" }}
                      >
                        {member.rank}
                      </Typography>
                    )}
                    <Avatar
                      src={member.image || undefined}
                      sx={{
                        width: medal ? 42 : 36,
                        height: medal ? 42 : 36,
                        fontSize: "0.9rem",
                        fontWeight: 700,
                        bgcolor: !member.image ? (medal ? medal.deep : "primary.main") : undefined,
                        border: medal ? `2px solid ${medal.main}` : undefined,
                        boxShadow: medal ? medal.glow : undefined,
                      }}
                    >
                      {!member.image && member.name[0].toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <Typography
                          variant="body2"
                          fontWeight={medal ? 700 : 600}
                          noWrap
                          sx={medal ? { color: medal.text } : undefined}
                        >
                          {member.name}
                        </Typography>
                        {isCurrentUser && <Chip label="you" size="small" color="primary" sx={{ height: 18, fontSize: "0.6rem" }} />}
                      </Box>
                      <Box sx={{ display: "flex", gap: 1.5 }}>
                        <Typography variant="caption" color="text.secondary">{member.quizzesAttempted} quizzes</Typography>
                        {member.quizzesMissed > 0 && (
                          <Typography variant="caption" color="error">{member.quizzesMissed} missed</Typography>
                        )}
                      </Box>
                    </Box>
                    {medal ? (
                      <Box
                        sx={{
                          px: 1.25,
                          py: 0.5,
                          borderRadius: 1.5,
                          background: medal.badge,
                          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4)",
                          display: "flex",
                          alignItems: "baseline",
                          gap: 0.5,
                        }}
                      >
                        <Typography
                          sx={{
                            color: "white",
                            fontWeight: 800,
                            fontSize: "0.95rem",
                            fontVariantNumeric: "tabular-nums",
                            textShadow: "0 1px 1px rgba(0,0,0,0.25)",
                            lineHeight: 1,
                          }}
                        >
                          {member.score}
                        </Typography>
                        <Typography
                          sx={{
                            color: "white",
                            opacity: 0.85,
                            fontSize: "0.65rem",
                            fontWeight: 700,
                            textShadow: "0 1px 1px rgba(0,0,0,0.25)",
                            lineHeight: 1,
                          }}
                        >
                          pts
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" fontWeight={700} sx={{ fontVariantNumeric: "tabular-nums" }}>
                        {member.score} pts
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ ml: "56px" }}>
                    <LinearProgress
                      variant="determinate"
                      value={barWidth}
                      sx={{
                        height: medal ? 7 : 6,
                        borderRadius: 3,
                        bgcolor: "action.hover",
                        "& .MuiLinearProgress-bar": {
                          background: medal ? medal.bar : "linear-gradient(90deg, #0f766e, #14b8a6)",
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
