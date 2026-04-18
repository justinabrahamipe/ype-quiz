import { ImageResponse } from "next/og";

export const alt = "YPE Bible Quiz";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          backgroundColor: "#0c0a09",
          backgroundImage:
            "radial-gradient(circle at 15% 15%, rgba(20,184,166,0.35) 0%, transparent 55%), radial-gradient(circle at 90% 90%, rgba(217,119,6,0.3) 0%, transparent 50%)",
          color: "#f5f5f4",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            marginBottom: 24,
          }}
        >
          <div
            style={{ width: 64, height: 4, background: "#fbbf24" }}
          />
          <div
            style={{
              color: "#fbbf24",
              fontSize: 38,
              fontWeight: 800,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            YPE Bible Quiz
          </div>
        </div>

        <div
          style={{
            fontSize: 92,
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            marginBottom: 24,
          }}
        >
          Read the Word.
        </div>
        <div
          style={{
            fontSize: 92,
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            color: "#2dd4bf",
            marginBottom: 40,
          }}
        >
          Ten chapters a week.
        </div>

        <div
          style={{
            display: "flex",
            gap: 40,
            fontSize: 28,
            color: "#a8a29e",
          }}
        >
          <div>10 chapters / week</div>
          <div>·</div>
          <div>Wed & Thu</div>
          <div>·</div>
          <div>Matthew 1–10</div>
        </div>

        <div
          style={{
            marginTop: "auto",
            fontSize: 22,
            color: "#78716c",
          }}
        >
          Mahanaim Church of God · Manchester
        </div>
      </div>
    ),
    { ...size }
  );
}
