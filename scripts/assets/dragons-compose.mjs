// Builds the «Летели дракончики» pictures: our own drawings in the colours of the game (six dragons, donuts on clouds,
// the podium, the flight and goal cards) — schematic, not the publisher's artwork — and the cover, the front of the box
// straightened from the publisher's photo (sources/dl-dragons/img-p.jpg, evrikus.ru).
// Output: app/games/dragons-art/<name>.webp (in the repository, they work offline). Run: node scripts/assets/dragons-compose.mjs [name…]
import fs from "node:fs";
import path from "node:path";
import { root, createCanvas, loadImage, saver, tag, text, UIB, INK } from "./compose-kit.mjs";

const save = saver(path.join(root, "app", "games", "dragons-art"));
const W = 768;
export const COL = { purple: "#8E52C8", blue: "#2C9FE0", yellow: "#F2C230", green: "#4AAE48", red: "#E2453B", brown: "#8A5636" };
const SKY = "#D6EEFB", DOUGH = "#E6B072", DOUGH_D = "#C2864A", OK = "#2E9B4F", NO = "#D9483B", ACC = "#E0603B";
const shade = (hex, k) => "#" + [1, 3, 5].map(i => Math.max(0, Math.min(255, Math.round(parseInt(hex.slice(i, i + 2), 16) * (1 + k))))).map(v => v.toString(16).padStart(2, "0")).join("");

