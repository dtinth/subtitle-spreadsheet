import { useStore } from "@nanostores/react";
import { DownloadIcon, ReloadIcon } from "@radix-ui/react-icons";
import { Button, Code, Flex } from "@radix-ui/themes";
import { computed } from "nanostores";
import { $subtitleEvents } from "./SubtitleEvents";
import { YouTubePlayer } from "./YouTubePlayer";
import { $currentTime, $duration } from "./YouTubePlayerState";
import { $YT } from "./YoutubeApi";
import { $sheetData, $sheetDataLoading } from "./sheetData";

const $youtubeId = computed([$sheetData], (sheetData) => {
  if (!sheetData) return;
  for (const [key, value] of sheetData.values) {
    if (key === "youtube") {
      return String(value);
    }
  }
});

export function VideoPlayer() {
  const yt = useStore($YT);
  const youtubeId = useStore($youtubeId);
  return (
    <Flex flexGrow="1">
      {youtubeId ? (
        yt ? (
          <YouTubePlayer yt={yt} youtubeId={youtubeId} key={youtubeId} />
        ) : (
          "Loading API..."
        )
      ) : (
        "No YouTube ID..."
      )}
    </Flex>
  );
}

export function VideoController() {
  const currentTime = useStore($currentTime);
  const duration = useStore($duration);
  const loading = useStore($sheetDataLoading);
  return (
    <Flex align="center" gap="1">
      <Code>
        {currentTime.toFixed(1)} / {duration.toFixed(1)}
      </Code>
      <Flex flexGrow="1" />
      <Flex flexShrink="0" gap="1">
        <Button
          disabled={loading}
          onClick={() => {
            $sheetDataLoading.set(true);
            parent.postMessage({ reload: {} }, "*");
          }}
        >
          <ReloadIcon />
        </Button>
        <Button disabled={loading} onClick={downloadVtt}>
          <DownloadIcon />
        </Button>
      </Flex>
    </Flex>
  );
}

function downloadVtt() {
  const output = [];
  output.push("WEBVTT");
  function formatTime(t: number) {
    const h = Math.floor(t / 3600)
      .toString()
      .padStart(2, "0");
    const m = Math.floor((t % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const s = Math.floor(t % 60)
      .toString()
      .padStart(2, "0");
    const ms = Math.floor((t * 1000) % 1000)
      .toString()
      .padStart(3, "0");
    return `${h}:${m}:${s}.${ms}`;
  }
  const cues = $subtitleEvents.get();
  for (const cue of cues) {
    if (!cue.text || !cue.duration) continue;
    const text = cue.text.replace(/`([^`]+)`/g, "<i>$1</i>");
    output.push("");
    output.push(
      `${formatTime(cue.time)} --> ${formatTime(cue.time + cue.duration)}`
    );
    output.push(text);
  }
  output.push("");
  const blob = new Blob([output.join("\n")], { type: "text/vtt" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "subtitles.vtt";
  a.click();
}
