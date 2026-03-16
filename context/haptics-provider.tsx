"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useWebHaptics } from "web-haptics/react";
import type { HapticInput } from "web-haptics";

type HapticsContextType = {
  hapticsEnabled: boolean;
  setHapticsEnabled: (enabled: boolean) => void;
  trigger: (input?: HapticInput) => void;
};

const HapticsContext = createContext<HapticsContextType>({
  hapticsEnabled: true,
  setHapticsEnabled: () => {},
  trigger: () => {},
});

export function useHapticsSettings() {
  const { hapticsEnabled, setHapticsEnabled } = useContext(HapticsContext);
  return { hapticsEnabled, setHapticsEnabled };
}

export function useAppHaptics() {
  const { trigger } = useContext(HapticsContext);
  return trigger;
}

const STORAGE_KEY = "til-bar-haptics";

export function HapticsProvider({ children }: { children: React.ReactNode }) {
  const { trigger: hapticTrigger } = useWebHaptics();
  const [hapticsEnabled, setHapticsEnabled] = useState(() => {
    if (typeof window === "undefined") return true;
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored !== null ? stored === "true" : true;
  });

  const handleSetHapticsEnabled = useCallback((enabled: boolean) => {
    setHapticsEnabled(enabled);
    localStorage.setItem(STORAGE_KEY, String(enabled));
  }, []);

  const trigger = useCallback(
    (input?: HapticInput) => {
      if (hapticsEnabled) {
        hapticTrigger(input);
      }
    },
    [hapticsEnabled, hapticTrigger],
  );

  const value = useMemo(
    () => ({
      hapticsEnabled,
      setHapticsEnabled: handleSetHapticsEnabled,
      trigger,
    }),
    [hapticsEnabled, handleSetHapticsEnabled, trigger],
  );

  return <HapticsContext value={value}>{children}</HapticsContext>;
}
