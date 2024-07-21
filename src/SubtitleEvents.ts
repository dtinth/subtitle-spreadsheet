import { computed } from "nanostores";
import { $sheetData } from "./sheetData";

export interface SubtitleEvent {
  row: number;
  time: number;
  text: string;
  duration: number;
}
export const $subtitleEvents = computed(
  [$sheetData],
  (sheetData): SubtitleEvent[] => {
    if (!sheetData) return [];
    const out: SubtitleEvent[] = [];
    let gap = 0;
    for (const [i, rowValues] of sheetData.values.entries()) {
      const [key, value] = rowValues;
      if (key === "gap") {
        gap = +value;
      }
      if (!key || !String(key).match(/^[\d.]+$/)) continue;
      const time = +key;
      const text = String(value).trim() || "";
      const row = sheetData.row + i;
      out.push({ time, text, row, duration: 0 });
    }
    out.sort((a, b) => a.time - b.time);
    for (let i = 1; i < out.length; i++) {
      out[i - 1].duration = Math.max(0, out[i].time - out[i - 1].time - gap);
    }
    if (out.length > 0) {
      out[out.length - 1].duration = 1;
    }
    return out;
  }
);
