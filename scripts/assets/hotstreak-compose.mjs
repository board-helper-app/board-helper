// Our own diagrams for «Вперёд, маскот!» (Hot Streak): the track, tickets, cards and the podium, drawn top-down
// in the colours of the box (turf greens, podium yellow, the four mascots' colours). Layout follows quoridor-compose.mjs:
// a title at the top left, the drawing, a caption bar at the bottom.
// Run: node scripts/assets/hotstreak-compose.mjs [name…]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createCanvas, GlobalFonts } from "@napi-rs/canvas";

const root = fileURLToPath(new URL("../../", import.meta.url));
// each subset under its own family name: one family with two files keeps only one of them (digits come from latin)
for (const [w, fam] of [["600", "Onest"], ["700", "OnestB"]]) for (const [sub, k] of [["latin", "L"], ["cyrillic", "C"]])
  GlobalFonts.registerFromPath(`${root}/node_modules/@fontsource/onest/files/onest-${sub}-${w}-normal.woff2`, fam + k);
const font = (size, bold) => `${size}px ${bold ? "OnestBL, OnestBC" : "OnestL, OnestC"}`;

const W = 768, H = 512;
const C = {
  paper: "#F4F1E4", frame: "#B9C2A0", ink: "#24301F", muted: "#5E6B55", accent: "#D94F2B", bar: "#E6EBD3",
  turfA: "#3F8A34", turfB: "#4F9E3E", line: "#F4F7EC", star: "#CFE6C3", yellow: "#F6C925", yellowDark: "#B98F0C",
  cardBack: "#F2C230", good: "#2F8F4E", bad: "#C0392B", money: "#E9C46A", moneyEdge: "#A57F25", paperSheet: "#FFFDF6",
};
// the four mascots: Gobbler the bear, Hurley the bun banger, Dangle the fish, Mum the queen
const M = {
  bear: { main: "#E8622C", dark: "#7A2A6E", light: "#F6A06E" },
  dog: { main: "#EE8B78", dark: "#C2372A", light: "#F7C9A8" },
  fish: { main: "#2F5BA8", dark: "#1B3567", light: "#8FB0E8" },
  queen: { main: "#F3B9B0", dark: "#8E2337", light: "#F6D36B" },
};
const ORDER = ["queen", "fish", "dog", "bear"];

function rr(ctx, x, y, w, h, r, fill, stroke, lw = 2) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
}
function circle(ctx, x, y, r, fill, stroke, lw = 2) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
}
function text(ctx, s, x, y, size, fill = C.ink, align = "center", bold = false) {
  ctx.font = font(size, bold); ctx.fillStyle = fill; ctx.textAlign = align; ctx.textBaseline = "middle";
  ctx.fillText(s, x, y);
}
function star(ctx, x, y, r, fill) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, k = i % 2 ? r * .45 : r; ctx.lineTo(x + Math.cos(a) * k, y + Math.sin(a) * k); }
  ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
}
function arrow(ctx, pts, { color = C.accent, w = 6, head = 14, dash = [] } = {}) {
  ctx.save(); ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = w; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.setLineDash(dash);
  ctx.beginPath(); ctx.moveTo(...pts[0]);
  if (pts.length === 3) ctx.quadraticCurveTo(...pts[1], ...pts[2]); else ctx.lineTo(...pts[1]);
  ctx.stroke(); ctx.setLineDash([]);
  const [x, y] = pts.at(-1), [px, py] = pts.at(-2), a = Math.atan2(y - py, x - px);
  ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * 3, y + Math.sin(a) * 3);
  ctx.lineTo(x - Math.cos(a - .5) * head, y - Math.sin(a - .5) * head); ctx.lineTo(x - Math.cos(a + .5) * head, y - Math.sin(a + .5) * head);
  ctx.closePath(); ctx.fill(); ctx.restore();
}
function cross(ctx, x, y, r = 16) {
  circle(ctx, x, y, r, C.bad, "#fff", 2.5);
  ctx.strokeStyle = "#fff"; ctx.lineWidth = 3.5; ctx.lineCap = "round"; const d = r * .38;
  ctx.beginPath(); ctx.moveTo(x - d, y - d); ctx.lineTo(x + d, y + d); ctx.moveTo(x + d, y - d); ctx.lineTo(x - d, y + d); ctx.stroke();
}
function check(ctx, x, y, r = 16) {
  circle(ctx, x, y, r, C.good, "#fff", 2.5);
  ctx.strokeStyle = "#fff"; ctx.lineWidth = 3.5; ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.beginPath(); ctx.moveTo(x - r * .4, y); ctx.lineTo(x - r * .1, y + r * .32); ctx.lineTo(x + r * .45, y - r * .32); ctx.stroke();
}
function tag(ctx, s, x, y, { bg = C.ink, fg = "#fff", size = 20 } = {}) {
  ctx.font = font(size, true); const w = ctx.measureText(s).width + 22, h = size + 14;
  rr(ctx, x - w / 2, y - h / 2, w, h, h / 2, bg); text(ctx, s, x, y + 1, size, fg, "center", true);
}

