const icons = {
  layers: '<path d="m12 2 10 5-10 5L2 7zM2 12l10 5 10-5M2 17l10 5 10-5"/>',
  passport: '<rect x="4" y="3" width="16" height="18" rx="2"/><circle cx="12" cy="10" r="3"/><path d="M12 7c-1.6 1.5-1.6 4.5 0 6 1.6-1.5 1.6-4.5 0-6ZM9 10h6m-6 7h6"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 4v3"/>',
  moon: '<path d="M20.9 13.35A9 9 0 0 1 10.65 3.1a9 9 0 1 0 10.25 10.25Z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42m0-14.14-1.42 1.42m-11.3 11.3-1.42 1.42"/>',
  external: '<path d="M13 5h6v6m0-6-9 9m7-1v6H5V7h6"/>',
  door: '<path d="M3 21h18M6 21V4h12v17M6 4l8-2v19m-3-9h.01"/>',
  flask: '<path d="M9 3h6m-5 0v7l-5.7 8.2A1.8 1.8 0 0 0 5.8 21h12.4a1.8 1.8 0 0 0 1.5-2.8L14 10V3M8 15h8"/>',
  nodes: '<rect x="9" y="3" width="6" height="5" rx="1"/><rect x="3" y="16" width="6" height="5" rx="1"/><rect x="15" y="16" width="6" height="5" rx="1"/><path d="M12 8v4M6 16v-4h12v4"/>',
  shield: '<path d="M12 22S4 18 4 11V5l8-3 8 3v6c0 7-8 11-8 11Z"/><path d="m9 12 2 2 4-4"/>',
  book: '<path d="M12 5C9 3 6 3 3 4v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1Zm0 0v15"/>',
  rocket: '<path d="M12 16c7-4 9-7 9-13-6 0-9 2-13 9m4 4-4-4m4 4-1 4-4 1 1-4-1-1-4 1 1-4 4-1m7-3h.01M3 21l2-2"/>',
  arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
  back: '<path d="M20 12H5m6-6-6 6 6 6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 5V4H4v12h1"/>',
  chat: '<path d="M20 4H4v13h4v4l5-4h7zM8 9h8m-8 4h5"/>',
};

export function icon(name) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">${icons[name]}</svg>`;
}

export function avatar(person) {
  const hair = {
    bob: '<path d="M9 18c0-13 22-13 22 0l1 11-6 2H13l-5-3z"/><path d="M11 17c0-10 17-11 19 0-6 1-10-2-12-5-1 3-4 5-7 5z"/>',
    swept: '<path d="M10 19c-3-9 5-15 12-13 5-1 9 4 8 11-6-4-10-1-15-5l-3 8z"/>',
    bun: '<circle cx="23" cy="7" r="6"/><path d="M10 18c-1-12 22-15 21 1-4-1-7-3-9-6-2 3-6 5-12 5z"/>',
    glasses: '<path d="M10 17c0-12 20-12 20 0l-4-1-5-4-6 4z"/><path d="M12 19h6v4h-5zm10 0h6l-1 4h-5zm-4 1h4" fill="none" stroke="var(--cp-text)" stroke-width="1.1"/>',
  }[person.look];
  return `<svg class="avatar tone-${person.tone}" viewBox="0 0 40 40" aria-hidden="true">
    <circle cx="20" cy="20" r="20" class="avatar-bg"/><path d="M4 36c3-6 9-9 16-9s13 3 16 9a20 20 0 0 1-32 0" class="avatar-shirt"/>
    ${person.look === 'bob' ? `<g class="avatar-hair">${hair.split('/>')[0]}/></g>` : ''}
    <path d="M16 23h8v8c-2 3-6 3-8 0z" class="avatar-skin"/><ellipse cx="20" cy="20" rx="9" ry="11" class="avatar-skin"/>
    <path d="M16 20h.1m7.9 0h.1m-6 5q2 2 4 0" class="avatar-features" fill="none" stroke-linecap="round" stroke-width="1.4"/>
    <g class="avatar-hair">${person.look === 'bob' ? hair.slice(hair.indexOf('/>') + 2) : hair}</g></svg>`;
}

export const floorSize = [800, 490];
const project = ([x, y, z = 0]) => [321 + x * .79 - y * .74, 65 + x * .42 + y * .42 - z];
const point = (p) => project(p).map((n) => Math.round(n * 10) / 10).join(',');
const poly = (points, fill, extra = '') => `<polygon points="${points.map(point).join(' ')}" fill="${fill}" ${extra}/>`;
const line = (points, pen, extra = '') => `<polyline points="${points.map(point).join(' ')}" fill="none" stroke="${pen}" ${extra}/>`;
const ellipse = (x, y, z, rx, ry, fill) => `<ellipse cx="${project([x, y, z])[0]}" cy="${project([x, y, z])[1]}" rx="${rx}" ry="${ry}" fill="${fill}"/>`;
const rectangle = (x, y, w, d, z) => [[x, y, z], [x + w, y, z], [x + w, y + d, z], [x, y + d, z]];
const flat = (x, y, w, d, z, fill, extra) => poly(rectangle(x, y, w, d, z), fill, extra);
const ink = 'var(--cp-text)';
const deskTop = 'var(--cp-office-wood)';
const pale = 'var(--cp-bg-elevated)';
const accent = 'var(--cp-accent)';
const seat = 'var(--cp-office-seat)';
const edge = 'var(--cp-office-shade)';
const shadow = 'var(--cp-office-shadow)';
const screen = 'var(--cp-office-screen)';

