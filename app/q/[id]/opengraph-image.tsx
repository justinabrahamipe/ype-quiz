import { ImageResponse } from "next/og";
import { prisma } from "@/lib/db";
import { readPublicImageAsDataUri } from "@/lib/og-helpers";

export const runtime = "nodejs";
export const contentType = "image/png";
export const alt = "YPE Bible Quiz";
export const size = { width: 1200, height: 630 };

export default async function QuizOgImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  try {
    const { id } = await params;
    const [quiz, logo] = await Promise.all([
      prisma.quiz.findUnique({
        where: { id },
        select: {
          title: true,
          biblePortion: true,
          questionCount: true,
          startTime: true,
          endTime: true,
          isPrerequisite: true,
        },
      }),
      readPublicImageAsDataUri("logo.png"),
    ]);

    if (!quiz) {
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

    const now = new Date();
    let statusLabel = "Upcoming";
    let statusColor = "#a8a29e";
    if (quiz.isPrerequisite) {
      statusLabel = "Qualifying quiz";
      statusColor = "#fbbf24";
    } else if (now >= quiz.startTime && now <= quiz.endTime) {
      statusLabel = "Open now";
      statusColor = "#34d399";
    } else if (now > quiz.endTime) {
      statusLabel = "Closed";
      statusColor = "#fb7185";
    }

    const dateFmt = (d: Date) =>
      d.toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
      });
    const window =
      quiz.startTime.toDateString() === quiz.endTime.toDateString()
        ? dateFmt(quiz.startTime)
        : `${dateFmt(quiz.startTime)} – ${dateFmt(quiz.endTime)}`;

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
              "radial-gradient(circle at 12% 15%, rgba(20,184,166,0.35) 0%, transparent 55%), radial-gradient(circle at 88% 95%, rgba(217,119,6,0.3) 0%, transparent 50%)",
            color: "#f5f5f4",
            padding: "40px 60px",
            fontFamily: "sans-serif",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            {logo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logo}
                alt=""
                width={60}
                height={60}
                style={{ width: 60, height: 60 }}
              />
            )}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  display: "flex",
                  fontSize: 18,
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
                  fontSize: 26,
                  fontWeight: 800,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                }}
              >
                YPE Bible Quiz
              </div>
            </div>

            <div
              style={{
                display: "flex",
                marginLeft: "auto",
                padding: "6px 18px",
                borderRadius: 999,
                background: `${statusColor}22`,
                border: `2px solid ${statusColor}`,
                color: statusColor,
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              {statusLabel}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              flexGrow: 1,
              marginTop: 30,
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 92,
                fontWeight: 900,
                letterSpacing: "-0.03em",
                lineHeight: 1,
              }}
            >
              {quiz.title}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 36,
                color: "#2dd4bf",
                fontWeight: 700,
                marginTop: 14,
              }}
            >
              {quiz.biblePortion}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 20,
              paddingTop: 20,
              borderTop: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div style={{ display: "flex", gap: 36 }}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div
                  style={{
                    display: "flex",
                    fontSize: 36,
                    fontWeight: 800,
                    color: "#fbbf24",
                    lineHeight: 1,
                  }}
                >
                  {`${quiz.questionCount}`}
                </div>
                <div
                  style={{
                    display: "flex",
                    fontSize: 15,
                    color: "#a8a29e",
                    marginTop: 4,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                  }}
                >
                  Questions
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div
                  style={{
                    display: "flex",
                    fontSize: 28,
                    fontWeight: 800,
                    color: "#e7e5e4",
                    lineHeight: 1,
                    marginTop: 6,
                  }}
                >
                  {window}
                </div>
                <div
                  style={{
                    display: "flex",
                    fontSize: 15,
                    color: "#a8a29e",
                    marginTop: 6,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                  }}
                >
                  Window
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                padding: "14px 28px",
                borderRadius: 12,
                background: "linear-gradient(135deg, #0f766e, #14b8a6)",
                color: "#f0fdfa",
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: "0.04em",
              }}
            >
              Take the quiz →
            </div>
          </div>
        </div>
      ),
      size
    );
  } catch (err) {
    console.error("[opengraph-image q/id] failed:", err);
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