/* ---------- the kit: each returns SVG markup ---------- */
// a dragon standing at (x, y) — the feet; h — its height
function dragon(x, y, h, col, flip) {
  const k = h / 110, d = shade(col, -0.3), l = shade(col, 0.35);
  return `<g transform="translate(${x} ${y}) scale(${flip ? -k : k} ${k})" stroke="${d}" stroke-width="2.4" stroke-linejoin="round">
    <path d="M20 -16 C44 -10 52 -28 44 -44 L56 -42 L48 -54 L40 -46 C46 -30 36 -22 18 -26 Z" fill="${col}"/>
    <path d="M-8 -60 C-44 -92 -60 -62 -50 -44 C-42 -52 -30 -50 -18 -42 Z" fill="${d}"/>
    <ellipse cx="0" cy="-34" rx="27" ry="31" fill="${col}"/>
    <ellipse cx="5" cy="-29" rx="15" ry="20" fill="${l}" stroke="none"/>
    <ellipse cx="-12" cy="-3" rx="10" ry="5" fill="${col}"/><ellipse cx="13" cy="-3" rx="10" ry="5" fill="${col}"/>
    <path d="M-8 -88 L-14 -104 L0 -91 Z" fill="${d}"/><path d="M8 -91 L11 -107 L18 -89 Z" fill="${d}"/>
    <circle cx="3" cy="-72" r="22" fill="${col}"/>
    <ellipse cx="21" cy="-65" rx="13" ry="10" fill="${col}"/>
    <circle cx="9" cy="-77" r="7.5" fill="#fff" stroke-width="1.6"/><circle cx="11.5" cy="-77" r="3.6" fill="#24212B" stroke="none"/>
    <circle cx="28" cy="-68" r="1.6" fill="#24212B" stroke="none"/>
    <path d="M14 -58 q8 6 16 -1" fill="none" stroke="#24212B" stroke-width="2.2" stroke-linecap="round"/>
  </g>`;
}
// a cardboard figure: the dragon on a white stand
const figure = (x, y, h, col, flip) => `<rect x="${x - h * 0.3}" y="${y - h * 0.06}" width="${h * 0.6}" height="${h * 0.12}" rx="${h * 0.04}" fill="#fff" stroke="#B9C6D2" stroke-width="2"/>${dragon(x, y - h * 0.04, h, col, flip)}`;
// a donut seen from above: dough, glaze, hole
function donut(x, y, r, col, bg) {
  return `<g><circle cx="${x}" cy="${y}" r="${r}" fill="${DOUGH}" stroke="${DOUGH_D}" stroke-width="${r * 0.07}"/>
    <circle cx="${x}" cy="${y}" r="${r * 0.84}" fill="${col}"/>
    <path d="M${x - r * 0.55} ${y - r * 0.45} A${r * 0.7} ${r * 0.7} 0 0 1 ${x + r * 0.2} ${y - r * 0.68}" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="${r * 0.12}" stroke-linecap="round"/>
    <circle cx="${x}" cy="${y}" r="${r * 0.34}" fill="${bg || SKY}" stroke="${DOUGH_D}" stroke-width="${r * 0.07}"/></g>`;
}
// the many-coloured donut of the finish
function rainbow(x, y, r, bg) {
  const cs = Object.values(COL), seg = (i) => { const a0 = (i / 6) * 2 * Math.PI - Math.PI / 2, a1 = ((i + 1) / 6) * 2 * Math.PI - Math.PI / 2, R = r * 0.84;
    return `<path d="M${x} ${y} L${x + R * Math.cos(a0)} ${y + R * Math.sin(a0)} A${R} ${R} 0 0 1 ${x + R * Math.cos(a1)} ${y + R * Math.sin(a1)} Z" fill="${cs[i]}"/>`; };
  return `<g><circle cx="${x}" cy="${y}" r="${r}" fill="${DOUGH}" stroke="${DOUGH_D}" stroke-width="${r * 0.07}"/>${cs.map((_, i) => seg(i)).join("")}
    <circle cx="${x}" cy="${y}" r="${r * 0.34}" fill="${bg || SKY}" stroke="${DOUGH_D}" stroke-width="${r * 0.07}"/></g>`;
}
const cloud = (x, y, w, h) => `<g fill="#fff">${[[0, .55, .5], [.22, .3, .55], [.5, .2, .6], [.75, .35, .5], [1, .6, .42]].map(([u, v, s]) => `<ellipse cx="${x + u * w}" cy="${y + v * h}" rx="${w * s * 0.42}" ry="${h * s * 0.9}"/>`).join("")}<rect x="${x}" y="${y + h * 0.45}" width="${w}" height="${h * 0.55}" rx="${h * 0.27}"/></g>`;
// the back of a flight card: the scales — gems of the second colour on the first
const GEMS = [[.2, .22, .13], [.55, .18, .1], [.82, .3, .12], [.32, .5, .15], [.7, .58, .13], [.15, .78, .11], [.5, .82, .12], [.86, .82, .09], [.48, .46, .07]];
function cardBack(x, y, s, a, b, rot) {
  const tr = rot ? ` transform="rotate(${rot} ${x + s / 2} ${y + s / 2})"` : "";
  return `<g${tr}><rect x="${x}" y="${y}" width="${s}" height="${s}" rx="${s * 0.09}" fill="${a}" stroke="#fff" stroke-width="3"/>
    ${GEMS.map(([u, v, r]) => `<circle cx="${x + u * s}" cy="${y + v * s}" r="${r * s}" fill="${b}" stroke="${shade(b, -0.25)}" stroke-width="1.5"/><circle cx="${x + u * s - r * s * 0.3}" cy="${y + v * s - r * s * 0.3}" r="${r * s * 0.3}" fill="#fff" opacity=".55"/>`).join("")}</g>`;
}
const stack = (x, y, s, a, b, n) => Array.from({ length: n || 4 }, (_, i) => cardBack(x + i * 3, y - i * 4, s, a, b)).join("");
// the face of a flight card: the dragon that flies and the donut where it lands
const cardFace = (x, y, s, dcol, ncol) => `<rect x="${x}" y="${y}" width="${s}" height="${s}" rx="${s * 0.09}" fill="#fff" stroke="#B9C6D2" stroke-width="2"/>
  <rect x="${x + s * 0.06}" y="${y + s * 0.06}" width="${s * 0.88}" height="${s * 0.88}" rx="${s * 0.06}" fill="#EEF7FD"/>
  ${dragon(x + s * 0.38, y + s * 0.88, s * 0.72, COL[dcol])}${donut(x + s * 0.72, y + s * 0.7, s * 0.17, ncol, "#EEF7FD")}`;
