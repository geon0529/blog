import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "@storybook/test";
import { ThemeProvider } from "next-themes";
import { ThemeSwitcher } from "../components/theme-switcher";
import clsx from "clsx";

const meta = {
  title: "UI/ThemeSwitcher",
  component: ThemeSwitcher,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "사용자가 라이트, 다크, 시스템 테마 간을 전환할 수 있도록 하는 Theme Switcher 컴포넌트입니다. (next-themes)",
      },
    },
  },
  tags: ["autodocs"], // <- 상단에 첫번째 스토리를 자동으로 띄움
  // ThemeProvider로 감싸는 데코레이터
  decorators: [
    (Story, context) => {
      const { parameters } = context;
      const initialTheme = parameters?.theme || "light";
      return (
        <ThemeProvider
          attribute="class"
          defaultTheme={initialTheme}
          disableTransitionOnChange
        >
          <div className={clsx("p-4")}>
            <Story />
          </div>
        </ThemeProvider>
      );
    },
  ],
} satisfies Meta<typeof ThemeSwitcher>;

export default meta;
type Story = StoryObj<typeof meta>;

// 기본 스토리
export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: "theme 을 변경해주는 Theme switcher 입니다.",
      },
    },
    theme: "light",
  },
  decorators: [
    (Story) => {
      return (
        <div className="min-h-[200px] w-full bg-background text-foreground p-8 rounded-lg border transition-colors">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Theme switcher demo</h3>
            <p className="text-muted-foreground">
              스위처를 클릭하여 배경 변화를 확인하세요
            </p>
            <Story />
          </div>
        </div>
      );
    },
  ],
};

// 인터랙션 테스트 스토리
export const InteractiveTest: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 드롭다운 트리거 버튼 찾기
    const triggerButton = canvas.getByRole("button");

    // 드롭다운 열기
    await userEvent.click(triggerButton);

    // 드롭다운 메뉴가 열렸는지 확인
    const dropdown = canvas.getByRole("menu");
    await expect(dropdown).toBeInTheDocument();

    // 각 테마 옵션이 있는지 확인
    const lightOption = canvas.getByText("Light");
    const darkOption = canvas.getByText("Dark");
    const systemOption = canvas.getByText("System");

    await expect(lightOption).toBeInTheDocument();
    await expect(darkOption).toBeInTheDocument();
    await expect(systemOption).toBeInTheDocument();

    // Dark 테마 선택해보기
    await userEvent.click(darkOption);

    // 드롭다운이 닫혔는지 확인 (잠시 대기)
    await new Promise((resolve) => setTimeout(resolve, 100));
  },
  parameters: {
    docs: {
      description: {
        story:
          "드롭다운을 열고 다양한 테마 옵션을 선택하는 인터랙션 테스트입니다.",
      },
    },
  },
};
