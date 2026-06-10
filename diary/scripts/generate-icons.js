// Generates icon PNGs for PWA — no dependencies, Node.js built-ins only
const zlib = require("zlib");
const fs = require("fs");
const path = require("path");

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let j = 0; j < 8; j++) c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeData = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(typeData), 0);
  return Buffer.concat([len, typeData, crcBuf]);
}

function makeIcon(size) {
  // Raw RGBA pixel data: each row starts with filter byte 0, then R,G,B,A per pixel
  const rawRows = [];
  const cx = size / 2, cy = size / 2;
  const outerR = size * 0.3;
  const innerR = size * 0.23;

  for (let y = 0; y < size; y++) {
    const row = [0]; // filter: none
    for (let x = 0; x < size; x++) {
      const dx = x - cx, dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      // Ring: paper-colored ring on rust background
      if (dist >= innerR && dist <= outerR) {
        row.push(0xfb, 0xf8, 0xf3, 0xff); // paper #fbf8f3
      } else {
        row.push(0xc4, 0x6b, 0x4d, 0xff); // rust #c46b4d
      }
    }
    rawRows.push(Buffer.from(row));
  }

  const raw = Buffer.concat(rawRows);
  const compressed = zlib.deflateSync(raw);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);  // width
  ihdr.writeUInt32BE(size, 4);  // height
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 6;   // color type: RGBA
  ihdr[10] = 0;  // compression
  ihdr[11] = 0;  // filter
  ihdr[12] = 0;  // interlace

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", compressed),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const publicDir = path.join(__dirname, "..", "public");
[192, 512].forEach((size) => {
  const png = makeIcon(size);
  fs.writeFileSync(path.join(publicDir, `icon-${size}.png`), png);
  console.log(`✓ icon-${size}.png (${png.length} bytes)`);
});
console.log("Done — icons generated in public/");
