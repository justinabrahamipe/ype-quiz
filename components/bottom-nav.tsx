"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import Paper from "@mui/material/Paper";
import QuizRoundedIcon from "@mui/icons-material/QuizRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import PeopleRoundedIcon from "@mui/icons-material/PeopleRounded";

export function BottomNav() {
  const pathname = usePathname();

  const getValue = () => {
    if (pathname === "/quizzes") return 0;
    if (pathname === "/you") return 1;
    if (pathname === "/leaderboard") return 2;
    return 0;
  };

  return (
    <Paper
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        borderTop: "1px solid",
        borderColor: "divider",
        display: { xs: "block", md: "none" },
      }}
      elevation={8}
    >
      <BottomNavigation
        value={getValue()}
        showLabels
        sx={{
          bgcolor: "background.paper",
          justifyContent: "space-between",
          px: 3,
          "& .MuiBottomNavigationAction-root": {
            minWidth: "auto",
            flex: "0 0 auto",
            color: "text.secondary",
            "&.Mui-selected": {
              color: "primary.main",
            },
          },
        }}
      >
        <BottomNavigationAction
          component={Link}
          href="/quizzes"
          label="Quizzes"
          icon={<QuizRoundedIcon />}
        />
        <BottomNavigationAction
          component={Link}
          href="/you"
          label="You"
          icon={<PersonRoundedIcon />}
        />
        <BottomNavigationAction
          component={Link}
          href="/leaderboard"
          label="Leaderboard"
          icon={<PeopleRoundedIcon />}
        />
      </BottomNavigation>
    </Paper>
  );
}
