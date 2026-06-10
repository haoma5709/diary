// Download woff2 fonts from Google Fonts via gwfh API
const https = require("https");
const fs = require("fs");
const path = require("path");

const FONTS_DIR = path.join(__dirname, "..", "public", "fonts");
fs.mkdirSync(FONTS_DIR, { recursive: true });

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": "node" } }, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => resolve(JSON.parse(data)));
    }).on("error", reject);
  });
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on("finish", () => {
        file.close();
        resolve(fs.statSync(dest).size);
      });
    }).on("error", reject);
  });
}

async function main() {
  const fonts = [
    { family: "noto-serif-sc", weights: ["regular", "600", "700"] },
    { family: "noto-sans-sc", weights: ["regular", "500", "600"] },
  ];

  let css = "/* Self-hosted Google Fonts — woff2 */\n\n";

  for (const { family, weights } of fonts) {
    console.log(`Fetching metadata for ${family} (chinese-simplified)...`);
    const data = await fetchJson(`https://gwfh.mranftl.com/api/fonts/${family}?subsets=chinese-simplified`);
    const variants = data.variants;

    for (const weight of weights) {
      const v = variants.find((v) => v.id === weight);
      if (!v || !v.woff2) {
        console.log(`  ✗ ${weight}: no woff2 URL`);
        continue;
      }

      const filename = `${family}-${weight}.woff2`;
      const dest = path.join(FONTS_DIR, filename);

      console.log(`  Downloading ${filename}...`);
      const size = await download(v.woff2, dest);
      console.log(`  ✓ ${filename} (${(size / 1024).toFixed(0)} KB)`);

      const fontWeight = weight === "regular" ? "400" : weight;
      css += `@font-face {\n`;
      css += `  font-family: '${data.family}';\n`;
      css += `  font-style: normal;\n`;
      css += `  font-weight: ${fontWeight};\n`;
      css += `  font-display: swap;\n`;
      css += `  src: url('/fonts/${filename}') format('woff2');\n`;
      css += `}\n\n`;
    }
  }

  fs.writeFileSync(path.join(FONTS_DIR, "fonts.css"), css);
  console.log(`\nDone! CSS written to public/fonts/fonts.css`);
}

main().catch(console.error);
