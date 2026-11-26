// Generates the product images in public/products/, the seed manifest docs/product-images.csv
// and public/products/ATTRIBUTION.md. Run with `npm run images:build` (needs internet access for
// the Wikimedia Commons photos). The generated files are committed, so normal setup does not run this.
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const frontendRoot = process.cwd();
const repoRoot = path.resolve(frontendRoot, "..");
const outDir = path.join(frontendRoot, "public", "products");
const SIZE = 320;
const USER_AGENT =
  "SmartphoneShopLocalTestApp/1.0 (https://github.com/adrianstanciu555/smartphone-shop; images:build script)";

/** Freely licensed Wikimedia Commons photos; crop = [left, top, width, height] as fractions of the source. */
const PHOTOS: Record<string, { file: string; crop?: [number, number, number, number] }> = {
  "Apple iPhone 15": { file: "File:Apple iPhone 15.jpg", crop: [0, 0.2, 0.49, 0.63] },
  "Google Pixel 8": { file: "File:Google Pixel 8 Rose rear.jpg", crop: [0.15, 0.07, 0.7, 0.86] },
  "OPPO Find X7": { file: "File:OPPO Find X7（2024年2月20日）.jpg", crop: [0.22, 0.1, 0.48, 0.5] },
  "Samsung Galaxy S24": { file: "File:Samsung Galaxy S24 01.jpg", crop: [0.26, 0.18, 0.44, 0.64] },
  "Sony Xperia 1 V": { file: "File:Sony Xperia 1 V.png" },
  "Vivo X100": { file: "File:Vivo X100 pic3.jpg", crop: [0.32, 0.46, 0.25, 0.36] },
};

/** Phones without a suitable free photo get a drawn front view: [body, screen start, screen end]. */
const DRAWN_PHONES: Record<string, [string, string, string]> = {
  "HONOR Magic6": ["#1f3d33", "#2f855a", "#9ae6b4"],
  "Motorola Edge 40": ["#1e293b", "#1d4ed8", "#93c5fd"],
  "OnePlus Nord 3": ["#334155", "#0f766e", "#5eead4"],
  "Xiaomi Redmi Note 13": ["#111827", "#7c3aed", "#f0abfc"],
};

const COLOURS: Record<string, { fill: string; stroke: string; detail: string }> = {
  Black: { fill: "#1f2937", stroke: "#111827", detail: "#9ca3af" },
  White: { fill: "#f8fafc", stroke: "#94a3b8", detail: "#64748b" },
  Blue: { fill: "#2563eb", stroke: "#1e3a8a", detail: "#bfdbfe" },
};

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const svg = (body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}" width="${SIZE}" height="${SIZE}">${body}</svg>\n`;
const text = (x: number, y: number, size: number, fill: string, value: string) =>
  `<text x="${x}" y="${y}" font-family="Arial,Helvetica,sans-serif" font-size="${size}" font-weight="700" fill="${fill}" text-anchor="middle">${esc(value)}</text>`;

function drawnPhone(model: string, [body, from, to]: [string, string, string]): string {
  const brand = model.split(" ")[0];
  const name = model.slice(brand.length + 1);
  return svg(
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs>` +
      `<rect x="100" y="16" width="120" height="288" rx="20" fill="${body}"/>` +
      `<rect x="106" y="22" width="108" height="276" rx="15" fill="url(#g)"/>` +
      `<circle cx="160" cy="36" r="4.5" fill="#0b0f19"/>` +
      text(160, 150, 15, "#fff", brand) +
      text(160, 172, 13, "#fff", name),
  );
}

function phoneOutline(fill: string, stroke: string, extra = "", opacity = 1): string {
  return (
    `<rect x="98" y="16" width="124" height="288" rx="24" fill="${fill}" fill-opacity="${opacity}" stroke="${stroke}" stroke-width="6"/>` +
    `<rect x="114" y="32" width="44" height="58" rx="12" fill="#fff" stroke="${stroke}" stroke-width="3"/>` +
    extra
  );
}

function caseSvg(kind: string): string {
  switch (kind) {
    case "Clear Case":
      return svg(phoneOutline("#cbd5e1", "#94a3b8", `<path d="M190 60 L205 45 M195 110 L215 90" stroke="#fff" stroke-width="5" stroke-linecap="round"/>`, 0.35));
    case "Slim Case":
      return svg(phoneOutline("#334155", "#1e293b"));
    case "Rugged Case":
      return svg(
        phoneOutline("#374151", "#111827") +
          [[98, 16], [222, 16], [98, 304], [222, 304]]
            .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="13" fill="#f97316"/>`)
            .join(""),
      );
    default: // Wallet Case
      return svg(
        `<rect x="70" y="16" width="180" height="288" rx="16" fill="#92400e" stroke="#78350f" stroke-width="5"/>` +
          `<line x1="160" y1="20" x2="160" y2="300" stroke="#78350f" stroke-width="4"/>` +
          [70, 112, 154].map((y) => `<rect x="84" y="${y}" width="62" height="34" rx="5" fill="#b45309"/>`).join("") +
          `<rect x="232" y="140" width="26" height="40" rx="6" fill="#78350f"/>`,
      );
  }
}

