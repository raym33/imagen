"use client";

import { useState, useRef, useCallback } from "react";
import type { TextElement, SlideConfig, LogoConfig } from "@/lib/types";

type Props = {
  photoUrl: string;
  config: SlideConfig;
  onChange: (config: SlideConfig) => void;
  slideIndex: number;
};

const PRESET_COLORS = [
  "#ffffff",
  "#000000",
  "#f5f0e8",
  "#e11d48",
  "#4ade80",
  "#3b82f6",
  "#f59e0b",
  "#a855f7",
];

export default function SlideEditor({
  photoUrl,
  config,
  onChange,
  slideIndex,
}: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const selectedText = config.texts.find((t) => t.id === selectedId) || null;

  const updateText = useCallback(
    (id: string, updates: Partial<TextElement>) => {
      onChange({
        ...config,
        texts: config.texts.map((t) =>
          t.id === id ? { ...t, ...updates } : t
        ),
      });
    },
    [config, onChange]
  );

  const addText = () => {
    const newText: TextElement = {
      id: `${slideIndex}-${Date.now()}`,
      content: "New Text",
      x: 50,
      y: 50,
      fontSize: 32,
      color: "#ffffff",
      fontWeight: "700",
      fontStyle: "normal",
      align: "center",
      opacity: 1,
    };
    onChange({ ...config, texts: [...config.texts, newText] });
    setSelectedId(newText.id);
  };

  const removeText = (id: string) => {
    onChange({ ...config, texts: config.texts.filter((t) => t.id !== id) });
    if (selectedId === id) setSelectedId(null);
  };

  const handlePointerDown = (id: string, e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedId(id);
    setDragging(id);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging || !previewRef.current) return;
    const rect = previewRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    updateText(dragging, { x, y });
  };

  const handlePointerUp = () => {
    setDragging(null);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const logo: LogoConfig = {
        dataUrl: ev.target?.result as string,
        x: 50,
        y: 50,
        scale: 0.3,
      };
      onChange({ ...config, logo });
    };
    reader.readAsDataURL(file);
  };

  // Scale fontSize from 1080px canvas to preview size
  const previewScale = previewRef.current
    ? previewRef.current.offsetWidth / 1080
    : 0.3;

  return (
    <div className="space-y-3">
      {/* Preview area */}
      <div
        ref={previewRef}
        className="relative aspect-square bg-zinc-900 rounded-xl overflow-hidden select-none"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={() => setSelectedId(null)}
      >
        {/* Photo */}
        <img
          src={photoUrl}
          alt="base"
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />

        {/* Overlay */}
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: config.overlayColor,
            opacity: config.overlayOpacity,
          }}
        />

        {/* Logo */}
        {config.logo && (
          <div
            className="absolute cursor-move"
            style={{
              left: `${config.logo.x}%`,
              top: `${config.logo.y}%`,
              transform: `translate(-50%, -50%) scale(${config.logo.scale})`,
            }}
          >
            <img
              src={config.logo.dataUrl}
              alt="logo"
              className="max-w-[200px] pointer-events-none"
              draggable={false}
            />
          </div>
        )}

        {/* Text elements */}
        {config.texts.map((t) => (
          <div
            key={t.id}
            onPointerDown={(e) => handlePointerDown(t.id, e)}
            className={`absolute cursor-move whitespace-nowrap ${
              selectedId === t.id
                ? "outline outline-2 outline-blue-500 outline-offset-4 rounded"
                : ""
            }`}
            style={{
              left: `${t.x}%`,
              top: `${t.y}%`,
              transform: `translate(${
                t.align === "center"
                  ? "-50%"
                  : t.align === "right"
                  ? "-100%"
                  : "0%"
              }, -50%)`,
              fontSize: `${t.fontSize * previewScale}px`,
              fontWeight: t.fontWeight,
              fontStyle: t.fontStyle,
              color: t.color,
              opacity: t.opacity,
              textShadow: "0 2px 8px rgba(0,0,0,0.5)",
              fontFamily:
                '"Helvetica Neue", Helvetica, Arial, sans-serif',
              userSelect: "none",
              touchAction: "none",
            }}
          >
            {t.content}
          </div>
        ))}

        {/* Slide number badge */}
        <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full">
          {slideIndex + 1}
        </div>
      </div>

      {/* Controls for selected text */}
      {selectedText && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400 font-medium">
              Editando texto
            </span>
            <button
              type="button"
              onClick={() => removeText(selectedText.id)}
              className="text-red-400 hover:text-red-300"
            >
              Eliminar
            </button>
          </div>

          {/* Content */}
          <input
            type="text"
            value={selectedText.content}
            onChange={(e) =>
              updateText(selectedText.id, { content: e.target.value })
            }
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm"
            placeholder="Texto"
          />

          {/* Font size */}
          <div className="flex items-center gap-2">
            <label className="text-zinc-500 w-16">Size</label>
            <input
              type="range"
              min="10"
              max="120"
              value={selectedText.fontSize}
              onChange={(e) =>
                updateText(selectedText.id, {
                  fontSize: Number(e.target.value),
                })
              }
              className="flex-1 accent-white"
            />
            <span className="text-zinc-400 w-10 text-right">
              {selectedText.fontSize}
            </span>
          </div>

          {/* Opacity */}
          <div className="flex items-center gap-2">
            <label className="text-zinc-500 w-16">Opac.</label>
            <input
              type="range"
              min="0"
              max="100"
              value={selectedText.opacity * 100}
              onChange={(e) =>
                updateText(selectedText.id, {
                  opacity: Number(e.target.value) / 100,
                })
              }
              className="flex-1 accent-white"
            />
            <span className="text-zinc-400 w-10 text-right">
              {Math.round(selectedText.opacity * 100)}%
            </span>
          </div>

          {/* Color */}
          <div className="flex items-center gap-2">
            <label className="text-zinc-500 w-16">Color</label>
            <div className="flex gap-1.5 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() =>
                    updateText(selectedText.id, { color: c })
                  }
                  className={`w-6 h-6 rounded-full border-2 transition-all ${
                    selectedText.color === c
                      ? "border-blue-500 scale-110"
                      : "border-zinc-600"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
              <input
                type="color"
                value={selectedText.color}
                onChange={(e) =>
                  updateText(selectedText.id, { color: e.target.value })
                }
                className="w-6 h-6 rounded-full cursor-pointer border-0 bg-transparent"
                title="Color personalizado"
              />
            </div>
          </div>

          {/* Weight / Style / Align */}
          <div className="flex gap-2">
            <div className="flex bg-zinc-800 rounded-lg overflow-hidden border border-zinc-700">
              {(["400", "600", "700", "800"] as const).map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() =>
                    updateText(selectedText.id, { fontWeight: w })
                  }
                  className={`px-2.5 py-1.5 ${
                    selectedText.fontWeight === w
                      ? "bg-white text-black"
                      : "text-zinc-400 hover:text-white"
                  }`}
                  style={{ fontWeight: w }}
                >
                  A
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() =>
                updateText(selectedText.id, {
                  fontStyle:
                    selectedText.fontStyle === "italic"
                      ? "normal"
                      : "italic",
                })
              }
              className={`px-3 py-1.5 rounded-lg border border-zinc-700 italic ${
                selectedText.fontStyle === "italic"
                  ? "bg-white text-black"
                  : "bg-zinc-800 text-zinc-400"
              }`}
            >
              I
            </button>

            <div className="flex bg-zinc-800 rounded-lg overflow-hidden border border-zinc-700">
              {(["left", "center", "right"] as const).map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() =>
                    updateText(selectedText.id, { align: a })
                  }
                  className={`px-2.5 py-1.5 ${
                    selectedText.align === a
                      ? "bg-white text-black"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {a === "left" ? "L" : a === "center" ? "C" : "R"}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom controls */}
      <div className="flex gap-2 flex-wrap">
        <button
          type="button"
          onClick={addText}
          className="text-xs text-zinc-400 hover:text-white border border-zinc-800 rounded-lg px-3 py-1.5"
        >
          + Texto
        </button>

        <label className="text-xs text-zinc-400 hover:text-white border border-zinc-800 rounded-lg px-3 py-1.5 cursor-pointer">
          {config.logo ? "Cambiar logo" : "+ Logo"}
          <input
            type="file"
            accept="image/png,image/svg+xml,image/webp"
            className="hidden"
            onChange={handleLogoUpload}
          />
        </label>

        {config.logo && (
          <>
            <div className="flex items-center gap-1 text-xs text-zinc-500">
              <span>Logo</span>
              <input
                type="range"
                min="5"
                max="200"
                value={config.logo.scale * 100}
                onChange={(e) =>
                  onChange({
                    ...config,
                    logo: config.logo
                      ? {
                          ...config.logo,
                          scale: Number(e.target.value) / 100,
                        }
                      : null,
                  })
                }
                className="w-20 accent-white"
              />
            </div>
            <button
              type="button"
              onClick={() => onChange({ ...config, logo: null })}
              className="text-xs text-red-400 hover:text-red-300"
            >
              Quitar logo
            </button>
          </>
        )}

        <div className="flex items-center gap-1 ml-auto text-xs text-zinc-500">
          <span>Overlay</span>
          <input
            type="range"
            min="0"
            max="80"
            value={config.overlayOpacity * 100}
            onChange={(e) =>
              onChange({
                ...config,
                overlayOpacity: Number(e.target.value) / 100,
              })
            }
            className="w-20 accent-white"
          />
        </div>
      </div>
    </div>
  );
}
