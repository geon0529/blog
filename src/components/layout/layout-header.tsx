import Logo from "@/components/layout/logo";
import HeaderMenu from "@/components/layout/header-menu";
import { createClient } from "@/lib/supabase/server";

export default async function LayoutHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex items-center justify-between w-full h-12 p-4">
      <Logo />
      <HeaderMenu />
    </div>
  );
}
