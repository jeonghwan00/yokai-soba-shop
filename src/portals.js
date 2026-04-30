// Vibe Jam 2026 portal integration.
//
// Players can arrive at our game from another Vibe Jam game via a "portal"
// — a redirect that carries continuity params in the query string. They
// can also leave to the Vibe Jam webring via our exit portal. If they
// arrived through a portal we render a "return portal" so they can go back.
//
// Spec: https://vibejam.cc/portal/2026
//   ?portal=true             → skip our title screen
//   ?ref=foo.com             → host that sent them; we render a return portal
//   ?username, color, speed  → optional player params to forward on
//   ?team, hp, avatar_url    → ditto
//
// Forwarded keys list — kept in one place so all builders agree.
const FORWARD_KEYS = [
  'username', 'color', 'speed', 'team', 'hp', 'avatar_url',
  'speed_x', 'speed_y', 'speed_z',
  'rotation_x', 'rotation_y', 'rotation_z',
];

const params = (typeof window !== 'undefined')
  ? new URLSearchParams(window.location.search)
  : new URLSearchParams();

export const portal = Object.freeze({
  arrived: params.get('portal') === 'true',
  ref: params.get('ref'),
  ...Object.fromEntries(FORWARD_KEYS.map((k) => [k, params.get(k)])),
});

function selfRef() {
  if (typeof window === 'undefined') return '';
  return (window.location.host + window.location.pathname).replace(/\/$/, '');
}

function appendForwardParams(url) {
  for (const key of FORWARD_KEYS) {
    if (portal[key]) url.searchParams.set(key, portal[key]);
  }
}

// Send the player onward to the Vibe Jam 2026 portal hub. The hub then
// redirects to the next game in the webring.
export function exitToVibeJam() {
  if (typeof window === 'undefined') return;
  const url = new URL('https://vibejam.cc/portal/2026');
  url.searchParams.set('ref', selfRef());
  appendForwardParams(url);
  window.location.href = url.toString();
}

// Return the player to the game that sent them. Forwards player params
// (username/color/etc) so the receiving game can keep continuity, and
// sets ?portal=true&ref=us so the destination knows it was a portal hop.
export function returnToRef() {
  if (typeof window === 'undefined' || !portal.ref) return;
  const raw = portal.ref;
  const target = raw.startsWith('http') ? raw : `https://${raw}`;
  let url;
  try {
    url = new URL(target);
  } catch (_) {
    return;
  }
  url.searchParams.set('portal', 'true');
  url.searchParams.set('ref', selfRef());
  appendForwardParams(url);
  window.location.href = url.toString();
}

// Short label for the return-portal button — just the host of the ref URL.
export function refLabel() {
  if (!portal.ref) return null;
  try {
    const target = portal.ref.startsWith('http') ? portal.ref : `https://${portal.ref}`;
    return new URL(target).host;
  } catch (_) {
    return portal.ref;
  }
}
