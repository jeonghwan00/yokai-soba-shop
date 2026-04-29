// Thin wrapper around Canvas2D drawing primitives.
// Scenes call these helpers so we don't repeat ctx.drawImage boilerplate
// or worry about pixel snapping. All coordinates are in logical (640x360)
// pixels — main.js handles the CSS-side integer scaling.

export const LOGICAL_WIDTH = 640;
export const LOGICAL_HEIGHT = 360;

export function clear(ctx, color = '#0a0a0f') {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
}

// Draw an image scaled to cover the whole canvas (used for backgrounds).
export function drawBackground(ctx, image) {
  if (!image) return;
  ctx.drawImage(image, 0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
}

// Draw a sprite centered on (cx, cy) at the given logical size. The image
// can be any source resolution — we just stretch into the target rect with
// imageSmoothingEnabled=false set globally.
export function drawSprite(ctx, image, cx, cy, w, h) {
  if (!image) return;
  const x = Math.round(cx - w / 2);
  const y = Math.round(cy - h / 2);
  ctx.drawImage(image, x, y, w, h);
}

export function drawText(ctx, text, x, y, opts = {}) {
  const {
    color = '#f5e6d3',
    size = 12,
    align = 'left',
    baseline = 'top',
    family = '-apple-system, sans-serif',
  } = opts;
  ctx.fillStyle = color;
  ctx.font = `${size}px ${family}`;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.fillText(text, x, y);
}

// Filled rounded rect (manual path so we work on older canvases too).
export function fillRoundRect(ctx, x, y, w, h, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fill();
}