// a goal card: the golden donut on its back; or three dragons on its face
const goalBack = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${w * 0.09}" fill="#fff" stroke="#B9C6D2" stroke-width="2"/>
  <rect x="${x + w * 0.07}" y="${y + w * 0.07}" width="${w * 0.86}" height="${h - w * 0.14}" rx="${w * 0.06}" fill="#EEF7FD"/>
  <path d="M${x + w * 0.42} ${y + h * 0.58} L${x + w * 0.58} ${y + h * 0.58} L${x + w * 0.54} ${y + h * 0.74} L${x + w * 0.46} ${y + h * 0.74} Z" fill="#E1A92A" stroke="#B57E14" stroke-width="2"/>
  <rect x="${x + w * 0.34}" y="${y + h * 0.74}" width="${w * 0.32}" height="${h * 0.07}" rx="3" fill="#E1A92A" stroke="#B57E14" stroke-width="2"/>
  ${donut(x + w / 2, y + h * 0.4, w * 0.24, "#F3C640", "#EEF7FD")}`;
const goalFace = (x, y, w, h, cols) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${w * 0.09}" fill="#fff" stroke="#B9C6D2" stroke-width="2"/>
  <rect x="${x + w * 0.07}" y="${y + w * 0.07}" width="${w * 0.86}" height="${h - w * 0.14}" rx="${w * 0.06}" fill="#EEF7FD"/>
  ${cols.map((c, i) => dragon(x + w * [0.3, 0.7, 0.5][i], y + h * [0.47, 0.47, 0.9][i], w * 0.5, COL[c], i === 1)).join("")}`;
// the podium: three rocks, the top step on the left
function podium(x, y, w, on) {
  const steps = [[0, 1, "+7"], [1, 0.72, "+5"], [2, 0.46, "+3"]], sw = w / 3, H = w * 0.42;
  return steps.map(([i, k, lab]) => { const X = x + i * sw, top = y - H * k;
    return `<rect x="${X + 4}" y="${top}" width="${sw - 8}" height="${H * k}" rx="10" fill="#A58B74" stroke="#7C6553" stroke-width="3"/>
      <rect x="${X + 4}" y="${top}" width="${sw - 8}" height="12" rx="6" fill="#7FB24A"/>
      <text x="${X + sw / 2}" y="${top + Math.min(H * k * 0.6, 52)}" text-anchor="middle" font-family="Arial" font-weight="700" font-size="${sw * 0.26}" fill="#fff">${lab}</text>
      ${on && on[i] ? figure(X + sw / 2, top + 2, sw * 0.95, COL[on[i]]) : ""}`; }).join("");
}
const check = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${OK}"/><path d="M${x - r * .45} ${y} l${r * .3} ${r * .35} l${r * .6} ${-r * .7}" fill="none" stroke="#fff" stroke-width="${r * .28}" stroke-linecap="round" stroke-linejoin="round"/>`;
const cross = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${NO}"/><path d="M${x - r * .4} ${y - r * .4} l${r * .8} ${r * .8} M${x + r * .4} ${y - r * .4} l${-r * .8} ${r * .8}" stroke="#fff" stroke-width="${r * .28}" stroke-linecap="round"/>`;
// a jump: a curved arrow
function jump(x1, y1, x2, y2, lift, col) {
  const mx = (x1 + x2) / 2, my = Math.min(y1, y2) - (lift || 60), c = col || ACC, a = Math.atan2(y2 - my, x2 - mx), s = 16;
  return `<path d="M${x1} ${y1} Q${mx} ${my} ${x2} ${y2}" fill="none" stroke="${c}" stroke-width="5" stroke-linecap="round" stroke-dasharray="${col ? "0" : "0"}"/>
    <path d="M${x2} ${y2} L${x2 - s * Math.cos(a - .45)} ${y2 - s * Math.sin(a - .45)} L${x2 - s * Math.cos(a + .45)} ${y2 - s * Math.sin(a + .45)} Z" fill="${c}"/>`;
}
const arrowR = (x1, y, x2) => `<path d="M${x1} ${y} L${x2 - 14} ${y}" stroke="${ACC}" stroke-width="7" stroke-linecap="round"/><path d="M${x2} ${y} L${x2 - 22} ${y - 14} L${x2 - 22} ${y + 14} Z" fill="${ACC}"/>`;
const slot = (x, y, s) => `<rect x="${x}" y="${y}" width="${s}" height="${s}" rx="${s * 0.09}" fill="none" stroke="#8796A6" stroke-width="3" stroke-dasharray="10 8"/>`;
const sky = H => `<rect width="${W}" height="${H}" fill="${SKY}"/>`;

