import type { SlideConfig } from "./types";

const SIZE = 1080;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}

export async function renderSlide(
  photoDataUrl: string,
  config: SlideConfig
): Promise<string> {
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  // Draw photo (center crop to square)
  const photo = await loadImage(photoDataUrl);
  const scale = Math.max(SIZE / photo.width, SIZE / photo.height);
  const sw = photo.width * scale;
  const sh = photo.height * scale;
  ctx.drawImage(photo, (SIZE - sw) / 2, (SIZE - sh) / 2, sw, sh);

  // Draw overlay
  if (config.overlayOpacity > 0) {
    ctx.fillStyle = config.overlayColor;
    ctx.globalAlpha = config.overlayOpacity;
    ctx.fillRect(0, 0, SIZE, SIZE);
    ctx.globalAlpha = 1;
  }

  // Draw logo
  if (config.logo) {
    const logo = await loadImage(config.logo.dataUrl);
    const logoW = logo.width * config.logo.scale;
    const logoH = logo.height * config.logo.scale;
    const lx = (config.logo.x / 100) * SIZE - logoW / 2;
    const ly = (config.logo.y / 100) * SIZE - logoH / 2;
    ctx.drawImage(logo, lx, ly, logoW, logoH);
  }

  // Draw texts
  for (const t of config.texts) {
    ctx.save();
    ctx.globalAlpha = t.opacity;
    ctx.fillStyle = t.color;
    ctx.textAlign = t.align;
    ctx.textBaseline = "middle";

    const style = t.fontStyle === "italic" ? "italic " : "";
    ctx.font = `${style}${t.fontWeight} ${t.fontSize}px "Helvetica Neue", Helvetica, Arial, sans-serif`;

    // Text shadow
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 2;

    const px = (t.x / 100) * SIZE;
    const py = (t.y / 100) * SIZE;
    ctx.fillText(t.content, px, py);
    ctx.restore();
  }

  return canvas.toDataURL("image/jpeg", 0.95);
}

export async function renderAllSlides(
  photoDataUrl: string,
  configs: SlideConfig[]
): Promise<string[]> {
  const results: string[] = [];
  for (const config of configs) {
    results.push(await renderSlide(photoDataUrl, config));
  }
  return results;
}
