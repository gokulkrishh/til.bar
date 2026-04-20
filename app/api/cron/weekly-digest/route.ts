import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWeeklyDigest } from "@/lib/email/resend";
import type { DigestTil } from "@/emails/weekly-digest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const CHUNK_SIZE = 10;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured" },
      { status: 500 },
    );
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setUTCDate(weekStart.getUTCDate() - 7);

  const admin = createAdminClient();

  const { data: profiles, error: profilesError } = await admin
    .from("profiles")
    .select("id, email, full_name, settings")
    .eq("settings->>email_digest_enabled", "true");

  if (profilesError) {
    console.error("[weekly-digest] failed to load profiles", profilesError);
    return NextResponse.json(
      { error: "Failed to load opted-in users" },
      { status: 500 },
    );
  }

  const results = {
    total: profiles?.length ?? 0,
    sent: 0,
    skipped: 0,
    failed: 0,
  };

  if (!profiles || profiles.length === 0) {
    return NextResponse.json(results);
  }

  for (let i = 0; i < profiles.length; i += CHUNK_SIZE) {
    const chunk = profiles.slice(i, i + CHUNK_SIZE);

    const settled = await Promise.allSettled(
      chunk.map(async (profile) => {
        const { data: tils, error: tilsError } = await admin
          .from("tils")
          .select(
            "id, url, title, description, created_at, tags:til_tags(...tags(name))",
          )
          .eq("user_id", profile.id)
          .gte("created_at", weekStart.toISOString())
          .order("created_at", { ascending: false });

        if (tilsError) throw tilsError;

        if (!tils || tils.length === 0) {
          return { status: "skipped" as const, email: profile.email };
        }

        await sendWeeklyDigest({
          to: profile.email,
          fullName: profile.full_name,
          tils: tils as unknown as DigestTil[],
          weekStart,
          weekEnd: now,
        });

        return { status: "sent" as const, email: profile.email };
      }),
    );

    for (const outcome of settled) {
      if (outcome.status === "fulfilled") {
        if (outcome.value.status === "sent") results.sent += 1;
        else results.skipped += 1;
      } else {
        results.failed += 1;
        console.error("[weekly-digest] send failed", outcome.reason);
      }
    }
  }

  return NextResponse.json(results);
}
