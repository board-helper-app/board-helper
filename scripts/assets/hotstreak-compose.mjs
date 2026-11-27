// Diagrams for «Вперёд, маскот!». Run with optional scene names to render a subset.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCanvas, GlobalFonts, Path2D } from '@napi-rs/canvas';

const repo = fileURLToPath(new URL('../../', import.meta.url));
const W = 768;
const H = 512;
const cream = '#fff3d3';
const ink = '#24231f';
const yellow = '#ffd431';
const orange = '#e55429';
const pine = '#1c542f';
const white = '#fff8e6';
const red = '#9c2944';
const blue = '#264684';
const turf = ['#34733c', '#4a863a'];
const teams = [
  { color: '#f1b934', shade: '#6d2618', symbol: '◆', name: 'Мамаша' },
  { color: '#406ac2', shade: '#162d52', symbol: '●', name: 'Повеса' },
  { color: '#ff7359', shade: '#871f28', symbol: '▲', name: 'Хёрли' },
  { color: '#ca4b9d', shade: '#62214d', symbol: '■', name: 'Индюк' },
];

for (const [weight, family] of [[600, 'Text'], [800, 'Display']]) {
  for (const subset of ['latin', 'cyrillic']) {
    GlobalFonts.registerFromPath(`${repo}/node_modules/@fontsource/onest/files/onest-${subset}-${weight}-normal.woff2`, family + subset);
  }
}

