"use client";

import { createContext, useContext, useState, useEffect } from "react";

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
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      setSoundEnabled(stored === "true");
    }
  }, []);

  const handleSetSoundEnabled = (enabled: boolean) => {
    setSoundEnabled(enabled);
    localStorage.setItem(STORAGE_KEY, String(enabled));
  };

  return (
    <SoundContext
      value={{ soundEnabled, setSoundEnabled: handleSetSoundEnabled }}
    >
      {children}
    </SoundContext>
  );
}
