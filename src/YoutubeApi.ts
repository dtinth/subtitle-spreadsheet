import { atom } from "nanostores";

export const $YT = atom<typeof YT | undefined>(window.YT);

const script = document.createElement("script");
script.src = "https://www.youtube.com/iframe_api";
script.async = true;
document.body.appendChild(script);

const onYouTubeIframeAPIReady = () => {
  $YT.set(window.YT);
};

Object.assign(window, {
  onYouTubeIframeAPIReady,
});
