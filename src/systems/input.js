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

// Touch displacement (in logical units) below which we treat a touchend as
// a tap and synthesize a click. Above the threshold the touch was a drag.
const TAP_MAX_DIST_SQ = 12 * 12;

export function attachInput(canvas) {
  // Pull touch coordinates from `touches[0]` when present, else
  // `changedTouches[0]` (which is the only place touchend has them).
  function touchPoint(e) {
    const t = (e.touches && e.touches[0])
      || (e.changedTouches && e.changedTouches[0]);
    if (!t) return null;
    return toLogical(t.clientX, t.clientY, canvas);
  }

  function pointFromEvent(e) {
    if (e.touches !== undefined) return touchPoint(e);
    return toLogical(e.clientX, e.clientY, canvas);
  }

  function dispatch(eventName, set, e, overridePoint) {
    const point = overridePoint || pointFromEvent(e);
    if (!point) return;
    pointer.x = point.x;
    pointer.y = point.y;
    if (eventName === 'down') pointer.down = true;
    if (eventName === 'up') pointer.down = false;
    for (const fn of set) fn(point);
  }

  canvas.addEventListener('mousedown', (e) => { e.preventDefault(); dispatch('down', downListeners, e); });
  canvas.addEventListener('mouseup',   (e) => { dispatch('up', upListeners, e); });
  canvas.addEventListener('mousemove', (e) => { dispatch('move', moveListeners, e); });
  canvas.addEventListener('click',     (e) => { dispatch('click', clickListeners, e); });

  // Touch path:
  // - touchstart records the start point and fires `down` listeners.
  // - touchmove fires `move` listeners.
  // - touchend fires `up` listeners. If the finger barely moved we also
  //   synthesize a click (browsers suppress the synthetic mouse click
  //   because we preventDefault on touchstart, so we have to dispatch it
  //   ourselves).
  let touchStart = null;
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const p = touchPoint(e);
    if (p) touchStart = p;
    dispatch('down', downListeners, e, p);
  });
  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    dispatch('move', moveListeners, e);
  }, { passive: false });
  canvas.addEventListener('touchend', (e) => {
    const p = touchPoint(e);
    dispatch('up', upListeners, e, p);
    if (p && touchStart) {
      const dx = p.x - touchStart.x;
      const dy = p.y - touchStart.y;
      if (dx * dx + dy * dy <= TAP_MAX_DIST_SQ) {
        // Treat as a tap — synthesize the click that browsers won't fire
        // for us once we preventDefault'd touchstart.
        dispatch('click', clickListeners, e, p);
      }
    }
    touchStart = null;
  });

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
