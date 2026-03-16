"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type SoundContextType = {
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
};

const SoundContext = createContext<SoundContextType>({
  soundEnabled: true,
  setSoundEnabled: () => {},
});

export function useSoundSettings() {
  return useContext(SoundContext);
}

const STORAGE_KEY = "til-bar-sound";

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window === "undefined") return true;
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored !== null ? stored === "true" : true;
  });

  const handleSetSoundEnabled = useCallback((enabled: boolean) => {
    setSoundEnabled(enabled);
    localStorage.setItem(STORAGE_KEY, String(enabled));
  }, []);

  const value = useMemo(
    () => ({ soundEnabled, setSoundEnabled: handleSetSoundEnabled }),
    [soundEnabled, handleSetSoundEnabled],
  );

  return <SoundContext value={value}>{children}</SoundContext>;
}