function rr(c, x, y, w, h, radius, fill, stroke, lw = 2) {
  c.beginPath();
  c.roundRect(x, y, w, h, radius);
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (stroke) { c.lineWidth = lw; c.strokeStyle = stroke; c.stroke(); }
}
function poly(c, coords, fill) {
  c.beginPath();
  coords.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
  c.closePath();
  c.fillStyle = fill;
  c.fill();
}
function disk(c, x, y, r, fill, stroke) {
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fillStyle = fill;
  c.fill();
  if (stroke) { c.lineWidth = 3; c.strokeStyle = stroke; c.stroke(); }
}
function type(c, s, x, y, px, color = ink, opts = {}) {
  const { align = 'center', light = false, max = 690 } = opts;
  const font = light ? 'Text' : 'Display';
  const size = value => `${value}px ${font}cyrillic, ${font}latin, Segoe UI Symbol`;
  c.font = size(px);
  const width = c.measureText(s).width;
  if (width > max) c.font = size(Math.floor(px * max / width));
  c.textAlign = align;
  c.textBaseline = 'middle';
  c.fillStyle = color;
  c.fillText(s, x, y);
}
function line(c, pts, color, w = 5, dash = []) {
  c.beginPath();
  pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
  c.lineWidth = w;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.strokeStyle = color;
  c.setLineDash(dash);
  c.stroke();
  c.setLineDash([]);
}
function arrow(c, pts, color = ink, width = 6, dashed = false) {
  line(c, pts, color, width, dashed ? [8, 7] : []);
  const [x, y] = pts.at(-1);
  const [u, v] = pts.at(-2);
  const a = Math.atan2(y - v, x - u);
  const l = width * 2.1;
  poly(c, [[x + Math.cos(a) * 4, y + Math.sin(a) * 4], [x - Math.cos(a - .6) * l, y - Math.sin(a - .6) * l], [x - Math.cos(a + .6) * l, y - Math.sin(a + .6) * l]], color);
}
function scatter(c, x, y, w, h, seed = 3, n = 26) {
  const colors = [orange, blue, pine, red, white];
  let s = seed;
  const next = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
  for (let i = 0; i < n; i++) {
    c.save();
    c.translate(x + next() * w, y + next() * h);
    c.rotate((next() - .5) * 2.7);
    rr(c, 0, 0, 3 + next() * 4, 7 + next() * 9, 1.5, colors[i % colors.length]);
    c.restore();
  }
}
function star(c, x, y, r, paint) {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = i * Math.PI / 5 - Math.PI / 2;
    const radius = i % 2 ? r * .44 : r;
    return [x + Math.cos(a) * radius, y + Math.sin(a) * radius];
  });
  poly(c, pts, paint);
}
function checkers(c, x, y, rows, s) {
  for (let j = 0; j < rows; j++) for (let i = 0; i < 2; i++) {
    c.fillStyle = (i + j) % 2 ? white : ink;
    c.fillRect(x + i * s, y + j * s, s, s);
  }
}
function ticket(c, x, y, w, h, color, label, sub, fg = ink) {
  rr(c, x + 4, y + 5, w, h, 13, '#35221428');
  rr(c, x, y, w, h, 13, color, ink, 2.5);
  for (const p of [x, x + w]) disk(c, p, y + h / 2, 7, cream);
  type(c, label, x + w / 2, y + h * (sub ? .36 : .5), Math.min(31, w / 4), fg, { max: w - 11 });
  if (sub) type(c, sub, x + w / 2, y + h * .72, 21, fg, { max: w - 13, light: true });
}
function pill(c, s, x, y, w, paint = pine, fg = white) {
  rr(c, x - w / 2, y - 18, w, 36, 18, paint);
  type(c, s, x, y + 1, 22, fg, { max: w - 12 });
}
function iconCard(c, x, y, { w = 83, h = 117, fill = yellow, mark = '', back = false, frame = false, tilt = 0 } = {}) {
  c.save();
  c.translate(x, y);
  c.rotate(tilt);
  rr(c, -w / 2 + 3, -h / 2 + 5, w, h, 9, '#36271035');
  rr(c, -w / 2, -h / 2, w, h, 9, fill, ink, 2.5);
  if (frame) rr(c, -w / 2 + 6, -h / 2 + 6, w - 12, h - 12, 6, '', white, 3);
  if (back) {
    poly(c, [[-w * .34, h * .21], [0, -h * .26], [w * .34, -h * .13], [0, h * .31]], orange);
    line(c, [[-w * .22, h * .19], [w * .19, -h * .13]], ink, Math.max(2, w * .047));
    disk(c, -w * .21, -h * .23, Math.max(2, w * .045), pine);
  } else {
    type(c, mark, 0, 1, Math.min(40, Math.round(w * .53)), fill === blue || fill === pine ? white : ink, { max: w - 6 });
  }
  c.restore();
}
function chip(c, x, y, team, { dir = -1, r = 22, ghost = false, down = false } = {}) {
  const t = teams[team];
  c.save();
  c.translate(x, y);
  if (ghost) c.globalAlpha = .47;
  if (down) c.scale(1, .66);
  disk(c, 2, 3, r + 1, '#142b25');
  disk(c, 0, 0, r, t.color, t.shade);
  if (down) {
    line(c, [[-r * .40, -r * .40], [r * .40, r * .40]], white, 4);
    line(c, [[r * .40, -r * .40], [-r * .40, r * .40]], white, 4);
  } else {
    poly(c, [[dir * (r + 7), 0], [dir * (r - 5), -8], [dir * (r - 5), 8]], white);
    type(c, t.symbol, -dir * 2, 1, r * 1.2, white, { max: r * 2 });
  }
  c.restore();
}
function markOut(c, x, y, r = 17) {
  disk(c, x, y, r, red, white);
  line(c, [[x - 6, y - 6], [x + 6, y + 6]], white, 4);
  line(c, [[x + 6, y - 6], [x - 6, y + 6]], white, 4);
}
function hand(c, x, y, scale, flip, sleeve, skin) {
  c.save();
  c.translate(x, y);
  c.scale(flip * scale, scale);
  const shape = new Path2D('M -75 42 L -54 9 Q -42 -8 -24 -10 L 23 -23 Q 39 -28 45 -19 Q 48 -13 37 -8 L 17 0 L 57 -6 Q 66 -7 70 -1 Q 72 5 61 10 L 38 17 L 74 14 Q 83 12 86 20 Q 88 28 76 32 L 44 40 Q 50 45 44 53 Q 38 63 1 61 L -18 60 L -48 81 Z');
  c.lineWidth = 3;
  c.strokeStyle = ink;
  c.fillStyle = skin;
  c.fill(shape);
  c.stroke(shape);
  poly(c, [[-92, 58], [-69, 33], [-34, 64], [-57, 89], [-92, 89]], sleeve);
  line(c, [[-91, 57], [-69, 33], [-34, 64], [-57, 89]], ink, 3);
  line(c, [[15, 19], [34, 17]], ink, 2);
  line(c, [[18, 44], [41, 40]], ink, 2);
  c.restore();
}
function track(c, x, y, w, h, { cols = 8, lanes = 4, finish = 0, stars = [], folds = [] } = {}) {
  const cw = w / cols;
  const lh = h / lanes;
  rr(c, x + 3, y + 5, w, h, 9, '#22281c34');
  c.save();
  c.beginPath();
  c.roundRect(x, y, w, h, 9);
  c.clip();
  for (let j = 0; j < lanes; j++) {
    c.fillStyle = turf[j % 2];
    c.fillRect(x, y + j * lh, w, lh);
    if (j % 2 === 0) {
      c.fillStyle = '#ffffff0c';
      for (let i = 0; i < cols; i++) if (i % 2 === 0) c.fillRect(x + i * cw, y + j * lh, cw, lh);
    }
    for (let i = 1; i < cols; i++) {
      if (i !== finish && !folds.includes(i)) line(c, [[x + i * cw, y + (j + .32) * lh], [x + i * cw, y + (j + .68) * lh]], '#f2ecb5a8', 2.4);
    }
  }
  for (const i of folds) line(c, [[x + i * cw, y], [x + i * cw, y + h]], white, 3.2);
  for (const [i, j] of stars) star(c, x + (i + .5) * cw, y + (j + .5) * lh, 10, '#e2e8b2');
  if (finish) checkers(c, x + cw * finish - 6, y, Math.ceil(h / 6), 6);
  c.restore();
  rr(c, x, y, w, h, 9, '', pine, 3);
  const cell = (i, j) => [x + (i + .5) * cw, y + (j + .5) * lh];
  return { cell, x, y, cw, lh };
}
function pathMove(c, t, from, to, turn = false) {
  const [x, y] = t.cell(...from);
  const [u, v] = t.cell(...to);
  const d = Math.sign(u - x);
  if (turn) {
    const dy = Math.sign(v - y);
    arrow(c, [[x + d * 24, y], [u, y], [u, v - dy * 24]], yellow, 6);
  } else {
    const gap = Math.abs(x - u) < 54 ? 13 : 24;
    arrow(c, [[x + d * gap, y + 14], [u - d * gap, v + 14]], yellow, 5);
  }
}
function layout(title, caption, draw) {
  const c = createCanvas(W, H);
  const g = c.getContext('2d');
  g.fillStyle = cream;
  g.fillRect(0, 0, W, H);
  poly(g, [[0, 0], [W, 0], [W, 78], [0, 96]], yellow);
  poly(g, [[0, 0], [25, 0], [0, 53]], orange);
  scatter(g, 622, 12, 117, 48, title.length + 21, 12);
  type(g, title, 37, 42, 41, ink, { align: 'left', max: 586 });
  poly(g, [[0, 453], [W, 440], [W, 512], [0, 512]], pine);
  poly(g, [[0, 453], [W, 440], [W, 444], [0, 457]], yellow);
  type(g, caption, W / 2, 482, 25, white, { max: 718 });
  draw(g);
  return c;
}

