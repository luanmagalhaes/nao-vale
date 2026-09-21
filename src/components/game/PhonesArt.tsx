function Celular({
  rotulo,
  cor,
  giro,
}: {
  rotulo: string;
  cor: string;
  giro: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1" style={{ transform: `rotate(${giro})` }}>
      <div className="bg-tinta traco rounded-xl p-1 shadow-[3px_3px_0_rgba(0,0,0,0.35)]">
        <div className="bg-creme flex h-20 w-14 flex-col gap-1 rounded-lg p-1">
          <div className="bg-ceu traco-fino flex h-5 items-center justify-center rounded">
            <span className="font-display text-creme text-[7px] uppercase">
              praia
            </span>
          </div>
          <div className="border-fogo bg-banana h-2 rounded-sm border-2" />
          <div className="border-fogo bg-banana h-2 rounded-sm border-2" />
          <div className="border-fogo bg-banana h-2 rounded-sm border-2" />
          <div className="border-fogo bg-banana h-2 rounded-sm border-2" />
        </div>
      </div>
      <span
        className={`font-display traco-fino rounded-md px-1.5 py-0.5 text-[9px] uppercase leading-none ${cor}`}
      >
        {rotulo}
      </span>
    </div>
  );
}

export function PhonesArt() {
  return (
    <div className="flex items-start justify-center gap-2">
      <Celular
        rotulo="quem explica"
        cor="bg-time-vermelho text-creme"
        giro="-6deg"
      />
      <span className="font-display text-creme mt-7 text-3xl leading-none">
        =
      </span>
      <Celular rotulo="o juiz" cor="bg-time-azul text-creme" giro="6deg" />
    </div>
  );
}
