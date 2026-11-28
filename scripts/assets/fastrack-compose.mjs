// Our top-down diagrams of Fastrack (Blue Orange): the wooden track with checkered strips along the long sides of each half, the wall with
// its slot in the middle, the elastic cords and the ten red disks — in the colours of the box. The cover is the
// publisher's photo of the box (blueorangegames.com), squared.
// Run: node scripts/assets/fastrack-compose.mjs [name…] → app/games/fastrack-art/, app/games/covers/fastrack.webp
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createCanvas, loadImage, GlobalFonts } from "@napi-rs/canvas";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const font = (f, fam) => GlobalFonts.registerFromPath(path.join(root, "node_modules/@fontsource", f), fam);
font("onest/files/onest-cyrillic-600-normal.woff2", "OnestC"); font("onest/files/onest-latin-600-normal.woff2", "OnestL");
const ONEST = "OnestL, OnestC";

const W = 768, H = 512;
const C = { paper: "#F6F1E7", frame: "#B8262C", frameDark: "#7E1A1E", wood: "#F0D9AE", woodLine: "#E2C48F", ink: "#2B2220", muted: "#776B60",
  disk: "#C0392B", diskDark: "#7D2019", star: "#F2C14E", cord: "#1E1E1E", ok: "#2E7D4F", bad: "#B3261E", skin: "#E8B48E" };
// the track: outer frame, two camps (checkered) at the ends, the wall at x = 384 with the slot in the middle
const T = { x: 64, y: 96, w: 640, h: 300 };
const midY = T.y + T.h / 2, slot = 34, campW = 150, cordIn = 22;