/* a mascot seen from above: a round token in its colours; dir = -1 looks left (to the finish), 1 — right (turned around);
   fallen — lying flat, darker, with a dashed outline */
function mascot(ctx, x, y, kind, { r = 22, dir = -1, fallen = false, ghost = false } = {}) {
  const m = M[kind];
  ctx.save();
  if (ghost) ctx.globalAlpha = .35;
  circle(ctx, x + 2, y + 4, r, "#0000002E");
  if (fallen) { ctx.translate(x, y); ctx.scale(1, .62); ctx.translate(-x, -y); }
  circle(ctx, x, y, r, m.main, m.dark, 3);
  if (kind === "bear") { circle(ctx, x - r * .62, y - r * .72, r * .32, m.main, m.dark, 2.5); circle(ctx, x + r * .62, y - r * .72, r * .32, m.main, m.dark, 2.5); circle(ctx, x, y + r * .25, r * .42, m.light); }
  if (kind === "dog") { rr(ctx, x - r * .28, y - r * .85, r * .56, r * 1.7, r * .28, m.dark); ctx.strokeStyle = C.yellow; ctx.lineWidth = 3; ctx.beginPath(); for (let i = 0; i < 5; i++) ctx.lineTo(x + (i % 2 ? 5 : -5), y - r * .6 + i * r * .3); ctx.stroke(); }
  if (kind === "fish") { ctx.strokeStyle = m.dark; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y - r); ctx.quadraticCurveTo(x + r * .5, y - r * 1.5, x + r * .2, y - r * 1.55); ctx.stroke(); circle(ctx, x + r * .2, y - r * 1.55, 4.5, C.yellow); circle(ctx, x, y + r * .3, r * .42, m.light); }
  if (kind === "queen") { ctx.fillStyle = m.light; ctx.beginPath(); ctx.moveTo(x - r * .62, y - r * .55); ctx.lineTo(x - r * .62, y - r * 1.12); ctx.lineTo(x - r * .3, y - r * .82); ctx.lineTo(x, y - r * 1.22); ctx.lineTo(x + r * .3, y - r * .82); ctx.lineTo(x + r * .62, y - r * 1.12); ctx.lineTo(x + r * .62, y - r * .55); ctx.closePath(); ctx.fill(); ctx.strokeStyle = m.dark; ctx.lineWidth = 2; ctx.stroke(); }
  if (!fallen) {
    // eyes look where the mascot faces
    const ex = dir * r * .25;
    for (const s of [-1, 1]) { circle(ctx, x + ex + s * r * .22, y - r * .12, r * .18, "#fff", "#00000040", 1); circle(ctx, x + ex + s * r * .22 + dir * 2.5, y - r * .12, r * .08, C.ink); }
  } else {
    ctx.setLineDash([5, 4]); circle(ctx, x, y, r + 4, null, "#fff", 2.5); ctx.setLineDash([]);
  }
  ctx.restore();
}

