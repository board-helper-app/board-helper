// Builds the «Коридор» (Quoridor) pictures: our own top-down drawings of the board in the game's materials (a dark wooden
// board with grooves, light wooden fences, four turned pawns), drawn after the rules' text (the figures 1–10 are not in
// the published PDF), and the square cover — the front of the box from the publisher's photo (sources/dl-quoridor/web,
// gigamic.com). Output: app/games/quoridor-art/<name>.webp and app/games/covers/quoridor.webp.
// Run: node scripts/assets/quoridor-compose.mjs [name…]
import fs from "node:fs";
import path from "node:path";
import { root, createCanvas, loadImage, saver, text, tag, UIB, INK } from "./compose-kit.mjs";

const save = saver(path.join(root, "app", "games", "quoridor-art"));
const saveCover = saver(path.join(root, "app", "games", "covers"));
const W = 768, H = 512;
const BG = "#F3EBDD", WOOD = "#6B3326", WOOD_D = "#4A2119", CELL = "#7A3D2E", CELL_L = "#8A4A39";
const FENCE = "#EDBE6E", FENCE_D = "#B9813A", OK = "#2E9B4F", NO = "#D9483B", GOAL = "#F2C230";
// the four pawns as on the box: aubergine, plum, orange and natural wood
export const PAWN = { dark: "#4A1E3C", plum: "#9C3D7A", orange: "#E0954E", wood: "#F0DCC6" };
const shade = (hex, k) => "#" + [1, 3, 5].map(i => Math.max(0, Math.min(255, Math.round(parseInt(hex.slice(i, i + 2), 16) * (1 + k))))).map(v => v.toString(16).padStart(2, "0")).join("");

/* ---------- a board (or a piece of it) seen from above ----------
   cols × rows cells of size s with grooves g; fences: { c, r, d } — "h": in the groove under row r over cols c and c+1,
   "v": in the groove right of col c over rows r and r+1; pawns: { c, r, col }; marks: cells to tint { c, r, fill } */
function board(X, Y, cols, rows, s, g, o = {}) {
  const cx = c => X + g + c * (s + g) + s / 2, cy = r => Y + g + r * (s + g) + s / 2;
  const w = cols * s + (cols + 1) * g, h = rows * s + (rows + 1) * g;
  let out = `<rect x="${X - 6}" y="${Y - 6}" width="${w + 12}" height="${h + 12}" rx="${o.edge === false ? 4 : 14}" fill="${WOOD}" stroke="${WOOD_D}" stroke-width="4"/>`;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const m = (o.marks || []).find(k => k.c === c && k.r === r);
    out += `<rect x="${cx(c) - s / 2}" y="${cy(r) - s / 2}" width="${s}" height="${s}" rx="${s * 0.12}" fill="${m ? m.fill : CELL}" stroke="${CELL_L}" stroke-width="2"/>`;
  }
  for (const f of o.fences || []) out += fence(f.d === "h" ? cx(f.c) - s / 2 : cx(f.c) + s / 2, f.d === "h" ? cy(f.r) + s / 2 : cy(f.r) - s / 2, s, g, f.d, f.bad);
  for (const p of o.pawns || []) out += pawn(cx(p.c), cy(p.r), s * 0.36, p.col, p.ghost);
  return { svg: out, cx, cy, w, h };
}
// a fence lying in a groove: two cells and the groove between them long
function fence(x, y, s, g, d, bad) {
  const L = 2 * s + g, T = g * 1.25, fill = bad ? "#F4C9C4" : FENCE, st = bad ? NO : FENCE_D;
  return d === "h"
    ? `<rect x="${x}" y="${y + g / 2 - T / 2}" width="${L}" height="${T}" rx="2.5" fill="${fill}" stroke="${st}" stroke-width="2"/>`
    : `<rect x="${x + g / 2 - T / 2}" y="${y}" width="${T}" height="${L}" rx="2.5" fill="${fill}" stroke="${st}" stroke-width="2"/>`;
}
// a turned pawn from above: the base, the body, the head
function pawn(x, y, r, col, ghost) {
  const d = shade(col, -0.35), l = shade(col, 0.4), op = ghost ? ` opacity=".35"` : "";
  return `<g${op}><circle cx="${x + r * 0.12}" cy="${y + r * 0.16}" r="${r}" fill="#000" opacity=".25"/><circle cx="${x}" cy="${y}" r="${r}" fill="${col}" stroke="${d}" stroke-width="2.5"/>
    <circle cx="${x}" cy="${y}" r="${r * 0.62}" fill="${col}" stroke="${d}" stroke-width="2"/><circle cx="${x - r * 0.2}" cy="${y - r * 0.2}" r="${r * 0.2}" fill="${l}" opacity=".8"/></g>`;
}
// fences waiting beside the board
const pile = (x, y, n, s, g, d, step) => Array.from({ length: n }, (_, i) => d === "h" ? fence(x, y + i * (step || g * 2), s, g, "h") : fence(x + i * (step || g * 2), y, s, g, "v")).join("");
const arrow = (x1, y1, x2, y2, col, dash) => {
  const a = Math.atan2(y2 - y1, x2 - x1), k = 16, ex = x2 - Math.cos(a) * 10, ey = y2 - Math.sin(a) * 10;
  return `<path d="M${x1} ${y1} L${ex} ${ey}" stroke="${col}" stroke-width="6" stroke-linecap="round"${dash ? ` stroke-dasharray="2 11"` : ""}/>
    <path d="M${x2} ${y2} L${x2 - k * Math.cos(a - .5)} ${y2 - k * Math.sin(a - .5)} L${x2 - k * Math.cos(a + .5)} ${y2 - k * Math.sin(a + .5)} Z" fill="${col}"/>`;
};
// a hop over a pawn: an arc with a head
function hop(x1, y1, x2, y2, lift, col) {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, nx = -(y2 - y1), ny = x2 - x1, n = Math.hypot(nx, ny) || 1, qx = mx + nx / n * lift, qy = my + ny / n * lift;
  const a = Math.atan2(y2 - qy, x2 - qx), k = 16;
  return `<path d="M${x1} ${y1} Q${qx} ${qy} ${x2 - Math.cos(a) * 9} ${y2 - Math.sin(a) * 9}" fill="none" stroke="${col}" stroke-width="6" stroke-linecap="round"/>
    <path d="M${x2} ${y2} L${x2 - k * Math.cos(a - .5)} ${y2 - k * Math.sin(a - .5)} L${x2 - k * Math.cos(a + .5)} ${y2 - k * Math.sin(a + .5)} Z" fill="${col}"/>`;
}
const check = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${OK}" stroke="#fff" stroke-width="3"/><path d="M${x - r * .45} ${y} l${r * .3} ${r * .35} l${r * .6} ${-r * .7}" fill="none" stroke="#fff" stroke-width="${r * .28}" stroke-linecap="round" stroke-linejoin="round"/>`;
const cross = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${NO}" stroke="#fff" stroke-width="3"/><path d="M${x - r * .4} ${y - r * .4} l${r * .8} ${r * .8} M${x + r * .4} ${y - r * .4} l${-r * .8} ${r * .8}" stroke="#fff" stroke-width="${r * .28}" stroke-linecap="round"/>`;

