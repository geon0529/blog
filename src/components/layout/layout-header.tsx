import ThemeSwitcher from "@/components/theme-switcher";
import UserInfo from "@/components/user-info";
import { createClient } from "@/lib/supabase/server";

export default async function LayoutHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="w-full h-12 p-4 flex items-center justify-between">
      <div></div>
      <div className="flex items-center">
        {user ? <UserInfo user={user} /> : <ThemeSwitcher />}
      </div>
    </div>
  );
}
