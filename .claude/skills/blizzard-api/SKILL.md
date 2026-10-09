---
name: blizzard-api
description: Getting a token from the Blizzard Hearthstone Game Data API, searching cards, making requests to the metadata and deck endpoints, debugging. Use for Blizzard/Battle.net API, card data and sync issues.
---

# Blizzard Hearthstone API

Reference: `docs/API-NOTES.md`. Code: `src/lib/blizzard/`.

## Quick test (curl)

```bash
# read from .env.local
set -a; source .env.local; set +a
TOKEN=$(curl -s -u "$BLIZZARD_CLIENT_ID:$BLIZZARD_CLIENT_SECRET" -d grant_type=client_credentials https://oauth.battle.net/token | jq -r .access_token)
curl -s "https://eu.api.blizzard.com/hearthstone/cards?locale=en_US&set=standard&collectible=1&class=shaman,neutral&pageSize=5&textFilter=shudderwock" -H "Authorization: Bearer $TOKEN" | jq '.cards[] | {id,name,manaCost,classId,cardSetId}'
curl -s "https://eu.api.blizzard.com/hearthstone/metadata/setGroups?locale=en_US" -H "Authorization: Bearer $TOKEN" | jq '.[] | select(.slug=="standard")'
curl -s "https://eu.api.blizzard.com/hearthstone/deck?locale=en_US&code=$DECKCODE" -H "Authorization: Bearer $TOKEN" | jq '{class:.class.slug, count:.cardCount, cards:[.cards[].name]}'
```

## Rules

- In code, always use `src/lib/blizzard/client.ts`; don't call `fetch` directly.
- `auth.ts` caches the token; on a 401, refresh once and retry. On a 429, respect `Retry-After`.
- When fetching the whole card pool, use `pageSize=500` and walk `page` up to `pageCount`; `set=standard&collectible=1&gameMode=constructed`.
- `card.id` = dbfId. This is what the deckstring uses.
- The Standard set list, class list and hero ids are read **from metadata**; never hard-coded.
- Locale `en_US`; there is no Turkish locale.

## Common problems

- `403 Forbidden`: token missing/expired or the client secret was rotated. Get a new token.
- `/cards` does not return hero cards (known behavior); use `metadata/classes[].cardId` for the hero.
- A new set is out but its cards aren't showing up: the Blizzard API can take hours/days to update after a patch; run `sync:cards` again and, if needed, cross-check against HearthstoneJSON.
- The game doesn't recognize the deck code but Blizzard `/deck` validates it: the deck contains cards from an **upcoming set** (`metadata.sets[].hyped === true`); sync excludes these, verify against HearthstoneJSON with `npm run check:ids`.
- Fewer cards than expected returned with `set=standard`: check that `collectible=1` and `gameMode=constructed` were passed together.
