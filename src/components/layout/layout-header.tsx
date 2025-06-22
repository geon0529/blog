import Logo from "@/components/layout/logo";
import HeaderMenu from "@/components/layout/header-menu";

export default async function LayoutHeader() {
  return (
    <div className="flex items-center justify-between w-full h-12 p-4">
      <Logo />
      <HeaderMenu />
    </div>
  );
}
