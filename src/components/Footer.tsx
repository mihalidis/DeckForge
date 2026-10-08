import { en } from "@/i18n/en";

export function Footer() {
  return (
    <footer id="about" className="mx-auto w-full max-w-[1440px] px-4 pb-8 pt-10 text-xs text-subtle sm:px-12">
      <p className="max-w-[720px] text-pretty">{en.footer.disclaimer}</p>
    </footer>
  );
}
