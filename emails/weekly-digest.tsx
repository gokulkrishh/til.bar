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

export type DigestThemeItem = {
  url: string;
  title: string | null;
  note: string;
};

export type DigestSynthesisInput = {
  themes: {
    title: string;
    items: DigestThemeItem[];
  }[];
  memoryLaneNote: string | null;
};

type Props = {
  appUrl: string;
  synthesis: DigestSynthesisInput;
  archiveTil?: DigestTil | null;
};

const archiveDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export function WeeklyDigestEmail({ appUrl, synthesis, archiveTil }: Props) {
  const preview = synthesis.themes[0]?.title ?? "Your TIL week";

  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading as="h1" style={h1}>
            Your TIL week
          </Heading>

          {synthesis.themes.map((theme) => (
            <Section key={theme.title} style={themeBlock}>
              <Text style={sectionLabel}>{theme.title}</Text>
              {theme.items.map((item) => (
                <Section key={item.url} style={itemBlock}>
                  <Link href={item.url} style={itemLink}>
                    {item.title?.trim() || item.url}
                  </Link>
                  <Text style={itemNote}>{item.note}</Text>
                </Section>
              ))}
            </Section>
          ))}

          {archiveTil && synthesis.memoryLaneNote && (
            <>
              <Text style={sectionLabel}>From your archive</Text>
              <Section style={memoryLaneSection}>
                <Text style={memoryLaneNote}>{synthesis.memoryLaneNote}</Text>
                <Text style={memoryLaneMeta}>
                  ↳{" "}
                  <Link href={archiveTil.url} style={memoryLaneLink}>
                    {archiveTil.title?.trim() || archiveTil.url}
                  </Link>{" "}
                  ·{" "}
                  {archiveDateFormatter.format(new Date(archiveTil.created_at))}
                </Text>
              </Section>
            </>
          )}

          <Hr style={hr} />
          <Text style={footer}>
            <Link href={appUrl} style={footerLink}>
              Open til.bar
            </Link>
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
  fontSize: "20px",
  fontWeight: 600,
  color: "#111827",
  margin: "0 0 16px",
};

const sectionLabel = {
  fontSize: "11px",
  fontWeight: 600,
  textTransform: "uppercase" as const,
  letterSpacing: "0.06em",
  color: "#9ca3af",
  margin: "0 0 12px",
};

const themeBlock = {
  margin: "0 0 28px",
};

const itemBlock = {
  margin: "0 0 16px",
};

const itemLink = {
  fontSize: "15px",
  fontWeight: 500,
  color: "#111827",
  textDecoration: "underline",
  lineHeight: "1.4",
};

const itemNote = {
  fontSize: "14px",
  color: "#4b5563",
  margin: "4px 0 0",
  lineHeight: "1.55",
};

const memoryLaneSection = {
  margin: "8px 0 0",
  padding: "12px 16px",
  borderLeft: "3px solid #d1d5db",
};

const memoryLaneNote = {
  fontSize: "14px",
  color: "#374151",
  margin: 0,
  lineHeight: "1.5",
};

const memoryLaneMeta = {
  fontSize: "12px",
  color: "#6b7280",
  margin: "6px 0 0",
};

const memoryLaneLink = {
  color: "#374151",
  textDecoration: "underline",
};

const hr = {
  borderColor: "#e5e7eb",
  margin: "24px 0 12px",
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
