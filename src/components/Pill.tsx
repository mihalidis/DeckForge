import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "ghost" | "solid" | "soft"; size?: "sm" | "md" };

/** Pill (999px) button — the design's primary action shape. */
export function Pill({ variant = "ghost", size = "sm", className = "", ...rest }: Props) {
  const base = "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";
  const sizes = size === "sm" ? "px-3.5 py-[7px] text-[13px]" : "px-[22px] py-[11px] text-[15px] font-bold";
  const variants = {
    ghost: "border border-line bg-transparent text-parchment hover:border-accent hover:text-accent",
    solid: "border-0 bg-accent text-ink hover:bg-accent-hover active:bg-accent-mid",
    soft: "border-0 text-accent hover:bg-accent hover:text-ink",
  }[variant];
  const softBg = variant === "soft" ? { background: "color-mix(in srgb, var(--color-accent) 14%, transparent)" } : undefined;
  return <button type="button" className={`${base} ${sizes} ${variants} ${className}`} style={softBg} {...rest} />;
}
