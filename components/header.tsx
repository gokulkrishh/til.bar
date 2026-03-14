import { createClient } from "@/lib/supabase/server";
import { Profile } from "@/components/profile";
import SignIn from "./signin";
import Link from "next/link";

export async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="flex items-center justify-between py-5">
      <Link className="active:scale-99" href="/">
        <h1 className="flex items-baseline font-mono text-lg font-semibold tracking-tight gap-2">
          til{" "}
          <span className="text-sm font-normal text-muted-foreground">
            — today i learned
          </span>
        </h1>
      </Link>
      {user ? <Profile user={user} /> : <SignIn />}
    </header>
  );
}