function box(x, y, w, d, h, top = deskTop, side = edge, z = 0) {
  const [a, b, c, e] = rectangle(x, y, w, d, z);
  const [a1, b1, c1, e1] = rectangle(x, y, w, d, z + h);
  return poly([e, c, c1, e1], side) +
    poly([b, c, c1, b1], side, 'class="box-right"') +
    poly([a1, b1, c1, e1], top, 'class="box-top"');
}

function plant(x, y, scale = 1) {
  const [px, py] = project([x, y, 13 * scale]);
  return ellipse(x + 4, y + 3, 0, 10 * scale, 4 * scale, shadow) +
    box(x - 5 * scale, y - 5 * scale, 10 * scale, 10 * scale, 12 * scale, pale, edge) +
    `<g transform="translate(${px} ${py}) scale(${scale})" class="plant">
      <path d="M0 0 -7-18M0 0l8-16M0 0l1-23" fill="none" stroke="${ink}" stroke-width="1.4"/>
      <path d="M-1-8c-8 2-12-4-11-9 6 0 10 2 11 9Zm2-1c1-8 5-10 11-10-1 7-5 10-11 10Zm-1-4c-6-5-5-12 1-16 5 6 4 12-1 16Z" fill="${seat}"/>
    </g>`;
}

function chair(x, y) {
  return ellipse(x + 6, y + 3, 1, 13, 5, shadow) +
    box(x, y, 19, 18, 8, seat, edge) + box(x, y + 14, 19, 4, 12, pale, edge, 8);
}

function monitor(x, y) {
  return box(x + 8, y, 8, 8, 2, ink, edge, 24) +
    box(x, y + 3, 26, 3, 17, pale, edge, 27) +
    poly([[x + 2, y + 6, 42], [x + 24, y + 6, 42], [x + 24, y + 6, 30], [x + 2, y + 6, 30]], screen) +
    line([[x + 5, y + 6, 38], [x + 14, y + 6, 38]], accent, 'stroke-width="1.2"') +
    line([[x + 5, y + 6, 34], [x + 19, y + 6, 34]], pale, 'stroke-width="1" opacity=".8"');
}

function workstation(x, y, dual = false) {
  return flat(x + 7, y + 8, 70, 32, 0, shadow) +
    box(x + 2, y + 3, 5, 24, 21, edge) + box(x + 58, y + 3, 5, 24, 21, edge) +
    box(x, y, 66, 31, 4, deskTop, edge, 20) +
    monitor(x + (dual ? 5 : 20), y + 4) + (dual ? monitor(x + 34, y + 4) : '') +
    flat(x + 19, y + 22, 25, 5, 24.5, pale) + chair(x + 23, y + 34);
}

function couch(x, y, w = 64) {
  return flat(x + 5, y + 4, w, 26, 0, shadow) +
    box(x, y, w, 26, 12, seat) + box(x, y, w, 7, 16, pale, edge, 12) +
    box(x, y + 7, 7, 19, 7, pale, edge, 12) +
    box(x + w - 7, y + 7, 7, 19, 7, pale, edge, 12) +
    line([[x + w / 2, y + 7, 12.5], [x + w / 2, y + 24, 12.5]], edge, 'stroke-width="1"');
}

function shelf(x, y, books = true) {
  let items = '';
  for (let i = 0; i < 7; i++) {
    const height = 7 + (i * 3) % 8;
    items += box(x + 3 + i * 7, y + 9, 4, 3, height, i % 3 ? pale : seat, edge, 10);
  }
  return box(x, y, 57, 14, 29, deskTop) +
    poly([[x + 2, y + 14, 8], [x + 55, y + 14, 8], [x + 55, y + 14, 25], [x + 2, y + 14, 25]], screen) +
    (books ? items : line([[x + 9, y + 14, 16], [x + 48, y + 14, 16]], accent, 'stroke-width="2" stroke-dasharray="3 4"'));
}

function whiteboard(x, y) {
  return box(x, y, 58, 4, 36, pale, edge) +
    poly([[x + 3, y + 4, 33], [x + 55, y + 4, 33], [x + 55, y + 4, 11], [x + 3, y + 4, 11]], pale, `stroke="${edge}" stroke-width="1"`) +
    line([[x + 9, y + 4, 28], [x + 27, y + 4, 28]], accent, 'stroke-width="2"') +
    line([[x + 9, y + 4, 22], [x + 42, y + 4, 22]], edge, 'stroke-width="1.5"') +
    line([[x + 9, y + 4, 17], [x + 34, y + 4, 17]], edge, 'stroke-width="1.5"');
}

