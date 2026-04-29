// Mouse + touch input, normalized to logical canvas coordinates (640x360).
// Scenes register `onClick` / `onMove` listeners and unregister on exit.
//
// We translate raw browser coordinates → CSS pixels → logical pixels using
// the current canvas bounding rect, so the scaling stays correct even if
// the browser is resized.

import { LOGICAL_WIDTH, LOGICAL_HEIGHT } from './renderer.js';

const clickListeners = new Set();
const moveListeners = new Set();
const downListeners = new Set();
const upListeners = new Set();
const keyDownListeners = new Set();

export const pointer = { x: 0, y: 0, down: false };

function toLogical(clientX, clientY, canvas) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = LOGICAL_WIDTH / rect.width;
  const scaleY = LOGICAL_HEIGHT / rect.height;
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
  };
}

export function attachInput(canvas) {
  const handle = (eventName, set) => (e) => {
    const isTouch = e.touches !== undefined;
    const point = isTouch && e.touches[0]
      ? toLogical(e.touches[0].clientX, e.touches[0].clientY, canvas)
      : toLogical(e.clientX, e.clientY, canvas);
    pointer.x = point.x;
    pointer.y = point.y;
    if (eventName === 'down') pointer.down = true;
    if (eventName === 'up') pointer.down = false;
    for (const fn of set) fn(point);
  };

  canvas.addEventListener('mousedown', (e) => { e.preventDefault(); handle('down', downListeners)(e); });
  canvas.addEventListener('mouseup',   (e) => { handle('up', upListeners)(e); });
  canvas.addEventListener('mousemove', handle('move', moveListeners));
  canvas.addEventListener('click',     handle('click', clickListeners));

  canvas.addEventListener('touchstart', (e) => { e.preventDefault(); handle('down', downListeners)(e); });
  canvas.addEventListener('touchend',   (e) => { handle('up', upListeners)(e); });
  canvas.addEventListener('touchmove',  (e) => { e.preventDefault(); handle('move', moveListeners)(e); }, { passive: false });

  // Keyboard listeners are attached to the window so they fire whether or
  // not the canvas has focus.
  window.addEventListener('keydown', (e) => {
    const key = (e.key || '').toLowerCase();
    for (const fn of keyDownListeners) fn(key, e);
  });
}

export function onClick(fn) {
  clickListeners.add(fn);
  return () => clickListeners.delete(fn);
}
export function onMove(fn) {
  moveListeners.add(fn);
  return () => moveListeners.delete(fn);
}
export function onDown(fn) {
  downListeners.add(fn);
  return () => downListeners.delete(fn);
}
export function onUp(fn) {
  upListeners.add(fn);
  return () => upListeners.delete(fn);
}
export function onKeyDown(fn) {
  keyDownListeners.add(fn);
  return () => keyDownListeners.delete(fn);
}

export function pointInRect(p, rect) {
  return (
    p.x >= rect.x &&
    p.x <= rect.x + rect.w &&
    p.y >= rect.y &&
    p.y <= rect.y + rect.h
  );
}
