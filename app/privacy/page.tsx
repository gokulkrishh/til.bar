import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — til.bar",
};

export default function PrivacyPage() {
  return (
    <div className="flex flex-col gap-6 py-10 max-w-2xl mx-auto text-sm text-muted-foreground leading-relaxed">
      <h1 className="text-xl font-semibold text-foreground">Privacy Policy</h1>
      <p className="text-xs text-muted-foreground">
        Last updated: March 15, 2026
      </p>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-foreground">
          What we collect
        </h2>
        <p>
          We only collect what is necessary to provide the service. When you
          sign in with Google, we store your name, email, and profile picture.
          Links you save are stored along with automatically fetched metadata
          (title, description).
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-foreground">
          Chrome extension
        </h2>
        <p>
          The til.bar Chrome extension reads the URL of pages you choose to
          save. It does not track browsing history, collect data in the
          background, or access any page content. Authentication tokens are
          stored locally in your browser.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-foreground">
          How we use your data
        </h2>
        <p>
          Your data is used solely to operate til.bar. We do not sell, share, or
          transfer your data to third parties. AI features (metadata
          improvement, tag generation) process your saved links but do not store
          data beyond what is shown in the app.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-foreground">Cookies</h2>
        <p>
          We use cookies to maintain your session. No tracking or analytics
          cookies are used.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-foreground">Data deletion</h2>
        <p>
          You can delete your account and all associated data from Settings →
          Data control. This action is permanent and cannot be undone.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-foreground">Contact</h2>
        <p>
          Questions about this policy? Reach out at{" "}
          <a
            href="mailto:krishnangokul9@gmail.com"
            className="text-foreground underline underline-offset-4"
          >
            krishnangokul9@gmail.com
          </a>
        </p>
      </section>
    </div>
  );
}