async function render(name, svg, labels) {
  const im = await loadImage(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="${BG}"/>${svg}</svg>`));
  const c = createCanvas(W, H), x = c.getContext("2d");
  x.drawImage(im, 0, 0);
  for (const l of labels || []) {
    if (l.tag) tag(x, l.t, l.x, l.y, { size: l.size || 22, bg: l.bg || INK, align: l.align });
    else text(x, l.t, l.x, l.y, { font: UIB(l.size || 24), color: l.color || INK, align: l.align || "center", maxW: l.maxW });
  }
  save(name, c, 82);
}

const S = 34, G = 8;   // the full board: 9 × 34 + 10 × 8 = 386
const jobs = {
  // fig.1: two players — each pawn in the middle of its first row, 10 fences each in the storage
  async start2() {
    const b = board(W / 2 - 193, 63, 9, 9, S, G, { pawns: [{ c: 4, r: 8, col: PAWN.orange }, { c: 4, r: 0, col: PAWN.dark }] });
    let s = b.svg;
    s += `<rect x="24" y="40" width="148" height="432" rx="12" fill="${WOOD_D}"/><rect x="${W - 172}" y="40" width="148" height="432" rx="12" fill="${WOOD_D}"/>`;
    s += pile(40, 70, 10, 26, 7, "v", 12);
    s += pile(W - 164, 70, 10, 26, 7, "v", 12);
    await render("start2", s, [{ t: "10", x: 98, y: 300, size: 34, color: "#fff" }, { t: "10", x: W - 98, y: 300, size: 34, color: "#fff" },
      { t: "перегородок", x: 98, y: 330, size: 22, color: "#F3EBDD" }, { t: "перегородок", x: W - 98, y: 330, size: 22, color: "#F3EBDD" }]);
  },
  // four players — a pawn in the middle of each side, 5 fences each
  async start4() {
    const X = W / 2 - 193, Y = 63, b = board(X, Y, 9, 9, S, G, { pawns: [{ c: 4, r: 8, col: PAWN.orange }, { c: 4, r: 0, col: PAWN.dark }, { c: 0, r: 4, col: PAWN.plum }, { c: 8, r: 4, col: PAWN.wood }] });
    let s = b.svg + pile(60, 150, 5, 26, 7, "v") + pile(W - 136, 150, 5, 26, 7, "v");
    await render("start4", s, [{ t: "по 5", x: 96, y: 290, size: 28 }, { t: "по 5", x: W - 96, y: 290, size: 28 }, { t: "у каждого", x: 96, y: 318, size: 20 }, { t: "у каждого", x: W - 96, y: 318, size: 20 }]);
  },
  // fig.2: one cell forwards, backwards, right or left — never diagonally
  async move() {
    const s0 = 66, g0 = 14, b = board(W / 2 - 207, 20, 5, 5, s0, g0, { pawns: [{ c: 2, r: 2, col: PAWN.orange }], marks: [[2, 1], [2, 3], [1, 2], [3, 2]].map(([c, r]) => ({ c, r, fill: "#3F7D4E" })) });
    let s = b.svg, x0 = b.cx(2), y0 = b.cy(2);
    for (const [c, r] of [[2, 1], [2, 3], [1, 2], [3, 2]]) s += arrow(x0 + (b.cx(c) - x0) * 0.35, y0 + (b.cy(r) - y0) * 0.35, b.cx(c), b.cy(r), "#fff");
    s += cross(b.cx(3), b.cy(1), 16);
    await render("move", s, [{ t: "1 клетка: вперёд, назад, вправо, влево", x: W / 2, y: 496, size: 28 }]);
  },
  // fig.3: a fence is never jumped — the pawn goes round it
  async around() {
    const s0 = 64, g0 = 14, b = board(W / 2 - 211, 30, 5, 5, s0, g0, { fences: [{ c: 1, r: 1, d: "h" }], pawns: [{ c: 2, r: 2, col: PAWN.orange }] });
    let s = b.svg;
    s += arrow(b.cx(2), b.cy(2) - 30, b.cx(2), b.cy(1) + 6, NO) + cross(b.cx(2) + 26, b.cy(1) + s0 / 2 + 7, 15);
    s += arrow(b.cx(2) + 26, b.cy(2), b.cx(3) - 4, b.cy(2), "#fff", true) + arrow(b.cx(3), b.cy(2) - 6, b.cx(3), b.cy(1) + 4, "#fff", true) + arrow(b.cx(3) - 6, b.cy(1), b.cx(2) + 12, b.cy(1), "#fff", true);
    await render("around", s, [{ t: "Через перегородку нельзя — обходите", x: W / 2, y: 496, size: 28 }]);
  },
  // fig.4: a fence closes exactly two cells, in the groove between them
  async fence() {
    const s0 = 64, g0 = 14, b = board(W / 2 - 211, 30, 5, 5, s0, g0, { fences: [{ c: 0, r: 1, d: "h" }, { c: 3, r: 1, d: "v" }, { c: 1, r: 3, d: "h" }],
      marks: [{ c: 0, r: 1, fill: "#A8673F" }, { c: 1, r: 1, fill: "#A8673F" }] });
    let s = b.svg + check(b.cx(1) + s0 / 2 + 7, b.cy(1) + s0 / 2 + 7, 15) + check(b.cx(3) + s0 / 2 + 7, b.cy(1) - 40, 15) + check(b.cx(2) + s0 / 2 + 7, b.cy(3) + s0 / 2 + 7, 15);
    await render("fence", s, [{ t: "Перегородка закрывает ровно 2 клетки", x: W / 2, y: 496, size: 28 }]);
  },
  // fig.5: a way to the goal line must always stay open
  async open() {
    const s0 = 40, g0 = 9, mk = (X, gap) => board(X, 70, 6, 6, s0, g0, { pawns: [{ c: 2, r: 4, col: PAWN.orange }],
      marks: [0, 1, 2, 3, 4, 5].map(c => ({ c, r: 0, fill: "#8C6A2C" })),
      fences: [{ c: 0, r: 2, d: "h" }, { c: 2, r: 2, d: "h" }, ...(gap ? [] : [{ c: 4, r: 2, d: "h", bad: true }])] });
    const L = mk(60, false), R = mk(W - 60 - 6 * s0 - 7 * g0, true);
    let s = L.svg + R.svg + cross(60 + 160, 36, 20) + check(W - 60 - 160, 36, 20);
    s += arrow(R.cx(2), R.cy(4) - 22, R.cx(2), R.cy(3) + 4, "#fff", true) + arrow(R.cx(2) + 6, R.cy(3), R.cx(5) + 2, R.cy(3), "#fff", true) + arrow(R.cx(5), R.cy(3) - 6, R.cx(5), R.cy(0) + 6, "#fff", true);
    await render("open", s, [{ t: "Финишная линия — сверху", x: W / 2, y: 414, size: 24, color: "#5F6B78" }, { t: "Выход к финишу должен остаться", x: W / 2, y: 474, size: 28 }]);
  },
  // fig.6: face to face — jump over the pawn and land behind it
  async jump() {
    const s0 = 64, g0 = 14, b = board(W / 2 - 211, 30, 5, 5, s0, g0, { pawns: [{ c: 2, r: 3, col: PAWN.orange }, { c: 2, r: 2, col: PAWN.dark }, { c: 2, r: 1, col: PAWN.orange, ghost: true }] });
    let s = b.svg + hop(b.cx(2) + 22, b.cy(3) - 10, b.cx(2) + 22, b.cy(1) + 10, -60, "#fff");
    await render("jump", s, [{ t: "Лицом к лицу — прыжок через фишку", x: W / 2, y: 496, size: 28 }]);
  },
  // fig.8 and 9: a fence behind the pawn — step to its right or left
  async side() {
    const s0 = 64, g0 = 14, b = board(W / 2 - 211, 30, 5, 5, s0, g0, { fences: [{ c: 1, r: 1, d: "h" }], pawns: [{ c: 2, r: 3, col: PAWN.orange }, { c: 2, r: 2, col: PAWN.dark }, { c: 1, r: 2, col: PAWN.orange, ghost: true }, { c: 3, r: 2, col: PAWN.orange, ghost: true }] });
    let s = b.svg + hop(b.cx(2) - 16, b.cy(3) - 14, b.cx(1) + 8, b.cy(2) + 12, 22, "#fff") + hop(b.cx(2) + 16, b.cy(3) - 14, b.cx(3) - 8, b.cy(2) + 12, -22, "#fff");
    await render("side", s, [{ t: "За фишкой перегородка — встаньте сбоку", x: W / 2, y: 496, size: 28 }]);
  },
  // fig.7: any of the 9 cells of the line opposite the start line wins
  async goal() {
    const b = board(W / 2 - 193, 40, 9, 9, S, G, { marks: Array.from({ length: 9 }, (_, c) => ({ c, r: 0, fill: "#B88A2A" })),
      pawns: [{ c: 6, r: 0, col: PAWN.orange }, { c: 3, r: 5, col: PAWN.dark }], fences: [{ c: 4, r: 1, d: "h" }, { c: 1, r: 3, d: "v" }, { c: 6, r: 4, d: "h" }] });
    let s = b.svg + `<rect x="${W / 2 - 193 - 6}" y="${b.cy(8) + S / 2 + 4}" width="398" height="8" fill="${PAWN.orange}"/>`;
    await render("goal", s, [{ t: "Финиш", x: W / 2 + 290, y: 70, tag: true, size: 20, bg: "#B88A2A" }, { t: "Старт", x: W / 2 + 290, y: 432, tag: true, size: 20 },
      { t: "Любая из 9 клеток напротив — победа", x: W / 2, y: 500, size: 28 }]);
  },
  // fig.10: four players — never jump more than one pawn
  async jump4() {
    const s0 = 64, g0 = 14, b = board(W / 2 - 211, 30, 5, 5, s0, g0, { pawns: [{ c: 2, r: 4, col: PAWN.orange }, { c: 2, r: 3, col: PAWN.dark }, { c: 2, r: 2, col: PAWN.plum }, { c: 2, r: 1, col: PAWN.orange, ghost: true }] });
    let s = b.svg + hop(b.cx(2) + 24, b.cy(4) - 8, b.cx(2) + 24, b.cy(1) + 8, -80, NO) + cross(b.cx(2) + 120, b.cy(2) + 6, 18);
    await render("jump4", s, [{ t: "Вчетвером — только через одну фишку", x: W / 2, y: 496, size: 28 }]);
  },
  // the square cover: the front of the box from the publisher's photo
  async cover() {
    const im = await loadImage(fs.readFileSync(path.join(root, "sources", "dl-quoridor", "web", "fr-1350.jpg")));
    const c = createCanvas(512, 512), x = c.getContext("2d"), k = im.width / 800;
    x.imageSmoothingQuality = "high"; x.drawImage(im, 98 * k, 98 * k, 604 * k, 604 * k, 0, 0, 512, 512);
    saveCover("quoridor", c, 82);
  },
};
const only = process.argv.slice(2);
for (const [name, job] of Object.entries(jobs)) if (!only.length || only.includes(name)) await job();
