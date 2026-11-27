// Generate the approved Quoridor diagrams and the square crop of the local publisher photo.
// Run: node scripts/assets/quoridor-compose.mjs [name…]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';

const root = fileURLToPath(new URL('../../', import.meta.url));
GlobalFonts.registerFromPath(`${root}/node_modules/@fontsource/onest/files/onest-cyrillic-600-normal.woff2`, 'Onest');
GlobalFonts.registerFromPath(`${root}/node_modules/@fontsource/onest/files/onest-latin-600-normal.woff2`, 'Onest');

const W = 768;
const H = 512;
const color = {
  paper: '#F7F0E6', ink: '#38221E', inkMuted: '#765D50', rust: '#A64833',
  walnut: '#4C2824', walnutLight: '#693B33', wall: '#F5C67F', wallEdge: '#A36D3C',
  teal: '#146458', mint: '#AAECCC', mintDark: '#225955', bad: '#A22B37', lightBad: '#FFA3A5',
  amber: '#E7A957', purple: '#5D3660', plum: '#A44971', ivory: '#F5DDC5',
};

function round(ctx, x, y, w, h, r, fill, stroke, lineWidth = 1) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lineWidth; ctx.stroke(); }
}

function circle(ctx, x, y, r, fill, stroke, lineWidth = 1) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lineWidth; ctx.stroke(); }
}

function text(ctx, value, x, y, size, fill = color.ink, align = 'center') {
  ctx.font = `600 ${size}px Onest, Arial`;
  ctx.fillStyle = fill;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(value, x, y);
}

function pawn(ctx, x, y, radius, hue) {
  circle(ctx, x, y + radius * .16, radius * 1.06, '#26191a9c');
  circle(ctx, x, y, radius, hue, color.ink, Math.max(1, radius * .12));
  const glow = ctx.createRadialGradient(x - radius * .27, y - radius * .33, 0, x, y, radius);
  glow.addColorStop(0, '#FFFFFF65');
  glow.addColorStop(.57, '#FFFFFF05');
  glow.addColorStop(1, '#2B121856');
  circle(ctx, x, y, radius * .94, glow);
  circle(ctx, x, y, radius * .66, null, '#FFF7E7A6', Math.max(1, radius * .075));
}

function grid(ctx, x, y, size, n, { marks = [], pawns = [], walls = [] } = {}) {
  const step = size / n;
  const gap = step * .095;
  round(ctx, x - 7, y - 7, size + 14, size + 24, 13, '#6D4A3833');
  round(ctx, x - 8, y - 8, size + 16, size + 16, 12, color.walnut, '#704137', 2);
  for (let row = 0; row < n; row++) for (let col = 0; col < n; col++) {
    const mark = marks.find(([c, r]) => c === col && r === row);
    const bg = mark ? mark[2] : ((row * 3 + col) % 4 === 0 ? '#75483D' : color.walnutLight);
    const tileX = x + col * step + gap;
    const tileY = y + row * step + gap;
    round(ctx, tileX, tileY, step - 2 * gap, step - 2 * gap, step * .10, bg, '#FFFFFF1F', 1.25);
    ctx.strokeStyle = '#E9A87817';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(tileX + step * .10, tileY + step * .17);
    ctx.quadraticCurveTo(tileX + step * .40, tileY + step * .08, tileX + step * .66, tileY + step * .14);
    ctx.stroke();
  }
  const position = (c, r) => [x + (c + .5) * step, y + (r + .5) * step];
  for (const [c, r, direction, bad] of walls) {
    if (c < 0 || c >= n - 1 || r < 0 || r >= n - 1) throw new Error(`Wall outside grid at ${c},${r}`);
    const width = step * .22;
    const length = step * 2 - gap;
    const startX = x + (direction === 'h' ? c * step + gap / 2 : (c + 1) * step - width / 2);
    const startY = y + (direction === 'v' ? r * step + gap / 2 : (r + 1) * step - width / 2);
    const wallW = direction === 'h' ? length : width;
    const wallH = direction === 'h' ? width : length;
    round(ctx, startX + 2, startY + 3, wallW, wallH, Math.min(width / 2, 4), '#25140FC0');
    round(ctx, startX, startY, wallW, wallH, Math.min(width / 2, 4), bad ? color.lightBad : color.wall, bad ? color.bad : color.wallEdge, 1.6);
  }
  for (const [c, r, hue] of pawns) pawn(ctx, ...position(c, r), step * .30, hue);
  return { position, step, x, y, size };
}

