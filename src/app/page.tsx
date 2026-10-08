export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col px-12 pb-20">
      <section className="mx-auto mt-[72px] flex max-w-[860px] flex-col gap-9">
        <div className="flex flex-col gap-3.5">
          <div className="text-xs font-semibold uppercase tracking-[.14em] text-muted">
            AI deck builder for Hearthstone
          </div>
          <h1 className="font-display text-[64px] font-medium leading-[1.05] tracking-[-.01em] text-balance">
            Describe the deck. <em className="italic text-accent">We forge it.</em>
          </h1>
          <p className="max-w-[560px] text-lg text-muted text-pretty">
            Type what you want to play. You get a legal 30-card Standard deck and a
            code that pastes straight into the game.
          </p>
        </div>
        <p className="text-sm text-subtle">
          Faz 0 iskeleti — tasarım token&apos;ları yüklü. Prompt kutusu Faz 3&apos;te gelecek.
        </p>
      </section>
    </main>
  );
}
