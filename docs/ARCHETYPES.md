# Arketip rehberi (LLM sistem prompt'una özet olarak girer)

Meta/winrate verisi resmi API'de yok; bu dosya **sınıf kimliği + arketip tanımı** verir, güncel kart adları vermez (kartlar her sette değişir, LLM onları aday listesinden okur). Yeni genişlemede bu dosya değişmez; sınıf kimliği değişirse (yeni mekanik) tek satır eklenir.

## Arketipler

- **Aggro** — 1–3 maliyetli 12+ kart, 5+ maliyette en fazla 2–3 kart. Hedef: 6–8. turda bitirmek. Removal az, burn/face hasarı ve board buff çok. Mulligan: 1–2 drop'lar.
- **Midrange** — 1–6 düzgün eğri, board kontrolünü alıp tempoyla kazanır. Hem erken minyon hem birkaç güçlü mid-game kart.
- **Control** — Removal, board clear, heal/armor, kart çekme; 2–4 geç oyun finisher. 7+ maliyet 3–5 kart olabilir. Mulligan: erken removal.
- **Combo / OTK** — Belirli kart kombinasyonuyla kazanır; deste kart çekme + hayatta kalma + combo parçaları. Seed kart genelde combonun merkezidir.

## Sınıf kimlikleri

| Sınıf | Güçlü yönler | Tipik tribe / mekanik |
|---|---|---|
| Death Knight | Corpse ekonomisi, rune'a göre kimlik: Blood (heal/removal/control), Frost (burn/spell/freeze), Unholy (undead board/aggro) | Undead; en fazla 3 rune |
| Demon Hunter | Hızlı tempo, kahraman saldırısı, Outcast, ucuz büyüler | Demon, Naga |
| Druid | Mana ramp, Choose One, büyük minyonlar, token/board | Beast, Dragon, Treant |
| Hunter | Face hasarı, Beast sinerjisi, Secret, silah | Beast |
| Mage | Büyü hasarı, Freeze, Secret, Elemental, Discover | Elemental, spell school |
| Paladin | Buff (handbuff/board), Divine Shield, silah, Murloc/Mech | Murloc, Mech, Dragon |
| Priest | Heal, kopyalama/çalma, Dragon, Undead, control | Dragon, Undead, Naga |
| Rogue | Combo, silah, Pirate, Stealth, ucuz kartlar, Miracle | Pirate, Mech |
| Shaman | Overload, Elemental, Totem, Battlecry (Shudderwock), Nature büyüleri | Elemental, Totem, Murloc |
| Warlock | Kart çekme (Life Tap), Demon, Discard, Zoo, kendine hasar | Demon, Imp |
| Warrior | Armor, silah, Taunt, Rush, Pirate, Enrage | Pirate, Mech, Dragon |

Pipeline bu tabloyu doğrudan kullanmıyor; `build.ts` sistem prompt'u arketip kurallarını kısa biçimde içeriyor. Tablo, prompt'u güncellerken ve eval sonuçlarını yorumlarken referans.
