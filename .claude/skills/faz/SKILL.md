---
name: faz
description: docs/ROADMAP.md'den sıradaki tamamlanmamış maddeyi seçip uygular, test eder ve işaretler. "sıradaki faz", "devam et", "/faz" denince kullan.
---

# Faz ilerletme

1. `docs/ROADMAP.md`'yi oku. İlk `[ ]` maddenin bulunduğu fazı ve maddeyi belirle. Kullanıcı belirli bir madde söylediyse onu al.
2. Maddeyi uygulamadan önce bağımlı dosyaları oku (`CLAUDE.md` yapı bölümü, ilgili `src/lib/*` dosyaları, `docs/API-NOTLARI.md` gerekiyorsa).
3. Küçük ve çalışır adımlarla uygula. Doğrulayıcı (`src/lib/deck/validate.ts`) veya deckstring koduna dokunuyorsan önce test yaz.
4. Doğrula: `npx tsc --noEmit`, ilgili `npx vitest` dosyası; UI işiyse `npm run dev` ve ekran görüntüsü.
5. Bitince:
   - `docs/ROADMAP.md`'de maddeyi `[x]` yap.
   - Kullanıcıya görünen bir değişiklikse `CHANGELOG.md` → `[Yayımlanmamış]`'a tek satır ekle.
   - Fazın tüm maddeleri bittiyse "Bitti kriteri"ni tek tek kontrol et ve sonucu kullanıcıya raporla.
6. Bir sonraki maddeyi tek cümleyle söyle, başlamadan onay bekle.

Kurallar: Faz sırasını atlama (Faz 3 UI işi, Faz 2 pipeline bitmeden başlamaz). Kapsam dışı (Wild, auth, TR) istek gelirse ROADMAP'in "Sonraki fazlar" bölümüne not düş, şimdi yapma.
