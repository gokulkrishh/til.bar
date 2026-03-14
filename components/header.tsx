import { createClient } from "@/lib/supabase/server";
import { Profile } from "@/components/profile";
import SignIn from "./signin";

export async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="flex items-center justify-between py-5">
      <h1 className="font-mono text-lg font-semibold tracking-tight">
        til{" "}
        <span className="text-sm font-normal text-muted-foreground">
          — today i learned
        </span>
      </h1>
      {user ? <Profile user={user} /> : <SignIn />}
    </header>
  );
}
