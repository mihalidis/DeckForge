import { en } from "@/i18n/en";

const icons = [
  <span key="a" className="block h-2.5 w-2.5 rounded-full bg-arcane" />,
  <span key="b" className="block h-2.5 w-2.5 rotate-45 rounded-[2px] bg-arcane" />,
  <span key="c" className="block h-2 w-3 rounded-[2px] border-2 border-arcane" />,
];

export function FeatureCards() {
  return (
    <div className="mt-10 grid gap-3.5 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
      {en.landing.features.map((f, i) => (
        <div key={f.title} className="flex flex-col gap-2 rounded-xl border border-hair bg-glass p-[22px]">
          <span className="grid h-[34px] w-[34px] place-items-center rounded-md border" style={{ background: "color-mix(in srgb, var(--color-arcane) 12%, transparent)", borderColor: "color-mix(in srgb, var(--color-arcane) 30%, transparent)" }}>
            {icons[i]}
          </span>
          <div className="mt-1.5 font-display text-xl font-medium">{f.title}</div>
          <div className="text-sm text-muted text-pretty">{f.body}</div>
        </div>
      ))}
    </div>
  );
}
