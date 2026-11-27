// Renders launcher icons from the approved BoardHelper artwork.
// Run: node scripts/make-icons.js
const fs = require('node:fs');
const path = require('node:path');
const { createCanvas, loadImage } = require('@napi-rs/canvas');

const root = path.join(__dirname, '..');
const iconDir = path.join(root, 'app', 'icons');
const buildDir = path.join(root, 'build');

async function main() {
  const artwork = await loadImage(path.join(__dirname, 'assets', 'boardhelper-icon.webp'));
  fs.mkdirSync(iconDir, { recursive: true });
  fs.mkdirSync(buildDir, { recursive: true });

  const files = [
    [path.join(iconDir, 'boardhelper-192.png'), 192, 'rounded'],
    [path.join(iconDir, 'boardhelper-512.png'), 512, 'rounded'],
    [path.join(iconDir, 'boardhelper-maskable-512.png'), 512, 'maskable'],
    [path.join(iconDir, 'boardhelper-apple-180.png'), 180, 'square'],
    [path.join(iconDir, 'icon.png'), 256, 'rounded'],
    [path.join(buildDir, 'icon.png'), 512, 'rounded'],
  ];

  for (const [file, size, form] of files) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingQuality = 'high';

    if (form === 'rounded') {
      ctx.beginPath();
      ctx.roundRect(0, 0, size, size, size * .2);
      ctx.clip();
    }

    if (form === 'maskable') {
      // Leave enough room for the symbol inside the circular maskable safe zone.
      const inset = size * .02;
      ctx.fillStyle = '#211815';
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(artwork, inset, inset, size - inset * 2, size - inset * 2);
    } else {
      ctx.drawImage(artwork, 0, 0, size, size);
    }
    fs.writeFileSync(file, canvas.toBuffer('image/png'));
  }

  console.log('Icons:', files.length);
}

main().catch(error => { console.error(error); process.exitCode = 1; });
