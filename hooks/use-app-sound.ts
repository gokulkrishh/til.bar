"use client";

import { useSound } from "@web-kits/audio/react";
import type { SoundDefinition } from "@web-kits/audio";

export function useAppSound(sound: SoundDefinition) {
  return useSound(sound);
}
