import { ImageResponse } from "next/og";
import { prisma } from "@/lib/db";
import { readPublicImageAsDataUri } from "@/lib/og-helpers";
import { getUsersAggregates } from "@/lib/aggregate-score";

export const runtime = "nodejs";
export const contentType = "image/png";
export const alt = "YPE Bible Quiz Leaderboard";
export const size = { width: 1080, height: 1350 };

export default async function LeaderboardOgImage() {
  try {
    const [allQualified, logo] = await Promise.all([
      prisma.user.findMany({
        where: { isQualified: true, isApproved: true, role: "user" },
        select: { id: true, name: true },
      }),
      readPublicImageAsDataUri("logo.png"),
    ]);

    const totalQualified = allQualified.length;
    const aggregates = await getUsersAggregates(allQualified.map((u) => u.id));
    const list = allQualified
      .map((u) => ({
        name: u.name || "Anonymous",
        score: aggregates.get(u.id)?.totalScore ?? 0,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);

    const rankColor = (i: number) =>
      i === 0
        ? "#fbbf24"
        : i === 1
        ? "#cbd5e1"
        : i === 2
        ? "#d97706"
        : "#78716c";
    const rowBg = (i: number) =>
      i === 0
        ? "rgba(251,191,36,0.14)"
        : i < 3
        ? "rgba(148,163,184,0.08)"
        : "rgba(255,255,255,0.04)";
    const rowBorder = (i: number) =>
      i === 0
        ? "rgba(251,191,36,0.4)"
        : i < 3
        ? "rgba(148,163,184,0.2)"
        : "rgba(255,255,255,0.08)";
    const avatarFallback = (i: number) =>
      i === 0
        ? "linear-gradient(135deg, #b45309, #f59e0b)"
        : i === 1
        ? "linear-gradient(135deg, #64748b, #cbd5e1)"
        : i === 2
        ? "linear-gradient(135deg, #78350f, #d97706)"
        : "linear-gradient(135deg, #0f766e, #14b8a6)";

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#0c0a09",
            backgroundImage:
              "radial-gradient(circle at 20% 10%, rgba(20,184,166,0.35) 0%, transparent 55%), radial-gradient(circle at 85% 95%, rgba(217,119,6,0.3) 0%, transparent 50%)",
            color: "#f5f5f4",
            padding: "50px 55px",
            fontFamily: "sans-serif",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 18,
              marginBottom: 18,
            }}
          >
            {logo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logo}
                alt=""
                width={72}
                height={72}
                style={{ width: 72, height: 72 }}
              />
            )}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: 22,
                  color: "#e7e5e4",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                Mahanaim
              </div>
              <div
                style={{
                  display: "flex",
                  color: "#fbbf24",
                  fontSize: 30,
                  fontWeight: 800,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                }}
              >
                YPE Bible Quiz
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              fontSize: 80,
              fontWeight: 800,
              lineHeight: 1,
              letterSpacing: "-0.02em",
              marginBottom: 8,
            }}
          >
            Leaderboard
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              fontSize: 24,
              color: "#a8a29e",
              marginBottom: 28,
            }}
          >
            {`Top ${list.length} of ${totalQualified} qualified member${
              totalQualified === 1 ? "" : "s"
            }`}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {list.map((m, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 18,
                  padding: "10px 22px",
                  borderRadius: 16,
                  background: rowBg(i),
                  border: `1px solid ${rowBorder(i)}`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    width: 48,
                    fontSize: 30,
                    fontWeight: 800,
                    color: rankColor(i),
                  }}
                >
                  {`${i + 1}`}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 52,
                    height: 52,
                    borderRadius: 26,
                    background: avatarFallback(i),
                    fontSize: 24,
                    fontWeight: 700,
                    color: "#f0fdfa",
                  }}
                >
                  {(m.name[0] || "?").toUpperCase()}
                </div>
                <div
                  style={{
                    display: "flex",
                    flex: 1,
                    fontSize: 28,
                    fontWeight: 600,
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                  }}
                >
                  {m.name}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 6,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      fontSize: 32,
                      fontWeight: 800,
                      color: i === 0 ? "#fbbf24" : "#2dd4bf",
                    }}
                  >
                    {`${m.score}`}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      fontSize: 20,
                      color: "#78716c",
                      fontWeight: 500,
                    }}
                  >
                    pts
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: "auto",
              paddingTop: 24,
              borderTop: "1px solid rgba(255,255,255,0.08)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 22,
                color: "#e7e5e4",
                fontWeight: 700,
              }}
            >
              Mahanaim Church of God · Manchester
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 18,
                color: "#78716c",
                marginTop: 4,
              }}
            >
              Young People&apos;s Endeavour · Weekly Bible Quiz
            </div>
          </div>
        </div>
      ),
      size
    );
  } catch (err) {
    console.error("[opengraph-image leaderboard] failed:", err);
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#0c0a09",
            color: "#f5f5f4",
            fontSize: 48,
            fontFamily: "sans-serif",
          }}
        >
          YPE Bible Quiz Leaderboard
        </div>
      ),
      size
    );
  }
}
