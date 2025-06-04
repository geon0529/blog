"use client";

import { Button } from "@/components/ui/button";
import { Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { motion } from "motion/react";
import useIsMounted from "@/hooks/useIsMounted";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const themeLabelMapper: Record<string, string> = {
  light: "밝은 테마",
  dark: "어두운 테마",
  system: "시스템 테마",
};

export default function ThemeSwitcher() {
  const { theme = "light", setTheme } = useTheme();
  const { isMounted } = useIsMounted();
  const ICON_SIZE = 16;

  const onClickTheme = () => {
    switch (theme) {
      case "light": {
        setTheme("dark");
        break;
      }
      case "dark": {
        setTheme("system");
        break;
      }
      case "system": {
        setTheme("light");
        break;
      }
    }
  };

  if (!isMounted) {
    return (
      <Button variant="ghost" size={"sm"}>
        <motion.div
          key="light"
          initial={{
            rotate: 180,
          }}
          animate={{ rotate: 0 }}
        >
          <Sun
            key="light"
            size={ICON_SIZE}
            className={"text-muted-foreground"}
          />
        </motion.div>
      </Button>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size={"sm"} onClick={onClickTheme}>
          {theme === "light" ? (
            <motion.div
              key="light"
              initial={{
                rotate: 180,
              }}
              animate={{ rotate: 0 }}
            >
              <Sun
                key="light"
                size={ICON_SIZE}
                className={"text-muted-foreground"}
              />
            </motion.div>
          ) : theme === "dark" ? (
            <motion.div
              key="dark"
              initial={{
                rotate: 180,
              }}
              animate={{ rotate: 0 }}
            >
              <Moon
                key="dark"
                size={ICON_SIZE}
                className={"text-muted-foreground"}
              />
            </motion.div>
          ) : (
            <motion.div
              key="system"
              initial={{
                rotate: 180,
              }}
              animate={{ rotate: 0 }}
            >
              <Laptop
                key="system"
                size={ICON_SIZE}
                className={"text-muted-foreground"}
              />
            </motion.div>
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>{themeLabelMapper[theme]}</p>
      </TooltipContent>
    </Tooltip>
  );
}
