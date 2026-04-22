"use client";

import { useSound } from "@web-kits/audio/react";
import type { SoundDefinition } from "@web-kits/audio";
import { clickSoftSound } from "@/sounds/click-soft";

export function useAppSound(sound: SoundDefinition = clickSoftSound) {
  return useSound(sound);
}
