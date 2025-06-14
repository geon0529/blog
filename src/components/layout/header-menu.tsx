import ThemeSwitcher from "@/components/theme-switcher";
import UserInfo from "@/components/user-info";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function HeaderMenu() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex items-center gap-4">
      <nav className="flex items-center gap-4">
        <Link
          href="/blog"
          className="text-sm font-medium transition-colors hover:text-primary"
        >
          Blog
        </Link>
        <Link
          href="/projects"
          className="text-sm font-medium transition-colors hover:text-primary"
        >
          Projects
        </Link>
        <Link
          href="/about"
          className="text-sm font-medium transition-colors hover:text-primary"
        >
          About
        </Link>
      </nav>
      <div>
        <ThemeSwitcher />
        {user ? <UserInfo user={user} /> : <></>}
      </div>
    </div>
  );
}
