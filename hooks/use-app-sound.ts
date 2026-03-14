"use client";

import { useSound } from "@/hooks/use-sound";
import { useSoundSettings } from "@/context/sound-provider";
import type { SoundAsset } from "@/lib/sound-types";

export function useAppSound(sound: SoundAsset) {
  const { soundEnabled } = useSoundSettings();
  return useSound(sound, { soundEnabled });
}
