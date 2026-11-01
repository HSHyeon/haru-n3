import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { Resvg } from '@resvg/resvg-js';

// The only artwork source. Do not redraw or edit generated PNG/ICO files.
const publicDirectory = new URL('../public/', import.meta.url);
const svg = await readFile(new URL('favicon.svg', publicDirectory), 'utf8');
const iconDirectory = new URL('icons/', publicDirectory);
await mkdir(iconDirectory, { recursive: true });

function render(source, size) {
  return Buffer.from(
    new Resvg(source, {
      fitTo: { mode: 'width', value: size },
      font: { loadSystemFonts: false },
    })
      .render()
      .asPng(),
  );
}

const variants = [
  { size: 16, name: 'favicon-16.png' },
  { size: 32, name: 'favicon-32.png' },
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 192, name: 'icon-192.png' },
  { size: 512, name: 'icon-512.png' },
];
const images = new Map();
for (const { size, name } of variants) {
  const png = render(svg, size);
  images.set(size, png);
  await writeFile(new URL(name, iconDirectory), png);
}

// Inset the same SVG inside an opaque square so Android masks cannot clip
// the moon or the note. The background color is derived from the source SVG.
const background = svg.match(/<rect\b[^>]*\bfill="(#[a-f\d]{3,8})"/i)?.[1];
if (!background) throw new Error('The source SVG needs a solid background rect.');
const insetSvg = svg.replace('<svg ', '<svg x="64" y="64" width="384" height="384" ');
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" fill="${background}"/>${insetSvg}</svg>`;
await writeFile(new URL('icon-maskable-512.png', iconDirectory), render(maskableSvg, 512));

// ICO supports PNG payloads. Keep 16px and 32px entries for browser tabs.
const sizes = [16, 32];
const header = Buffer.alloc(6);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = header.length + sizes.length * 16;
const entries = sizes.map((size) => {
  const image = images.get(size);
  const entry = Buffer.alloc(16);
  entry.writeUInt8(size, 0);
  entry.writeUInt8(size, 1);
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(image.length, 8);
  entry.writeUInt32LE(offset, 12);
  offset += image.length;
  return entry;
});
await writeFile(
  new URL('favicon.ico', publicDirectory),
  Buffer.concat([header, ...entries, ...sizes.map((size) => images.get(size))]),
);
console.log('Generated 6 PNG icons and favicon.ico from public/favicon.svg.');
