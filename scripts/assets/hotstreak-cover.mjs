// The square cover of «Вперёд, маскот!»: the Russian box from the publisher's site, cropped to the box, on a light ground.
// Run: node scripts/assets/hotstreak-cover.mjs sources/dl-hotstreak/web/<box>.png app/games/covers/hotstreak.webp "#E9F2D8"
import fs from "node:fs";
import { createCanvas, loadImage } from "@napi-rs/canvas";
const [, , input, output, bg] = process.argv;
const img = await loadImage(fs.readFileSync(input));
const c0 = createCanvas(img.width, img.height), x0 = c0.getContext("2d"); x0.drawImage(img, 0, 0);
const d = x0.getImageData(0, 0, img.width, img.height).data;
let l = 1e9, t = 1e9, r = 0, b = 0;
for (let y = 0; y < img.height; y++) for (let x = 0; x < img.width; x++) if (d[(y * img.width + x) * 4 + 3] > 20) { l = Math.min(l, x); r = Math.max(r, x); t = Math.min(t, y); b = Math.max(b, y); }
const size = 512, c = createCanvas(size, size), ctx = c.getContext("2d");
ctx.fillStyle = bg; ctx.fillRect(0, 0, size, size);
const bw = r - l, bh = b - t, w = size * 0.96, h = bh * w / bw;
ctx.imageSmoothingQuality = "high";
ctx.drawImage(img, l, t, bw, bh, (size - w) / 2, (size - h) / 2, w, h);
fs.writeFileSync(output, c.toBuffer("image/webp", 80));
console.log(l, t, r, b);
