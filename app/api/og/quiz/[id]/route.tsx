import { ImageResponse } from "next/og";
import { prisma } from "@/lib/db";
import { readPublicImageAsDataUri } from "@/lib/og-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WIDTH = 1080;
const HEIGHT = 1350;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
      return new Response("Quiz not found", { status: 404 });
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
              "radial-gradient(circle at 15% 10%, rgba(20,184,166,0.35) 0%, transparent 55%), radial-gradient(circle at 85% 95%, rgba(217,119,6,0.3) 0%, transparent 50%)",
            color: "#f5f5f4",
            padding: "55px 60px",
            fontFamily: "sans-serif",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 18,
              marginBottom: 30,
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
            <div
              style={{
                display: "flex",
                padding: "8px 22px",
                borderRadius: 999,
                background: `${statusColor}22`,
                border: `2px solid ${statusColor}`,
                color: statusColor,
                fontSize: 24,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: 30,
              }}
            >
              {statusLabel}
            </div>

            <div
              style={{
                display: "flex",
                fontSize: 96,
                fontWeight: 900,
                letterSpacing: "-0.03em",
                lineHeight: 1.02,
                marginBottom: 14,
                textAlign: "center",
              }}
            >
              {quiz.title}
            </div>

            <div
              style={{
                display: "flex",
                fontSize: 40,
                color: "#2dd4bf",
                fontWeight: 700,
                marginBottom: 40,
              }}
            >
              {quiz.biblePortion}
            </div>

            <div
              style={{
                display: "flex",
                gap: 20,
                marginBottom: 40,
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  padding: "18px 32px",
                  borderRadius: 18,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    fontSize: 52,
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
                    fontSize: 18,
                    color: "#a8a29e",
                    marginTop: 6,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                  }}
                >
                  Questions
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  padding: "18px 32px",
                  borderRadius: 18,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    fontSize: 32,
                    fontWeight: 800,
                    color: "#e7e5e4",
                    lineHeight: 1,
                    marginTop: 12,
                  }}
                >
                  {window}
                </div>
                <div
                  style={{
                    display: "flex",
                    fontSize: 18,
                    color: "#a8a29e",
                    marginTop: 10,
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
                padding: "16px 36px",
                borderRadius: 14,
                background: "linear-gradient(135deg, #0f766e, #14b8a6)",
                color: "#f0fdfa",
                fontSize: 30,
                fontWeight: 700,
                letterSpacing: "0.04em",
              }}
            >
              Tap to take the quiz →
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
      { width: WIDTH, height: HEIGHT }
    );
  } catch (err) {
    console.error("[og/quiz] failed:", err);
    return new Response(
      `Failed to generate image: ${(err as Error)?.message || "unknown"}`,
      { status: 500 }
    );
  }
}