function rr(x, X, Y, w, h, r) { x.beginPath(); x.roundRect(X, Y, w, h, r); }
function label(x, s, X, Y, o = {}) { x.font = `${o.size || 22}px ${ONEST}`; x.fillStyle = o.color || C.ink; x.textAlign = o.align || "center"; x.textBaseline = "middle"; x.fillText(s, X, Y); }
function tag(x, s, X, Y, o = {}) {
  const size = o.size || 22; x.font = `${size}px ${ONEST}`;
  const w = x.measureText(s).width + 30, h = size + 20;
  x.fillStyle = o.bg || C.frame; rr(x, X - w / 2, Y - h / 2, w, h, h / 2); x.fill();
  label(x, s, X, Y + 1, { size, color: o.color || "#fff" });
}
function arrow(x, pts, color = C.frame, dash) {
  x.strokeStyle = color; x.fillStyle = color; x.lineWidth = 5; x.lineCap = "round"; if (dash) x.setLineDash(dash);
  x.beginPath(); x.moveTo(...pts[0]);
  if (pts.length === 3) x.quadraticCurveTo(...pts[1], ...pts[2]); else x.lineTo(...pts[1]);
  x.stroke(); x.setLineDash([]);
  const [a1, a2] = [pts[pts.length - 2], pts[pts.length - 1]], a = Math.atan2(a2[1] - a1[1], a2[0] - a1[0]), s = 16;
  x.beginPath(); x.moveTo(...a2); x.lineTo(a2[0] - s * Math.cos(a - .45), a2[1] - s * Math.sin(a - .45)); x.lineTo(a2[0] - s * Math.cos(a + .45), a2[1] - s * Math.sin(a + .45)); x.closePath(); x.fill();
}
function cross(x, X, Y, r = 14) { x.strokeStyle = C.bad; x.lineWidth = 6; x.lineCap = "round"; x.beginPath(); x.moveTo(X - r, Y - r); x.lineTo(X + r, Y + r); x.moveTo(X + r, Y - r); x.lineTo(X - r, Y + r); x.stroke(); }
function tick(x, X, Y, r = 14) { x.strokeStyle = C.ok; x.lineWidth = 6; x.lineCap = "round"; x.beginPath(); x.moveTo(X - r, Y); x.lineTo(X - r / 3, Y + r * 0.7); x.lineTo(X + r, Y - r * 0.7); x.stroke(); }
function star(x, X, Y, r) {
  x.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r * 0.45 : r; x.lineTo(X + q * Math.cos(a), Y + q * Math.sin(a)); } x.closePath(); x.fill();
}
function disk(x, X, Y, r = 19, ghost = false) {
  x.save(); if (ghost) x.globalAlpha = 0.35;
  x.shadowColor = "#00000045"; x.shadowBlur = 6; x.shadowOffsetY = 3;
  // as on the box: a light wooden disk with a red circle and a white star
  x.fillStyle = "#C9A878"; x.beginPath(); x.arc(X, Y, r, 0, Math.PI * 2); x.fill(); x.shadowColor = "transparent";
  x.fillStyle = "#F3E3C3"; x.beginPath(); x.arc(X, Y, r * 0.88, 0, Math.PI * 2); x.fill();
  x.fillStyle = C.disk; x.beginPath(); x.arc(X, Y, r * 0.62, 0, Math.PI * 2); x.fill();
  x.fillStyle = "#fff"; star(x, X, Y, r * 0.42);
  x.restore();
}
// the cord of one end: a straight line across the camp, or pulled back by a finger at (px, py)
function cord(x, side, pull) {
  const X = side < 0 ? T.x + cordIn : T.x + T.w - cordIn;
  // a light rim keeps the black cord visible over the black and white squares
  for (const [col, lw] of [["#FFF4D6", 9], [C.cord, 4]]) { x.strokeStyle = col; x.lineWidth = lw; x.beginPath(); x.moveTo(X, T.y + 6); if (pull) x.lineTo(...pull); x.lineTo(X, T.y + T.h - 6); x.stroke(); }
  for (const Y of [T.y + 6, T.y + T.h - 6]) { x.fillStyle = C.frameDark; x.beginPath(); x.arc(X, Y, 6, 0, Math.PI * 2); x.fill(); }
}
function track(x, o = {}) {
  x.shadowColor = "#00000035"; x.shadowBlur = 14; x.shadowOffsetY = 6;
  x.fillStyle = C.frame; rr(x, T.x - 14, T.y - 14, T.w + 28, T.h + 28, 16); x.fill(); x.shadowColor = "transparent";
  x.fillStyle = C.wood; x.fillRect(T.x, T.y, T.w, T.h);
  x.strokeStyle = C.woodLine; x.lineWidth = 1.5;
  for (let Y = T.y + 18; Y < T.y + T.h; Y += 26) { x.beginPath(); x.moveTo(T.x, Y); x.bezierCurveTo(T.x + 200, Y - 6, T.x + 440, Y + 6, T.x + T.w, Y); x.stroke(); }
  // the checkered strips along both long sides, as on the box: the disks start on them
  const sq = 25;
  for (const top of [T.y, T.y + T.h - 2 * sq]) for (let i = 0; i * sq < T.w; i++) for (let j = 0; j < 2; j++) {
    x.fillStyle = (i + j) % 2 ? "#1F1F1F" : "#FAFAFA"; x.fillRect(T.x + i * sq, top + j * sq, Math.min(sq, T.w - i * sq), sq);
  }
  // the wall with its slot
  x.fillStyle = C.frame; x.fillRect(384 - 9, T.y - 14, 18, T.h / 2 - slot / 2 + 14); x.fillRect(384 - 9, midY + slot / 2, 18, T.h / 2 - slot / 2 + 14);
  x.fillStyle = C.frameDark; x.fillRect(384 - 9, midY - slot / 2 - 4, 18, 4); x.fillRect(384 - 9, midY + slot / 2, 18, 4);
  if (!o.noCords) { cord(x, -1, o.pullL); cord(x, 1, o.pullR); }
}
// disks spread over a camp (side -1: left, 1: right)
// a side's disks: the first five on its checkered strips (3 along the top, 2 along the bottom), more in the wood between
const camp = (side, n) => {
  const L = side < 0 ? T.x : 384 + 9, yt = T.y + 25, yb = T.y + T.h - 25;
  const pts = [[70, yt], [170, yt], [270, yt], [120, yb], [220, yb], [80, midY - 45], [180, midY - 45], [130, midY + 40], [230, midY + 40], [280, midY - 2]];
  return pts.slice(0, n).map(([dx, Y]) => [L + (side < 0 ? dx : 311 - dx), Y]);
};
function finger(x, X, Y, a) {
  x.save(); x.translate(X, Y); x.rotate(a);
  x.fillStyle = C.skin; x.strokeStyle = "#7A4A2C"; x.lineWidth = 3;
  rr(x, -14, -12, 120, 28, 14); x.fill(); x.stroke();
  x.fillStyle = "#F7D9C4"; rr(x, -10, -8, 22, 18, 6); x.fill();
  x.restore();
}
const scene = draw => { const c = createCanvas(W, H), x = c.getContext("2d"); x.fillStyle = C.paper; x.fillRect(0, 0, W, H); draw(x); return c; };

