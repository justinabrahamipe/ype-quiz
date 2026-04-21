import { ImageResponse } from "next/og";
import { prisma } from "@/lib/db";
import {
  fetchImageAsDataUri,
  readPublicImageAsDataUri,
} from "@/lib/og-helpers";
import { getOverallRank } from "@/lib/rank";
import { getUserAggregate } from "@/lib/aggregate-score";

export const runtime = "nodejs";
export const contentType = "image/png";
export const alt = "YPE Bible Quiz";
export const size = { width: 1080, height: 1350 };

export default async function UserOgImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  try {
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        name: true,
        image: true,
        isApproved: true,
        role: true,
      },
    });

    if (!user || !user.isApproved || user.role !== "user") {
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
            YPE Bible Quiz
          </div>
        ),
        size
      );
    }

    const [aggregate, avatar, logo] = await Promise.all([
      getUserAggregate(id),
      fetchImageAsDataUri(user.image),
      readPublicImageAsDataUri("logo.png"),
    ]);

    const name = user.name || "Anonymous";
    const score = aggregate.totalScore;
    const attemptsCount = aggregate.quizzesAttempted;
    const onBoard =
      aggregate.totalScore > 0 ||
      aggregate.quizzesAttempted > 0 ||
      aggregate.quizzesMissed > 0;
    const { rank, totalMembers } = await getOverallRank(score, onBoard);

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
            padding: "50px 60px",
            fontFamily: "sans-serif",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 18,
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
                width={180}
                height={180}
                style={{
                  width: 180,
                  height: 180,
                  borderRadius: 90,
                  border: `5px solid ${accent}`,
                  objectFit: "cover",
                  marginBottom: 18,
                }}
              />
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 180,
                  height: 180,
                  borderRadius: 90,
                  border: `5px solid ${accent}`,
                  background: "linear-gradient(135deg, #0f766e, #14b8a6)",
                  fontSize: 90,
                  fontWeight: 800,
                  color: "#f0fdfa",
                  marginBottom: 18,
                }}
              >
                {(name[0] || "?").toUpperCase()}
              </div>
            )}

            <div
              style={{
                display: "flex",
                fontSize: 52,
                fontWeight: 800,
                letterSpacing: "-0.02em",
                marginBottom: 6,
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
                    fontSize: 22,
                    color: "#a8a29e",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    fontWeight: 600,
                    marginBottom: 10,
                  }}
                >
                  Currently ranked
                </div>
                <div
                  style={{
                    display: "flex",
                    fontSize: 170,
                    fontWeight: 900,
                    color: accent,
                    lineHeight: 1,
                    letterSpacing: "-0.04em",
                    marginBottom: 8,
                  }}
                >
                  {rankLabel}
                </div>
                <div
                  style={{
                    display: "flex",
                    fontSize: 26,
                    color: "#d6d3d1",
                    marginBottom: 28,
                  }}
                >
                  {`of ${totalMembers} member${
                    totalMembers === 1 ? "" : "s"
                  }`}
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  fontSize: 36,
                  fontWeight: 700,
                  color: accent,
                  marginBottom: 28,
                  marginTop: 12,
                }}
              >
                Just getting started
              </div>
            )}

            <div style={{ display: "flex", gap: 28 }}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  padding: "20px 36px",
                  borderRadius: 20,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    fontSize: 58,
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
                    fontSize: 20,
                    color: "#a8a29e",
                    marginTop: 6,
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
                  padding: "20px 36px",
                  borderRadius: 20,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    fontSize: 58,
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
                    fontSize: 20,
                    color: "#a8a29e",
                    marginTop: 6,
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
              alignItems: "center",
              paddingTop: 20,
              borderTop: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 22,
                fontWeight: 700,
                color: "#e7e5e4",
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
    console.error("[opengraph-image u/id] failed:", err);
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
          YPE Bible Quiz
        </div>
      ),
      size
    );
  }
}
