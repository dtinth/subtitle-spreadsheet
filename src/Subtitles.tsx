import { useStore } from "@nanostores/react";
import { Box, Code, Flex, Text, TextArea } from "@radix-ui/themes";
import { getOrCreate } from "@thai/get-or-create";
import { useEffect, useMemo, useRef } from "react";
import { $rawAsrHint, $waveform } from "./AudioState";
import { $editingIndex, $focus, $hoverIndex, $hoverTime } from "./EditorState";
import { ScrollContainer } from "./ScrollContainer";
import { $subtitleEvents, SubtitleEvent } from "./SubtitleEvents";
import { $currentTime, $duration, $player } from "./YouTubePlayerState";
import { $sheetData, $sheetDataLoading } from "./sheetData";

export function EventVisualizer() {
  const subtitleEvents = useStore($subtitleEvents);
  const duration = useStore($duration);
  const maxSubtitleTime = useMemo(() => {
    let max = 0;
    for (const event of subtitleEvents) {
      max = Math.max(event.time, max);
    }
    return max;
  }, [subtitleEvents]);
  const maxTime = Math.max(duration, maxSubtitleTime + 1);
  const heightPerSecond = 30;
  const height = Math.round(maxTime * heightPerSecond);
  const onMouseMove = (y: number) => {
    $hoverTime.set(Math.round((y / heightPerSecond) * 10) / 10);
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "s") {
      const player = $player.get();
      player?.seekTo($hoverTime.get(), true);
      e.preventDefault();
    }
    if (e.key === " ") {
      const player = $player.get();
      if (player?.getPlayerState() === YT.PlayerState.PLAYING) {
        player.pauseVideo();
      } else {
        player?.playVideo();
      }
      e.preventDefault();
    }
    if (e.key === "j" || e.key === "ArrowRight" || e.key === "ArrowDown") {
      const player = $player.get();
      const target = $currentTime.get() + 2;
      $currentTime.set(target);
      player?.seekTo(target, true);
    }
    if (e.key === "k" || e.key === "ArrowLeft" || e.key === "ArrowUp") {
      const player = $player.get();
      const target = $currentTime.get() - 2;
      $currentTime.set(target);
      player?.seekTo(target, true);
    }
    if (e.key === "c") {
      parent.postMessage(
        { insertTime: { time: +$hoverTime.get().toFixed(1) } },
        "*"
      );
    }
    if (e.key === "n") {
      parent.postMessage(
        { insertTime: { time: +$currentTime.get().toFixed(1) } },
        "*"
      );
    }
    if (e.key === "f") {
      const index = $hoverIndex.get();
      if (index > -1) {
        const { row } = $subtitleEvents.get()[index];
        parent.postMessage({ selectCell: { row, column: 1 } }, "*");
      }
    }
    if (e.key === "x") {
      const index = $hoverIndex.get();
      if (index > -1) {
        const { row } = $subtitleEvents.get()[index];
        const sheetData = $sheetData.get()!;
        const rowIndex = row - sheetData.row;
        const before = sheetData.values[rowIndex][0];
        const after = +$hoverTime.get().toFixed(1);
        if (before !== after) {
          updateCell(row, 1, before, after);
        }
      }
    }
    if (e.key === "t") {
      const subtitleEvents = $subtitleEvents.get();
      const hoverTime = $hoverTime.get();
      let insertBefore = -1;
      let insertBeforeIndex = -1;
      for (let i = 1; i < subtitleEvents.length; i++) {
        if (subtitleEvents[i].time > hoverTime) {
          insertBefore = subtitleEvents[i].row;
          insertBeforeIndex = i;
          break;
        }
      }
      if (insertBefore !== -1) {
        insertNewRow(insertBefore, hoverTime);
        $editingIndex.set(insertBeforeIndex);
      }
    }
    if (e.key === "r") {
      if (!$sheetDataLoading.get()) {
        $sheetDataLoading.set(true);
        parent.postMessage({ reload: {} }, "*");
      }
    }
    if (e.key === "Enter") {
      const index = $hoverIndex.get();
      if (index > -1) {
        $editingIndex.set(index);
      }
    }
  };
  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    // Load audio file
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const json = JSON.parse(await file.text());
    if (!Array.isArray(json.waveform)) {
      alert("Invalid waveform data");
      return;
    }
    $waveform.set(json.waveform);
    if (Array.isArray(json.words)) {
      $rawAsrHint.set(
        json.words.map(([time, word]: [number, string]) => ({
          time,
          text: word,
        }))
      );
    }
  };
  return (
    <div
      onFocus={() => $focus.set(true)}
      onBlur={() => $focus.set(false)}
      onKeyDown={onKeyDown}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
    >
      <ScrollContainer
        id="main-timeline"
        height={height}
        onMouseMove={onMouseMove}
      >
        {(scrollTop, viewportHeight) => (
          <>
            <WaveformVisualizer
              top={scrollTop}
              height={viewportHeight}
              heightPerSecond={heightPerSecond}
            />
            <AsrHintVisualizer
              top={scrollTop}
              height={viewportHeight}
              heightPerSecond={heightPerSecond}
            />
            <CurrentTimeLine heightPerSecond={heightPerSecond} />
            <HoverLine heightPerSecond={heightPerSecond} />
            <SubtitleEventList
              heightPerSecond={heightPerSecond}
              subtitleEvents={subtitleEvents}
            />
          </>
        )}
      </ScrollContainer>
      <SubtitleTextEditorContainer />
    </div>
  );
}

