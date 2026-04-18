import "server-only";

import { Resend } from "resend";
import { render } from "@react-email/render";
import { WeeklyDigestEmail, type DigestTil } from "@/emails/weekly-digest";

let client: Resend | null = null;

function getClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not set");
  if (!client) client = new Resend(apiKey);
  return client;
}

function getAppUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  return "https://til.bar";
}

export async function sendWeeklyDigest({
  to,
  fullName,
  tils,
  weekStart,
  weekEnd,
}: {
  to: string;
  fullName: string | null;
  tils: DigestTil[];
  weekStart: Date;
  weekEnd: Date;
}) {
  const from = process.env.EMAIL_FROM;
  if (!from) throw new Error("EMAIL_FROM is not set");

  const appUrl = getAppUrl();
  const html = await render(
    WeeklyDigestEmail({ fullName, tils, weekStart, weekEnd, appUrl }),
  );

  const text = await render(
    WeeklyDigestEmail({ fullName, tils, weekStart, weekEnd, appUrl }),
    { plainText: true },
  );

  return getClient().emails.send({
    from,
    to,
    subject: `Your TIL week — ${tils.length} link${tils.length === 1 ? "" : "s"}`,
    html,
    text,
  });
}