function protectorSvg(kind: string): string {
  const glass = (fill: string, opacity: number, border = "") =>
    `<g transform="rotate(-8 160 160)"><rect x="96" y="20" width="128" height="280" rx="22" fill="${fill}" fill-opacity="${opacity}" stroke="#64748b" stroke-width="3"/>${border}` +
    `<path d="M120 90 L180 40 M120 130 L205 60" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-opacity=".8"/></g>`;
  switch (kind) {
    case "Anti-Glare Film":
      return svg(glass("#94a3b8", 0.45) + text(160, 310, 16, "#475569", "MATTE"));
    case "Full Cover Glass":
      return svg(glass("#bae6fd", 0.4, `<rect x="96" y="20" width="128" height="280" rx="22" fill="none" stroke="#111827" stroke-width="10"/>`));
    case "Privacy Glass":
      return svg(glass("#111827", 0.75) + text(160, 310, 16, "#475569", "PRIVACY"));
    default: // Tempered Glass
      return svg(glass("#bae6fd", 0.45) + text(160, 310, 16, "#475569", "9H"));
  }
}

function chargerSvg(kind: string, c: (typeof COLOURS)[string]): string {
  if (kind.includes("Wireless Charger")) {
    return svg(
      `<path d="M160 250 C160 290 260 280 300 300" stroke="${c.stroke}" stroke-width="7" fill="none"/>` +
        `<circle cx="160" cy="160" r="105" fill="${c.fill}" stroke="${c.stroke}" stroke-width="5"/>` +
        `<circle cx="160" cy="160" r="70" fill="none" stroke="${c.detail}" stroke-width="4"/>` +
        `<path d="M146 150 a20 20 0 0 1 28 0 M138 140 a32 32 0 0 1 44 0" stroke="${c.detail}" stroke-width="5" fill="none" stroke-linecap="round"/>` +
        text(160, 190, 18, c.detail, "15W"),
    );
  }
  if (kind.includes("Charging Stand")) {
    return svg(
      `<rect x="40" y="250" width="240" height="40" rx="14" fill="${c.fill}" stroke="${c.stroke}" stroke-width="5"/>` +
        `<path d="M100 250 L120 40 L180 40 L170 250 Z" fill="${c.fill}" stroke="${c.stroke}" stroke-width="5"/>` +
        `<circle cx="148" cy="120" r="22" fill="none" stroke="${c.detail}" stroke-width="4"/>` +
        `<rect x="205" y="200" width="44" height="50" rx="10" fill="${c.fill}" stroke="${c.stroke}" stroke-width="4"/>` +
        `<circle cx="70" cy="240" r="16" fill="${c.detail}"/>`,
    );
  }
  const label = kind.includes("GaN") ? ["65W", "GaN"] : ["20W", "USB-C"];
  return svg(
    `<rect x="140" y="30" width="12" height="50" rx="3" fill="#9ca3af"/><rect x="168" y="30" width="12" height="50" rx="3" fill="#9ca3af"/>` +
      `<rect x="90" y="76" width="140" height="190" rx="26" fill="${c.fill}" stroke="${c.stroke}" stroke-width="5"/>` +
      `<rect x="140" y="236" width="40" height="12" rx="6" fill="${c.stroke}"/>` +
      text(160, 160, 30, c.detail, label[0]) +
      text(160, 192, 18, c.detail, label[1]),
  );
}

function cableSvg(kind: string, c: (typeof COLOURS)[string]): string {
  const braided = kind.includes("Braided");
  const tipEnd = kind.includes("Lightning") ? `<rect x="252" y="40" width="10" height="24" rx="2" fill="#d1d5db"/>` : `<rect x="250" y="40" width="16" height="22" rx="7" fill="#9ca3af"/>`;
  const tipStart = kind.includes("Magnetic")
    ? `<circle cx="66" cy="270" r="16" fill="#9ca3af" stroke="${c.stroke}" stroke-width="4"/>`
    : `<rect x="58" y="268" width="16" height="22" rx="7" fill="#9ca3af"/>`;
  return svg(
    `<path d="M66 250 C66 150 260 220 250 140 C240 70 120 120 140 80 C150 60 230 90 258 76" fill="none" stroke="${c.stroke}" stroke-width="14" stroke-linecap="round"/>` +
      `<path d="M66 250 C66 150 260 220 250 140 C240 70 120 120 140 80 C150 60 230 90 258 76" fill="none" stroke="${c.fill}" stroke-width="9" stroke-linecap="round"${braided ? ` stroke-dasharray="6 4"` : ""}/>` +
      `<rect x="50" y="232" width="32" height="40" rx="8" fill="${c.fill}" stroke="${c.stroke}" stroke-width="4"/>` +
      `<rect x="242" y="62" width="32" height="40" rx="8" fill="${c.fill}" stroke="${c.stroke}" stroke-width="4" transform="rotate(180 258 82)"/>` +
      tipStart +
      tipEnd,
  );
}

