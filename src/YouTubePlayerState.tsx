import { atom } from "nanostores";

export const $player = atom<YT.Player | null>(null);
export const $playerState = atom<YT.PlayerState | null>(null);
export const $currentTime = atom(0);
export const $duration = atom(1);
