"use client";

import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSoundSettings } from "@/context/sound-provider";
import { useHapticsSettings, useAppHaptics } from "@/context/haptics-provider";
import { Switch } from "@/components/ui/switch";

export function AppearanceTab() {
  const { theme, setTheme } = useTheme();
  const { soundEnabled, setSoundEnabled } = useSoundSettings();
  const { hapticsEnabled, setHapticsEnabled } = useHapticsSettings();
  const trigger = useAppHaptics();

  return (
    <div className="flex flex-col gap-2 py-4 px-1 overflow-hidden">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Theme</h3>
          <p className="text-xs text-muted-foreground">
            Choose your preferred theme
          </p>
        </div>
        <div className="flex border border-muted rounded-full p-0.75 w-fit">
          {[
            { value: "system", label: "System", icon: Monitor },
            { value: "light", label: "Light", icon: Sun },
            { value: "dark", label: "Dark", icon: Moon },
          ].map(({ value, label, icon: Icon }) => (
            <button
              className={cn(
                "rounded-full cursor-pointer p-1.25 hover:bg-muted hit-area-1",
                {
                  "bg-primary text-white hover:bg-primary": theme === value,
                },
              )}
              key={value}
              onClick={() => {
                setTheme(value);
                trigger("light");
              }}
              aria-label={label}
            >
              <Icon className="size-3" />
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between pt-4">
        <div>
          <h3 className="text-sm font-semibold">Sound</h3>
          <p className="text-xs text-muted-foreground">
            Play sounds on actions
          </p>
        </div>
        <Switch
          checked={soundEnabled}
          onCheckedChange={() => {
            trigger("light");
            setSoundEnabled(!soundEnabled);
          }}
        />
      </div>
      <div className="flex items-center justify-between pt-4">
        <div>
          <h3 className="text-sm font-semibold">Haptics</h3>
          <p className="text-xs text-muted-foreground">Vibrate on actions</p>
        </div>
        <Switch
          checked={hapticsEnabled}
          onCheckedChange={() => {
            setHapticsEnabled(!hapticsEnabled);
            trigger("light");
          }}
        />
      </div>
    </div>
  );
}
