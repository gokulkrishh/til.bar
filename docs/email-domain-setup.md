# Email domain setup (Resend + Namecheap)

For the weekly digest feature, til.bar sends email via [Resend](https://resend.com). You don't create an email address anywhere — you authenticate the domain, then send from any `@til.bar` address. No mailbox required.

---

## 1. Add the domain in Resend

1. https://resend.com → **Sign up** / log in.
2. Sidebar → **Domains** → **Add Domain**.
3. Enter `til.bar` (or `send.til.bar` — see note below) → **Add**.
4. Resend shows a table of DNS records: typically **1× MX**, **1× TXT (SPF)**, **1× TXT (DKIM)**. Leave this tab open.

> **Root vs subdomain**: Resend's current default is a subdomain like `send.til.bar` (sender becomes `no-reply@send.til.bar`). This isolates email reputation from the root domain — recommended. If Resend shows `send` as the host, you're on the subdomain path.

## 2. Add DNS records in Namecheap

1. https://namecheap.com → sign in.
2. **Domain List** → **Manage** next to `til.bar`.
3. Top tab → **Advanced DNS**.
4. For each Resend row, click **Add New Record**:

### MX record

| Field       | Value                                                            |
| ----------- | ---------------------------------------------------------------- |
| Type        | MX Record                                                        |
| Host        | `send` (whatever Resend specifies)                               |
| Mail Server | value from Resend (e.g. `feedback-smtp.us-east-1.amazonses.com`) |
| Priority    | `10`                                                             |
| TTL         | Automatic                                                        |

### TXT — SPF

| Field | Value                               |
| ----- | ----------------------------------- |
| Type  | TXT Record                          |
| Host  | `send` (same subdomain as MX)       |
| Value | `v=spf1 include:amazonses.com ~all` |
| TTL   | Automatic                           |

### TXT — DKIM

| Field | Value                                                                           |
| ----- | ------------------------------------------------------------------------------- |
| Type  | TXT Record                                                                      |
| Host  | `resend._domainkey` (strip `.til.bar` — Namecheap auto-appends the root domain) |
| Value | the long public-key string from Resend (one line)                               |
| TTL   | Automatic                                                                       |

5. Click the green ✓ on each row to save.

### Namecheap gotchas

- Host values **must not include the root domain**. If Resend says `resend._domainkey.til.bar`, enter only `resend._domainkey`.
- For a record on the root itself, use `@`.
- TXT values: don't wrap the value in quotes yourself — Namecheap adds them.

## 3. Verify in Resend

1. Back in Resend → **Domains** → click your domain → **Verify DNS Records**.
2. Takes 1–15 minutes for DNS to propagate. All three records turn green when verified.

## 4. Configure the app

Once the domain is verified, fill `.env.local`:

```
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=til.bar <no-reply@til.bar>
CRON_SECRET=some-long-random-string
```

> If you used the `send.til.bar` subdomain path, update `EMAIL_FROM` to `til.bar <no-reply@send.til.bar>`.

Generate a `CRON_SECRET`:

```bash
openssl rand -hex 32
```

Remember to mirror both variables in the Vercel dashboard → Project → Settings → Environment Variables for production.

## 5. Send address options

Any address under the verified domain works — no setup per address:

- `no-reply@til.bar` — standard for transactional / digest mail
- `hello@til.bar`
- `digest@til.bar`

## FAQ

**Do I need Google Workspace?** No. Workspace is for _receiving_ mail. Resend is send-only.

**What happens if someone replies to `no-reply@til.bar`?** It bounces. If you want replies, add a `Reply-To` header pointing at a real inbox (e.g. your personal Gmail) in the `sendWeeklyDigest` helper.

**Can I send from multiple addresses?** Yes — any local-part under the verified domain works without extra config.

**Cost?** Resend's free tier covers 3,000 emails/month and 100/day — plenty for a single-user weekly digest.
