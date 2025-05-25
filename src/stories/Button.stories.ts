import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";

import { Button } from "./Button";

// 스토리 설정 방법에 대한 자세한 내용: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
  title: "Example/Button",
  component: Button,
  parameters: {
    // 캔버스에서 컴포넌트를 중앙에 배치하는 선택적 매개변수. 자세한 정보: https://storybook.js.org/docs/configure/story-layout
    layout: "centered",
  },
  // 이 컴포넌트는 자동으로 생성된 Autodocs 항목을 가집니다: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ["autodocs"],
  // argTypes에 대한 자세한 내용: https://storybook.js.org/docs/api/argtypes
  argTypes: {
    backgroundColor: { control: "color" },
  },
  // `fn`을 사용하여 onClick 인자를 감시합니다. 호출되면 actions 패널에 나타납니다: https://storybook.js.org/docs/essentials/actions#action-args
  args: { onClick: fn() },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// args를 사용한 스토리 작성에 대한 자세한 내용: https://storybook.js.org/docs/writing-stories/args
export const Primary: Story = {
  args: {
    primary: true,
    label: "Button",
  },
};

export const Secondary: Story = {
  args: {
    label: "Button",
  },
};

export const Large: Story = {
  args: {
    size: "large",
    label: "Button",
  },
};

export const Small: Story = {
  args: {
    size: "small",
    label: "Button",
  },
};
