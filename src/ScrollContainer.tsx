import { useEffect, useRef, useState } from "react";

export interface ScrollContainer {
  id: string;
  height: number;
  onMouseMove: (y: number) => void;
  children: (scrollTop: number, height: number) => React.ReactNode;
}
export function ScrollContainer(props: ScrollContainer) {
  const ref = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(-1);
  useEffect(() => {
    if (!ref.current) return;
    setScrollTop(Math.round(ref.current.scrollTop));
  }, []);
  return (
    <div
      id={props.id}
      className="with-focus"
      style={{
        position: "absolute",
        inset: 0,
        overflowY: "auto",
        overflowX: "hidden",
      }}
      tabIndex={0}
      ref={ref}
      onScroll={() => {
        if (!ref.current) return;
        setScrollTop(Math.round(ref.current.scrollTop));
      }}
      onMouseMove={(e) => {
        props.onMouseMove(
          e.clientY -
            (ref.current?.getBoundingClientRect().top || 0) +
            (ref.current?.scrollTop || 0)
        );
      }}
    >
      <div style={{ position: "relative", height: props.height }}>
        {props.children(scrollTop, ref.current?.offsetHeight || 0)}
      </div>
    </div>
  );
}