function updateCell(
  row: number,
  column: number,
  from: number | string,
  to: number | string
) {
  const sheetData = $sheetData.get()!;
  const rowIndex = row - sheetData.row;
  const columnIndex = column - sheetData.column;
  const newSheetData = {
    ...sheetData,
    values: sheetData.values.map((row, i) => {
      if (i === rowIndex) {
        return row.map((cell, j) => {
          if (j === columnIndex) {
            return to;
          }
          return cell;
        });
      }
      return row;
    }),
  };
  $sheetData.set(newSheetData);
  parent.postMessage({ updateCell: { row, column, from, to } }, "*");
}

function insertNewRow(row: number, time: number) {
  const sheetData = $sheetData.get()!;
  const rowIndex = row - sheetData.row;
  const newSheetData = {
    ...sheetData,
    values: [
      ...sheetData.values.slice(0, rowIndex),
      [time, ""],
      ...sheetData.values.slice(rowIndex),
    ],
  };
  $sheetData.set(newSheetData);
  parent.postMessage({ createTime: { row, time } }, "*");
}

function SubtitleTextEditorContainer() {
  const editingIndex = useStore($editingIndex);
  if (!editingIndex) return null;
  return <SubtitleTextEditor index={editingIndex} key={editingIndex} />;
}
function SubtitleTextEditor(props: { index: number }) {
  const subtitleEvents = useStore($subtitleEvents);
  const event = subtitleEvents[props.index];
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const onKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    const focusTimeline = () => {
      const timelineElement = document.getElementById(
        "main-timeline"
      ) as HTMLElement | null;
      timelineElement?.focus();
    };
    if (e.key === "Escape") {
      $editingIndex.set(undefined);
      focusTimeline();
      e.preventDefault();
    }
    if (
      e.key === "Enter" &&
      !e.shiftKey &&
      !e.ctrlKey &&
      !e.metaKey &&
      !e.altKey
    ) {
      updateCell(event.row, 2, event.text, textareaRef.current!.value);
      $editingIndex.set(undefined);
      focusTimeline();
      e.preventDefault();
    }
    // Pressing option-enter will insert a newline
    const textarea = textareaRef.current;
    if (e.key === "Enter" && (e.metaKey || e.altKey) && textarea) {
      const value = textarea.value;
      const start = textarea.selectionStart || 0;
      const end = textarea.selectionEnd || 0;
      const newValue = `${value.slice(0, start)}\n${value.slice(end)}`;
      textarea.value = newValue;
      textarea.setSelectionRange(start + 1, start + 1);
      e.preventDefault();
    }
  };
  useEffect(() => {
    setTimeout(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      textarea.focus();
      textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    });
  }, []);
  return (
    <Box
      position="absolute"
      top="0"
      left="0"
      right="0"
      style={{ zIndex: 100 }}
      p="2"
    >
      <TextArea
        defaultValue={event.text}
        onKeyDown={onKeyDown}
        ref={textareaRef}
      />
    </Box>
  );
}

function SubtitleEventList(props: {
  subtitleEvents: SubtitleEvent[];
  heightPerSecond: number;
}) {
  return useMemo(() => {
    return props.subtitleEvents.map((event, index) => {
      const top = Math.round(event.time * props.heightPerSecond);
      return (
        <SubtitleEventItem key={index} index={index} top={top} event={event} />
      );
    });
  }, [props.subtitleEvents, props.heightPerSecond]);
}

interface SubtitleEventItem {
  top: number;
  index: number;
  event: SubtitleEvent;
}
function SubtitleEventItem(props: SubtitleEventItem) {
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: props.top }}>
      <ActiveIndexConnector index={props.index}>
        {(active) => (
          <Box
            px="2"
            style={
              active
                ? {
                    borderTop: "1px solid var(--accent-8)",
                    color: "var(--accent-9)",
                  }
                : { borderTop: "1px solid var(--gray-a6)" }
            }
          >
            <Text size="1" style={{ whiteSpace: "pre-line" }}>
              <div style={{ lineHeight: 1.4 }}>{props.event.text}</div>
            </Text>
          </Box>
        )}
      </ActiveIndexConnector>
    </div>
  );
}

interface ActiveIndexConnector {
  index: number;
  children: (active: boolean) => React.ReactNode;
}
export function ActiveIndexConnector(props: ActiveIndexConnector) {
  const hoverIndex = useStore($hoverIndex);
  const active = hoverIndex === props.index;
  const render = props.children;
  const children = useMemo(() => render(active), [active, render]);
  return <>{children}</>;
}

