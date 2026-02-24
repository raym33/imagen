"use client";

import { useState, useCallback, useRef } from "react";
import JSZip from "jszip";
import SlideEditor from "@/components/SlideEditor";
import { renderAllSlides } from "@/lib/canvas-renderer";
import { createDefaultSlides, type SlideConfig } from "@/lib/types";

type Mode = "canvas" | "gemini";

function UploadZone({
  image,
  onImage,
  label,
  sublabel,
}: {
  image: string | null;
  onImage: (img: string) => void;
  label: string;
  sublabel: string;
}) {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = (e) => onImage(e.target?.result as string);
      reader.readAsDataURL(file);
    },
    [onImage]
  );

  const onDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div
      onDragEnter={onDrag}
      onDragLeave={onDrag}
      onDragOver={onDrag}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      className={`relative rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden
        ${dragActive ? "border-white bg-zinc-800/50" : "border-zinc-700 hover:border-zinc-500"}
        ${image ? "p-2" : "p-8"}`}
    >
      {image ? (
        <img
          src={image}
          alt="preview"
          className="w-full rounded-xl object-contain max-h-48"
        />
      ) : (
        <div className="flex flex-col items-center text-center">
          <svg
            className="w-8 h-8 mb-2 text-zinc-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
            />
          </svg>
          <p className="text-sm font-medium text-zinc-300">{label}</p>
          <p className="text-xs text-zinc-500 mt-1">{sublabel}</p>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        aria-label={label}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </div>
  );
}

