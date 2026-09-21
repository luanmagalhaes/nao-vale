import { mkdir, writeFile } from "node:fs/promises";

const rate = 22050;
const root = new URL("../../", import.meta.url);

function shape(wave, phase, semente) {
  if (wave === "sine") {
    return Math.sin(phase);
  }

  if (wave === "noise") {
    const x = Math.sin(semente * 12.9898) * 43758.5453;

    return (x - Math.floor(x)) * 2 - 1;
  }

  const ciclo = phase / (Math.PI * 2) - Math.floor(phase / (Math.PI * 2));

  if (wave === "triangle") {
    return 4 * Math.abs(ciclo - 0.5) - 1;
  }

  if (wave === "saw") {
    return ciclo * 2 - 1;
  }

  return ciclo < 0.5 ? 1 : -1;
}

function render(notas) {
  const segundos =
    Math.max(...notas.map((nota) => nota.at + nota.seconds)) + 0.12;
  const quadros = Math.ceil(segundos * rate);
  const amostras = new Float32Array(quadros);

  for (const nota of notas) {
    const inicio = Math.floor(nota.at * rate);
    const duracao = Math.floor(nota.seconds * rate);
    const ataque = Math.max(1, Math.floor((nota.attack ?? 0.008) * rate));
    const queda = nota.decay ?? 1.8;

    for (let indice = 0; indice < duracao; indice += 1) {
      const posicao = inicio + indice;

      if (posicao >= quadros) {
        break;
      }

      const progresso = indice / duracao;
      const hz = nota.to
        ? nota.hz + (nota.to - nota.hz) * progresso
        : nota.hz;
      const fase = (2 * Math.PI * hz * indice) / rate;
      const sobe = Math.min(1, indice / ataque);
      const desce = Math.pow(1 - progresso, queda);

      amostras[posicao] +=
        shape(nota.wave, fase, posicao) * nota.gain * sobe * desce;
    }
  }

  let pico = 0;

  for (const valor of amostras) {
    pico = Math.max(pico, Math.abs(valor));
  }

  const normal = pico > 0 ? 0.8 / pico : 1;
  const corpo = Buffer.alloc(quadros * 2);

  for (let indice = 0; indice < quadros; indice += 1) {
    const limitado = Math.max(-1, Math.min(1, amostras[indice] * normal));

    corpo.writeInt16LE(Math.round(limitado * 32767), indice * 2);
  }

  const cabecalho = Buffer.alloc(44);

  cabecalho.write("RIFF", 0);
  cabecalho.writeUInt32LE(36 + corpo.length, 4);
  cabecalho.write("WAVE", 8);
  cabecalho.write("fmt ", 12);
  cabecalho.writeUInt32LE(16, 16);
  cabecalho.writeUInt16LE(1, 20);
  cabecalho.writeUInt16LE(1, 22);
  cabecalho.writeUInt32LE(rate, 24);
  cabecalho.writeUInt32LE(rate * 2, 28);
  cabecalho.writeUInt16LE(2, 32);
  cabecalho.writeUInt16LE(16, 34);
  cabecalho.write("data", 36);
  cabecalho.writeUInt32LE(corpo.length, 40);

  return { buffer: Buffer.concat([cabecalho, corpo]), segundos };
}

const sons = {
  tap: [
    { hz: 880, at: 0, seconds: 0.05, wave: "square", gain: 0.16, decay: 3 },
  ],
  card: [
    {
      hz: 320,
      to: 1400,
      at: 0,
      seconds: 0.16,
      wave: "noise",
      gain: 0.3,
      decay: 2.2,
    },
    { hz: 660, at: 0.08, seconds: 0.1, wave: "triangle", gain: 0.16, decay: 2.4 },
  ],
  right: [
    { hz: 783.99, at: 0, seconds: 0.11, wave: "triangle", gain: 0.26 },
    { hz: 1046.5, at: 0.08, seconds: 0.13, wave: "triangle", gain: 0.26 },
    { hz: 1567.98, at: 0.17, seconds: 0.22, wave: "sine", gain: 0.22, decay: 2.2 },
  ],
  skip: [
    { hz: 520, at: 0, seconds: 0.09, wave: "triangle", gain: 0.2, decay: 2.6 },
    { hz: 392, at: 0.07, seconds: 0.12, wave: "triangle", gain: 0.18, decay: 2.6 },
  ],
  buzz: [
    { hz: 150, at: 0, seconds: 0.42, wave: "square", gain: 0.3, decay: 0.7 },
    { hz: 98, at: 0, seconds: 0.45, wave: "saw", gain: 0.26, decay: 0.7 },
    { hz: 220, at: 0.02, seconds: 0.3, wave: "noise", gain: 0.1, decay: 1.4 },
  ],
  tick: [
    { hz: 1200, at: 0, seconds: 0.035, wave: "square", gain: 0.14, decay: 4 },
  ],
  timeup: [
    { hz: 440, at: 0, seconds: 0.2, wave: "square", gain: 0.26, decay: 1.2 },
    { hz: 330, at: 0.22, seconds: 0.2, wave: "square", gain: 0.26, decay: 1.2 },
    { hz: 220, at: 0.44, seconds: 0.4, wave: "square", gain: 0.28, decay: 1 },
  ],
  draw: [
    { hz: 90, at: 0, seconds: 0.9, wave: "noise", gain: 0.16, decay: 0.4, attack: 0.3 },
    { hz: 523.25, at: 0.95, seconds: 0.12, wave: "triangle", gain: 0.24 },
    { hz: 659.25, at: 1.06, seconds: 0.12, wave: "triangle", gain: 0.24 },
    { hz: 783.99, at: 1.17, seconds: 0.12, wave: "triangle", gain: 0.24 },
    { hz: 1046.5, at: 1.28, seconds: 0.36, wave: "triangle", gain: 0.3, decay: 1.4 },
    { hz: 1318.51, at: 1.32, seconds: 0.3, wave: "sine", gain: 0.14, decay: 1.6 },
  ],
  win: [
    { hz: 523.25, at: 0, seconds: 0.14, wave: "triangle", gain: 0.24 },
    { hz: 659.25, at: 0.13, seconds: 0.14, wave: "triangle", gain: 0.24 },
    { hz: 783.99, at: 0.26, seconds: 0.14, wave: "triangle", gain: 0.24 },
    { hz: 1046.5, at: 0.39, seconds: 0.22, wave: "triangle", gain: 0.28 },
    { hz: 987.77, at: 0.62, seconds: 0.12, wave: "triangle", gain: 0.22 },
    { hz: 1046.5, at: 0.74, seconds: 0.12, wave: "triangle", gain: 0.22 },
    { hz: 1318.51, at: 0.86, seconds: 0.5, wave: "triangle", gain: 0.3, decay: 1.3 },
    { hz: 1567.98, at: 0.9, seconds: 0.46, wave: "sine", gain: 0.16, decay: 1.5 },
    { hz: 2093, at: 1, seconds: 0.36, wave: "sine", gain: 0.08, decay: 1.8 },
  ],
};

await mkdir(new URL("public/sounds/", root), { recursive: true });

for (const [nome, notas] of Object.entries(sons)) {
  const { buffer, segundos } = render(notas);

  await writeFile(new URL(`public/sounds/${nome}.wav`, root), buffer);

  console.log(
    `public/sounds/${nome}.wav — ${segundos.toFixed(2)}s — ${(buffer.length / 1024).toFixed(1)} kB`,
  );
}
