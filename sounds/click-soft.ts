import type { SoundDefinition } from "@web-kits/audio";

export const clickSoftSound: SoundDefinition = {
  source: { type: "sine", frequency: 800 },
  envelope: { attack: 0, decay: 0.015, sustain: 0, release: 0.005 },
  gain: 0.1,
};
