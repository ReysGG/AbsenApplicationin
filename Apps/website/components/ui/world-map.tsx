"use client";

import { useRef, useEffect, useState } from "react";
import { LazyMotion, m, domAnimation } from "motion/react";
import DottedMap from "dotted-map";

interface MapProps {
  dots?: Array<{
    start: { lat: number; lng: number; label?: string };
    end: { lat: number; lng: number; label?: string };
  }>;
  lineColor?: string;
  theme?: "light" | "dark";
}

// Canonical fix for react-doctor/rerender-memo-with-default-value:
// A new [] is allocated on every render, breaking referential equality.
// Hoisting to module scope gives the same stable reference every time.
const EMPTY_DOTS: NonNullable<MapProps["dots"]> = [];

export default function WorldMap({
  dots = EMPTY_DOTS,
  lineColor = "#34D399",
  theme = "light",
}: MapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [svgMap, setSvgMap] = useState<string>("");

  useEffect(() => {
    // Generate dotted map SVG client-side to prevent SSR hydration errors
    const map = new DottedMap({ height: 100, grid: "diagonal" });
    const svg = map.getSVG({
      radius: 0.22,
      color: theme === "dark" ? "#FFFFFF30" : "#00000015",
      shape: "circle",
      backgroundColor: "transparent",
    });
    setSvgMap(svg);
  }, [theme]);

  const projectPoint = (lat: number, lng: number) => {
    const x = (lng + 180) * (800 / 360);
    const y = (90 - lat) * (400 / 180);
    return { x, y };
  };

  const createCurvedPath = (
    start: { x: number; y: number },
    end: { x: number; y: number }
  ) => {
    const midX = (start.x + end.x) / 2;
    const midY = Math.min(start.y, end.y) - 50;
    return `M ${start.x} ${start.y} Q ${midX} ${midY} ${end.x} ${end.y}`;
  };

  if (!svgMap) {
    return <div className="w-full aspect-2/1 bg-transparent animate-pulse rounded-lg" />;
  }

  return (
    <div className="w-full aspect-2/1 bg-transparent rounded-lg relative font-sans">
      <img
        src={`data:image/svg+xml;utf8,${encodeURIComponent(svgMap)}`}
        className="h-full w-full mask-[linear-gradient(to_bottom,transparent,white_10%,white_90%,transparent)] pointer-events-none select-none"
        alt="world map"
        height="495"
        width="1056"
        draggable={false}
      />
      <LazyMotion features={domAnimation}>
      <svg
        ref={svgRef}
        viewBox="0 0 800 400"
        className="w-full h-full absolute inset-0 pointer-events-none select-none"
      >
        {dots.map((dot, i) => {
          const startPoint = projectPoint(dot.start.lat, dot.start.lng);
          const endPoint = projectPoint(dot.end.lat, dot.end.lng);
          return (
            <g key={`path-group-${i}`}>
              {/* Core animated line */}
              <m.path
                d={createCurvedPath(startPoint, endPoint)}
                fill="none"
                stroke="url(#path-gradient)"
                strokeWidth="1.5"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{
                  duration: 2.5,
                  delay: 0.4 * i,
                  ease: "easeInOut",
                  repeat: Infinity,
                  repeatType: "loop",
                  repeatDelay: 1.5,
                }}
              />
              
              {/* Subtle background glow path */}
              <path
                d={createCurvedPath(startPoint, endPoint)}
                fill="none"
                stroke={lineColor}
                strokeWidth="0.5"
                opacity="0.2"
              />
            </g>
          );
        })}

        <defs>
          <linearGradient id="path-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="transparent" stopOpacity="0" />
            <stop offset="15%" stopColor={lineColor} stopOpacity="1" />
            <stop offset="85%" stopColor={lineColor} stopOpacity="1" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </linearGradient>
        </defs>

        {dots.map((dot, i) => (
          <g key={`points-group-${i}`}>
            {/* Start Node */}
            <g key={`start-${i}`}>
              <circle
                cx={projectPoint(dot.start.lat, dot.start.lng).x}
                cy={projectPoint(dot.start.lat, dot.start.lng).y}
                r="3"
                fill={lineColor}
              />
              <circle
                cx={projectPoint(dot.start.lat, dot.start.lng).x}
                cy={projectPoint(dot.start.lat, dot.start.lng).y}
                r="3"
                fill={lineColor}
                opacity="0.5"
              >
                <animate
                  attributeName="r"
                  from="3"
                  to="10"
                  dur="2s"
                  begin="0s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  from="0.6"
                  to="0"
                  dur="2s"
                  begin="0s"
                  repeatCount="indefinite"
                />
              </circle>
            </g>

            {/* End Node */}
            <g key={`end-${i}`}>
              <circle
                cx={projectPoint(dot.end.lat, dot.end.lng).x}
                cy={projectPoint(dot.end.lat, dot.end.lng).y}
                r="3"
                fill={lineColor}
              />
              <circle
                cx={projectPoint(dot.end.lat, dot.end.lng).x}
                cy={projectPoint(dot.end.lat, dot.end.lng).y}
                r="3"
                fill={lineColor}
                opacity="0.5"
              >
                <animate
                  attributeName="r"
                  from="3"
                  to="10"
                  dur="2s"
                  begin="0s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  from="0.6"
                  to="0"
                  dur="2s"
                  begin="0s"
                  repeatCount="indefinite"
                />
              </circle>
            </g>

            {/* End Node Label */}
            {dot.end.label && (
              <text
                x={projectPoint(dot.end.lat, dot.end.lng).x + 8}
                y={projectPoint(dot.end.lat, dot.end.lng).y + 3}
                fill={theme === "dark" ? "#A3A3A3" : "#404040"}
                fontSize="6"
                fontWeight="600"
                fontFamily="sans-serif"
                className="opacity-80 select-none pointer-events-none fill-neutral-400"
              >
                {dot.end.label}
              </text>
            )}

            {/* Start Node Label (rendered once for Jakarta) */}
            {i === 0 && dot.start.label && (
              <text
                x={projectPoint(dot.start.lat, dot.start.lng).x - 14}
                y={projectPoint(dot.start.lat, dot.start.lng).y - 8}
                fill={theme === "dark" ? "#10B981" : "#059669"}
                fontSize="7"
                fontWeight="700"
                fontFamily="sans-serif"
                className="select-none pointer-events-none fill-emerald-400"
              >
                {dot.start.label}
              </text>
            )}
          </g>
        ))}
      </svg>
      </LazyMotion>
    </div>
  );
}
