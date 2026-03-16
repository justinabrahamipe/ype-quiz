"use client";

export function LeaderboardRow({
  rank,
  name,
  email,
  image,
  score,
  isCurrentUser,
}: {
  rank: number;
  name: string;
  email: string;
  image: string | null;
  score: number;
  isCurrentUser: boolean;
}) {
  return (
    <div
      className={`group relative flex items-center gap-3 px-5 py-3.5 transition-colors ${
        isCurrentUser
          ? "bg-[var(--accent-soft)]"
          : "hover:bg-[var(--surface)]"
      }`}
      title={email}
    >
      <span
        className={`w-7 text-center text-sm font-bold ${
          rank === 1
            ? "rank-gold"
            : rank === 2
            ? "rank-silver"
            : rank === 3
            ? "rank-bronze"
            : "text-[var(--muted)]"
        }`}
      >
        {rank}
      </span>
      {image ? (
        <img
          src={image}
          alt=""
          className="w-8 h-8 rounded-full ring-2 ring-[var(--card-border)]"
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
          {name[0].toUpperCase()}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium truncate block">
          {name}
          {isCurrentUser && (
            <span className="ml-1.5 text-xs text-[var(--accent)]">(you)</span>
          )}
        </span>
        <span className="text-xs text-[var(--muted)] hidden group-hover:block truncate">
          {email}
        </span>
      </div>
      <span className="text-sm font-bold tabular-nums">
        {score}
      </span>
    </div>
  );
}
