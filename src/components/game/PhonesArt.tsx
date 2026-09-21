function Phone({
  label,
  cor,
  tilt,
}: {
  label: string;
  cor: string;
  tilt: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1" style={{ transform: `rotate(${tilt})` }}>
      <div className="bg-ink stroke-hard rounded-xl p-1 shadow-[3px_3px_0_rgba(0,0,0,0.35)]">
        <div className="bg-cream flex h-20 w-14 flex-col gap-1 rounded-lg p-1">
          <div className="bg-sky stroke-thin flex h-5 items-center justify-center rounded">
            <span className="font-display text-cream text-[7px] uppercase">
              praia
            </span>
          </div>
          <div className="border-fire bg-yellow h-2 rounded-sm border-2" />
          <div className="border-fire bg-yellow h-2 rounded-sm border-2" />
          <div className="border-fire bg-yellow h-2 rounded-sm border-2" />
          <div className="border-fire bg-yellow h-2 rounded-sm border-2" />
        </div>
      </div>
      <span
        className={`font-display stroke-thin rounded-md px-1.5 py-0.5 text-[9px] uppercase leading-none ${cor}`}
      >
        {label}
      </span>
    </div>
  );
}

export function PhonesArt() {
  return (
    <div className="flex items-start justify-center gap-2">
      <Phone
        label="quem explica"
        cor="bg-team-red text-cream"
        tilt="-6deg"
      />
      <span className="font-display text-cream mt-7 text-3xl leading-none">
        =
      </span>
      <Phone label="o juiz" cor="bg-team-blue text-cream" tilt="6deg" />
    </div>
  );
}
