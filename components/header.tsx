import { createClient } from "@/lib/supabase/server";
import { Profile } from "@/components/profile";
import SignIn from "./signin";
import Link from "next/link";
import Image from "next/image";

export async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="flex items-center justify-between py-5">
      <Link className="active:scale-98 inline-flex items-center" href="/">
        <Image priority src="/logo.svg" alt="TIL Logo" width={28} height={28} />
      </Link>
      {user ? <Profile user={user} /> : <SignIn />}
    </header>
  );
}