function person(x, y, tint = seat) {
  const [px, py] = project([x, y, 0]);
  return `<g transform="translate(${px} ${py})"><ellipse cy="-1" rx="7" ry="3" fill="${shadow}"/>
    <path d="M-2 0v-10m4 8v-9" stroke="${screen}" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M-5-10v-8c0-6 10-6 10 0v8Z" fill="${tint}" stroke="${edge}" stroke-width="1"/>
    <circle cy="-24" r="4.3" fill="${deskTop}"/><path d="M-4-24a4.2 4.2 0 1 1 8 0c-4-2-5 0-8 0Z" fill="${screen}"/>
  </g>`;
}

const positions = [
  [24, 214], [24, 24], [199, 24], [374, 24], [199, 214], [374, 214],
];
const quickNames = ['Welcome Desk', 'Model Studio', 'Agent Workshop', 'Tool Control', 'Context Library', 'Release Deck'];

export function marker(index) {
  const [x, y] = positions[index];
  const [px, py] = project([x + 76, y + 114, 13]);
  return { x: px / floorSize[0] * 100, y: py / floorSize[1] * 100, label: quickNames[index] };
}

export function office() {
  const decor = [
    (x, y) => couch(x + 13, y + 40) + box(x + 86, y + 31, 42, 28, 20) + plant(x + 122, y + 72) + person(x + 62, y + 91, accent),
    (x, y) => whiteboard(x + 76, y + 22) + workstation(x + 17, y + 49, true) + plant(x + 128, y + 68) + person(x + 95, y + 90),
    (x, y) => whiteboard(x + 62, y + 17) + chair(x + 12, y + 55) + box(x + 34, y + 40, 65, 38, 19) + chair(x + 66, y + 85) + person(x + 114, y + 73, accent),
    (x, y) => shelf(x + 79, y + 20, false) + workstation(x + 12, y + 49, true) + plant(x + 130, y + 83) + person(x + 98, y + 84),
    (x, y) => shelf(x + 12, y + 16) + shelf(x + 74, y + 16) + couch(x + 40, y + 58) + plant(x + 114, y + 65) + person(x + 27, y + 88, accent),
    (x, y) => whiteboard(x + 82, y + 18) + workstation(x + 18, y + 45, true) + plant(x + 125, y + 59) + person(x + 100, y + 87),
  ];
  const floor = box(0, 0, 550, 377, 16, 'url(#floor-tile)', 'var(--cp-office-base)', -16);
  const rail = line([[0, 377, -5], [550, 377, -5], [550, 0, -5]], accent, 'stroke-width="1.5" opacity=".64"');
  const zones = positions.map(([x, y], i) => `<g class="office-zone" data-zone="${i}">
    ${flat(x, y, 152, 138, .2, 'var(--cp-office-mat)', 'class="zone-mat"')}
    ${line([[x + 4, y + 135, 1], [x + 148, y + 135, 1], [x + 148, y + 5, 1]], edge, 'class="zone-edge"')}
    </g>`).join('');
  const aisles = line([[0, 188, 1], [550, 188, 1]], edge, 'stroke-dasharray="4 7" opacity=".65"') +
    [186, 362].map((x) => line([[x, 21, 1], [x, 355, 1]], edge, 'stroke-dasharray="4 7" opacity=".56"')).join('');
  const walls = box(2, 0, 546, 5, 41, pale, edge) + box(0, 5, 5, 368, 41, pale, edge) +
    [37, 96, 156, 217, 276, 335, 395, 454].map((x) => poly([
      [x, 5, 33], [x + 46, 5, 33], [x + 46, 5, 12], [x, 5, 12],
    ], 'url(#window-glass)', `stroke="${deskTop}" stroke-width="1.5"`)).join('');
  const dividers = [185, 360].map((x) => [28, 219].map((y) =>
    box(x, y, 4, 84, 19, pale) + line([[x + 4, y, 17], [x + 4, y + 84, 17]], pale, 'opacity=".6"')).join('')).join('');
  return `<svg viewBox="0 0 ${floorSize.join(' ')}" aria-hidden="true" focusable="false" class="office-art">
    <defs>
      <pattern id="floor-tile" patternUnits="userSpaceOnUse" width="34" height="14" patternTransform="skewY(28)">
        <rect width="34" height="14" fill="var(--cp-office-wood)"/><path d="M0 0h34M14 0v14" fill="none" stroke="${edge}" opacity=".28" stroke-width=".65"/>
      </pattern>
      <linearGradient id="window-glass" x2="0" y2="1">
        <stop stop-color="var(--cp-office-light)"/><stop offset="1" stop-color="${seat}"/>
      </linearGradient>
    </defs>
    ${flat(-4, 1, 573, 394, -24, shadow)}${floor}${rail}${zones}${aisles}${walls}${dividers}
    ${positions.map(([x, y], i) => decor[i](x, y)).join('')}
    ${plant(12, 176)}${plant(535, 180)}${plant(534, 357)}${plant(11, 360)}
  </svg>`;
}