/* ---------- render: the SVG, then the labels with the app's fonts ---------- */
async function render(name, H, svg, labels) {
  const im = await loadImage(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${svg}</svg>`));
  const c = createCanvas(W, H), x = c.getContext("2d");
  x.drawImage(im, 0, 0);
  for (const l of labels || []) {
    if (l.tag) tag(x, l.t, l.x, l.y, { size: l.size || 22, bg: l.bg || "#22305E", align: l.align });
    else text(x, l.t, l.x, l.y, { font: UIB(l.size || 22), color: l.color || INK, align: l.align || "center", maxW: l.maxW });
  }
  save(name, c, 80);
}

const ORDER = ["purple", "blue", "yellow", "green", "red", "brown"];
const jobs = {
  // the board: parts А, Б, В and the finish Г; the donut path from the start cloud to the many-coloured donut and the podium
  async board() {
    const H = 470, rows = [[400, ["brown", "purple", "blue", "green", "yellow", "red", "purple", "brown"]], [300, ["red", "yellow", "green", "brown", "blue", "purple", "yellow", "green"]], [200, ["blue", "brown", "red", "purple", "green", "yellow", "red", "blue"]]];
    let s = sky(H);
    [[0, 360, "А"], [0, 260, "Б"], [0, 160, "В"], [0, 20, "Г"]].forEach(([, y], i) => { s += `<rect x="40" y="${y}" width="${W - 80}" height="${i === 3 ? 140 : 100}" rx="10" fill="${i % 2 ? "#C7E6F8" : "#DDF1FC"}" stroke="#fff" stroke-width="4"/>`; });
    rows.forEach(([y, cs], r) => cs.forEach((c, i) => { const X = r % 2 ? W - 150 - i * 72 : 150 + i * 72; s += donut(X, y + 10, 25, COL[c]); }));
    s += cloud(50, 360, 120, 90) + rainbow(560, 110, 34) + podium(140, 150, 300) + cloud(520, 30, 140, 40);
    s += jump(654, 385, 618, 290, 40) + jump(114, 285, 150, 190, 40) + jump(654, 185, 590, 125, 30);
    await render("board", H, s, [{ t: "А", x: 722, y: 418, size: 26 }, { t: "Б", x: 722, y: 318, size: 26 }, { t: "В", x: 722, y: 218, size: 26 }, { t: "Г", x: 722, y: 80, size: 26 },
      { t: "Старт", x: 110, y: 448, tag: true, size: 20 }, { t: "Финиш", x: 560, y: 52, tag: true, size: 20, bg: ACC }]);
  },
  // all six dragons on the start cloud
  async start() {
    const H = 400; let s = sky(H) + cloud(40, 150, W - 80, 230);
    ORDER.forEach((c, i) => { s += figure(130 + i * 102, 340, 150, COL[c]); });
    await render("start", H, s, [{ t: "Все 6 дракончиков — на стартовом облаке", x: W / 2, y: 70, size: 26 }]);
  },
  // five stacks of flight cards, scales up; a place for the discard
  async stacks() {
    const H = 380; let s = sky(H);
    [["purple", "yellow"], ["red", "blue"], ["green", "purple"], ["blue", "yellow"], ["yellow", "red"]].forEach(([a, b], i) => { s += stack(34 + i * 122, 150, 104, COL[a], COL[b], 5); });
    s += slot(W - 130, 250, 104);
    await render("stacks", H, s, [{ t: "5 стопок по 12 карточек, чешуёй вверх", x: W / 2, y: 70, size: 26 }, { t: "Сброс", x: W - 78, y: 236, size: 20, color: "#5F6B78" }]);
  },
  // one goal card each, face down; the own one may be looked at, never shown
  async goals() {
    const H = 450; let s = sky(H);
    s += goalBack(60, 120, 150, 220) + goalBack(230, 120, 150, 220) + goalFace(470, 100, 180, 260, ["yellow", "red", "purple"]);
    await render("goals", H, s, [{ t: "Каждому — 1 карточка цели в закрытую", x: W / 2, y: 64, size: 26 }, { t: "чужие", x: 220, y: 380, size: 20, color: "#5F6B78" }, { t: "своя: смотреть можно, показывать нельзя", x: 560, y: 394, size: 20, color: "#5F6B78", maxW: 300 }]);
  },
  // the turn: the top card of any stack turned over — the dragon that flies and the colour of its donut
  async flip() {
    const H = 400; let s = sky(H);
    s += cardBack(70, 120, 180, COL.purple, COL.yellow) + arrowR(280, 210, 360);
    s += cardFace(400, 40, 150, "yellow", COL.purple) + cardFace(400, 210, 150, "purple", COL.yellow);
    await render("flip", H, s, [{ t: "или", x: 620, y: 205, size: 22, color: "#5F6B78" }, { t: "Чешуя жёлтая и фиолетовая", x: 160, y: 350, size: 20, maxW: 260 }]);
  },
  // the flight: to the nearest donut of the colour, forward or back; a taken donut is passed
  async fly() {
    const H = 380, y = 250, cs = ["blue", "red", "yellow", "purple", "green", "blue", "brown", "blue"], X = i => 60 + i * 92;
    let s = sky(H) + `<rect x="20" y="${y - 50}" width="${W - 40}" height="100" rx="12" fill="#DDF1FC" stroke="#fff" stroke-width="4"/>`;
    cs.forEach((c, i) => { s += donut(X(i), y, 30, COL[c]); });
    s += cardFace(344, 8, 84, "purple", COL.blue) + figure(X(3), y + 22, 110, COL.purple) + figure(X(5), y + 22, 110, COL.yellow, true);
    s += jump(X(3) + 10, y - 100, X(7), y - 40, 70) + jump(X(3) - 10, y - 100, X(0), y - 40, 70);
    s += check(X(7), y - 140, 18) + check(X(0), y - 140, 18) + cross(X(5) + 36, y - 70, 15);
    await render("fly", H, s, [{ t: "назад", x: X(0) + 40, y: 52, size: 20 }, { t: "вперёд", x: X(7) - 40, y: 52, size: 20 }, { t: "занят — дальше", x: X(5) + 10, y: 348, size: 20, color: NO }]);
  },
  // the variant for the youngest: forward only
  async "fly-fwd"() {
    const H = 380, y = 250, cs = ["blue", "red", "yellow", "purple", "green", "blue", "brown", "blue"], X = i => 60 + i * 92;
    let s = sky(H) + `<rect x="20" y="${y - 50}" width="${W - 40}" height="100" rx="12" fill="#DDF1FC" stroke="#fff" stroke-width="4"/>`;
    cs.forEach((c, i) => { s += donut(X(i), y, 30, COL[c]); });
    s += cardFace(344, 8, 84, "purple", COL.blue) + figure(X(3), y + 22, 110, COL.purple) + figure(X(5), y + 22, 110, COL.yellow, true);
    s += jump(X(3) + 10, y - 100, X(7), y - 40, 70) + check(X(7), y - 140, 18) + cross(X(5) + 36, y - 70, 15);
    await render("fly-fwd", H, s, [{ t: "только вперёд", x: X(7) - 70, y: 52, size: 20 }, { t: "занят — дальше", x: X(5) + 10, y: 348, size: 20, color: NO }]);
  },
  // the finish: the many-coloured donut fits any colour; from it — to the highest free step of the podium
  async finish() {
    const H = 400; let s = sky(H) + cloud(380, 250, 300, 110);
    s += rainbow(520, 300, 46) + podium(60, 340, 330, ["green"]) + figure(520, 318, 120, COL.yellow);
    s += jump(470, 220, 228, 225, 70);
    await render("finish", H, s, [{ t: "Разноцветный пончик считается пончиком любого цвета", x: W / 2, y: 52, size: 24, maxW: 700 }]);
  },
  // the end: the third dragon on the podium; or three stacks are empty
  async end() {
    const H = 400; let s = sky(H) + podium(40, 360, 330, ["green", "yellow", "red"]);
    s += slot(420, 150, 90) + slot(530, 150, 90) + slot(640, 150, 90) + stack(420, 290, 90, COL.blue, COL.red, 3) + stack(530, 290, 90, COL.green, COL.brown, 2);
    await render("end", H, s, [{ t: "или", x: 400, y: 120, size: 22, color: "#5F6B78" }, { t: "3 стопки пусты", x: 590, y: 120, size: 22 }, { t: "3 дракончика на пьедестале", x: 200, y: 52, size: 22, maxW: 330 }]);
  },
  // the points: the dragons of the goal card that stand on the podium score their steps
  async score() {
    const H = 420; let s = sky(H) + goalFace(40, 110, 170, 250, ["yellow", "red", "purple"]) + podium(300, 380, 330, ["yellow", "blue", "red"]);
    await render("score", H, s, [{ t: "Жёлтый 7 + красный 3 = 10 очков", x: W / 2, y: 56, size: 26 }]);
  },
  // the cover: the front of the box straightened from the publisher's photo
  async cover() {
    const im = await loadImage(fs.readFileSync(path.join(root, "sources", "dl-dragons", "img-p.jpg")));
    const sc = createCanvas(im.width, im.height), sx = sc.getContext("2d"); sx.drawImage(im, 0, 0);
    const src = sx.getImageData(0, 0, im.width, im.height).data;
    // the corners of the front (top left, top right, bottom right, bottom left), a few pixels inside the edge
    const [x0, y0, x1, y1, x2, y2, x3, y3] = [363, 146, 944, 66, 924, 1033, 372, 1166];
    const dx1 = x1 - x2, dx2 = x3 - x2, dy1 = y1 - y2, dy2 = y3 - y2, sX = x0 - x1 + x2 - x3, sY = y0 - y1 + y2 - y3, den = dx1 * dy2 - dx2 * dy1;
    const g = (sX * dy2 - dx2 * sY) / den, h = (dx1 * sY - sX * dy1) / den;
    const a = x1 - x0 + g * x1, b = x3 - x0 + h * x3, d = y1 - y0 + g * y1, e = y3 - y0 + h * y3;
    const w = 640, hh = 1120, oc = createCanvas(w, hh), ox = oc.getContext("2d"), od = ox.createImageData(w, hh);
    for (let j = 0; j < hh; j++) for (let i = 0; i < w; i++) {
      const u = (i + .5) / w, v = (j + .5) / hh, z = g * u + h * v + 1, X = (a * u + b * v + x0) / z - .5, Y = (d * u + e * v + y0) / z - .5;
      const xi = Math.floor(X), yi = Math.floor(Y), fx = X - xi, fy = Y - yi, o = (j * w + i) * 4;
      const p = (xx, yy, k) => src[(Math.min(im.height - 1, Math.max(0, yy)) * im.width + Math.min(im.width - 1, Math.max(0, xx))) * 4 + k];
      for (let k = 0; k < 3; k++) od.data[o + k] = (p(xi, yi, k) * (1 - fx) + p(xi + 1, yi, k) * fx) * (1 - fy) + (p(xi, yi + 1, k) * (1 - fx) + p(xi + 1, yi + 1, k) * fx) * fy;
      od.data[o + 3] = 255;
    }
    ox.putImageData(od, 0, 0); save("cover", oc, 80);
  },
};
const only = process.argv.slice(2);
for (const [name, job] of Object.entries(jobs)) if (!only.length || only.includes(name)) await job();
