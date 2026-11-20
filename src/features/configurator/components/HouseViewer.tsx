"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { RoofScene } from "../three/RoofScene";
import type { SceneConfig } from "../three/types";

type Props = {
  config: SceneConfig;
  badges: readonly string[];
  caption?: string;
};

const btn =
  "grid size-10 place-items-center rounded-full border border-slate-200 bg-white/95 text-brand-900 shadow-sm backdrop-blur transition-colors hover:bg-white focus-visible:z-10";

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

export default function HouseViewer({ config, badges, caption }: Props) {
  const helpId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<RoofScene | null>(null);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [description, setDescription] = useState("Interactive 3D architectural model of your building.");

  const { slope, stories, buildingType, material, weathering, damaged, solar, fence } = config;
  const fEnabled = fence?.enabled ?? false;
  const fStyle = fence?.styleId ?? "";
  const fFinish = fence?.finishId ?? "";
  const fHeight = fence?.height ?? "6ft";
  const fPlacement = fence?.placement ?? "backyard";
  const fGate = fence?.gate ?? true;
  const initialConfigRef = useRef<SceneConfig>(config);

  useEffect(() => {
    let cancelled = false;
    let scene: RoofScene | null = null;
    (async () => {
      try {
        const { RoofScene } = await import("../three/RoofScene");
        if (cancelled || !wrapRef.current || !canvasRef.current) return;
        scene = new RoofScene(wrapRef.current, canvasRef.current, { onAutoRotateChange: setRotating });
        sceneRef.current = scene;
        setRotating(scene.getAutoRotate());
        setDescription(scene.setConfig(initialConfigRef.current).description);
        setReady(true);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
      scene?.dispose();
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => {
    const next: SceneConfig = {
      slope,
      stories,
      buildingType,
      material,
      weathering,
      damaged,
      solar,
      fence: fEnabled
        ? {
            enabled: true,
            styleId: fStyle,
            finishId: fFinish,
            height: fHeight,
            placement: fPlacement,
            gate: fGate,
          }
        : undefined,
    };
    initialConfigRef.current = next;
    const scene = sceneRef.current;
    if (!scene) return;
    setDescription(scene.setConfig(next).description);
  }, [slope, stories, buildingType, material, weathering, damaged, solar, fEnabled, fStyle, fFinish, fHeight, fPlacement, fGate]);

  function onKeyDown(e: React.KeyboardEvent) {
    const s = sceneRef.current;
    if (!s) return;
    const step = 0.14;
    const map: Record<string, () => void> = {
      ArrowLeft: () => s.orbitBy(-step, 0),
      ArrowRight: () => s.orbitBy(step, 0),
      ArrowUp: () => s.orbitBy(0, -step),
      ArrowDown: () => s.orbitBy(0, step),
      "+": () => s.orbitBy(0, 0, 0.8),
      "=": () => s.orbitBy(0, 0, 0.8),
      "-": () => s.orbitBy(0, 0, 1.25),
    };
    const fn = map[e.key];
    if (fn) {
      e.preventDefault();
      s.setAutoRotate(false);
      fn();
    }
  }

  return (
    <figure className="m-0">
      <div
        ref={wrapRef}
        className="roof-canvas-stage relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-b from-[#8dbde8] via-[#cfe3f4] to-[#dce9f5] shadow-lg sm:aspect-[16/11] lg:aspect-[4/3]"
      >
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={description}
          aria-describedby={helpId}
          tabIndex={0}
          onKeyDown={onKeyDown}
          className="block size-full cursor-grab touch-pan-y active:cursor-grabbing outline-offset-[-3px] focus-visible:outline-3 focus-visible:outline-accent-600"
        />

        {!ready && !failed && (
          <div className="absolute inset-0 grid place-items-center text-sm font-semibold text-brand-900/70" role="status">
            Loading 3D preview…
          </div>
        )}
        {failed && (
          <div className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-slate-700">
            Your browser can’t display the 3D preview. You can still complete the questionnaire and see your matching packages.
          </div>
        )}

        {ready && (
          <>
            <div className="pointer-events-none absolute inset-x-3 top-3 flex flex-wrap gap-1.5 pr-12">
              {badges.map((b, idx) => (
                <span
                  key={b}
                  className={`${
                    idx > 0 && idx < badges.length - 1 ? "hidden sm:inline-flex" : "inline-flex"
                  } rounded-full border border-slate-200/80 bg-white/90 px-3 py-1 text-xs font-bold text-brand-900 shadow-sm backdrop-blur`}
                >
                  {b}
                </span>
              ))}
            </div>
            <div className="absolute bottom-3 right-3 flex flex-col gap-2" role="group" aria-label="3D view controls">
              <button
                type="button"
                className={btn}
                onClick={() => sceneRef.current?.focusRoof()}
                aria-label="Inspect roof close-up"
                title="Zoom close to inspect roof"
              >
                <Icon d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.35-4.35M11 8v6M8 11h6" />
              </button>
              <button
                type="button"
                className={btn}
                onClick={() => sceneRef.current?.orbitBy(0, 0, 0.74)}
                aria-label="Zoom in"
                title="Zoom in"
              >
                <Icon d="M12 5v14M5 12h14" />
              </button>
              <button
                type="button"
                className={btn}
                onClick={() => sceneRef.current?.orbitBy(0, 0, 1.35)}
                aria-label="Zoom out"
                title="Zoom out"
              >
                <Icon d="M5 12h14" />
              </button>
              <button
                type="button"
                className={btn}
                onClick={() => sceneRef.current?.setAutoRotate(!rotating)}
                aria-pressed={rotating}
                aria-label="Auto-rotate"
                title="Toggle auto-rotate"
              >
                <Icon d={rotating ? "M8 5v14M16 5v14" : "M21 12a9 9 0 1 1-3-6.7M21 4v5h-5"} />
              </button>
              <button
                type="button"
                className={btn}
                onClick={() => sceneRef.current?.resetView()}
                aria-label="Reset view"
                title="Reset camera view"
              >
                <Icon d="M3 11 12 4l9 7M5 10v10h14V10" />
              </button>
            </div>
          </>
        )}
      </div>
      <figcaption id={helpId} className="mt-2.5 text-center text-xs text-slate-500">
        {caption ?? "Drag to rotate · right-drag to pan · scroll or pinch to zoom close · arrow keys when focused"}
      </figcaption>
    </figure>
  );
}
