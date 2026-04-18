"use client";

const SUPER_ADMIN_EMAIL =
  process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || "mahanaimype@gmail.com";

export function MessageUsLink({
  subject = "YPE Bible Quiz — message",
  body = "",
  label = "Message us",
  className,
}: {
  subject?: string;
  body?: string;
  label?: string;
  className?: string;
}) {
  const href = `mailto:${SUPER_ADMIN_EMAIL}?subject=${encodeURIComponent(
    subject
  )}${body ? `&body=${encodeURIComponent(body)}` : ""}`;

  return (
    <a
      href={href}
      className={
        className ||
        "text-sm text-blue-600 dark:text-blue-400 hover:underline"
      }
    >
      {label}
    </a>
  );
}
