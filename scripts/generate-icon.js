// scripts/generate-icon.js
// Creates production Windows ICO from assets/icon.png
const fs = require('fs');
const path = require('path');
const resedit = require('resedit');

const rootDir = path.resolve(__dirname, '..');
const pngPath = path.join(rootDir, 'assets', 'icon.png');
const icoPath = path.join(rootDir, 'assets', 'icon.ico');

if (!fs.existsSync(pngPath)) {
  console.error('Missing assets/icon.png');
  process.exit(1);
}

const png = fs.readFileSync(pngPath);

const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type 1 = ICO
header.writeUInt16LE(1, 4); // 1 image

const dirEntry = Buffer.alloc(16);
dirEntry.writeUInt8(64, 0); // width 64
dirEntry.writeUInt8(64, 1); // height 64
dirEntry.writeUInt8(0, 2);  // color count
dirEntry.writeUInt8(0, 3);  // reserved
dirEntry.writeUInt16LE(1, 4); // planes
dirEntry.writeUInt16LE(32, 6); // bit count
dirEntry.writeUInt32LE(png.length, 8); // image size
dirEntry.writeUInt32LE(6 + 16, 12); // offset

const ico = Buffer.concat([header, dirEntry, png]);
fs.writeFileSync(icoPath, ico);

// Validate with resedit
const parsed = resedit.Data.IconFile.from(ico);
console.log(`Successfully generated and verified assets/icon.ico (${parsed.icons.length} icon entry).`);
