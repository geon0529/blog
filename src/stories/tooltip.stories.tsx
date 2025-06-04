import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const meta = {
  title: "UI/Tooltip",
  component: Tooltip,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <TooltipProvider>
        <div className="p-8">
          <Story />
        </div>
      </TooltipProvider>
    ),
  ],
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline">Hover me</Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Add to library</p>
      </TooltipContent>
    </Tooltip>
  ),
};

export const WithSidePositions: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-8">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Top</Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>Tooltip on top</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Right</Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>Tooltip on right</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Bottom</Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>Tooltip on bottom</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Left</Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>Tooltip on left</p>
        </TooltipContent>
      </Tooltip>
    </div>
  ),
};

export const WithCustomContent: Story = {
  render: () => (
    <div className="flex gap-4">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Simple Text</Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Simple tooltip text</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Rich Content</Button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="flex flex-col gap-1">
            <p className="font-semibold">Rich Tooltip</p>
            <p className="text-xs text-muted-foreground">
              This tooltip contains multiple lines of text and formatting.
            </p>
          </div>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">With Icon</Button>
        </TooltipTrigger>
        <TooltipContent>
          <div className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <p>Success message</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </div>
  ),
};

export const WithDifferentTriggers: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button>Button Trigger</Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Triggered by button</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-help underline decoration-dotted">
            Help text
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>This is helpful information</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <div className="w-8 h-8 bg-primary rounded-full cursor-pointer flex items-center justify-center text-primary-foreground text-sm">
            ?
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Custom element trigger</p>
        </TooltipContent>
      </Tooltip>
    </div>
  ),
};

export const WithCustomSideOffset: Story = {
  render: () => (
    <div className="flex gap-8">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Default Offset</Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Default side offset (4px)</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Large Offset</Button>
        </TooltipTrigger>
        <TooltipContent sideOffset={20}>
          <p>Large side offset (20px)</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">No Offset</Button>
        </TooltipTrigger>
        <TooltipContent sideOffset={0}>
          <p>No side offset (0px)</p>
        </TooltipContent>
      </Tooltip>
    </div>
  ),
};

export const DelayAndDuration: Story = {
  render: () => (
    <div className="flex gap-4">
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <Button variant="outline">Instant</Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>No delay</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip delayDuration={500}>
        <TooltipTrigger asChild>
          <Button variant="outline">Normal</Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>500ms delay</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip delayDuration={1000}>
        <TooltipTrigger asChild>
          <Button variant="outline">Slow</Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>1000ms delay</p>
        </TooltipContent>
      </Tooltip>
    </div>
  ),
};

export const Playground: Story = {
  args: {
    defaultOpen: false,
    delayDuration: 700,
    disableHoverableContent: false,
  },
  argTypes: {
    defaultOpen: {
      control: "boolean",
      description: "Whether the tooltip is open by default",
    },
    delayDuration: {
      control: { type: "range", min: 0, max: 2000, step: 100 },
      description:
        "The duration in milliseconds to wait before showing the tooltip",
    },
    disableHoverableContent: {
      control: "boolean",
      description:
        "Prevent the tooltip from opening when hovering over its content",
    },
  },
  render: (args) => (
    <Tooltip {...args}>
      <TooltipTrigger asChild>
        <Button variant="outline">Configure me</Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Playground tooltip</p>
      </TooltipContent>
    </Tooltip>
  ),
};
