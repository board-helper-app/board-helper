// Our pictures for «Тако, кот, коза, сыр, пицца»: simple scenes of cards, piles and hands in the colours of the Hobby World
// box (lime and magenta), with the characters cut out of the rulebook by taco-crops.mjs. The gesture tiles of the special
// cards are the rulebook's own pictures (page 5). The cover is the publisher's render of the Russian box.
// Run: node scripts/assets/taco-crops.mjs, then node scripts/assets/taco-compose.mjs [name…] → app/games/taco-art/, covers/taco.webp
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createCanvas, loadImage, GlobalFonts } from "@napi-rs/canvas";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const font = (f, fam) => GlobalFonts.registerFromPath(path.join(root, "node_modules/@fontsource", f), fam);
font("unbounded/files/unbounded-cyrillic-800-normal.woff2", "UnbC"); font("unbounded/files/unbounded-latin-800-normal.woff2", "UnbL");
font("onest/files/onest-cyrillic-600-normal.woff2", "OnestC"); font("onest/files/onest-latin-600-normal.woff2", "OnestL");
const UNB = "UnbL, UnbC", ONEST = "OnestL, OnestC";

const W = 768, H = 512;
const C = { paper: "#FBF8E4", lime: "#E4E85A", limeDark: "#C9CD2E", magenta: "#E2177F", ink: "#2A1E1A", brown: "#6B4A2E", muted: "#7A6A55",
  green: "#2E8B57", red: "#C62F3A", skin: ["#F2C7A0", "#D9A273", "#A8714A"] };
const FACE = { taco: "#BFE3C4", cat: "#B5DDE8", goat: "#F1EBA6", cheese: "#D9B8E0", pizza: "#F3B6BE", gorilla: "#D7B6E0", groundhog: "#F3B6BE", narwhal: "#F1EBA6" };
const WORD = { taco: "ТАКО", cat: "КОТ", goat: "КОЗА", cheese: "СЫР", pizza: "ПИЦЦА", gorilla: "ГОРИЛЛА", groundhog: "СУРОК", narwhal: "НАРВАЛ" };
const pics = {};
for (const k of Object.keys(WORD)) pics[k] = await loadImage(fs.readFileSync(path.join(root, "sources/assets/taco", k + ".png")));

