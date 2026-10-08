import { en } from "@/i18n/en";

export function Navbar({ onHome }: { onHome?: () => void }) {
  return (
    <nav className="relative mx-auto flex w-full max-w-[1440px] items-center gap-7 px-4 py-4 sm:px-12 sm:py-[18px]">
      <button type="button" onClick={onHome} className="mr-auto flex items-center gap-2.5 text-parchment hover:text-parchment">
        <span className="grid h-7 w-7 place-items-center rounded-sm bg-linear-135 from-accent to-accent-deep">
          <span className="block h-2.5 w-2.5 rotate-45 rounded-[2px] bg-ink" />
        </span>
        <span className="font-display text-xl font-semibold tracking-[.01em]">{en.app.name}</span>
      </button>
      <button type="button" onClick={onHome} className="text-sm font-medium text-parchment hover:text-accent">{en.nav.newDeck}</button>
      <a href="#about" className="text-sm font-medium text-muted hover:text-accent">{en.nav.about}</a>
    </nav>
  );
}
