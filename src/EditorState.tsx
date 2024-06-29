import { atom, computed } from "nanostores";
import { $subtitleEvents } from "./SubtitleEvents";

export const $focus = atom(false);
export const $hoverTime = atom(0);

export const $hoverIndex = computed(
  [$subtitleEvents, $hoverTime],
  (subtitleEvents, hoverTime) => {
    let minDistance = Infinity;
    let minIndex = -1;
    for (let i = 0; i < subtitleEvents.length; i++) {
      const distance = Math.abs(subtitleEvents[i].time - hoverTime);
      if (distance < minDistance && distance < 3) {
        minDistance = distance;
        minIndex = i;
      }
    }
    return minIndex;
  }
);
