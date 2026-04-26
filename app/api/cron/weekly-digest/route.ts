import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWeeklyDigest } from "@/lib/email/resend";
import { generateDigestSynthesis } from "@/lib/ai-digest";
import type { DigestTil } from "@/emails/weekly-digest";

export const maxDuration = 60;

const CHUNK_SIZE = 10;
const DEFAULT_AI_CAP = 10;
const ARCHIVE_MIN_AGE_DAYS = 30;

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

  const aiCap = Number(
    process.env.WEEKLY_DIGEST_AI_MAX_USERS ?? DEFAULT_AI_CAP,
  );

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setUTCDate(weekStart.getUTCDate() - 7);

  const archiveCutoff = new Date(now);
  archiveCutoff.setUTCDate(archiveCutoff.getUTCDate() - ARCHIVE_MIN_AGE_DAYS);

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
    skippedNoSaves: 0,
    skippedNoAiBudget: 0,
    skippedAiFailed: 0,
    failed: 0,
    aiCap,
  };

  if (!profiles || profiles.length === 0) {
    return NextResponse.json(results);
  }

  let aiBudget = aiCap;

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
          return { status: "skippedNoSaves" as const };
        }

        if (aiBudget <= 0) {
          return { status: "skippedNoAiBudget" as const };
        }
        // Safe to decrement here: callbacks within a chunk are scheduled in
        // parallel but JS is single-threaded, so check-and-decrement is atomic.
        aiBudget -= 1;

        const { data: archive } = await admin
          .from("tils")
          .select(
            "id, url, title, description, created_at, tags:til_tags(...tags(name))",
          )
          .eq("user_id", profile.id)
          .lt("created_at", archiveCutoff.toISOString())
          .order("created_at", { ascending: false })
          .limit(20);

        let archiveTil: DigestTil | null = null;
        if (archive && archive.length > 0) {
          const pick = archive[Math.floor(Math.random() * archive.length)];
          archiveTil = pick as unknown as DigestTil;
        }

        const typedTils = tils as unknown as DigestTil[];
        const raw = await generateDigestSynthesis({
          tils: typedTils,
          archiveTil,
        });

        if (!raw) {
          return { status: "skippedAiFailed" as const };
        }

        const resolvedThemes = raw.themes
          .map((theme) => ({
            title: theme.title,
            items: theme.items
              .map((item) => {
                const til = typedTils[item.sourceIndex];
                if (!til) return null;
                return { url: til.url, title: til.title, note: item.note };
              })
              .filter((item): item is NonNullable<typeof item> =>
                Boolean(item),
              ),
          }))
          .filter((theme) => theme.items.length > 0);

        if (resolvedThemes.length === 0) {
          return { status: "skippedAiFailed" as const };
        }

        await sendWeeklyDigest({
          to: profile.email,
          synthesis: {
            themes: resolvedThemes,
            memoryLaneNote: raw.memoryLaneNote,
          },
          archiveTil: raw.memoryLaneNote ? archiveTil : null,
        });

        return { status: "sent" as const };
      }),
    );

    for (const outcome of settled) {
      if (outcome.status === "fulfilled") {
        switch (outcome.value.status) {
          case "sent":
            results.sent += 1;
            break;
          case "skippedNoSaves":
            results.skippedNoSaves += 1;
            break;
          case "skippedNoAiBudget":
            results.skippedNoAiBudget += 1;
            break;
          case "skippedAiFailed":
            results.skippedAiFailed += 1;
            break;
        }
      } else {
        results.failed += 1;
        console.error("[weekly-digest] send failed", outcome.reason);
      }
    }
  }

  return NextResponse.json(results);
}
