import { Flex, Text } from "@radix-ui/themes";
import { useEffect } from "react";
import { EditorHint, EventVisualizer, SubtitlePreview } from "./Subtitles";
import { VideoController, VideoPlayer } from "./Video";
import { TimeTracker } from "./YouTubePlayer";
import { $sheetData, $sheetDataLoading, SheetData } from "./sheetData";

interface EventData {
  sheetDataLoaded?: {
    sheetData: SheetData;
  };
}

function App() {
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data as EventData;
      if (data.sheetDataLoaded) {
        $sheetData.set(data.sheetDataLoaded.sheetData);
        $sheetDataLoading.set(false);
      }
    };
    window.addEventListener("message", handleMessage);
    parent.postMessage({ ready: {} }, "*");
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return (
    <div style={{ position: "fixed", inset: 0, display: "flex" }}>
      <TimeTracker />
      <Flex flexGrow="1" direction="column">
        <Flex flexShrink="0" direction="column">
          <Flex
            flexShrink="0"
            style={{ aspectRatio: "16/9", position: "relative" }}
          >
            <VideoPlayer />
          </Flex>
          <Flex
            flexShrink="0"
            px="2"
            height="72px"
            align="center"
            justify="center"
            style={{ background: "#000", color: "#fff", textAlign: "center" }}
          >
            <SubtitlePreview />
          </Flex>
        </Flex>
        <Flex
          flexShrink="0"
          direction="column"
          p="2"
          style={{
            background: "var(--gray-2)",
            borderBottom: "1px solid var(--gray-8)",
          }}
        >
          <VideoController />
        </Flex>
        <Flex position="relative" flexGrow="1">
          <Flex
            position="absolute"
            inset="0"
            direction="column"
            overflow="auto"
          >
            <EventVisualizer />
          </Flex>
        </Flex>
        <Flex
          flexShrink="0"
          p="2"
          style={{
            background: "var(--gray-2)",
            borderTop: "1px solid var(--gray-8)",
          }}
        >
          <Text size="1" as="div">
            <EditorHint />
          </Text>
        </Flex>
      </Flex>
    </div>
  );
}

export default App;