const moveBy = (point, dx, dy) => [point[0] + dx, point[1] + dy];

function arrow(ctx, points, { fill = color.mint, thickness = 6, dash = [], head = 13, quadratic = false } = {}) {
  ctx.save();
  ctx.strokeStyle = fill;
  ctx.fillStyle = fill;
  ctx.lineWidth = thickness;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  if (quadratic) ctx.quadraticCurveTo(...points[1], ...points[2]);
  else for (const p of points.slice(1)) ctx.lineTo(...p);
  ctx.stroke();
  const [x, y] = points.at(-1);
  const [px, py] = points.at(-2);
  const angle = Math.atan2(y - py, x - px);
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(x + Math.cos(angle) * 3, y + Math.sin(angle) * 3);
  ctx.lineTo(x - Math.cos(angle - .50) * head, y - Math.sin(angle - .50) * head);
  ctx.lineTo(x - Math.cos(angle + .50) * head, y - Math.sin(angle + .50) * head);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function crossed(ctx, x, y, radius = 13) {
  circle(ctx, x, y, radius, color.bad, '#FFE2DC', 2);
  ctx.strokeStyle = '#FFF1E6';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  const d = radius * .34;
  ctx.beginPath();
  ctx.moveTo(x - d, y - d); ctx.lineTo(x + d, y + d);
  ctx.moveTo(x + d, y - d); ctx.lineTo(x - d, y + d);
  ctx.stroke();
}

function target(ctx, position, radius = 11) {
  circle(ctx, ...position, radius, null, color.mint, 2);
}

function stock(ctx, cx, y, n, hue) {
  round(ctx, cx - 67, y, 134, n === 10 ? 124 : 90, 12, '#EFE1D1', '#DDC8B6', 1.5);
  circle(ctx, cx - 18, y + 26, 10, hue, color.walnut, 1.4);
  text(ctx, String(n), cx + 15, y + 27, 28);
  for (let i = 0; i < n; i++) {
    const x = cx - 47 + (i % 5) * 19;
    const yy = y + 54 + Math.floor(i / 5) * 36;
    round(ctx, x, yy, 13, 25, 3, color.wall, color.wallEdge, 1.5);
  }
}

function scene(title, caption, drawing) {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = color.paper;
  ctx.fillRect(0, 0, W, H);
  round(ctx, 8, 8, W - 16, H - 16, 17, null, '#BDA18C', 2);
  round(ctx, 42, 37, 6, 30, 3, color.rust);
  text(ctx, title, 64, 53, 35, color.ink, 'left');
  drawing(ctx);
  round(ctx, 33, 448, 702, 38, 7, '#EFE1D1');
  text(ctx, caption, W / 2, 468, 25);
  return canvas;
}

const orange = color.amber;
const dark = color.purple;
const valid = color.mintDark;
const paneX = 215;
const paneY = 91;
const paneSize = 338;
const full = (ctx, options) => grid(ctx, paneX, paneY, paneSize, 9, options);
function section(ctx, options) {
  text(ctx, 'Фрагмент поля', 648, 409, 17, color.inkMuted);
  return grid(ctx, paneX, paneY, paneSize, 5, options);
}

const scenes = {
  start2: scene('Старт вдвоём', 'На средних клетках противоположных краёв', ctx => {
    full(ctx, { pawns: [[4, 0, dark], [4, 8, orange]], marks: [[4, 0, valid], [4, 8, valid]] });
    stock(ctx, 119, 158, 10, dark);
    stock(ctx, 649, 158, 10, orange);
    text(ctx, 'перегородок', 119, 312, 18);
    text(ctx, 'перегородок', 649, 312, 18);
  }),
  start4: scene('Старт вчетвером', 'Фишка в середине своей стороны', ctx => {
    full(ctx, { pawns: [[4, 0, dark], [4, 8, orange], [0, 4, color.plum], [8, 4, color.ivory]], marks: [[4, 0, valid], [4, 8, valid], [0, 4, valid], [8, 4, valid]] });
    stock(ctx, 119, 122, 5, dark);
    stock(ctx, 119, 260, 5, color.plum);
    stock(ctx, 649, 122, 5, color.ivory);
    stock(ctx, 649, 260, 5, orange);
    text(ctx, 'По 5 каждому', 119, 395, 17);
    text(ctx, 'По 5 каждому', 649, 395, 17);
  }),
  turn: scene('Одно действие за ход', 'Перегородки кончились — ходите фишкой', ctx => {
    text(ctx, 'Фрагменты поля', 384, 89, 17, color.inkMuted);
    const left = grid(ctx, 80, 115, 242, 4, { pawns: [[1, 2, orange]], marks: [[1, 1, valid]] });
    arrow(ctx, [moveBy(left.position(1, 2), 0, -24), left.position(1, 1)]);
    const right = grid(ctx, 446, 115, 242, 4, { walls: [[1, 1, 'h']] });
    const [x, y] = right.position(1, 1);
    arrow(ctx, [[x + 30, y - 31], [x + 30, y + 17]]);
    text(ctx, 'ИЛИ', 384, 235, 24, color.rust);
    text(ctx, 'Ход фишкой', 201, 394, 25);
    text(ctx, 'Перегородка', 567, 394, 25);
  }),
  fence: scene('Как поставить перегородку', 'Каждая перекрывает два соседних перехода', ctx => {
    text(ctx, 'Фрагменты поля', 384, 88, 17, color.inkMuted);
    grid(ctx, 82, 113, 236, 4, { walls: [[1, 1, 'h']], marks: [[1, 1, '#875337'], [2, 1, '#875337'], [1, 2, '#875337'], [2, 2, '#875337']] });
    grid(ctx, 450, 113, 236, 4, { walls: [[1, 1, 'v']], marks: [[1, 1, '#875337'], [2, 1, '#875337'], [1, 2, '#875337'], [2, 2, '#875337']] });
    text(ctx, 'Горизонтально', 200, 393, 24);
    text(ctx, 'Вертикально', 568, 393, 24);
  }),
  move: scene('Шаг на одну клетку', 'Вперёд, назад, влево или вправо', ctx => {
    const endpoints = [[2, 1], [2, 3], [1, 2], [3, 2]];
    const board = section(ctx, { pawns: [[2, 2, orange]], marks: endpoints.map(([c, r]) => [c, r, valid]) });
    const origin = board.position(2, 2);
    for (const [c, r] of endpoints) {
      const end = board.position(c, r);
      arrow(ctx, [moveBy(origin, (c - 2) * 25, (r - 2) * 25), end]);
    }
    crossed(ctx, ...board.position(3, 1));
  }),
  around: scene('Перегородку обходят', 'Пунктир показывает три отдельных хода', ctx => {
    const route = [[2, 2], [3, 2], [3, 1], [2, 1]];
    const board = section(ctx, { pawns: [[2, 2, orange]], walls: [[1, 1, 'h']], marks: route.slice(1).map(([c, r]) => [c, r, valid]) });
    const start = board.position(2, 2);
    const points = route.slice(1).map(p => board.position(...p));
    arrow(ctx, [moveBy(start, 25, 0), ...points], { dash: [6, 7] });
    crossed(ctx, ...moveBy(start, 0, -board.step / 2), 13);
    for (let i = 0; i < points.length; i++) {
      const [x, y] = points[i];
      circle(ctx, x + 17, y + 17, 10, color.teal);
      text(ctx, String(i + 1), x + 17, y + 17, 14, '#fff');
    }
  }),
  jump: scene('Прыжок через соперника', 'Без перегородки приземлитесь сразу за ним', ctx => {
    const board = section(ctx, { pawns: [[2, 3, orange], [2, 2, dark]], marks: [[2, 1, valid]] });
    const start = board.position(2, 3), end = board.position(2, 1);
    target(ctx, end, 15);
    arrow(ctx, [moveBy(start, 0, -24), end], { dash: [7, 7] });
    pawn(ctx, ...board.position(2, 2), board.step * .30, dark);
  }),
  side: scene('Перегородка за соперником', 'Выберите клетку слева или справа от него', ctx => {
    const board = section(ctx, { pawns: [[2, 3, orange], [2, 2, dark]], walls: [[1, 1, 'h']], marks: [[1, 2, valid], [3, 2, valid]] });
    const start = board.position(2, 3);
    for (const d of [-1, 1]) {
      const end = board.position(2 + d, 2);
      target(ctx, end);
      arrow(ctx, [moveBy(start, d * 20, -13), moveBy(end, 0, 40), end], { quadratic: true });
    }
  }),
  'side-one': scene('Сбоку мешает перегородка', 'В этом примере можно прыгнуть только вправо', ctx => {
    const board = section(ctx, { pawns: [[2, 3, orange], [2, 2, dark]], walls: [[1, 1, 'h'], [1, 2, 'v']], marks: [[3, 2, valid]] });
    const start = board.position(2, 3), end = board.position(3, 2);
    target(ctx, end);
    arrow(ctx, [moveBy(start, 20, -13), moveBy(end, 0, 40), end], { quadratic: true });
    crossed(ctx, ...board.position(1, 2));
  }),
  jump4: scene('Вчетвером: через одну фишку', 'Третья фишка сзади — приземляйтесь сбоку', ctx => {
    const board = section(ctx, { pawns: [[2, 3, orange], [2, 2, dark], [2, 1, color.plum]], marks: [[1, 2, valid], [3, 2, valid]] });
    for (const d of [-1, 1]) {
      const end = board.position(2 + d, 2);
      target(ctx, end);
      arrow(ctx, [moveBy(board.position(2, 3), d * 20, -13), moveBy(end, 0, 40), end], { quadratic: true });
    }
    crossed(ctx, ...board.position(2, 0));
    text(ctx, 'Двойной прыжок', 116, 131, 18, color.bad);
  }),
  open: scene('Путь к финишу остаётся', 'Оставьте проход каждому игроку', ctx => {
    const marks = Array.from({ length: 9 }, (_, col) => [col, 0, '#386259']);
    const pawns = [[0, 8, orange], [4, 0, dark]];
    const left = grid(ctx, 49, 117, 278, 9, { pawns, walls: [[0, 7, 'v'], [0, 6, 'h', true]], marks });
    const right = grid(ctx, W - 49 - 278, 117, 278, 9, { pawns, walls: [[0, 7, 'v'], [1, 6, 'h']], marks });
    text(ctx, 'Нельзя', 188, 92, 23, color.bad);
    text(ctx, 'Можно', 580, 92, 23, color.teal);
    crossed(ctx, ...left.position(0, 7), 9);
    arrow(ctx, [moveBy(right.position(0, 8), 0, -13), right.position(0, 0)], { thickness: 4, dash: [6, 6], head: 10 });
    text(ctx, 'Выхода нет', 188, 422, 20, color.bad);
    text(ctx, 'Дорожка открыта', 580, 422, 20, color.teal);
  }),
  goal: scene('Финиш на противоположной стороне', 'Любая из 9 клеток этого ряда — победа', ctx => {
    const marks = Array.from({ length: 9 }, (_, c) => [c, 0, '#3F7669']);
    const board = full(ctx, { marks, pawns: [[6, 0, orange], [2, 6, dark]], walls: [[1, 3, 'h'], [5, 4, 'v'], [4, 7, 'h']] });
    target(ctx, board.position(4, 8), 8);
    text(ctx, 'Финиш', 648, 115, 24, color.teal);
    arrow(ctx, [[602, 115], [563, 115]], { fill: color.teal, thickness: 4, head: 10 });
    text(ctx, 'Старт', 648, 410, 24, color.inkMuted);
    arrow(ctx, [[603, 410], [563, 410]], { fill: color.inkMuted, thickness: 4, head: 10 });
  }),
};

const only = new Set(process.argv.slice(2));
const selected = key => !only.size || only.has(key);
const artDir = path.join(root, 'app/games/quoridor-art');
fs.mkdirSync(artDir, { recursive: true });
for (const [key, canvas] of Object.entries(scenes)) {
  if (selected(key)) fs.writeFileSync(path.join(artDir, key + '.webp'), canvas.toBuffer('image/webp', 94));
}
if (selected('cover')) {
  const image = await loadImage(path.join(root, 'sources/dl-quoridor/web/fr-1350.jpg'));
  if (image.width !== 800 || image.height !== 800) throw new Error('Unexpected official cover dimensions');
  const cover = createCanvas(512, 512);
  cover.getContext('2d').drawImage(image, 113, 113, 573, 573, 0, 0, 512, 512);
  fs.writeFileSync(path.join(root, 'app/games/covers/quoridor.webp'), cover.toBuffer('image/webp', 94));
}