function audioSvg(kind: string, c: (typeof COLOURS)[string]): string {
  if (kind.includes("Headphones")) {
    const anc = kind.includes("ANC");
    return svg(
      `<path d="M70 190 C70 50 250 50 250 190" fill="none" stroke="${c.stroke}" stroke-width="22" stroke-linecap="round"/>` +
        `<path d="M70 190 C70 50 250 50 250 190" fill="none" stroke="${c.fill}" stroke-width="14" stroke-linecap="round"/>` +
        `<rect x="40" y="170" width="70" height="110" rx="30" fill="${c.fill}" stroke="${c.stroke}" stroke-width="5"/>` +
        `<rect x="210" y="170" width="70" height="110" rx="30" fill="${c.fill}" stroke="${c.stroke}" stroke-width="5"/>` +
        (anc ? text(75, 232, 16, c.detail, "ANC") : `<circle cx="245" cy="225" r="8" fill="${c.detail}"/>`),
    );
  }
  const sport = kind.includes("Sport");
  const bud = (x: number) =>
    `<ellipse cx="${x}" cy="110" rx="34" ry="38" fill="${c.fill}" stroke="${c.stroke}" stroke-width="5"/>` +
    `<rect x="${x - 10}" y="140" width="20" height="60" rx="10" fill="${c.fill}" stroke="${c.stroke}" stroke-width="5"/>` +
    (sport ? `<path d="M${x - 30} 90 C${x - 60} 30 ${x + 60} 20 ${x + 32} 92" fill="none" stroke="${c.stroke}" stroke-width="8" stroke-linecap="round"/>` : "");
  return svg(
    `<rect x="80" y="200" width="160" height="96" rx="40" fill="${c.fill}" stroke="${c.stroke}" stroke-width="5"/>` +
      `<line x1="84" y1="236" x2="236" y2="236" stroke="${c.stroke}" stroke-width="3"/>` +
      `<circle cx="160" cy="266" r="5" fill="${c.detail}"/>` +
      bud(115) +
      bud(205),
  );
}

/** Splits an accessory name into its image key: kind (+ colour where the kind has colour variants). */
function accessoryImage(name: string, category: string): { key: string; content: string; label: string } {
  if (category === "case" || category === "screen_protector") {
    const kind = name.match(/(Clear|Slim|Rugged|Wallet) Case|Anti-Glare Film|Full Cover Glass|Privacy Glass|Tempered Glass/)?.[0];
    if (!kind) throw new Error(`Unknown ${category}: ${name}`);
    return { key: slug(kind), content: category === "case" ? caseSvg(kind) : protectorSvg(kind), label: kind.toLowerCase() };
  }
  const colour = name.split(" ").at(-1)!;
  const c = COLOURS[colour];
  if (!c) throw new Error(`Unknown colour in ${name}`);
  const kind = name
    .replace(/^.*?(\d+W |Wireless |USB-C |Magnetic |Braided |3-in-1 |ANC |Bluetooth |Sport )/, "$1")
    .replace(/ \d+(\.\d+)?m\b/, "")
    .replace(` ${colour}`, "");
  const draw = category === "charger" ? chargerSvg : category === "cable" ? cableSvg : audioSvg;
  return { key: `${slug(kind)}-${colour.toLowerCase()}`, content: draw(kind, c), label: `${colour.toLowerCase()} ${kind}` };
}

type CommonsInfo = { thumbUrl: string; pageUrl: string; artist: string; licence: string; licenceUrl: string };

