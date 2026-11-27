// Square crop of the official Choo Choo Games artwork.
// Run with the publisher's source PNG and the desired output WebP path.
import fs from 'node:fs';
import { createCanvas, loadImage } from '@napi-rs/canvas';

const [, , input, output] = process.argv;
const image = await loadImage(input);
const [x, y, width, height] = [696, 150, 1230, 1230];
if (x + width > image.width || y + height > image.height) throw new Error('Unexpected source image size');
const square = createCanvas(512, 512);
const ctx = square.getContext('2d');
ctx.imageSmoothingQuality = 'high';
ctx.drawImage(image, x, y, width, height, 0, 0, 512, 512);
fs.writeFileSync(output, square.toBuffer('image/webp', 95));
