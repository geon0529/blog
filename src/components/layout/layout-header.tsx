import { ThemeSwitcher } from "@/components/theme-switcher";

export default function LayoutHeader() {
  return (
    <div className="w-full h-12 p-4 flex items-center">
      <ThemeSwitcher />
    </div>
  );
}
