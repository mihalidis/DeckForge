/** Altıgen mana kristali (tasarımdaki clip-path). */
export function ManaGem({ cost, size = 28 }: { cost: number; size?: number }) {
  return (
    <span
      className="grid flex-none place-items-center text-[13px] font-bold tabular-nums text-white"
      style={{
        width: size,
        height: size,
        background: "linear-gradient(160deg, var(--color-mana), var(--color-mana-deep))",
        clipPath: "polygon(50% 0, 95% 28%, 95% 72%, 50% 100%, 5% 72%, 5% 28%)",
        fontSize: size <= 26 ? 12 : 13,
      }}
    >
      {cost}
    </span>
  );
}
