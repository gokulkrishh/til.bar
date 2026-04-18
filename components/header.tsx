import { createClient } from "@/lib/supabase/server";
import { Profile } from "@/components/profile";
import { SearchButton } from "@/components/search";
import SignIn from "./signin";
import Link from "next/link";
import Image from "next/image";

export async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let emailDigestEnabled = false;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("settings")
      .eq("id", user.id)
      .single();
    const settings = (data?.settings ?? {}) as {
      email_digest_enabled?: boolean;
    };
    emailDigestEnabled = settings.email_digest_enabled === true;
  }

  return (
    <header className="flex items-center justify-between py-5">
      <Link className="active:scale-98 inline-flex items-center" href="/">
        <Image priority src="/logo.svg" alt="TIL Logo" width={28} height={28} />
      </Link>
      <div className="flex items-center gap-2">
        {user && <SearchButton />}
        {user ? (
          <Profile user={user} emailDigestEnabled={emailDigestEnabled} />
        ) : (
          <SignIn />
        )}
      </div>
    </header>
  );
}

export const FallbackHeader = () => (
  <header className="flex items-center justify-between h-20">
    <Link className="active:scale-98 inline-flex items-center" href="/">
      <Image priority src="/logo.svg" alt="TIL Logo" width={28} height={28} />
    </Link>
  </header>
);
