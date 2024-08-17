import { atom } from "nanostores";

export const $waveform = atom<number[]>([]);
export const $rawAsrHint = atom<{ time: number; text: string }[]>([]);