export default function ScuffersGenerator() {
  const [modelImage, setModelImage] = useState<string | null>(null);
  const [styleImage, setStyleImage] = useState<string | null>(null);
  const [slideConfigs, setSlideConfigs] = useState<SlideConfig[]>(
    createDefaultSlides()
  );
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("canvas");
  const [activeSlide, setActiveSlide] = useState(0);

  const updateSlide = useCallback(
    (index: number, config: SlideConfig) => {
      const next = [...slideConfigs];
      next[index] = config;
      setSlideConfigs(next);
    },
    [slideConfigs]
  );

  const addSlide = () => {
    setSlideConfigs([
      ...slideConfigs,
      {
        texts: [
          {
            id: `new-${Date.now()}`,
            content: "New Slide",
            x: 50,
            y: 50,
            fontSize: 48,
            color: "#ffffff",
            fontWeight: "700",
            fontStyle: "normal",
            align: "center",
            opacity: 1,
          },
        ],
        overlayColor: "#000000",
        overlayOpacity: 0.2,
        logo: null,
      },
    ]);
    setActiveSlide(slideConfigs.length);
  };

  const removeSlide = (index: number) => {
    if (slideConfigs.length <= 1) return;
    const next = slideConfigs.filter((_, i) => i !== index);
    setSlideConfigs(next);
    if (activeSlide >= next.length) setActiveSlide(next.length - 1);
  };

  const generate = async () => {
    if (!modelImage) {
      setError("Sube la foto del modelo primero");
      return;
    }
    setIsLoading(true);
    setGeneratedImages([]);
    setError(null);

    try {
      if (mode === "canvas") {
        const images = await renderAllSlides(modelImage, slideConfigs);
        setGeneratedImages(images);
      } else {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            modelImage,
            styleImage,
            slides: slideConfigs.map((s) =>
              s.texts.map((t) => t.content).join("\n")
            ),
          }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        setGeneratedImages(data.images);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error generating images");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadZip = async () => {
    if (generatedImages.length === 0) return;
    const zip = new JSZip();
    generatedImages.forEach((img, i) => {
      const base64 = img.split(",")[1];
      const ext = img.includes("image/png") ? "png" : "jpg";
      zip.file(`scuffers-slide-${i + 1}.${ext}`, base64, { base64: true });
    });
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "scuffers-carousel.zip";
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadSingle = (img: string, index: number) => {
    const a = document.createElement("a");
    a.href = img;
    a.download = `scuffers-slide-${index + 1}.jpg`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 px-4 py-3">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight italic">
              scuffers
            </h1>
            <span className="text-[10px] text-zinc-500 border border-zinc-800 rounded-full px-2 py-0.5">
              carousel generator
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Mode toggle */}
            <div className="flex bg-zinc-900 rounded-lg p-0.5 border border-zinc-800">
              <button
                type="button"
                onClick={() => setMode("canvas")}
                className={`text-xs px-3 py-1 rounded-md transition-all ${
                  mode === "canvas"
                    ? "bg-white text-black font-medium"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Canvas
              </button>
              <button
                type="button"
                onClick={() => setMode("gemini")}
                className={`text-xs px-3 py-1 rounded-md transition-all ${
                  mode === "gemini"
                    ? "bg-emerald-600 text-white font-medium"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Gemini AI
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_320px] gap-6">
          {/* LEFT: Photo upload + generate */}
          <div className="space-y-4">
            <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Foto base
            </h2>
            <UploadZone
              image={modelImage}
              onImage={setModelImage}
              label="Foto del modelo"
              sublabel="Arrastra o haz clic"
            />
            {modelImage && (
              <button
                type="button"
                onClick={() => {
                  setModelImage(null);
                  setGeneratedImages([]);
                }}
                className="text-xs text-zinc-500 hover:text-zinc-300"
              >
                Cambiar foto
              </button>
            )}

            {mode === "gemini" && (
              <>
                <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider pt-2">
                  Referencia estilo
                </h2>
                <UploadZone
                  image={styleImage}
                  onImage={setStyleImage}
                  label="PSD / ejemplo (opcional)"
                  sublabel="Para Gemini AI"
                />
              </>
            )}

            <button
              type="button"
              onClick={generate}
              disabled={!modelImage || isLoading}
              className="w-full bg-white text-black font-semibold text-sm py-3.5 rounded-xl
                hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed
                flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Generando...
                </>
              ) : (
                "GENERAR CARRUSEL"
              )}
            </button>
            {error && (
              <p className="text-red-400 text-xs text-center">{error}</p>
            )}

            {/* Generated results */}
            {generatedImages.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-emerald-400">
                    {generatedImages.length} slides
                  </span>
                  <button
                    type="button"
                    onClick={downloadZip}
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500
                      text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                  >
                    ZIP
                  </button>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {generatedImages.map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => downloadSingle(img, i)}
                      className="group relative"
                    >
                      <img
                        src={img}
                        alt={`Slide ${i + 1}`}
                        className="w-full aspect-square object-cover rounded-lg border border-zinc-800"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* CENTER: Slide editor */}
          <div>
            {/* Slide tabs */}
            <div className="flex items-center gap-1 mb-3 overflow-x-auto">
              {slideConfigs.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveSlide(i)}
                  className={`text-xs px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                    activeSlide === i
                      ? "bg-white text-black font-medium"
                      : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
                  }`}
                >
                  Slide {i + 1}
                </button>
              ))}
              <button
                type="button"
                onClick={addSlide}
                className="text-xs px-2.5 py-1.5 rounded-lg bg-zinc-900 text-zinc-500 hover:text-white border border-zinc-800"
              >
                +
              </button>
              {slideConfigs.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeSlide(activeSlide)}
                  className="text-xs px-2.5 py-1.5 rounded-lg text-red-400/60 hover:text-red-400 ml-1"
                >
                  Eliminar
                </button>
              )}
            </div>

            {/* Editor */}
            {modelImage ? (
              <div className="max-w-lg mx-auto">
                <SlideEditor
                  photoUrl={modelImage}
                  config={slideConfigs[activeSlide]}
                  onChange={(c) => updateSlide(activeSlide, c)}
                  slideIndex={activeSlide}
                />
              </div>
            ) : (
              <div className="aspect-square max-w-lg mx-auto bg-zinc-900/50 rounded-xl border border-zinc-800 flex items-center justify-center">
                <p className="text-zinc-600 text-sm">
                  Sube una foto para empezar a editar
                </p>
              </div>
            )}
          </div>

          {/* RIGHT: All slides overview */}
          <div>
            <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
              Vista previa del carrusel
            </h2>
            {modelImage ? (
              <div className="space-y-2">
                {slideConfigs.map((config, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveSlide(i)}
                    className={`w-full relative rounded-xl overflow-hidden border-2 transition-all ${
                      activeSlide === i
                        ? "border-white"
                        : "border-zinc-800 hover:border-zinc-600"
                    }`}
                  >
                    {/* Mini preview */}
                    <div className="aspect-square relative">
                      <img
                        src={modelImage}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      <div
                        className="absolute inset-0"
                        style={{
                          backgroundColor: config.overlayColor,
                          opacity: config.overlayOpacity,
                        }}
                      />
                      {/* Mini text previews */}
                      {config.texts.map((t) => (
                        <div
                          key={t.id}
                          className="absolute whitespace-nowrap"
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
                            fontSize: `${Math.max(6, t.fontSize * 0.12)}px`,
                            fontWeight: t.fontWeight,
                            fontStyle: t.fontStyle,
                            color: t.color,
                            opacity: t.opacity,
                            textShadow: "0 1px 3px rgba(0,0,0,0.5)",
                          }}
                        >
                          {t.content}
                        </div>
                      ))}
                      {/* Logo mini */}
                      {config.logo && (
                        <div
                          className="absolute"
                          style={{
                            left: `${config.logo.x}%`,
                            top: `${config.logo.y}%`,
                            transform: `translate(-50%, -50%) scale(${config.logo.scale * 0.15})`,
                          }}
                        >
                          <img
                            src={config.logo.dataUrl}
                            alt=""
                            className="max-w-[200px]"
                          />
                        </div>
                      )}
                      <div className="absolute top-1 right-1 bg-black/60 text-white text-[8px] px-1.5 py-0.5 rounded-full">
                        {i + 1}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <div
                    key={n}
                    className="aspect-square bg-zinc-900/30 rounded-xl border border-zinc-800/50 flex items-center justify-center"
                  >
                    <span className="text-zinc-800 text-xs">{n}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