/* the track: lanes across, the finish line at the left; cells are columns; a `from` column hides the cells before it */
function track(ctx, x, y, w, h, { cols = 12, lanes = 4, finish = true, stars = [], folds = [], start = false, cut = null } = {}) {
  const lh = h / lanes, cw = w / cols;
  rr(ctx, x - 6, y - 6, w + 12, h + 12, 10, "#2D6427");
  for (let l = 0; l < lanes; l++) { ctx.fillStyle = l % 2 ? C.turfB : C.turfA; ctx.fillRect(x, y + l * lh, w, lh); }
  ctx.strokeStyle = "#FFFFFF55"; ctx.lineWidth = 2;
  for (let c = 1; c < cols; c++) for (let l = 0; l < lanes; l++) { ctx.beginPath(); ctx.moveTo(x + c * cw, y + l * lh + lh * .35); ctx.lineTo(x + c * cw, y + l * lh + lh * .65); ctx.stroke(); }
  for (const c of folds) { ctx.strokeStyle = C.line; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x + c * cw, y); ctx.lineTo(x + c * cw, y + h); ctx.stroke(); }
  for (const [c, l] of stars) star(ctx, x + (c + .5) * cw, y + (l + .5) * lh, Math.min(cw, lh) * .3, C.star);
  if (finish) {
    const fx = x + cw * .5, sq = 7;
    for (let i = 0; i * sq < h; i++) for (let j = 0; j < 2; j++) { ctx.fillStyle = (i + j) % 2 ? "#fff" : "#1d1d1d"; ctx.fillRect(fx - sq + j * sq, y + i * sq, sq, Math.min(sq, h - i * sq)); }
  }
  if (start) { ctx.strokeStyle = "#fff"; ctx.lineWidth = 3; ctx.setLineDash([8, 6]); ctx.beginPath(); ctx.moveTo(x + w - cw * 1.0, y); ctx.lineTo(x + w - cw * 1.0, y + h); ctx.stroke(); ctx.setLineDash([]); }
  return { cell: (c, l) => [x + (c + .5) * cw, y + (l + .5) * lh], cw, lh, x, y, w, h };
}

function card(ctx, x, y, { w = 64, h = 92, kind = "fish", label = "2", back = false, start = false, green = false, rot = 0 } = {}) {
  ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.rotate(rot); ctx.translate(-w / 2, -h / 2);
  rr(ctx, 2, 4, w, h, 8, "#0000002A");
  if (back) {
    rr(ctx, 0, 0, w, h, 8, C.cardBack, "#9C7A10", 2);
    for (let i = 0; i < 4; i++) { ctx.strokeStyle = i % 2 ? "#1d1d1d" : "#fff"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(6, 16 + i * 20); ctx.quadraticCurveTo(w / 2, 6 + i * 20, w - 6, 20 + i * 20); ctx.stroke(); }
  } else {
    const m = green ? { main: "#3E8C2F", dark: "#1F5A1A", light: "#CDE7C0" } : M[kind];
    rr(ctx, 0, 0, w, h, 8, m.main, m.dark, start ? 5 : 2);
    if (start) rr(ctx, 6, 6, w - 12, h - 12, 5, null, "#fff", 2.5);
    const ink = kind === "queen" && !green ? m.dark : "#fff";
    if (label === "*") star(ctx, w / 2, h / 2, w * .3, ink);
    else {
      const words = label.split(" "); let size = Math.min(30, w * .45);
      const fits = sz => { ctx.font = font(sz, true); return words.every(wd => ctx.measureText(wd).width <= w - 10); };
      while (size > 9 && !fits(size)) size--;
      const lh = size * 1.15; words.forEach((wd, i) => text(ctx, wd, w / 2, h / 2 + (i - (words.length - 1) / 2) * lh, size, ink, "center", true));
    }
  }
  ctx.restore();
}

function ticket(ctx, x, y, kind, side, values, { w = 250, h = 84, label } = {}) {
  const yes = kind === "yes", no = kind === "no";
  const m = yes ? { main: "#7CC58A", dark: "#2F7A43", light: "#D9F0DC" } : no ? { main: "#F0A6A8", dark: "#A83A44", light: "#FBE0E0" } : M[kind];
  rr(ctx, x + 2, y + 4, w, h, 8, "#0000002A");
  rr(ctx, x, y, w, h, 8, m.light, m.dark, 2.5);
  rr(ctx, x, y, 62, h, [8, 0, 0, 8], m.main);
  if (yes || no) text(ctx, yes ? "ДА" : "НЕТ", x + 31, y + h / 2, yes ? 22 : 19, "#fff", "center", true);
  else mascot(ctx, x + 31, y + h / 2 + 4, kind, { r: 17 });
  text(ctx, side, x + 62 + (w - 62) / 2, y + 15, 15, m.dark, "center", true);
  const n = values.length, cw = (w - 70) / n;
  values.forEach((v, i) => {
    const cx = x + 66 + cw * (i + .5);
    text(ctx, v, cx, y + h / 2 + 6, 26, v.startsWith("−") ? C.bad : C.ink, "center", true);
    if (label) text(ctx, label[i], cx, y + h - 13, 13, C.muted);
  });
}

