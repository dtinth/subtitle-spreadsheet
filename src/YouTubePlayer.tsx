import { useStore } from "@nanostores/react";
import { useEffect, useRef } from "react";
import {
  $currentTime,
  $duration,
  $player,
  $playerState,
} from "./YouTubePlayerState";

export interface YouTubePlayer {
  yt: typeof YT;
  youtubeId: string;
}
export function YouTubePlayer({ yt, youtubeId }: YouTubePlayer) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const div = ref.current;
    if (!div) {
      console.warn("no div");
      return;
    }
    const player = new yt.Player(div, {
      height: "100%",
      width: "100%",
      videoId: youtubeId,
      events: {
        onStateChange: (event) => {
          $playerState.set(event.data);
          $duration.set(player.getDuration());
        },
      },
    });
    $player.set(player);
    return () => {
      try {
        player.destroy();
      } catch (e) {
        console.error("Unable to destroy player", e);
      }
    };
  }, [yt, youtubeId]);

  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "200%",
        height: "200%",
        transform: "scale(0.5)",
        transformOrigin: "0 0",
      }}
    />
  );
}

export function TimeTracker() {
  const playerState = useStore($playerState);
  const player = useStore($player);
  useEffect(() => {
    if (!player) return;
    if (playerState !== YT.PlayerState.PLAYING) return;
    const interval = setInterval(() => {
      $currentTime.set(player.getCurrentTime());
      $duration.set(player.getDuration());
    }, 16);
    return () => clearInterval(interval);
  }, [playerState, player]);
  return <></>;
}
