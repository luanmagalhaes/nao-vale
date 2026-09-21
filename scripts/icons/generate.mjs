import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const aqui = dirname(fileURLToPath(import.meta.url));
const raiz = join(aqui, "..", "..");
const publico = join(raiz, "public");
const app = join(raiz, "src", "app");

const base = await readFile(join(app, "icon.svg"));
const maskable = await readFile(join(aqui, "maskable.svg"));

await mkdir(publico, { recursive: true });

const saidas = [
  { origem: base, destino: join(publico, "icon-192.png"), tamanho: 192 },
  { origem: base, destino: join(publico, "icon-512.png"), tamanho: 512 },
  {
    origem: maskable,
    destino: join(publico, "icon-maskable-512.png"),
    tamanho: 512,
  },
  { origem: base, destino: join(app, "apple-icon.png"), tamanho: 180 },
];

for (const saida of saidas) {
  const png = await sharp(saida.origem)
    .resize(saida.tamanho, saida.tamanho)
    .png()
    .toBuffer();

  await writeFile(saida.destino, png);
  console.log(`gerado ${saida.destino}`);
}
