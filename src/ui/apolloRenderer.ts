// Canvas renderer for the Apollo Mission Simulator.
// The cabin photo stays fixed; moving NASA scenery is composited only inside the
// three black window panes, and the centre display shows live mission readings.

export interface CockpitFrame {
  exterior: HTMLImageElement | null;
  cabin: HTMLImageElement | null;
  /** Display tilt of the scenery, degrees. */
  angle: number;
  /** 0..1 — how far through the stage the scenery has progressed (zooms in). */
  progress: number;
  /** Speed that drives the sway/drift. 0 when not flying. */
  motionSpeed: number;
  powered: boolean;
  alarm: boolean;
  readout: [string, string][];
}

// Native size of the cabin photograph and the window / display boxes measured on it.
const PHOTO_W = 1536;
const PHOTO_H = 1024;
const WINDOWS: [number, number, number, number][] = [
  [0.044, 0.16, 0.284, 0.378],
  [0.364, 0.16, 0.274, 0.378],
  [0.68, 0.16, 0.281, 0.378],
];
const DISPLAY = { x: 0.425, y: 0.612, w: 0.135, h: 0.17 };

function imageReady(im: HTMLImageElement | null): im is HTMLImageElement {
  return !!im && im.complete && im.naturalWidth > 0;
}

export class CockpitRenderer {
  private lastTime = 0;
  private distance = 0;
  private angle = 0;
  private speed = 0;
  private readonly reducedMotion: boolean;

  constructor() {
    this.reducedMotion =
      typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  draw(ctx: CanvasRenderingContext2D, W: number, H: number, f: CockpitFrame, timeSec: number) {
    const dt = this.lastTime ? Math.min(timeSec - this.lastTime, 0.05) : 0;
    this.lastTime = timeSec;

    // Ease the scenery toward the target speed and tilt for a smooth feel.
    this.speed += (f.motionSpeed - this.speed) * (1 - Math.exp(-3 * dt));
    this.angle += (f.angle - this.angle) * (1 - Math.exp(-5 * dt));
    if (!this.reducedMotion) this.distance += this.speed * dt;
    const forwardZoom = 0.16 * (1 - Math.exp(-this.distance / 50));

    ctx.fillStyle = '#101416';
    ctx.fillRect(0, 0, W, H);

    // Cover-fit the photo; on phones the side consoles simply leave the frame.
    const scale = Math.max(W / PHOTO_W, H / PHOTO_H);
    const cw = PHOTO_W * scale;
    const ch = PHOTO_H * scale;
    const left = (W - cw) / 2;
    const top = (H - ch) / 2;

    const sway = this.reducedMotion ? 0 : Math.sin(timeSec * 0.45) * 3;
    const vibration = this.reducedMotion || !f.powered ? 0 : Math.sin(timeSec * 37) * 1.5;

    ctx.save();
    ctx.translate(vibration, vibration * 0.5);

    if (imageReady(f.cabin)) {
      ctx.drawImage(f.cabin, left, top, cw, ch);
    } else {
      ctx.fillStyle = '#252b2c';
      ctx.fillRect(0, H * 0.6, W, H * 0.4);
    }

    for (const [wx, wy, ww, wh] of WINDOWS) {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(left + cw * wx, top + ch * wy, cw * ww, ch * wh, 26 * scale);
      ctx.clip();
      ctx.fillStyle = '#020509';
      ctx.fillRect(0, 0, W, H);

      ctx.translate(W / 2 + sway, H * 0.34);
      ctx.rotate((-this.angle * Math.PI) / 180);
      if (imageReady(f.exterior)) {
        const windowHeight = ch * 0.46;
        const fit =
          Math.max(cw / f.exterior.naturalWidth, windowHeight / f.exterior.naturalHeight) *
          (1.08 + f.progress * 0.22 + forwardZoom);
        const iw = f.exterior.naturalWidth * fit;
        const ih = f.exterior.naturalHeight * fit;
        const drift = this.reducedMotion
          ? 0
          : Math.sin(timeSec * 0.14) * windowHeight * 0.015 + Math.sin(this.distance / 100) * cw * 0.035;
        ctx.drawImage(f.exterior, -iw / 2 - drift, -ih / 2 + f.progress * windowHeight * 0.05, iw, ih);
      }
      ctx.restore();
    }

    // Live readings replace the photo's decorative display.
    const dx = left + cw * DISPLAY.x;
    const dy = top + ch * DISPLAY.y;
    const dw = cw * DISPLAY.w;
    const dh = ch * DISPLAY.h;
    ctx.fillStyle = '#06110c';
    ctx.fillRect(dx, dy, dw, dh);
    ctx.fillStyle = '#93dcb0';
    ctx.font = `${Math.max(10, Math.min(17, 14 * scale))}px monospace`;
    ctx.textAlign = 'left';
    const lineH = 25 * scale;
    f.readout.forEach(([key, value], i) => {
      ctx.fillText(`${key} ${value}`, dx + 6 * scale, dy + 23 * scale + i * lineH, dw - 12 * scale);
    });

    if (f.alarm) {
      ctx.fillStyle = `rgba(200,35,25,${0.07 + 0.04 * Math.sin(timeSec * 8)})`;
      ctx.fillRect(0, 0, W, H);
    }
    ctx.restore();
  }
}
