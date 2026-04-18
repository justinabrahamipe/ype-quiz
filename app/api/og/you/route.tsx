import { ImageResponse } from "next/og";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { fetchImageAsDataUri, readPublicImageAsDataUri } from "@/lib/og-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WIDTH = 1080;
const HEIGHT = 1920;

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const userId = session.user.id;

    const [user, overallScore, attemptsCount, totalMembers] = await Promise.all(
      [
        prisma.user.findUnique({
          where: { id: userId },
          select: { name: true, image: true, isQualified: true },
        }),
        prisma.overallScore.findUnique({ where: { userId } }),
        prisma.attempt.count({
          where: {
            userId,
            isComplete: true,
            archivedAt: null,
            quiz: { isPrerequisite: false },
          },
        }),
        prisma.overallScore.count({
          where: { user: { isApproved: true, role: "user" } },
        }),
      ]
    );

    const score = Number(overallScore?.totalScore ?? 0);

    let rank = 0;
    if (overallScore) {
      const higher = await prisma.overallScore.count({
        where: {
          totalScore: { gt: score },
          user: { isApproved: true, role: "user" },
        },
      });
      rank = higher + 1;
    }

    const name = user?.name || session.user.name || "Quizzer";
    const [avatar, logo] = await Promise.all([
      fetchImageAsDataUri(user?.image || session.user.image || null),
      readPublicImageAsDataUri("logo.png"),
    ]);

    const rankLabel =
      rank === 1 ? "1st" : rank === 2 ? "2nd" : rank === 3 ? "3rd" : `#${rank}`;

    const accent =
      rank === 1
        ? "#fbbf24"
        : rank === 2
        ? "#cbd5e1"
        : rank === 3
        ? "#d97706"
        : "#2dd4bf";

    const percentile =
      rank > 0 && totalMembers > 0
        ? Math.round(((totalMembers - rank) / totalMembers) * 100)
        : 0;

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#0c0a09",
            backgroundImage: `radial-gradient(circle at 20% 15%, ${accent}40 0%, transparent 55%), radial-gradient(circle at 80% 95%, rgba(20,184,166,0.3) 0%, transparent 55%)`,
            color: "#f5f5f4",
            padding: "80px 70px",
            fontFamily: "sans-serif",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 20,
            }}
          >
            {logo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logo}
                alt=""
                width={80}
                height={80}
                style={{ width: 80, height: 80 }}
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
                  fontSize: 24,
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
                  fontSize: 34,
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
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              flexGrow: 1,
              textAlign: "center",
            }}
          >
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatar}
                alt=""
                width={240}
                height={240}
                style={{
                  width: 240,
                  height: 240,
                  borderRadius: 120,
                  border: `6px solid ${accent}`,
                  objectFit: "cover",
                  marginBottom: 28,
                }}
              />
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 240,
                  height: 240,
                  borderRadius: 120,
                  border: `6px solid ${accent}`,
                  background: "linear-gradient(135deg, #0f766e, #14b8a6)",
                  fontSize: 110,
                  fontWeight: 800,
                  color: "#f0fdfa",
                  marginBottom: 28,
                }}
              >
                {(name[0] || "?").toUpperCase()}
              </div>
            )}

            <div
              style={{
                display: "flex",
                fontSize: 64,
                fontWeight: 800,
                letterSpacing: "-0.02em",
                marginBottom: 10,
              }}
            >
              {name}
            </div>

            {rank > 0 ? (
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
                    fontSize: 26,
                    color: "#a8a29e",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    fontWeight: 600,
                    marginBottom: 18,
                  }}
                >
                  Currently ranked
                </div>
                <div
                  style={{
                    display: "flex",
                    fontSize: 220,
                    fontWeight: 900,
                    color: accent,
                    lineHeight: 1,
                    letterSpacing: "-0.04em",
                    marginBottom: 14,
                  }}
                >
                  {rankLabel}
                </div>
                <div
                  style={{
                    display: "flex",
                    fontSize: 30,
                    color: "#d6d3d1",
                    marginBottom: 50,
                  }}
                >
                  {`of ${totalMembers} member${
                    totalMembers === 1 ? "" : "s"
                  }${
                    percentile > 0
                      ? ` · top ${Math.max(1, 100 - percentile)}%`
                      : ""
                  }`}
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  fontSize: 42,
                  fontWeight: 700,
                  color: accent,
                  marginBottom: 50,
                  marginTop: 20,
                }}
              >
                Just getting started
              </div>
            )}

            <div style={{ display: "flex", gap: 40 }}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  padding: "28px 44px",
                  borderRadius: 24,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    fontSize: 72,
                    fontWeight: 800,
                    color: accent,
                    lineHeight: 1,
                  }}
                >
                  {`${score}`}
                </div>
                <div
                  style={{
                    display: "flex",
                    fontSize: 24,
                    color: "#a8a29e",
                    marginTop: 8,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                  }}
                >
                  Points
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  padding: "28px 44px",
                  borderRadius: 24,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    fontSize: 72,
                    fontWeight: 800,
                    color: "#2dd4bf",
                    lineHeight: 1,
                  }}
                >
                  {`${attemptsCount}`}
                </div>
                <div
                  style={{
                    display: "flex",
                    fontSize: 24,
                    color: "#a8a29e",
                    marginTop: 8,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                  }}
                >
                  {attemptsCount === 1 ? "Quiz" : "Quizzes"}
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              paddingTop: 30,
              borderTop: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 28,
                fontWeight: 700,
                color: "#e7e5e4",
              }}
            >
              Mahanaim Church of God · Manchester
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 22,
                color: "#78716c",
                marginTop: 6,
              }}
            >
              Young People&apos;s Endeavour · Weekly Bible Quiz
            </div>
          </div>
        </div>
      ),
      { width: WIDTH, height: HEIGHT }
    );
  } catch (err) {
    console.error("[og/you] failed:", err);
    return new Response(
      `Failed to generate image: ${(err as Error)?.message || "unknown"}`,
      { status: 500 }
    );
  }
}
