// Cuts the characters of «Тако, кот, коза, сыр, пицца» out of the vector rulebook (Hobby World, rendered at scale 4 by
// render.mjs into sources/taco-pages-hi) and makes the paper around them transparent: a flood fill from the edges of the
// crop over near-white (and the magenta page border) stops at the brown outlines, so white bodies keep their colour.
// Run: node scripts/assets/render.mjs sources/dl-taco/rules.pdf sources/taco-pages-hi 4, then node scripts/assets/taco-crops.mjs → sources/assets/taco/<name>.png (used by taco-compose.mjs).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createCanvas, loadImage } from "@napi-rs/canvas";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const out = path.join(root, "sources", "assets", "taco");
fs.mkdirSync(out, { recursive: true });
// boxes in units of a 2000-wide page (the size the pages were looked at); page 2 = printed pages 2–4, page 1 = 5–6
const crops = {
  taco: [2, [392, 72, 602, 238]],
  goat: [2, [1128, 258, 1270, 472]],
  cat: [2, [436, 836, 594, 1018]],
  cheese: [2, [1118, 876, 1258, 1034]],
  gorilla: [2, [882, 1116, 1104, 1356]],
  pizza: [2, [1392, 152, 1545, 308]],
  groundhog: [2, [1808, 412, 1948, 603]],
  narwhal: [1, [852, 1120, 1170, 1426], true, "tlr"],
  "do-gorilla": [1, [117, 165, 552, 435], false],
  "do-groundhog": [1, [105, 525, 555, 795], false],
  "do-narwhal": [1, [115, 890, 570, 1160], false],
};
const pages = {};
const page = async n => (pages[n] ||= await loadImage(fs.readFileSync(path.join(root, "sources", "taco-pages-hi", `page-0${n}.png`))));

const near = (d, i, [r, g, b], tol) => Math.abs(d[i] - r) + Math.abs(d[i + 1] - g) + Math.abs(d[i + 2] - b) <= tol;
function clearPaper(c, edges = "tlrb") {
  const x = c.getContext("2d"), W = c.width, H = c.height, img = x.getImageData(0, 0, W, H), d = img.data;
  const paper = [[255, 255, 255], [232, 23, 138]], seen = new Uint8Array(W * H), stack = [];
  const ok = p => paper.some(col => near(d, p * 4, col, 60));
  // the narwhal is cut by the page below: no fill from that edge, or it would run into the white body
  for (let i = 0; i < W; i++) { if (edges.includes("t")) stack.push(i); if (edges.includes("b")) stack.push((H - 1) * W + i); }
  for (let j = 0; j < H; j++) { if (edges.includes("l")) stack.push(j * W); if (edges.includes("r")) stack.push(j * W + W - 1); }
  while (stack.length) {
    const p = stack.pop();
    if (seen[p] || !ok(p)) continue;
    seen[p] = 1; d[p * 4 + 3] = 0;
    const px = p % W, py = (p - px) / W;
    if (px > 0) stack.push(p - 1); if (px < W - 1) stack.push(p + 1);
    if (py > 0) stack.push(p - W); if (py < H - 1) stack.push(p + W);
  }
  // soften the rim: a pixel next to the cleared paper keeps its colour at half strength
  for (let p = 0; p < W * H; p++) if (!seen[p] && d[p * 4 + 3] && near(d, p * 4, [255, 255, 255], 120)) {
    const px = p % W, py = (p - px) / W;
    if ((px > 0 && seen[p - 1]) || (px < W - 1 && seen[p + 1]) || (py > 0 && seen[p - W]) || (py < H - 1 && seen[p + W])) d[p * 4 + 3] = 128;
  }
  // the magenta page border inside an outline (the narwhal's tail) is paper too
  for (let p = 0; p < W * H; p++) if (near(d, p * 4, paper[1], 90)) d[p * 4 + 3] = 0;
  // keep the largest drawing: bits of text and frame lines around it go
  const comp = new Int32Array(W * H).fill(-1), sizes = [];
  for (let p0 = 0; p0 < W * H; p0++) {
    if (comp[p0] >= 0 || !d[p0 * 4 + 3]) continue;
    const id = sizes.length; let n = 0; const st = [p0]; comp[p0] = id;
    while (st.length) { const p = st.pop(); n++; const px = p % W, py = (p - px) / W;
      for (const q of [px > 0 ? p - 1 : -1, px < W - 1 ? p + 1 : -1, py > 0 ? p - W : -1, py < H - 1 ? p + W : -1])
        if (q >= 0 && comp[q] < 0 && d[q * 4 + 3]) { comp[q] = id; st.push(q); } }
    sizes.push(n);
  }
  const big = sizes.indexOf(Math.max(...sizes));
  for (let p = 0; p < W * H; p++) if (comp[p] !== big) d[p * 4 + 3] = 0;
  x.putImageData(img, 0, 0);
}
for (const [name, [n, [x0, y0, x1, y1], clear = true, edges]] of Object.entries(crops)) {
  const img = await page(n), k = img.width / 2000;
  const c = createCanvas(Math.round((x1 - x0) * k), Math.round((y1 - y0) * k));
  c.getContext("2d").drawImage(img, x0 * k, y0 * k, (x1 - x0) * k, (y1 - y0) * k, 0, 0, c.width, c.height);
  if (clear) clearPaper(c, edges);
  fs.writeFileSync(path.join(out, name + ".png"), c.toBuffer("image/png"));
  console.log(name, c.width + "x" + c.height);
}