const scenes = {
  roles: ['Три роли', 'Распределите роли до первой гонки', c => {
    const roles = [
      ['Букмекер', 'Билеты и деньги', yellow, ink],
      ['Дилер', 'Колода гонки', blue, white],
      ['Распорядитель', 'Ход маскотов', pine, white],
    ];
    roles.forEach(([name, desc, color, fg], i) => {
      const x = 40 + i * 233;
      rr(c, x + 4, 124, 215, 282, 18, '#42352326');
      rr(c, x, 117, 215, 282, 18, color);
      type(c, name, x + 107, 326, i === 2 ? 23 : 27, fg, { max: 202 });
      type(c, desc, x + 107, 364, 22, fg, { max: 194, light: true });
      if (i === 0) {
        disk(c, x + 107, 216, 53, red);
        type(c, '$', x + 107, 216, 64, white);
      } else if (i === 1) {
        iconCard(c, x + 90, 220, { back: true, tilt: -.20, w: 77, h: 101 });
        iconCard(c, x + 121, 210, { back: true, tilt: .18, w: 77, h: 101 });
      } else {
        chip(c, x + 69, 216, 2, { r: 31, ghost: true });
        chip(c, x + 153, 216, 2, { r: 31, dir: 1 });
        arrow(c, [[x + 63, 263], [x + 156, 263]], yellow, 6);
      }
    });
  }],
  track: ['Трасса и маскоты', 'Все четверо смотрят в сторону финиша', c => {
    const stars = [0, 1, 6, 13].flatMap(i => teams.map((_, j) => [i, j]));
    const t = track(c, 40, 155, 688, 199, { cols: 14, finish: 1, stars, folds: [4, 8, 11] });
    rr(c, 718, 149, 14, 211, 4, yellow, pine, 2.5);
    teams.forEach((_, i) => {
      const [x, y] = t.cell(11, i);
      chip(c, x, y, i, { r: 18 });
      rr(c, 462, y - 14, 100, 28, 14, pine);
      type(c, teams[i].name, 512, y + 1, 17, white, { max: 88 });
    });
    pill(c, 'Финиш', 91, 125, 109);
    pill(c, 'Старт', 605, 125, 97, red);
    arrow(c, [[650, 386], [122, 386]], orange, 6);
    type(c, 'Направление забега', 384, 416, 22, pine);
  }],
  tickets: ['Билеты и деньги', '«Норм» вверх, мелкие билеты сверху', c => {
    const colors = [yellow, '#86a1e9', '#ff9274', '#df80ad', '#8fd769', '#ed8ea4'];
    ['Маскот', 'Маскот', 'Маскот', 'Маскот', 'Да', 'Нет'].forEach((label, i) => {
      const x = 37 + i * 99 + (i === 5 ? 99 : 0);
      rr(c, x, 154, 90, 119, 9, colors[i], ink);
      rr(c, x + 4, 162, 82, 97, 9, colors[i], ink);
      rr(c, x + 9, 171, 72, 71, 8, white, ink);
      type(c, i < 4 ? teams[i].symbol : label.toUpperCase(), x + 45, 197, 28);
      type(c, 'НОРМ', x + 45, 224, 17, pine);
    });
    iconCard(c, 577, 208, { w: 67, h: 86, fill: blue, mark: '?' });
    type(c, 'Карта ставки', 577, 290, 17, pine);
    ticket(c, 253, 327, 262, 80, '#f4be62', '$10', 'каждому');
  }],
  deck: ['Колода гонки', 'Пример для 4 игроков · все карты открыты', c => {
    pill(c, '4 стартовые', 175, 136, 202);
    pill(c, '10 случайных', 521, 136, 234, red);
    teams.forEach((t, i) => iconCard(c, 64 + i * 74, 260, { w: 58, h: 94, fill: t.color, mark: t.symbol, frame: true }));
    line(c, [[324, 170], [324, 356]], '#7e724f63', 3, [5, 8]);
    const marks = ['1', '◆', '2', '−1', '●', '3', '■', '2', '▲', '1'];
    marks.forEach((m, i) => iconCard(c, 391 + (i % 5) * 72, 220 + Math.floor(i / 5) * 104, { w: 56, h: 77, mark: m, fill: i === 9 ? pine : teams[i % 4].color }));
    type(c, 'По одной на маскота', 175, 389, 23, pine, { max: 305 });
    type(c, 'Зелёные действуют на всех', 521, 389, 23, pine, { max: 402 });
  }],
  hand: ['Карты на руку', 'Свои карты держите в секрете', c => {
    const groups = [[205, 3, 'Обычная партия'], [563, 4, 'Вдвоём']];
    groups.forEach(([x, count, label], group) => {
      rr(c, x - 163, 134, 326, 261, 20, group ? '#eedb9f' : '#f3e4bd');
      type(c, label, x, 172, 28, pine);
      for (let i = 0; i < count; i++) {
        const offset = i - (count - 1) / 2;
        iconCard(c, x + offset * 61, 261 + Math.abs(offset) * 4, { w: 75, h: 102, back: true, tilt: offset * .105 });
      }
      type(c, `По ${count} карты`, x, 357, 31);
    });
  }],
  draft: ['Ставки змейкой', 'Последний игрок берёт два билета подряд', c => {
    const xs = [180, 312, 444, 576];
    arrow(c, [[114, 176], [642, 176]], pine, 7);
    arrow(c, [[642, 330], [114, 330]], red, 7);
    xs.forEach((x, i) => {
      disk(c, x, 176, 25, pine, white);
      disk(c, x, 330, 25, red, white);
      type(c, String(i + 1), x, 176, 26, white);
      type(c, String(8 - i), x, 330, 26, white);
      ticket(c, x - 55, 220, 110, 67, yellow, String(i + 1));
    });
    type(c, '1-й круг', 381, 125, 23, pine);
    type(c, '2-й круг', 381, 383, 23, red);
  }],
  ticket: ['Билеты ставок', 'Сторону билета выбирают сразу', c => {
    type(c, 'Билет маскота', 214, 132, 30, pine);
    type(c, 'Побочная ставка', 552, 132, 30, pine);
    ticket(c, 59, 172, 310, 85, yellow, 'НОРМ', '1-е · 2-е · 3-е');
    ticket(c, 59, 289, 310, 85, '#ff986e', 'РИСК', 'Больше за 1-е место');
    ticket(c, 398, 172, 310, 85, '#abd775', 'НОРМ', 'Выплата за верный ответ');
    ticket(c, 398, 289, 310, 85, '#ed8faa', 'РИСК', 'Можно потерять деньги');
    type(c, 'За 4-е место — $0', 214, 407, 22, pine);
    type(c, 'Выберите «Да» или «Нет»', 552, 407, 22, pine);
  }],
  shuffle: ['Подмешайте карты', 'Затем дилер тасует всю колоду гонки', c => {
    iconCard(c, 163, 228, { w: 103, h: 144, back: true, tilt: -.13 });
    iconCard(c, 229, 229, { w: 86, h: 123, back: true, tilt: .17 });
    arrow(c, [[315, 231], [395, 231]], orange, 8);
    hand(c, 471, 248, .66, 1, blue, '#e6925f');
    hand(c, 684, 224, .64, -1, red, '#e6925f');
    for (let i = 0; i < 4; i++) iconCard(c, 503 + i * 39, 212 - i * 4, { w: 88, h: 120, back: true, tilt: (i - 1.5) * .15 });
    pill(c, 'С руки рубашкой вверх', 199, 343, 303);
    type(c, 'По 1 карте · вдвоём по 2', 199, 397, 24, pine);
    type(c, 'Перемешайте', 560, 343, 29, red);
  }],
  go: ['Старт гонки', 'На «Вперёд!» открывают 4-ю карту', c => {
    const positions = [104, 232, 360];
    positions.forEach((x, i) => {
      iconCard(c, x, 222, { w: 93, h: 128, back: true, tilt: (i - 1) * .10 });
      type(c, String(3 - i), x, 319, 36, pine);
    });
    arrow(c, [[431, 218], [516, 218]], orange, 9);
    scatter(c, 559, 143, 155, 161, 82, 16);
    iconCard(c, 616, 219, { w: 108, h: 145, fill: blue, mark: '2', tilt: .10 });
    pill(c, 'Вперёд!', 616, 319, 131, red);
    type(c, 'Три карты в закрытый сброс', 233, 391, 25, pine);
    type(c, 'Первая карта хода', 617, 391, 25, pine);
  }],
  moves: ['Число, звезда, разворот', 'Направление зависит от взгляда маскота', c => {
    const t = track(c, 169, 136, 548, 263, { cols: 9, lanes: 3, finish: 1, stars: [[2, 1], [4, 1], [8, 1]] });
    const moves = [[7, 4, 3, '3'], [7, 4, 1, '★'], [4, 6, 2, '2']];
    moves.forEach(([a, b, team, symbol], row) => {
      chip(c, ...t.cell(a, row), team, { ghost: true, dir: row === 2 ? 1 : -1 });
      pathMove(c, t, [a, row], [b, row]);
      chip(c, ...t.cell(b, row), team, { dir: row === 2 ? 1 : -1 });
      iconCard(c, 91, t.cell(0, row)[1], { w: 69, h: 67, fill: teams[team].color, mark: symbol });
    });
    star(c, ...[t.cell(4, 1)[0], t.cell(4, 1)[1] + 33], 10, yellow);
    pill(c, 'Финиш', 229, 115, 111);
    pill(c, 'Развёрнут', 328, 353, 139, red);
  }],
  fall: ['«Падение» и «Порядок!»', '«Порядок!» срабатывает перед движением', c => {
    const boards = [track(c, 41, 187, 323, 132, { cols: 6, lanes: 2 }), track(c, 403, 187, 324, 132, { cols: 6, lanes: 2 })];
    pill(c, 'Маскот лежит', 202, 139, 203);
    pill(c, 'Карта «Порядок!»', 565, 139, 255, red);
    boards.forEach((t, i) => {
      const target = i ? 2 : 3;
      chip(c, ...t.cell(4, 0), 2, { down: true, ghost: true });
      pathMove(c, t, [4, 0], [target, 0]);
      chip(c, ...t.cell(target, 0), 2, { down: !i });
    });
    type(c, 'Даже по «3» — 1 клетка', 202, 369, 25, pine, { max: 330 });
    type(c, 'Встал → прошёл 2 клетки', 565, 369, 24, pine, { max: 332 });
  }],
  swerve: ['Поворот на соседнюю дорожку', 'Упавший ползёт на 1 клетку и тоже поворачивает', c => {
    const t = track(c, 190, 169, 521, 223, { cols: 7 });
    const [x, y] = t.cell(3, 0);
    const [startX, startY] = t.cell(5, 2);
    chip(c, startX, startY, 1, { ghost: true });
    pathMove(c, t, [5, 2], [3, 1], true);
    chip(c, ...t.cell(3, 1), 1);
    chip(c, ...t.cell(5, 0), 3, { ghost: true });
    arrow(c, [[t.cell(5, 0)[0] - 26, y], [x, y], [x, 146]], yellow, 5);
    markOut(c, x, 132);
    iconCard(c, 99, 232, { w: 92, h: 99, fill: blue, mark: '2' });
    type(c, 'Направо', 99, 312, 23, pine);
    type(c, 'За край — выбывает', x + 30, 130, 23, red, { align: 'left', max: 245 });
  }],
  collide: ['Столкновение', 'Движущийся продолжает ход', c => {
    const boards = [track(c, 40, 189, 323, 138, { cols: 6, lanes: 2 }), track(c, 405, 189, 323, 138, { cols: 6, lanes: 2 })];
    boards.forEach((t, i) => {
      const [x, y] = t.cell(3, 0);
      pill(c, i ? 'Уже лежал' : 'Стоял', t.x + 162, 143, 171, i ? red : pine);
      chip(c, ...t.cell(5, 0), 1, { ghost: true, r: 19 });
      arrow(c, [[t.cell(5, 0)[0] - 19, y + 21], [t.cell(1, 0)[0] + 20, y + 21]], yellow, 5);
      chip(c, ...t.cell(1, 0), 1, { r: 19 });
      if (i) markOut(c, x, y - 1); else chip(c, x, y, 2, { down: true, r: 19 });
      type(c, i ? 'Выбывает' : 'Падает', t.x + 162, 378, 31, i ? red : pine);
    });
  }],
  green: ['Зелёная карта', 'Все действуют сразу, без столкновений', c => {
    const t = track(c, 178, 154, 539, 244, { cols: 9, finish: 1 });
    pill(c, 'Финиш', 237, 126, 109);
    const from = [5, 3, 2, 6];
    const to = [3, 1, 1, 4];
    teams.forEach((_, i) => {
      chip(c, ...t.cell(from[i], i), i, { ghost: true, r: 19 });
      const [x, y] = t.cell(from[i], i);
      const [u] = t.cell(to[i], i);
      arrow(c, [[x, y + 24], [u + 3, y + 24]], yellow, 5);
      chip(c, ...t.cell(to[i], i), i, { r: 19 });
    });
    iconCard(c, 99, 246, { w: 94, h: 122, fill: pine, mark: '2' });
    type(c, 'Для всех', 99, 335, 23, pine);
    type(c, 'Останавливаются у финишной линии', 456, 421, 22, pine);
  }],
  fold: ['Колода кончилась', 'Карты со сбросом тасуют и снова дают старт', c => {
    const t = track(c, 42, 178, 680, 200, { cols: 12, finish: 1, folds: [4, 8] });
    const edge = t.x + t.cw * 8;
    chip(c, ...t.cell(4, 1), 3);
    chip(c, ...t.cell(6, 2), 1);
    rr(c, edge + 2, 178, 224, 200, 4, '#f5c544cc');
    rr(c, 713, 174, 14, 208, 4, '#f5b722', pine, 2);
    line(c, [[edge, 178], [edge, 378]], white, 4);
    arrow(c, [[696, 150], [edge + 7, 150]], orange, 6);
    markOut(c, ...t.cell(10, 2));
    type(c, 'Под трассой', edge + 111, 219, 24);
    type(c, 'выбывает', edge + 111, 253, 24, red);
    type(c, 'До следующей сплошной белой линии', 353, 417, 24, pine);
  }],
  podium: ['Пьедестал на коробке', 'Три места заняты — последний получает оставшееся', c => {
    scatter(c, 81, 156, 606, 84, 52, 43);
    const xs = [132, 300, 468, 636];
    xs.forEach((x, i) => {
      rr(c, x - 73, 251, 146, 113, 9, '#553c23');
      rr(c, x - 73, 242, 146, 102, 9, yellow, ink, 2);
      disk(c, x, 293, 35, white, red);
      type(c, String(i + 1), x, 294, 39, red);
    });
    chip(c, 132, 196, 1, { r: 29, dir: 1 });
    chip(c, 300, 196, 0, { r: 29 });
    chip(c, 636, 196, 3, { r: 29, down: true });
    type(c, 'Финиш → высшее свободное', 246, 393, 23, pine);
    type(c, 'Выбыл → низшее', 608, 393, 23, red);
  }],
  payout: ['Выплаты', 'После третьей гонки сравните деньги', c => {
    type(c, 'Маскот', 206, 135, 30, pine);
    type(c, 'Побочная ставка', 554, 135, 30, pine);
    ticket(c, 48, 177, 315, 90, '#adc784', '1-е · 2-е · 3-е', 'Сумма по месту');
    ticket(c, 402, 177, 315, 90, '#b6d993', 'Угадали', 'Сумма в билете');
    ticket(c, 48, 297, 315, 90, '#f6da7d', '4-е', '$0');
    ticket(c, 402, 297, 315, 90, '#f1a092', 'Не угадали', '«Риск» может дать минус');
  }],
  double: ['Третья гонка', 'Удваивается и выигрыш, и потеря', c => {
    ticket(c, 113, 152, 367, 98, '#ff9e83', 'Выбранный билет', 'Положите сверху');
    ticket(c, 113, 287, 367, 98, '#adc2de', 'Второй билет', 'Обычная выплата');
    disk(c, 583, 201, 52, red);
    disk(c, 583, 336, 52, pine);
    type(c, '×2', 583, 206, 52, white);
    type(c, '×1', 583, 341, 52, white);
  }],
  big: ['Большая компания', 'Угадавшие делят банк, округляя вниз', c => {
    rr(c, 49, 145, 256, 259, 13, white, '#a69364', 2);
    type(c, 'Листок ставок', 177, 181, 28, pine);
    for (const y of [231, 295, 348]) line(c, [[70, y + 17], [283, y + 17]], '#87927380', 2);
    type(c, 'Имя маскота', 177, 225, 25);
    type(c, 'Да или Нет', 177, 287, 25);
    type(c, 'Обведите одну ставку', 177, 330, 21, red, { max: 236 });
    type(c, 'В 3-й гонке — ×2', 177, 353, 19, red);
    type(c, '4 + 14 карт в колоде', 177, 378, 19, pine);
    const pots = [['1-е место', '$18'], ['2-е место', '$12'], ['3-е место', '$6'], ['Побочная', '$18']];
    pots.forEach(([label, n], i) => ticket(c, 353 + i % 2 * 185, 156 + Math.floor(i / 2) * 124, 167, 99, i === 3 ? '#f6ab96' : yellow, n, label));
  }],
  next: ['Перед новой гонкой', 'Маскоты возвращаются на старт прямо перед гонкой', c => {
    const blocks = [
      { text: 'Билеты в стопки', color: '#f9ce56', mark: '✓' },
      { text: 'Карту ставки вниз', color: '#fa987e', mark: '↓' },
      { text: 'Доберите карты', color: '#9dc575', mark: '+' },
    ];
    blocks.forEach(({ text, color, mark }, i) => {
      const x = 42 + i * 231;
      rr(c, x, 145, 218, 227, 17, color);
      iconCard(c, x + 109, 229, { w: 97, h: 112, fill: white, mark });
      type(c, text, x + 109, 317, 21, ink, { max: 209 });
      if (i === 2) type(c, 'По 1 · вдвоём по 2', x + 109, 346, 18, pine, { max: 206 });
    });
    type(c, 'В большой компании вместо добора замените 3 карты', 384, 414, 24, pine, { max: 682 });
  }],
  two: ['Вариант для двоих', 'Первый игрок меняется после каждой гонки', c => {
    type(c, 'Порядок выбора билетов', 384, 129, 29, pine);
    const order = [1, 2, 2, 1, 1, 2];
    arrow(c, [[103, 214], [666, 214]], orange, 6);
    order.forEach((n, i) => {
      disk(c, 109 + i * 110, 214, 36, n === 1 ? pine : blue, white);
      type(c, String(n), 109 + i * 110, 213, 37, white);
    });
    type(c, 'По 3 билета', 384, 290, 28);
    ticket(c, 50, 332, 318, 78, yellow, '4 карты', 'на руку при подготовке');
    ticket(c, 399, 332, 318, 78, '#f79d7a', 'По 2 карты', 'в колоду перед гонкой');
  }],
};


const selected = new Set(process.argv.slice(2));
const out = path.join(repo, 'app/games/hotstreak-art');
for (const [key, args] of Object.entries(scenes)) {
  if (!selected.size || selected.has(key)) {
    fs.writeFileSync(path.join(out, key + '.webp'), layout(...args).toBuffer('image/webp', 92));
  }
}