const scenes = {
  // setup: 5 disks on each checkered camp, the cords across the ends
  board: scene(x => {
    track(x);
    for (const [X, Y] of [...camp(-1, 5), ...camp(1, 5)]) disk(x, X, Y);
    tag(x, "5 дисков", T.x + 75, 450); tag(x, "5 дисков", T.x + T.w - 75, 450);
    label(x, "щель", 384, 54, { size: 22, color: C.muted }); arrow(x, [[384, 68], [384, midY - 30]], C.muted);
  }),
  // the shot: one finger pulls a disk back against the cord; it flies through the slot into the other camp
  shoot: scene(x => {
    track(x, { pullL: [T.x + 110, midY] });
    for (const [X, Y] of camp(1, 4)) disk(x, X, Y);
    disk(x, T.x + 132, midY);
    finger(x, T.x + 96, midY + 4, Math.PI * 0.95);
    arrow(x, [[T.x + 170, midY], [T.x + T.w - 170, midY]], C.frame, [14, 10]);
    tag(x, "Только резинкой, одним пальцем", 384, 452);
  }),
  // a disk stuck in the slot: only another disk may push it out
  slot: scene(x => {
    track(x);
    disk(x, 384, midY);
    disk(x, 250, midY + 8); arrow(x, [[272, midY + 6], [352, midY + 2]], C.frame);
    for (const [X, Y] of camp(-1, 2)) disk(x, X, Y);
    for (const [X, Y] of camp(1, 3)) disk(x, X, Y);
    finger(x, 384 - 40, midY - 80, -0.6); cross(x, 384 - 30, midY - 70, 20);
    tag(x, "Застрял — выбивайте другим диском", 384, 452);
  }),
  // over the wall — counts; off the board — out until the end of the round
  over: scene(x => {
    track(x);
    disk(x, 220, T.y + T.h - 70, 19, true); arrow(x, [[232, T.y + T.h - 90], [384, T.y + 110], [536, T.y + T.h - 90]], C.ok, [12, 9]); disk(x, 560, T.y + T.h - 70);
    tick(x, 452, T.y + 150, 16);
    disk(x, 250, T.y + 70, 19, true); arrow(x, [[240, T.y + 52], [200, T.y - 30]], C.bad, [12, 9]); disk(x, 186, 44);
    cross(x, 232, 44, 14);
    tag(x, "Через перегородку — считается", 560, 452, { bg: C.ok });
    tag(x, "За поле — вне игры", 175, 452, { bg: C.bad });
  }),
  // the round: the first to have all 10 disks in the other camp wins it; the game — two rounds of three
  round: scene(x => {
    track(x);
    for (const [X, Y] of camp(1, 10)) disk(x, X, Y);
    tag(x, "Все 10 у соперника — раунд выигран", 384, 46);
    [true, true, false].forEach((won, i) => {
      const X = 200 + i * 80, Y = 456;
      x.fillStyle = won ? C.star : "#fff"; x.strokeStyle = C.ink; x.lineWidth = 3; x.beginPath(); x.arc(X, Y, 24, 0, Math.PI * 2); x.fill(); x.stroke();
      label(x, String(i + 1), X, Y + 1, { size: 22 });
    });
    label(x, "2 из 3 — победа", 540, 456, { size: 24 });
  }),
};

const only = new Set(process.argv.slice(2)), want = k => !only.size || only.has(k);
const dir = path.join(root, "app/games/fastrack-art"); fs.mkdirSync(dir, { recursive: true });
for (const [k, c] of Object.entries(scenes)) if (want(k)) { const b = c.toBuffer("image/webp", 82); fs.writeFileSync(path.join(dir, k + ".webp"), b); console.log(k, Math.round(b.length / 1024) + "KB"); }
if (want("cover")) {
  // the publisher's photo is 384 × 364: the box on white, made square with a white margin
  const img = await loadImage(fs.readFileSync(path.join(root, "sources/dl-fastrack/web/Fastrack_Updated-Packaging_09012026144217.jpg")));
  const c = createCanvas(512, 512), x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, 512, 512);
  x.imageSmoothingQuality = "high"; const k = 512 / img.width; x.drawImage(img, 0, (512 - img.height * k) / 2, 512, img.height * k);
  const b = c.toBuffer("image/webp", 90); fs.writeFileSync(path.join(root, "app/games/covers/fastrack.webp"), b); console.log("cover", Math.round(b.length / 1024) + "KB");
}
