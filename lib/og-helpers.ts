import { promises as fs } from "fs";
import path from "path";

export async function fetchImageAsDataUri(
  url: string | null | undefined,
  timeoutMs = 3000
): Promise<string | null> {
  if (!url) return null;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    const type = res.headers.get("content-type") || "image/jpeg";
    const buffer = Buffer.from(await res.arrayBuffer());
    return `data:${type};base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
}

export async function readPublicImageAsDataUri(
  relativePath: string,
  mimeType = "image/png"
): Promise<string | null> {
  try {
    const buf = await fs.readFile(
      path.join(process.cwd(), "public", relativePath)
    );
    return `data:${mimeType};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}