async function commonsInfo(file: string): Promise<CommonsInfo> {
  const url = new URL("https://commons.wikimedia.org/w/api.php");
  url.search = new URLSearchParams({
    action: "query", titles: file, prop: "imageinfo", iiprop: "url|extmetadata", iiurlwidth: "1000", format: "json",
  }).toString();
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) throw new Error(`Commons API ${res.status} for ${file}`);
  type ImageInfo = { thumburl: string; descriptionurl: string; extmetadata: Record<string, { value?: string } | undefined> };
  const page = Object.values((await res.json()).query.pages)[0] as { imageinfo?: ImageInfo[] };
  const info = page.imageinfo?.[0];
  if (!info) throw new Error(`Commons file not found: ${file}`);
  const meta = info.extmetadata;
  return {
    thumbUrl: info.thumburl,
    pageUrl: info.descriptionurl,
    artist: String(meta.Artist?.value ?? "unknown").replace(/<[^>]+>/g, "").trim(),
    licence: meta.LicenseShortName?.value ?? "unknown",
    licenceUrl: meta.LicenseUrl?.value ?? "",
  };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function buildPhoto(model: string, { file, crop }: (typeof PHOTOS)[string]) {
  const info = await commonsInfo(file);
  await sleep(2000);
  const res = await fetch(info.thumbUrl, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) throw new Error(`Download ${res.status} for ${file}`);
  let image = sharp(Buffer.from(await res.arrayBuffer()));
  if (crop) {
    const { width = 0, height = 0 } = await image.metadata();
    const [l, t, w, h] = crop;
    image = sharp(
      await image
        .extract({ left: Math.round(l * width), top: Math.round(t * height), width: Math.round(w * width), height: Math.round(h * height) })
        .toBuffer(),
    );
  }
  const name = `${slug(model)}.webp`;
  await image
    .flatten({ background: "#ffffff" })
    .resize(SIZE, SIZE, { fit: "contain", background: "#ffffff" })
    .webp({ quality: 72, effort: 6 })
    .toFile(path.join(outDir, "phones", name));
  await sleep(2000);
  return { name, info };
}

const csv = await readFile(path.join(repoRoot, "docs", "products-seed.csv"), "utf8");
const products = csv
  .split(/\r?\n/)
  .slice(1)
  .filter((l) => l.trim())
  .map((l) => {
    const [name, category] = l.split(",");
    return { name, category };
  });

await rm(outDir, { recursive: true, force: true });
await mkdir(path.join(outDir, "phones"), { recursive: true });
await mkdir(path.join(outDir, "accessories"), { recursive: true });

const attribution: string[] = [];
const phoneUrls = new Map<string, { url: string; alt: string }>();
for (const [model, photo] of Object.entries(PHOTOS)) {
  const { name, info } = await buildPhoto(model, photo);
  phoneUrls.set(model, { url: `/products/phones/${name}`, alt: `Photo of the ${model}` });
  attribution.push(
    `| \`phones/${name}\` | [${file(photo.file)}](${info.pageUrl}) | ${info.artist} | [${info.licence}](${info.licenceUrl}) | ${photo.crop ? "cropped, " : ""}resized to ${SIZE}px, converted to WebP |`,
  );
  console.log(`photo  ${name}`);
}
for (const [model, colours] of Object.entries(DRAWN_PHONES)) {
  const name = `${slug(model)}.svg`;
  await writeFile(path.join(outDir, "phones", name), drawnPhone(model, colours));
  phoneUrls.set(model, { url: `/products/phones/${name}`, alt: `Illustration of the ${model}` });
  console.log(`drawn  ${name}`);
}

const manifest = ["name,url,alt_text"];
const written = new Set<string>();
for (const { name, category } of products) {
  if (category === "smartphone") {
    const model = name.replace(/\s+\d+GB$/, "");
    const image = phoneUrls.get(model);
    if (!image) throw new Error(`No image for phone model ${model}`);
    manifest.push(`${name},${image.url},${image.alt}`);
    continue;
  }
  const { key, content, label } = accessoryImage(name, category);
  if (!written.has(key)) {
    await writeFile(path.join(outDir, "accessories", `${key}.svg`), content);
    written.add(key);
  }
  manifest.push(`${name},/products/accessories/${key}.svg,Illustration of a ${label}`);
}

await writeFile(path.join(repoRoot, "docs", "product-images.csv"), manifest.join("\n") + "\n");
await writeFile(
  path.join(outDir, "ATTRIBUTION.md"),
  `# Product image credits

Generated by \`frontend/scripts/build-product-images.ts\` (\`npm run images:build\`).

## Photos (Wikimedia Commons)

The photos below are third-party works reused under their free licences and modified as noted.
They show the phone model, not necessarily the exact colour or storage variant sold.

| File | Source | Author | Licence | Changes |
| --- | --- | --- | --- | --- |
${attribution.join("\n")}

## Illustrations

All other files (\`phones/*.svg\`, \`accessories/*.svg\`) are simple drawings created for this project.
They are not product photos and do not use manufacturer artwork.
`,
);
console.log(`${products.length} products mapped, ${written.size} accessory drawings, manifest docs/product-images.csv`);

function file(title: string) {
  return title.replace(/^File:/, "");
}