export function SubtitlePreview() {
  const currentTime = useStore($currentTime);
  const subtitleEvents = useStore($subtitleEvents);
  const currentEvent = subtitleEvents.find(
    (event) =>
      event.time <= currentTime && event.time + event.duration > currentTime
  );
  return (
    <Text size="1" style={{ whiteSpace: "pre-line" }}>
      {currentEvent?.text}
    </Text>
  );
}

interface CurrentTimeLine {
  heightPerSecond: number;
}
function CurrentTimeLine(props: CurrentTimeLine) {
  const currentTime = useStore($currentTime);
  const top = Math.round(currentTime * props.heightPerSecond);
  return (
    <div
      style={{
        position: "absolute",
        top: top,
        left: 0,
        right: 0,
        height: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          height: 8,
          bottom: 0,
          left: 0,
          right: 0,
          background: "linear-gradient(to top, var(--orange-a6), transparent)",
        }}
      ></div>
    </div>
  );
}

interface HoverLine {
  heightPerSecond: number;
}
function HoverLine(props: HoverLine) {
  const hoverTime = useStore($hoverTime);
  const top = Math.round(hoverTime * props.heightPerSecond);
  return (
    <div
      style={{
        position: "absolute",
        top: top,
        left: 0,
        right: 0,
        height: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          height: 1,
          top: 0,
          left: 0,
          right: 0,
          background: "var(--red-a8)",
          boxShadow: "0 0 3px 0 var(--red-a7)",
        }}
      ></div>
      <div
        style={{
          position: "absolute",
          bottom: 4,
          right: 4,
          color: "var(--red-9)",
        }}
      >
        <Text size="1" weight="bold">
          {hoverTime.toFixed(1)}
        </Text>
      </div>
    </div>
  );
}

export function EditorHint() {
  const focus = useStore($focus);
  if (!focus) {
    return <>Focus on the timeline to activate keyboard shortcuts.</>;
  }
  const shortcuts = [
    ["Space", "Play/Pause"],
    ["J/→/↓", "Forward"],
    ["K/←/↑", "Backward"],
    ["S", "Seek to cursor"],
    ["C", "Insert cursor time"],
    ["T", "Create new row at time"],
    ["N", "Insert time at playhead"],
    ["F", "Focus subtitle cell"],
    ["X", "Fix time to cursor"],
    ["R", "Reload from sheet"],
  ];
  return (
    <>
      <Flex gapX="1" wrap="wrap" style={{ fontSize: "0.7em" }}>
        {shortcuts.map(([key, description]) => (
          <Text key={key}>
            <Code>{key}</Code> {description}
          </Text>
        ))}
      </Flex>
    </>
  );
}

const waveformMaxCache = new WeakMap<number[], number>();
interface WaveformVisualizer {
  top: number;
  height: number;
  heightPerSecond: number;
}
function WaveformVisualizer(props: WaveformVisualizer) {
  const waveform = useStore($waveform);
  const heightPerBar = props.heightPerSecond / 10;
  const buckets = Math.ceil((props.height / heightPerBar) * 2);
  const start = Math.floor(
    props.top / heightPerBar - props.height / heightPerBar / 2
  );
  const bars = Array.from({ length: buckets }, () => ({ top: 0, width: 0 }));
  const max = getOrCreate(waveformMaxCache, waveform, () => {
    let max = 0;
    for (const value of waveform) {
      max = Math.max(value, max);
    }
    return max;
  });
  for (let i = 0; i < buckets; i++) {
    const barIndex = start + i;
    if (barIndex < 0 || barIndex >= waveform.length) continue;
    const j = barIndex % buckets;
    bars[j].top = Math.round(barIndex * heightPerBar);
    bars[j].width = Math.round((waveform[barIndex] / max) * 100);
  }
  return bars.map((bar, i) => (
    <div
      key={i}
      style={{
        position: "absolute",
        top: bar.top,
        left: 0,
        width: `${bar.width}%`,
        height: heightPerBar,
        background: "var(--gray-a4)",
      }}
    />
  ));
}

interface AsrHintVisualizer {
  top: number;
  height: number;
  heightPerSecond: number;
}
function AsrHintVisualizer(props: AsrHintVisualizer) {
  const rawAsrHint = useStore($rawAsrHint);
  const minTime = (props.top - props.height / 2) / props.heightPerSecond;
  const maxTime = (props.top + props.height * 1.5) / props.heightPerSecond;
  const hints: React.ReactNode[] = [];
  for (const [i, hint] of rawAsrHint.entries()) {
    if (hint.time < minTime || hint.time > maxTime) continue;
    const top = Math.round(hint.time * props.heightPerSecond);
    hints.push(
      <div
        key={hint.time}
        style={{
          position: "absolute",
          top: top,
          width: "50%",
          right: (4 - (i % 5)) * 8 + "%",
          height: 0,
          color: "#0008",
          fontSize: "9px",
          textAlign: "right",
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <div style={{ borderTop: "1px solid #0004" }}>{hint.text}</div>
      </div>
    );
  }
  return <>{hints}</>;
}