function rr(x, X, Y, w, h, r) { x.beginPath(); x.roundRect(X, Y, w, h, r); }
function label(x, s, X, Y, o = {}) {
  x.font = `${o.size || 22}px ${o.disp ? UNB : ONEST}`; x.fillStyle = o.color || C.ink; x.textAlign = o.align || "center"; x.textBaseline = "middle";
  x.fillText(s, X, Y);
}
function tag(x, s, X, Y, o = {}) {
  const size = o.size || 22; x.font = `${size}px ${ONEST}`;
  const w = x.measureText(s).width + 30, h = size + 20, L = X - w / 2;
  x.fillStyle = o.bg || C.magenta; rr(x, L, Y - h / 2, w, h, h / 2); x.fill();
  label(x, s, X, Y + 1, { size, color: o.color || "#fff" });
}
function fitIn(x, img, X, Y, w, h) { const k = Math.min(w / img.width, h / img.height); x.drawImage(img, X + (w - img.width * k) / 2, Y + (h - img.height * k) / 2, img.width * k, img.height * k); }
// a card face up: pastel face, the word in the corner (and upside down in the other), the character in the middle
function face(x, cx, cy, w, k, a = 0, o = {}) {
  const h = w * 1.4;
  x.save(); x.translate(cx, cy); x.rotate(a);
  x.shadowColor = "#0000002e"; x.shadowBlur = 10; x.shadowOffsetY = 4;
  x.fillStyle = "#fff"; rr(x, -w / 2, -h / 2, w, h, w * 0.09); x.fill(); x.shadowColor = "transparent";
  x.fillStyle = FACE[k]; rr(x, -w / 2 + 4, -h / 2 + 4, w - 8, h - 8, w * 0.07); x.fill();
  if (o.ring) { x.strokeStyle = C.magenta; x.lineWidth = 7; rr(x, -w / 2 - 6, -h / 2 - 6, w + 12, h + 12, w * 0.12); x.stroke(); }
  label(x, WORD[k], -w / 2 + 12, -h / 2 + w * 0.13, { size: Math.round(w * 0.13), disp: true, align: "left" });
  x.save(); x.rotate(Math.PI); label(x, WORD[k], -w / 2 + 12, -h / 2 + w * 0.13, { size: Math.round(w * 0.13), disp: true, align: "left" }); x.restore();
  fitIn(x, pics[k], -w * 0.4, -h * 0.3, w * 0.8, h * 0.6);
  x.restore();
}
// a card face down: the lime back with the five words and the stripes of the box
function back(x, cx, cy, w, a = 0) {
  const h = w * 1.4;
  x.save(); x.translate(cx, cy); x.rotate(a);
  x.shadowColor = "#0000002e"; x.shadowBlur = 8; x.shadowOffsetY = 3;
  x.fillStyle = C.lime; rr(x, -w / 2, -h / 2, w, h, w * 0.09); x.fill(); x.shadowColor = "transparent";
  x.strokeStyle = C.limeDark; x.lineWidth = 2; x.stroke();
  const s = Math.max(7, Math.round(w * 0.1));
  ["ТАКО", "КОТ", "КОЗА", "СЫР", "ПИЦЦА"].forEach((t, i) => label(x, t, -w / 2 + w * 0.12, -h / 2 + h * 0.16 + i * s * 1.25, { size: s, disp: true, align: "left" }));
  x.fillStyle = C.ink; x.fillRect(-w * 0.18, h * 0.12, w * 0.06, h * 0.3); x.fillRect(-w * 0.06, h * 0.06, w * 0.06, h * 0.36);
  x.fillStyle = C.magenta; x.fillRect(w * 0.06, h * 0.18, w * 0.06, h * 0.24);
  x.restore();
}
// a stack of cards face down, its height shown by the edges below
function pile(x, cx, cy, w, n = 6) { for (let i = n - 1; i >= 0; i--) back(x, cx + i * 0.6, cy + i * 2.4, w); }
// a hand from above, fingers pointing up (a mitten with four fingers and a thumb); flip = thumb on the other side
function hand(x, cx, cy, s, tone, a = 0, flip = false) {
  x.save(); x.translate(cx, cy); x.rotate(a); if (flip) x.scale(-1, 1);
  x.shadowColor = "#00000040"; x.shadowBlur = 10; x.shadowOffsetY = 5;
  x.fillStyle = tone; x.strokeStyle = "#5A3A25"; x.lineWidth = 3;
  const finger = (fx, fy, fw, fh, fa = 0) => { x.save(); x.translate(fx, fy); x.rotate(fa); rr(x, -fw / 2, -fh, fw, fh, fw / 2); x.fill(); x.stroke(); x.restore(); };
  finger(-0.36 * s, -0.1 * s, 0.22 * s, 0.62 * s, -0.08); finger(-0.12 * s, -0.22 * s, 0.23 * s, 0.72 * s); finger(0.12 * s, -0.2 * s, 0.23 * s, 0.68 * s);
  finger(0.34 * s, -0.1 * s, 0.2 * s, 0.52 * s, 0.1); finger(-0.5 * s, 0.25 * s, 0.24 * s, 0.5 * s, -0.95);
  rr(x, -0.5 * s, -0.25 * s, 1.0 * s, 0.95 * s, 0.32 * s); x.fill(); x.stroke();
  x.shadowColor = "transparent"; x.fillStyle = tone; rr(x, -0.47 * s, -0.3 * s, 0.94 * s, 0.3 * s, 0.1 * s); x.fill();
  x.restore();
}
function bubble(x, s, cx, cy, o = {}) {
  x.font = `${o.size || 22}px ${UNB}`; const w = x.measureText(s).width + 26, h = (o.size || 22) + 22;
  x.fillStyle = o.bg || "#fff"; x.strokeStyle = o.line || C.ink; x.lineWidth = 2.5;
  rr(x, cx - w / 2, cy - h / 2, w, h, 14); x.fill(); x.stroke();
  x.beginPath(); x.moveTo(cx - 8, cy + h / 2 - 1); x.lineTo(cx, cy + h / 2 + 12); x.lineTo(cx + 8, cy + h / 2 - 1); x.closePath(); x.fill();
  x.beginPath(); x.moveTo(cx - 8, cy + h / 2); x.lineTo(cx, cy + h / 2 + 12); x.lineTo(cx + 8, cy + h / 2); x.stroke();
  label(x, s, cx, cy + 1, { size: o.size || 22, disp: true, color: o.color || C.ink });
}
function arrow(x, x1, y1, x2, y2, color = C.magenta) {
  x.strokeStyle = color; x.fillStyle = color; x.lineWidth = 5; x.lineCap = "round";
  x.beginPath(); x.moveTo(x1, y1); x.lineTo(x2, y2); x.stroke();
  const a = Math.atan2(y2 - y1, x2 - x1), s = 16;
  x.beginPath(); x.moveTo(x2, y2); x.lineTo(x2 - s * Math.cos(a - .45), y2 - s * Math.sin(a - .45)); x.lineTo(x2 - s * Math.cos(a + .45), y2 - s * Math.sin(a + .45)); x.closePath(); x.fill();
}
const scene = draw => { const c = createCanvas(W, H), x = c.getContext("2d"); x.fillStyle = C.paper; x.fillRect(0, 0, W, H); draw(x); return c; };

