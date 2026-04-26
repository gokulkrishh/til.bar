import "server-only";

import { Resend } from "resend";
import { render } from "@react-email/render";
import {
  WeeklyDigestEmail,
  type DigestSynthesisInput,
  type DigestTil,
} from "@/emails/weekly-digest";

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
  synthesis,
  archiveTil = null,
}: {
  to: string;
  synthesis: DigestSynthesisInput;
  archiveTil?: DigestTil | null;
}) {
  const from = process.env.EMAIL_FROM;
  if (!from) throw new Error("EMAIL_FROM is not set");

  const appUrl = getAppUrl();
  const props = { appUrl, synthesis, archiveTil };
  const html = await render(WeeklyDigestEmail(props));
  const text = await render(WeeklyDigestEmail(props), { plainText: true });

  const subject = `Your TIL week — ${synthesis.themes[0].title}`;

  return getClient().emails.send({
    from,
    to,
    subject,
    html,
    text,
  });
}
