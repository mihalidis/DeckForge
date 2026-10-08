# design/

Claude Design çıktısı buraya gelir; kod **buradan okunur, buraya yazılmaz**.

- `export/` — Design → Export → Code ile indirilen HTML/CSS/JS (zip açılmış hali). Referans; doğrudan `app/` içine kopyalanmaz, Next.js bileşenlerine çevrilir.
- `screens/` — Her ekranın PNG'si (`01-landing.png`, `02-generating.png`, `03-deck-result.png`, `04-refine.png`, `05-errors.png`, `06-mobile-*.png`).
- `tokens.md` — prototipten çıkarılan renk/font/radius/spacing token'ları (Faz 3'te `tailwind.config` kaynağı). `export/_ds/organic-*` Design'ın varsayılan iskeletidir, kullanılmaz.
- `screens.md` — ekran → route → bileşen eşlemesi.

Tasarım değişirse: export'u yeniden indir, `tokens.md`'yi güncelle, farkı `CHANGELOG.md`'ye yaz.