const scenes = {
  // setup: everyone gets the same number of cards face down; the rest go back into the box
  deal: scene(x => {
    pile(x, 384, 250, 92, 9);
    tag(x, "Перемешайте", 384, 120, { bg: C.ink });
    const seats = [[130, 140], [638, 140], [130, 380], [638, 380]];
    seats.forEach(([sx, sy], i) => { pile(x, sx, sy, 70, 5); arrow(x, 384 + (sx - 384) * 0.32, 250 + (sy - 250) * 0.32, 384 + (sx - 384) * 0.68, 250 + (sy - 250) * 0.62, C.brown); });
    tag(x, "поровну каждому", 384, 420);
    tag(x, "не смотреть!", 384, 470, { bg: C.ink });
  }),
  // the turn: turn the top card over without looking and say the next word; a match — the picture is the word said
  turn: scene(x => {
    const row = [["cat", "Тако"], ["pizza", "Кот"], ["taco", "Коза"], ["cheese", "Сыр"]];
    row.forEach(([k, w], i) => {
      const cx = 135 + i * 166, match = i === 3;
      face(x, cx, 300, 128, k, (i - 1.5) * 0.04, { ring: match });
      bubble(x, w, cx, 118, match ? { bg: C.magenta, line: C.magenta, color: "#fff" } : {});
    });
    tag(x, "Совпадение!", 633, 470);
  }),
  // a match: everybody slaps the pile; the hand on top (the last one) takes the whole pile
  slap: scene(x => {
    face(x, 384, 300, 120, "pizza", -0.12); face(x, 384, 300, 120, "cheese", 0.1);
    hand(x, 350, 310, 120, C.skin[2], -0.5); hand(x, 418, 300, 120, C.skin[0], 0.45, true); hand(x, 384, 262, 118, C.skin[1], 0.05);
    tag(x, "Рука сверху — последняя: забирает стопку", 384, 74);
    arrow(x, 384, 100, 384, 150);
    pile(x, 660, 300, 70, 4); arrow(x, 520, 300, 600, 300, C.brown); label(x, "под низ колоды", 660, 400, { size: 22, color: C.brown });
  }),
  // the special cards and what to do before slapping
  specials: scene(x => {
    [["gorilla", "по груди"], ["groundhog", "по столу"], ["narwhal", "руки рогом"]].forEach(([k, t], i) => {
      const cx = 140 + i * 244;
      face(x, cx, 220, 150, k, (i - 1) * 0.05);
      tag(x, t, cx, 435, { bg: C.ink });
    });
    label(x, "Сделайте жест, потом накройте стопку", 384, 488, { size: 22, color: C.brown });
  }),
  // the end: no cards left in one's deck and the first hand on the pile at a match or a special card
  end: scene(x => {
    x.setLineDash([10, 8]); x.strokeStyle = C.muted; x.lineWidth = 3; rr(x, 70, 170, 120, 168, 12); x.stroke(); x.setLineDash([]);
    label(x, "0 карт", 130, 254, { size: 24, color: C.muted });
    face(x, 440, 290, 124, "goat", -0.08); face(x, 440, 290, 124, "pizza", 0.06);
    hand(x, 440, 300, 120, C.skin[1], 0.05);
    arrow(x, 200, 254, 330, 280);
    tag(x, "Первым — и победа!", 440, 90);
    hand(x, 650, 330, 90, C.skin[0], 0.5, true); label(x, "опоздали", 650, 440, { size: 20, color: C.muted });
  }),
  // a player out of cards goes on: says the word on the turn and slaps
  empty: scene(x => {
    x.setLineDash([10, 8]); x.strokeStyle = C.muted; x.lineWidth = 3; rr(x, 120, 200, 120, 168, 12); x.stroke(); x.setLineDash([]);
    label(x, "0 карт", 180, 284, { size: 24, color: C.muted });
    bubble(x, "Сыр!", 180, 130);
    face(x, 520, 284, 124, "taco", 0.06);
    tag(x, "Карты кончились — играйте дальше", 384, 450);
  }),
};

const only = new Set(process.argv.slice(2)), want = k => !only.size || only.has(k);
const dir = path.join(root, "app/games/taco-art"); fs.mkdirSync(dir, { recursive: true });
const save = (name, c, q = 80) => { const b = c.toBuffer("image/webp", q); fs.writeFileSync(path.join(dir, name + ".webp"), b); console.log(name, c.width + "x" + c.height, Math.round(b.length / 1024) + "KB"); };
for (const [k, c] of Object.entries(scenes)) if (want(k)) save(k, c);
// the gesture tiles: the rulebook's own pictures of each special card
for (const k of ["gorilla", "groundhog", "narwhal"]) if (want("tile-" + k)) {
  const img = await loadImage(fs.readFileSync(path.join(root, "sources/assets/taco", "do-" + k + ".png")));
  const c = createCanvas(img.width, img.height); c.getContext("2d").drawImage(img, 0, 0); save("tile-" + k, c);
}
if (want("cover")) {
  const img = await loadImage(fs.readFileSync(path.join(root, "sources/dl-taco/web/renders_00.jpg")));
  const c = createCanvas(512, 512), x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, 512, 512);
  x.imageSmoothingQuality = "high"; x.drawImage(img, 30, 15, 740, 770, 10, 0, 492, 512);
  const b = c.toBuffer("image/webp", 88); fs.writeFileSync(path.join(root, "app/games/covers/taco.webp"), b); console.log("cover", Math.round(b.length / 1024) + "KB");
}
