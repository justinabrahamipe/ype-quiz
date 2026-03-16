"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/header";
import { toast } from "@/components/toaster";
import Image from "next/image";

const SUPER_ADMIN_EMAIL = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || "mahanaimype@gmail.com";

type UserItem = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: string;
  createdAt: string;
  overallScore: { totalScore: string } | null;
};

export default function ManageUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, role: newRole }),
    });

    if (res.ok) {
      toast(`User role updated to ${newRole}`, "success");
      fetchUsers();
    } else {
      const data = await res.json();
      toast(data.error || "Failed to update", "error");
    }
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
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-2xl font-bold">Manage Users</h1>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-blue-500 focus:outline-none text-sm"
        />

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-14 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-3 px-2 font-medium text-slate-500">User</th>
                  <th className="text-left py-3 px-2 font-medium text-slate-500">Email</th>
                  <th className="text-left py-3 px-2 font-medium text-slate-500">Joined</th>
                  <th className="text-left py-3 px-2 font-medium text-slate-500">Score</th>
                  <th className="text-left py-3 px-2 font-medium text-slate-500">Role</th>
                  <th className="text-left py-3 px-2 font-medium text-slate-500">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-slate-100 dark:border-slate-800"
                  >
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        {user.image ? (
                          <Image
                            src={user.image}
                            alt=""
                            width={24}
                            height={24}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700" />
                        )}
                        {user.name || "—"}
                      </div>
                    </td>
                    <td className="py-3 px-2">{user.email}</td>
                    <td className="py-3 px-2">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-2">
                      {user.overallScore
                        ? Number(user.overallScore.totalScore)
                        : 0}
                    </td>
                    <td className="py-3 px-2">
                      {user.email === SUPER_ADMIN_EMAIL ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
                          Super Admin
                        </span>
                      ) : (
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            user.role === "admin"
                              ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          {user.role}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-2">
                      {user.email !== SUPER_ADMIN_EMAIL && (
                        <button
                          onClick={() => toggleRole(user.id, user.role)}
                          className={`text-xs font-medium px-3 py-1 rounded-lg ${
                            user.role === "admin"
                              ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200"
                              : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200"
                          }`}
                        >
                          {user.role === "admin"
                            ? "Remove Admin"
                            : "Make Admin"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
