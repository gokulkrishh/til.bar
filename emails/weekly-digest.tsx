import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export type DigestTil = {
  id: string;
  url: string;
  title: string | null;
  description: string | null;
  created_at: string;
  tags: { name: string }[];
};

type Props = {
  fullName: string | null;
  tils: DigestTil[];
  weekStart: Date;
  weekEnd: Date;
  appUrl: string;
};

const dayFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

const rangeFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

const dayKeyFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: "UTC",
});

function groupByDay(tils: DigestTil[]) {
  const groups = new Map<string, { date: Date; items: DigestTil[] }>();
  for (const til of tils) {
    const date = new Date(til.created_at);
    const key = dayKeyFormatter.format(date);
    const bucket = groups.get(key);
    if (bucket) {
      bucket.items.push(til);
    } else {
      groups.set(key, { date, items: [til] });
    }
  }
  return Array.from(groups.values()).sort(
    (a, b) => b.date.getTime() - a.date.getTime(),
  );
}

export function WeeklyDigestEmail({
  fullName,
  tils,
  weekStart,
  weekEnd,
  appUrl,
}: Props) {
  const groups = groupByDay(tils);
  const greetingName = fullName?.split(" ")[0] ?? "there";
  const range = `${rangeFormatter.format(weekStart)} – ${rangeFormatter.format(weekEnd)}`;
  const preview = `${tils.length} link${tils.length === 1 ? "" : "s"} from ${range}`;

  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading as="h1" style={h1}>
            Your TIL week
          </Heading>
          <Text style={subtitle}>
            Hi {greetingName}, here&apos;s what you saved between {range}.
          </Text>

          {groups.map(({ date, items }) => (
            <Section key={date.toISOString()} style={daySection}>
              <Heading as="h2" style={h2}>
                {dayFormatter.format(date)}
              </Heading>
              {items.map((til) => (
                <Section key={til.id} style={itemSection}>
                  <Link href={til.url} style={itemLink}>
                    {til.title?.trim() || til.url}
                  </Link>
                  {til.description && (
                    <Text style={itemDescription}>{til.description}</Text>
                  )}
                  {til.tags.length > 0 && (
                    <Text style={tagRow}>
                      {til.tags.map((tag) => `#${tag.name}`).join("  ")}
                    </Text>
                  )}
                </Section>
              ))}
            </Section>
          ))}

          <Hr style={hr} />
          <Text style={footer}>
            Times are shown in UTC.{" "}
            <Link href={`${appUrl}/?settings=account`} style={footerLink}>
              Manage notifications
            </Link>
            .
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default WeeklyDigestEmail;

const body = {
  backgroundColor: "#ffffff",
  color: "#111827",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif",
};

const container = {
  margin: "0 auto",
  padding: "32px 20px",
  maxWidth: "560px",
};

const h1 = {
  fontSize: "24px",
  fontWeight: 600,
  margin: "0 0 8px",
};

const subtitle = {
  fontSize: "14px",
  color: "#6b7280",
  margin: "0 0 24px",
};

const daySection = {
  margin: "0 0 24px",
};

const h2 = {
  fontSize: "13px",
  fontWeight: 600,
  textTransform: "uppercase" as const,
  letterSpacing: "0.04em",
  color: "#6b7280",
  margin: "0 0 12px",
};

const itemSection = {
  padding: "12px 0",
  borderTop: "1px solid #e5e7eb",
};

const itemLink = {
  fontSize: "15px",
  fontWeight: 500,
  color: "#111827",
  textDecoration: "underline",
};

const itemDescription = {
  fontSize: "13px",
  color: "#4b5563",
  margin: "6px 0 0",
  lineHeight: "1.5",
};

const tagRow = {
  fontSize: "12px",
  color: "#6b7280",
  margin: "8px 0 0",
};

const hr = {
  borderColor: "#e5e7eb",
  margin: "24px 0",
};

const footer = {
  fontSize: "12px",
  color: "#9ca3af",
  margin: 0,
};

const footerLink = {
  color: "#6b7280",
  textDecoration: "underline",
};