function bill(ctx, x, y, n, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  rr(ctx, -42, -22, 84, 44, 5, C.money, C.moneyEdge, 2.5); rr(ctx, -34, -15, 68, 30, 4, null, C.moneyEdge, 1.5);
  text(ctx, "$" + n, 0, 1, 20, "#6B4E0E", "center", true); ctx.restore();
}

function scene(title, caption, draw) {
  const c = createCanvas(W, H), ctx = c.getContext("2d");
  ctx.fillStyle = C.paper; ctx.fillRect(0, 0, W, H);
  rr(ctx, 8, 8, W - 16, H - 16, 17, null, C.frame, 2);
  rr(ctx, 42, 37, 6, 30, 3, C.accent);
  text(ctx, title, 64, 53, 33, C.ink, "left", true);
  draw(ctx);
  rr(ctx, 33, 446, 702, 42, 8, C.bar);
  let size = 24; ctx.font = font(size); while (ctx.measureText(caption).width > 670) { size--; ctx.font = font(size); }
  text(ctx, caption, W / 2, 467, size);
  return c;
}

const scenes = {
  roles: scene("Три роли", "Роли распределяют между игроками за столом", ctx => {
    const col = (cx, name, sub, draw) => { rr(ctx, cx - 105, 95, 210, 300, 16, "#FFFFFF", C.frame, 2); draw(cx); text(ctx, name, cx, 330, 25, C.ink, "center", true); text(ctx, sub, cx, 364, 18, C.muted); };
    col(150, "Букмекер", "билеты и деньги", cx => { ticket(ctx, cx - 80, 130, "bear", "НОРМ", ["10", "7"], { w: 160, h: 70 }); bill(ctx, cx - 30, 245, 10, -.15); bill(ctx, cx + 35, 260, 5, .12); });
    col(384, "Дилер", "колода гонки", cx => { for (let i = 0; i < 4; i++) card(ctx, cx - 60 + i * 9, 130 + i * 4, { back: true, w: 74, h: 106 }); card(ctx, cx + 5, 165, { kind: "fish", label: "2", w: 74, h: 106, rot: .18 }); });
    col(618, "Распорядитель", "двигает маскотов", cx => { const t = track(ctx, cx - 85, 140, 170, 120, { cols: 4, lanes: 2, finish: false }); mascot(ctx, ...t.cell(3, 0), "bear", { r: 20, ghost: true }); mascot(ctx, ...t.cell(1, 0), "bear", { r: 20 }); arrow(ctx, [[t.cell(3, 0)[0] - 26, t.cell(3, 0)[1] + 28], [t.cell(1, 0)[0] + 26, t.cell(1, 0)[1] + 28]], { color: "#fff", w: 5 }); });
  }),
  track: scene("Трасса", "Маскоты на старте смотрят на финишную линию", ctx => {
    const t = track(ctx, 60, 120, 648, 260, { cols: 14, finish: true, start: true, folds: [5, 9], stars: [[2, 0], [2, 1], [2, 2], [2, 3], [6, 1], [7, 3], [6, 0], [11, 2], [11, 0], [7, 2], [11, 3], [10, 1]] });
    ORDER.forEach((k, l) => mascot(ctx, ...t.cell(13, l), k, { r: 22 }));
    tag(ctx, "Финиш", 95, 102); tag(ctx, "Старт", 683, 102);
    arrow(ctx, [[600, 400], [180, 400]], { color: C.accent, w: 5 }); text(ctx, "бегут к финишу", 390, 422, 18, C.muted);
  }),
  tickets: scene("Билеты и деньги", "Шесть стопок стороной «Норм» вверх и по 10 долларов", ctx => {
    const kinds = ["bear", "dog", "fish", "queen", "yes", "no"];
    kinds.forEach((k, i) => {
      const x = 52 + (i % 3) * 228, y = 100 + Math.floor(i / 3) * 128;
      for (let j = 2; j >= 1; j--) rr(ctx, x + j * 6, y + j * 7, 206, 80, 8, "#E4E0D0", "#B8B29C", 1.5);
      ticket(ctx, x, y, k, "НОРМ", k === "yes" || k === "no" ? ["10", "0"] : ["10", "7", "5"], { w: 206, h: 80 });
    });
    text(ctx, "Каждому:", 300, 395, 22, C.ink, "right", true); bill(ctx, 360, 396, 10, -.05);
  }),
  deck: scene("Колода гонки", "Все видят колоду: стартовые в рамке, по дорожкам маскотов", ctx => {
    const labels = { queen: ["−2", "*", "1"], fish: ["2", "3"], dog: ["1", "−1"], bear: ["3", "*", "2"] };
    ORDER.forEach((k, l) => {
      const y = 86 + l * 78;
      mascot(ctx, 76, y + 35, k, { r: 20 });
      card(ctx, 122, y, { kind: k, label: k === "dog" ? "2" : "1", start: true, w: 56, h: 70 });
      labels[k].forEach((lab, i) => card(ctx, 196 + i * 66, y, { kind: k, label: lab, w: 58, h: 70 }));
    });
    rr(ctx, 488, 100, 240, 300, 16, "#FFFFFF", C.frame, 2);
    text(ctx, "Для всех", 608, 134, 22, C.ink, "center", true);
    card(ctx, 540, 170, { green: true, label: "Все 1", w: 64, h: 90 }); card(ctx, 616, 170, { green: true, label: "Все 2", w: 64, h: 90 });
    text(ctx, "зелёные карты", 608, 300, 19, C.muted); text(ctx, "двигают всех сразу", 608, 328, 19, C.muted);
  }),
  hand: scene("На руку", "Свои карты гонки никому не показывайте", ctx => {
    for (let i = 0; i < 3; i++) card(ctx, 240 + i * 100, 120, { back: true, w: 92, h: 132, rot: (i - 1) * .12 });
    card(ctx, 548, 140, { back: true, w: 80, h: 116, rot: .25 });
    ctx.save(); ctx.globalAlpha = .9; tag(ctx, "вдвоём — ещё одна", 588, 290, { bg: C.accent, size: 17 }); ctx.restore();
    text(ctx, "по 3 карты рубашкой вверх", 384, 340, 24, C.ink, "center", true);
    text(ctx, "остальные карты гонки — в коробку", 384, 382, 19, C.muted);
  }),
  draft: scene("Ставки змейкой", "Второй круг — обратно: последний берёт два подряд", ctx => {
    const xs = [150, 306, 462, 618];
    xs.forEach((x, i) => { circle(ctx, x, 250, 40, "#FFFFFF", C.ink, 3); text(ctx, "Игрок " + (i + 1), x, 250, 17, C.ink, "center", true); });
    arrow(ctx, [[110, 185], [384, 110], [658, 185]], { color: C.good, w: 6 });
    xs.forEach((x, i) => tag(ctx, String(i + 1), x, 176 - (i === 1 || i === 2 ? 22 : 0), { bg: C.good, size: 20 }));
    arrow(ctx, [[658, 315], [384, 390], [110, 315]], { color: C.accent, w: 6 });
    xs.forEach((x, i) => tag(ctx, String(8 - i), x, 324 + (i === 1 || i === 2 ? 22 : 0), { bg: C.accent, size: 20 }));
    text(ctx, "1-й круг", 384, 95, 18, C.good, "center", true); text(ctx, "2-й круг", 384, 412, 18, C.accent, "center", true);
  }),
  ticket: scene("Билеты ставок", "«Риск» дороже за победу, а побочная ставка может отнять", ctx => {
    const lab = ["1-е", "2-е", "3-е"], yn = ["верно", "неверно"];
    text(ctx, "Билет маскота", 196, 98, 21, C.ink, "center", true); text(ctx, "Побочная ставка", 572, 98, 21, C.ink, "center", true);
    ticket(ctx, 52, 120, "bear", "НОРМ", ["10", "7", "5"], { w: 288, h: 96, label: lab });
    ticket(ctx, 52, 250, "bear", "РИСК", ["15", "5", "2"], { w: 288, h: 96, label: lab });
    ticket(ctx, 428, 120, "yes", "НОРМ", ["10", "0"], { w: 288, h: 96, label: yn });
    ticket(ctx, 428, 250, "yes", "РИСК", ["15", "−5"], { w: 288, h: 96, label: yn });
    text(ctx, "за 4-е место — $0", 196, 380, 19, C.muted); text(ctx, "«Нет» — такой же билет", 572, 380, 19, C.muted);
  }),
  go: scene("Старт гонки", "Три карты — в сброс рубашкой вверх, четвёртую открыть", ctx => {
    ["3", "2", "1"].forEach((n, i) => { card(ctx, 70 + i * 120, 150, { back: true, w: 92, h: 132, rot: (i - 1) * .06 }); tag(ctx, n + (i === 2 ? "…" : ","), 116 + i * 120, 320, { bg: C.ink, size: 24 }); });
    arrow(ctx, [[420, 216], [490, 216]], { color: C.accent });
    card(ctx, 520, 140, { kind: "fish", label: "2", w: 104, h: 150 });
    tag(ctx, "Вперёд!", 572, 330, { bg: C.accent, size: 26 });
    text(ctx, "сброс", 236, 380, 19, C.muted); text(ctx, "первая карта гонки", 572, 380, 19, C.muted);
  }),
  moves: scene("Число, звезда, разворот", "Маскот идёт туда, куда смотрит", ctx => {
    const t = track(ctx, 60, 100, 648, 300, { cols: 12, lanes: 3, finish: true, stars: [[2, 1], [5, 1], [10, 1]] });
    // number: 3 cells forward
    mascot(ctx, ...t.cell(9, 0), "bear", { ghost: true }); mascot(ctx, ...t.cell(6, 0), "bear");
    arrow(ctx, [[t.cell(9, 0)[0] - 24, t.cell(9, 0)[1]], [t.cell(6, 0)[0] + 28, t.cell(6, 0)[1]]], { color: "#fff" });
    card(ctx, t.cell(11, 0)[0] - 22, t.cell(11, 0)[1] - 30, { kind: "bear", label: "3", w: 42, h: 60 });
    // star: to the next star in the facing direction
    mascot(ctx, ...t.cell(9, 1), "fish", { ghost: true }); mascot(ctx, ...t.cell(5, 1), "fish");
    star(ctx, t.cell(5, 1)[0] + 20, t.cell(5, 1)[1] - 22, 11, C.yellow);
    arrow(ctx, [[t.cell(9, 1)[0] - 24, t.cell(9, 1)[1] - 10], [t.cell(7, 1)[0], t.cell(7, 1)[1] - 40], [t.cell(5, 1)[0] + 26, t.cell(5, 1)[1] - 10]], { color: "#fff" });
    card(ctx, t.cell(11, 1)[0] - 22, t.cell(11, 1)[1] - 30, { kind: "fish", label: "*", w: 42, h: 60 });
    // turned around: a forward move goes away from the finish
    mascot(ctx, ...t.cell(5, 2), "dog", { ghost: true, dir: 1 }); mascot(ctx, ...t.cell(7, 2), "dog", { dir: 1 });
    arrow(ctx, [[t.cell(5, 2)[0] + 24, t.cell(5, 2)[1]], [t.cell(7, 2)[0] - 28, t.cell(7, 2)[1]]], { color: "#fff" });
    card(ctx, t.cell(11, 2)[0] - 22, t.cell(11, 2)[1] - 30, { kind: "dog", label: "2", w: 42, h: 60 });
    tag(ctx, "развёрнут", t.cell(5, 2)[0], t.cell(5, 2)[1] + 36, { bg: "#ffffffE0", fg: C.ink, size: 15 });
  }),
  fall: scene("Падение и подъём", "Упавший ползёт на 1 клетку. Подъём — раньше хода", ctx => {
    const t = track(ctx, 60, 110, 300, 150, { cols: 5, lanes: 2, finish: false });
    mascot(ctx, ...t.cell(3, 0), "queen", { fallen: true, ghost: true }); mascot(ctx, ...t.cell(2, 0), "queen", { fallen: true });
    arrow(ctx, [[t.cell(3, 0)[0] - 24, t.cell(3, 0)[1]], [t.cell(2, 0)[0] + 28, t.cell(2, 0)[1]]], { color: "#fff" });
    card(ctx, 170, 282, { kind: "queen", label: "3", w: 80, h: 100 }); text(ctx, "лежит: любой ход — 1 клетка", 210, 410, 19, C.muted);
    const u = track(ctx, 410, 110, 300, 150, { cols: 5, lanes: 2, finish: false });
    mascot(ctx, ...u.cell(4, 0), "dog", { fallen: true, ghost: true }); mascot(ctx, ...u.cell(2, 0), "dog");
    arrow(ctx, [[u.cell(4, 0)[0] - 24, u.cell(4, 0)[1]], [u.cell(2, 0)[0] + 28, u.cell(2, 0)[1]]], { color: "#fff" });
    card(ctx, 520, 282, { kind: "dog", label: "Подъём 2", w: 80, h: 100 }); text(ctx, "сначала встаёт, потом идёт", 560, 410, 19, C.muted);
  }),
  swerve: scene("Занос", "Вбок по взгляду маскота. С краю — за трассой", ctx => {
    const t = track(ctx, 150, 150, 528, 250, { cols: 8, lanes: 4, finish: false });
    mascot(ctx, ...t.cell(5, 2), "fish", { ghost: true }); mascot(ctx, ...t.cell(4, 1), "fish");
    arrow(ctx, [[t.cell(5, 2)[0] - 20, t.cell(5, 2)[1] - 14], [t.cell(4, 1)[0] + 20, t.cell(4, 1)[1] + 14]], { color: "#fff" });
    mascot(ctx, ...t.cell(2, 0), "bear", { ghost: true });
    arrow(ctx, [[t.cell(2, 0)[0] - 6, t.cell(2, 0)[1] - 24], [t.cell(1.4, 0)[0], t.y - 34]], { color: C.bad });
    cross(ctx, t.cell(1.4, 0)[0] - 22, t.y - 40, 14);
    text(ctx, "за трассой — выбывает", t.cell(2, 0)[0] + 20, t.y - 30, 18, C.bad, "left", true);
    card(ctx, 40, 210, { kind: "fish", label: "1 вправо", w: 84, h: 110 });
  }),
  collide: scene("Столкновение", "Стоявший падает. Упавший снова — выбывает", ctx => {
    const t = track(ctx, 60, 110, 300, 150, { cols: 5, lanes: 2, finish: false });
    mascot(ctx, ...t.cell(4, 0), "bear", { ghost: true }); mascot(ctx, ...t.cell(2, 0), "queen", { fallen: true }); mascot(ctx, ...t.cell(1, 0), "bear");
    arrow(ctx, [[t.cell(4, 0)[0] - 24, t.cell(4, 0)[1] + 18], [t.cell(1, 0)[0] + 26, t.cell(1, 0)[1] + 18]], { color: "#fff" });
    text(ctx, "сквозь клетку — стоявший падает", 210, 300, 19, C.ink, "center", true);
    const u = track(ctx, 410, 110, 300, 150, { cols: 5, lanes: 2, finish: false });
    mascot(ctx, ...u.cell(4, 0), "fish", { ghost: true }); mascot(ctx, ...u.cell(2, 0), "dog", { fallen: true }); mascot(ctx, ...u.cell(1, 0), "fish");
    arrow(ctx, [[u.cell(4, 0)[0] - 24, u.cell(4, 0)[1] + 18], [u.cell(1, 0)[0] + 26, u.cell(1, 0)[1] + 18]], { color: "#fff" });
    cross(ctx, u.cell(2, 0)[0] + 18, u.cell(2, 0)[1] - 22, 14);
    text(ctx, "упавшего толкнули — выбывает", 560, 300, 19, C.bad, "center", true);
    text(ctx, "Тот, кто двигался, не падает", 384, 380, 20, C.muted);
  }),
  green: scene("Зелёная карта", "Все сразу, без столкновений, до финишной линии", ctx => {
    const t = track(ctx, 160, 100, 548, 300, { cols: 9, lanes: 4, finish: true });
    const from = [3, 2, 1, 4], to = [1, 0, 0, 2];
    ORDER.forEach((k, l) => { mascot(ctx, ...t.cell(from[l], l), k, { ghost: true }); mascot(ctx, ...t.cell(to[l], l), k); arrow(ctx, [[t.cell(from[l], l)[0] - 24, t.cell(from[l], l)[1]], [t.cell(to[l], l)[0] + 28, t.cell(to[l], l)[1]]], { color: "#fff", w: 4, head: 11 }); });
    card(ctx, 46, 190, { green: true, label: "Все 2", w: 86, h: 124 });
  }),
  fold: scene("Колода кончилась", "Трассу складывают до следующей белой линии", ctx => {
    const t = track(ctx, 60, 120, 648, 260, { cols: 14, finish: true, folds: [5, 9] });
    ctx.fillStyle = "#F6C925EE"; ctx.fillRect(t.x + 9 * t.cw, t.y - 8, 5 * t.cw + 8, t.h + 16);
    ctx.strokeStyle = C.yellowDark; ctx.lineWidth = 3; ctx.strokeRect(t.x + 9 * t.cw, t.y - 8, 5 * t.cw + 8, t.h + 16);
    text(ctx, "сложено", t.x + 11.5 * t.cw, t.y + t.h / 2, 26, "#6B4E0E", "center", true);
    mascot(ctx, ...t.cell(4, 1), "bear"); mascot(ctx, ...t.cell(7, 2), "fish");
    mascot(ctx, ...t.cell(11, 3), "dog", { ghost: true }); cross(ctx, ...t.cell(11, 3), 15);
    tag(ctx, "под трассой — выбывает", t.x + 11.5 * t.cw, t.y - 26, { bg: C.bad, size: 17 });
  }),
  podium: scene("Пьедестал", "Финиш — на высшее свободное место, выбывший — на низшее", ctx => {
    const xs = [160, 310, 460, 610];
    xs.forEach((x, i) => { rr(ctx, x - 62, 200, 124, 150, 14, C.yellow, C.yellowDark, 3); circle(ctx, x, 290, 42, "#FFFFFF", "#C0392B", 4); text(ctx, String(i + 1), x, 292, 40, "#B3261E", "center", true); });
    mascot(ctx, 160, 160, "fish", { r: 26 }); mascot(ctx, 310, 160, "bear", { r: 26 }); mascot(ctx, 610, 160, "dog", { r: 26 }); cross(ctx, 632, 138, 13);
    arrow(ctx, [[60, 110], [130, 140]], { color: C.good }); text(ctx, "финиш", 60, 92, 18, C.good, "left", true);
    arrow(ctx, [[708, 110], [640, 140]], { color: C.bad }); text(ctx, "выбывший", 708, 92, 18, C.bad, "right", true);
    text(ctx, "3 маскота на пьедестале — гонка окончена", 384, 395, 20, C.muted);
  }),
  double: scene("3-я гонка", "Верхний билет платит вдвое — и минус тоже", ctx => {
    ticket(ctx, 190, 262, "yes", "РИСК", ["15", "−5"], { w: 300, h: 96 });
    ticket(ctx, 170, 150, "fish", "НОРМ", ["10", "7", "5"], { w: 300, h: 96 });
    tag(ctx, "× 2", 540, 198, { bg: C.accent, size: 30 }); tag(ctx, "× 1", 560, 310, { bg: C.muted, size: 24 });
    text(ctx, "сверху", 120, 198, 20, C.ink, "center", true); text(ctx, "снизу", 120, 310, 20, C.muted);
  }),
  big: scene("Большая компания", "Банки делят угадавшие поровну, с округлением вниз", ctx => {
    ctx.save(); ctx.translate(170, 250); ctx.rotate(-.05);
    rr(ctx, -115, -140, 230, 280, 6, C.paperSheet, "#C9C2A8", 2);
    for (let i = 0; i < 6; i++) { ctx.strokeStyle = "#D7E2F2"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-100, -90 + i * 40); ctx.lineTo(100, -90 + i * 40); ctx.stroke(); }
    text(ctx, "Гонка 3", 0, -112, 20, C.ink, "center", true);
    text(ctx, "Дэнгл", -88, -70, 24, "#1B3567", "left", true); text(ctx, "Да", -88, -30, 24, "#2F7A43", "left", true);
    ctx.strokeStyle = C.accent; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(-50, -70, 56, 22, 0, 0, Math.PI * 2); ctx.stroke();
    text(ctx, "+ $9", 60, 30, 24, C.good, "center", true);
    ctx.restore();
    const pots = [["1-е место", 18], ["2-е место", 12], ["3-е место", 6], ["Побочная", 18]];
    pots.forEach(([n, v], i) => { const x = 370 + (i % 2) * 180, y = 120 + Math.floor(i / 2) * 150; rr(ctx, x, y, 160, 124, 14, "#FFFFFF", C.frame, 2); text(ctx, n, x + 80, y + 30, 19, C.muted); text(ctx, "$" + v, x + 80, y + 78, 40, C.ink, "center", true); });
  }),
};

const only = new Set(process.argv.slice(2));
const dir = path.join(root, "app/games/hotstreak-art");
fs.mkdirSync(dir, { recursive: true });
for (const [key, c] of Object.entries(scenes)) if (!only.size || only.has(key)) {
  const buf = c.toBuffer("image/webp", 92); fs.writeFileSync(path.join(dir, key + ".webp"), buf);
  console.log(key, Math.round(buf.length / 1024) + "KB");
}
