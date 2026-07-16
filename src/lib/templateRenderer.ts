import { TemplateConfig, ScreenshotTemplate } from "./template";
import { ensureFontLoaded, getFontFamily } from "./fonts";

// Load an image and return HTMLImageElement
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

// Draw wrapped text, returns total height used
function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);

  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], x, y + i * lineHeight);
  }
  return lines.length * lineHeight;
}

// Convert hex to rgba with alpha
function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Darken hex by percentage (0-1)
function darken(hex: string, amount: number): string {
  const h = hex.replace("#", "");
  const r = Math.max(0, parseInt(h.substring(0, 2), 16) * (1 - amount));
  const g = Math.max(0, parseInt(h.substring(2, 4), 16) * (1 - amount));
  const b = Math.max(0, parseInt(h.substring(4, 6), 16) * (1 - amount));
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Renders a marketing-style app store screenshot:
 *  - Solid background color with subtle organic blobs
 *  - App name at top
 *  - Large bold headline
 *  - Subtitle
 *  - Device mockup containing the user screenshot
 */
export async function renderTemplate(
  screenshotUrl: string,
  template: TemplateConfig,
  ss: ScreenshotTemplate,
  targetWidth: number,
  targetHeight: number
): Promise<string> {
  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext("2d")!;

  // Ensure selected font is loaded before drawing text
  ensureFontLoaded(template.fontId);
  const fontFamily = getFontFamily(template.fontId);
  try {
    // Preload key weights so canvas measures/draws correctly
    if ((document as any).fonts?.load) {
      await Promise.all([
        (document as any).fonts.load(`600 40px ${fontFamily}`),
        (document as any).fonts.load(`800 110px ${fontFamily}`),
        (document as any).fonts.load(`400 32px ${fontFamily}`),
      ]);
    }
  } catch {
    // ignore
  }

  const isLandscape = targetWidth > targetHeight;
  const scale = Math.min(targetWidth, targetHeight) / 1080; // scale factor based on ref 1080

  // ── Background ──
  if (template.backgroundStyle === "gradient") {
    const angle = ((template.gradientAngle ?? 135) * Math.PI) / 180;
    const cx = targetWidth / 2;
    const cy = targetHeight / 2;
    const len = Math.max(targetWidth, targetHeight);
    const dx = (Math.cos(angle) * len) / 2;
    const dy = (Math.sin(angle) * len) / 2;
    const grad = ctx.createLinearGradient(cx - dx, cy - dy, cx + dx, cy + dy);
    grad.addColorStop(0, template.backgroundColor);
    grad.addColorStop(1, template.backgroundColor2);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  } else if (template.backgroundStyle === "mesh") {
    ctx.fillStyle = template.backgroundColor;
    ctx.fillRect(0, 0, targetWidth, targetHeight);
    const radial = ctx.createRadialGradient(
      targetWidth * 0.2,
      targetHeight * 0.2,
      0,
      targetWidth * 0.2,
      targetHeight * 0.2,
      targetWidth * 0.9
    );
    radial.addColorStop(0, withAlpha(template.backgroundColor2, 0.9));
    radial.addColorStop(1, withAlpha(template.backgroundColor2, 0));
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, targetWidth, targetHeight);
    const radial2 = ctx.createRadialGradient(
      targetWidth * 0.85,
      targetHeight * 0.8,
      0,
      targetWidth * 0.85,
      targetHeight * 0.8,
      targetWidth * 0.7
    );
    radial2.addColorStop(0, withAlpha(template.accentColor, 0.35));
    radial2.addColorStop(1, withAlpha(template.accentColor, 0));
    ctx.fillStyle = radial2;
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  } else {
    ctx.fillStyle = template.backgroundColor;
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  }

  // Decorative blobs
  const intensity = template.blobIntensity ?? "subtle";
  if (intensity !== "none") {
    const alpha = intensity === "strong" ? 0.9 : 0.5;
    ctx.fillStyle = withAlpha(darken(template.backgroundColor, 0.3), alpha);
    ctx.beginPath();
    ctx.arc(targetWidth * 0.9, targetHeight * 0.15, targetWidth * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = withAlpha(template.accentColor, intensity === "strong" ? 0.15 : 0.06);
    ctx.beginPath();
    ctx.arc(targetWidth * 0.05, targetHeight * 0.85, targetWidth * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Layout regions ──
  const padding = targetWidth * 0.06;
  const textAreaHeight = isLandscape ? targetHeight * 0.35 : targetHeight * 0.36;
  const textOnTop = (template.textPosition ?? "top") === "top";
  const deviceAreaTop = textOnTop ? textAreaHeight : padding;
  const deviceAreaHeight = targetHeight - textAreaHeight - padding;

  // ── App name ──
  const appNameSize = Math.max(24, 40 * scale);
  ctx.fillStyle = template.textColor;
  ctx.font = `600 ${appNameSize}px ${fontFamily}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  const appNameY = textOnTop ? padding * 1.2 : targetHeight - textAreaHeight + padding * 0.4;

  const appNameWidth = ctx.measureText(template.appName).width;
  const dotSize = appNameSize * 0.7;
  const dotX = targetWidth / 2 - appNameWidth / 2 - dotSize - 12;
  const dotY = appNameY + (appNameSize - dotSize) / 2;
  ctx.beginPath();
  ctx.arc(dotX + dotSize / 2, dotY + dotSize / 2, dotSize / 2, 0, Math.PI * 2);
  ctx.strokeStyle = template.textColor;
  ctx.lineWidth = Math.max(2, 3 * scale);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(dotX + dotSize / 2, dotY + dotSize / 2, dotSize / 5, 0, Math.PI * 2);
  ctx.fillStyle = template.accentColor;
  ctx.fill();

  ctx.fillStyle = template.textColor;
  ctx.fillText(template.appName, targetWidth / 2 + dotSize / 2 + 6, appNameY);

  // ── Headline ──
  const headlineSize = Math.max(48, (isLandscape ? 80 : 110) * scale);
  ctx.font = `800 ${headlineSize}px ${fontFamily}`;
  ctx.fillStyle = template.textColor;
  ctx.textAlign = "center";
  const headlineY = appNameY + appNameSize * 2.2;
  const headlineHeight = drawWrappedText(
    ctx,
    ss.headline,
    targetWidth / 2,
    headlineY,
    targetWidth - padding * 2,
    headlineSize * 1.05
  );

  // ── Subtitle ──
  const subtitleSize = Math.max(20, 32 * scale);
  ctx.font = `400 ${subtitleSize}px ${fontFamily}`;
  ctx.fillStyle = template.subtextColor;
  const subtitleY = headlineY + headlineHeight + subtitleSize * 0.5;
  drawWrappedText(
    ctx,
    ss.subtitle,
    targetWidth / 2,
    subtitleY,
    targetWidth - padding * 2,
    subtitleSize * 1.3
  );

  // ── Device mockup with screenshot ──
  try {
    const img = await loadImage(screenshotUrl);
    const imgAspect = img.width / img.height;

    if (template.showDeviceFrame) {
      // Device frame
      const bezel = Math.max(16, 22 * scale);
      const frameRadius = Math.max(32, 60 * scale);
      const screenRadius = frameRadius - bezel * 0.5;

      // Fit device into device area
      const maxDeviceH = deviceAreaHeight;
      const maxDeviceW = targetWidth - padding * 2;
      let screenW: number, screenH: number;
      if (isLandscape) {
        screenH = Math.min(maxDeviceH - bezel * 2, maxDeviceW / imgAspect - bezel * 2);
      } else {
        // Portrait: pick screen size based on image aspect
        screenH = maxDeviceH - bezel * 2;
        screenW = screenH * imgAspect;
        if (screenW > maxDeviceW - bezel * 2) {
          screenW = maxDeviceW - bezel * 2;
          screenH = screenW / imgAspect;
        }
      }
      screenW = (screenH as number) * imgAspect;
      if (screenW > maxDeviceW - bezel * 2) {
        screenW = maxDeviceW - bezel * 2;
        screenH = screenW / imgAspect;
      }

      const frameW = screenW + bezel * 2;
      const frameH = screenH + bezel * 2;
      const frameX = (targetWidth - frameW) / 2;
      const frameY = deviceAreaTop + (deviceAreaHeight - frameH) / 2;

      // Frame outer (dark)
      ctx.fillStyle = "#0a0a0a";
      roundRect(ctx, frameX, frameY, frameW, frameH, frameRadius);
      ctx.fill();

      // Frame inner border highlight
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = Math.max(1, 2 * scale);
      roundRect(ctx, frameX + 2, frameY + 2, frameW - 4, frameH - 4, frameRadius - 2);
      ctx.stroke();

      // Screen (clipped)
      const screenX = frameX + bezel;
      const screenY = frameY + bezel;
      ctx.save();
      roundRect(ctx, screenX, screenY, screenW, screenH, screenRadius);
      ctx.clip();
      ctx.drawImage(img, screenX, screenY, screenW, screenH);
      ctx.restore();

      // Notch (for portrait phone-like)
      if (!isLandscape && imgAspect < 0.6) {
        const notchW = frameW * 0.32;
        const notchH = bezel * 0.9;
        const notchX = frameX + (frameW - notchW) / 2;
        const notchY = frameY + bezel * 0.15;
        ctx.fillStyle = "#0a0a0a";
        roundRect(ctx, notchX, notchY, notchW, notchH, notchH / 2);
        ctx.fill();
      }
    } else {
      // No device frame: just place screenshot with rounded corners and shadow
      const maxDeviceH = deviceAreaHeight;
      const maxDeviceW = targetWidth - padding * 2;
      let w = maxDeviceH * imgAspect;
      let h = maxDeviceH;
      if (w > maxDeviceW) {
        w = maxDeviceW;
        h = w / imgAspect;
      }
      const x = (targetWidth - w) / 2;
      const y = deviceAreaTop + (deviceAreaHeight - h) / 2;
      const r = Math.max(16, 32 * scale);

      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 40 * scale;
      ctx.shadowOffsetY = 10 * scale;
      roundRect(ctx, x, y, w, h, r);
      ctx.fillStyle = "#000";
      ctx.fill();
      ctx.restore();

      ctx.save();
      roundRect(ctx, x, y, w, h, r);
      ctx.clip();
      ctx.drawImage(img, x, y, w, h);
      ctx.restore();
    }
  } catch (e) {
    console.error("Failed to render screenshot:", e);
  }

  return canvas.toDataURL("image/png");
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
