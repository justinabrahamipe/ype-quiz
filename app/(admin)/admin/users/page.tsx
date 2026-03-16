"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/header";
import { toast } from "@/components/toaster";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Divider from "@mui/material/Divider";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import AdminPanelSettingsRoundedIcon from "@mui/icons-material/AdminPanelSettingsRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import Link from "next/link";

const SUPER_ADMIN_EMAIL = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || "mahanaimype@gmail.com";

type UserItem = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: string;
  isQualified: boolean;
  createdAt: string;
  overallScore: { totalScore: string } | null;
};

export default function ManageUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Menu
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [menuUser, setMenuUser] = useState<UserItem | null>(null);

  // Score edit
  const [editScoreUser, setEditScoreUser] = useState<UserItem | null>(null);
  const [scoreValue, setScoreValue] = useState("");

  // Delete confirmation
  const [deleteUser, setDeleteUser] = useState<UserItem | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Role change
  const [roleUser, setRoleUser] = useState<UserItem | null>(null);

  const fetchUsers = () => {
    setLoading(true);
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((data) => {
        setUsers(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const doAction = async (userId: string, action: string, extra: Record<string, unknown> = {}) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, action, ...extra }),
      });
      if (res.ok) {
        toast("Updated!", "success");
        fetchUsers();
      } else {
        const text = await res.text();
        try {
          const data = JSON.parse(text);
          toast(data.error || "Failed", "error");
        } catch {
          toast("Failed to update", "error");
        }
      }
    } catch {
      toast("Failed to update", "error");
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUser) return;
    setDeleting(true);
    const res = await fetch("/api/admin/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: deleteUser.id }),
    });
    if (res.ok) {
      toast("User deleted", "success");
      setDeleteUser(null);
      setDeleteConfirmText("");
      fetchUsers();
    } else {
      const data = await res.json();
      toast(data.error || "Failed to delete", "error");
    }
    setDeleting(false);
  };

  const handleSaveScore = async () => {
    if (!editScoreUser) return;
    await doAction(editScoreUser.id, "set_score", { score: Number(scoreValue) });
    setEditScoreUser(null);
    setScoreValue("");
  };

  const handleSetRole = async (role: string) => {
    if (!roleUser) return;
    await doAction(roleUser.id, "toggle_role", { role });
    setRoleUser(null);
  };

  const openMenu = (e: React.MouseEvent<HTMLElement>, user: UserItem) => {
    setMenuAnchor(e.currentTarget);
    setMenuUser(user);
  };

  const closeMenu = () => {
    setMenuAnchor(null);
    setMenuUser(null);
  };

  const filtered = users.filter(
    (u) =>
      !search ||
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Box sx={{ maxWidth: 900, mx: "auto", px: { xs: 1.5, sm: 3 }, py: 3 }}>
        <Typography variant="h5" fontWeight={700} className="gradient-text" sx={{ mb: 2 }}>
          Manage Users
        </Typography>

        <TextField
          fullWidth
          size="small"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ mb: 2 }}
        />

        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          {filtered.length} users
        </Typography>

        <Card elevation={0}>
          {loading ? (
            <Box sx={{ p: 4, textAlign: "center" }}>
              <Typography color="text.secondary">Loading...</Typography>
            </Box>
          ) : (
            filtered.map((user, i) => {
              const isSuperAdmin = user.email === SUPER_ADMIN_EMAIL;
              const score = user.overallScore ? Number(user.overallScore.totalScore) : 0;
              return (
                <Box key={user.id}>
                  {i > 0 && <Divider />}
                  <Box sx={{ px: 2.5, py: 1.5, display: "flex", alignItems: "center", gap: 1.5, "&:hover": { bgcolor: "action.hover" } }}>
                    <Avatar
                      src={user.image || undefined}
                      sx={{
                        width: 36, height: 36,
                        bgcolor: !user.image ? "primary.main" : undefined,
                        fontSize: "0.85rem",
                      }}
                    >
                      {!user.image && (user.name || "?")[0].toUpperCase()}
                    </Avatar>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={600} noWrap>
                        {user.name || "—"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {user.email}
                      </Typography>
                    </Box>

                    <Box sx={{ display: { xs: "none", sm: "flex" }, gap: 0.5, alignItems: "center" }}>
                      <Chip
                        label={isSuperAdmin ? "Super Admin" : user.role}
                        size="small"
                        color={isSuperAdmin ? "secondary" : user.role === "admin" ? "primary" : user.role === "quizmaster" ? "info" : "default"}
                        sx={{ height: 22, fontSize: "0.65rem" }}
                      />
                      <Chip
                        label={user.isQualified ? "Qualified" : "Not Qualified"}
                        size="small"
                        color={user.isQualified ? "success" : "warning"}
                        variant="outlined"
                        sx={{ height: 22, fontSize: "0.65rem" }}
                      />
                      <Chip label={`${score} pts`} size="small" variant="outlined" sx={{ height: 22, fontSize: "0.65rem" }} />
                    </Box>

                    <IconButton size="small" onClick={(e) => openMenu(e, user)}>
                      <MoreVertRoundedIcon sx={{ fontSize: 20 }} />
                    </IconButton>
                  </Box>
                </Box>
              );
            })
          )}
        </Card>
      </Box>

      {/* 3-dot Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={!!menuAnchor}
        onClose={closeMenu}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        <MenuItem
          component={Link}
          href={`/admin/users/${menuUser?.id}`}
          onClick={closeMenu}
        >
          <ListItemIcon><VisibilityRoundedIcon fontSize="small" /></ListItemIcon>
          <ListItemText>View Results</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          if (menuUser) { setRoleUser(menuUser); }
          closeMenu();
        }}>
          <ListItemIcon><AdminPanelSettingsRoundedIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Change Role</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          if (menuUser) doAction(menuUser.id, "toggle_qualified");
          closeMenu();
        }}>
          <ListItemIcon><VerifiedRoundedIcon fontSize="small" /></ListItemIcon>
          <ListItemText>{menuUser?.isQualified ? "Remove Qualification" : "Qualify User"}</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          if (menuUser) {
            setEditScoreUser(menuUser);
            setScoreValue(String(menuUser.overallScore ? Number(menuUser.overallScore.totalScore) : 0));
          }
          closeMenu();
        }}>
          <ListItemIcon><EditRoundedIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Edit Score</ListItemText>
        </MenuItem>
        {menuUser?.email !== SUPER_ADMIN_EMAIL && (
          <MenuItem onClick={() => {
            if (menuUser) { setDeleteUser(menuUser); setDeleteConfirmText(""); }
            closeMenu();
          }} sx={{ color: "error.main" }}>
            <ListItemIcon><DeleteRoundedIcon fontSize="small" sx={{ color: "error.main" }} /></ListItemIcon>
            <ListItemText>Delete User</ListItemText>
          </MenuItem>
        )}
      </Menu>

      {/* Change Role Dialog */}
      <Dialog open={!!roleUser} onClose={() => setRoleUser(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Change Role — {roleUser?.name || roleUser?.email}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 1 }}>
            {["user", "quizmaster", "admin"].map((role) => (
              <Button
                key={role}
                variant={roleUser?.role === role ? "contained" : "outlined"}
                onClick={() => handleSetRole(role)}
                startIcon={
                  role === "admin" ? <AdminPanelSettingsRoundedIcon /> :
                  role === "quizmaster" ? <EditRoundedIcon /> :
                  <PersonRoundedIcon />
                }
                sx={{ justifyContent: "flex-start", textTransform: "capitalize" }}
              >
                {role}
                {role === "quizmaster" && (
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>— can only manage quizzes</Typography>
                )}
              </Button>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoleUser(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Score Dialog */}
      <Dialog open={!!editScoreUser} onClose={() => setEditScoreUser(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Edit Score — {editScoreUser?.name || editScoreUser?.email}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            type="number"
            label="Total Score"
            value={scoreValue}
            onChange={(e) => setScoreValue(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditScoreUser(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveScore}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteUser} onClose={() => setDeleteUser(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ color: "error.main" }}>Delete User</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            This will permanently delete <strong>{deleteUser?.name || deleteUser?.email}</strong> and all their quiz attempts, answers, and disputes. This cannot be undone.
          </Typography>
          <Typography variant="body2" sx={{ mb: 1.5 }}>
            Type <strong>DELETE</strong> to confirm:
          </Typography>
          <TextField
            autoFocus
            fullWidth
            size="small"
            placeholder="Type DELETE"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteUser(null)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            disabled={deleteConfirmText !== "DELETE" || deleting}
            onClick={handleDeleteUser}
          >
            {deleting ? "Deleting..." : "Delete User"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
