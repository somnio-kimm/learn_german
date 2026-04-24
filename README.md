# learn_german

Web-first CEFR-leveled German vocabulary app. A single `web/` codebase ships to:

- **Web / PWA**
- **iOS** (Capacitor wrapper)
- **Android** (Capacitor wrapper)

## Layout

```text
.
├── web/                      # The PWA (static assets)
│   ├── data/                 # Runtime word data, sharded by CEFR level × part-of-speech
│   │   ├── cefr-a1/{nouns,verbs,adjectives,functional}.json
│   │   ├── cefr-a2/ … cefr-c2/
│   │   └── index.json        # counts + manifest for lazy loading
│   └── views/                # flashcard / gender-drill / conjugation-drill / case-drill
├── data/                     # Augment source (edits, overrides, example sentences)
│   ├── augment.json
│   └── augment/parts/{nouns,verbs,adjectives,functional}/
├── scripts/                  # Data build pipeline
│   ├── build-cefr-data.mjs   # seed → per-level/per-POS JSON
│   ├── merge-augment.mjs     # overlay data/augment
│   ├── sync-web-data.mjs     # copy to web/data/
│   └── lib/                  # verb-conjugator stub, noun-declension helpers
├── mobile/                   # Capacitor wrapper
│   ├── ios/                  # generated locally via `npx cap add ios`
│   └── android/              # generated locally via `npx cap add android`
└── package.json              # npm scripts (build:cefr, merge:augment, sync:web-data, mobile:sync)
```

## Data model

Every entry has a shared envelope (`lemma`, `pos`, `cefr`, `meaning_en`, `examples`, …) plus POS-specific fields:

- **Noun**: `article` (der/die/das), `plural`, `declension` (N/A/D/G × sg/pl).
- **Verb**: `class` (strong/weak/mixed/modal/separable), `auxiliary` (sein/haben), `stems`, `forms` (Präsens/Präteritum/Perfekt/Konjunktiv II).
- **Adjective**: `comparative`, `superlative`, `predicative_only`.
- **Functional** (pronoun/preposition/article/conjunction/particle/adverb): `subtype`, `case`, `governs`.

See `data/schema.md` for the full schema.

## Data workflow

The web runtime loads `web/data/cefr-{level}/{pos}.json`. `npm run build:cefr` reads local seed files in `data/augment/parts/` and writes into `web/data/`.

```bash
npm run build:cefr:web
```

## Mobile workflow

```bash
cd mobile
npm install
npx cap add ios       # first time only
npx cap add android   # first time only
npm run sync
npm run open:ios
npm run open:android
```

## Conventions

See [REVIEW.md](REVIEW.md) for branch, commit, and PR conventions, and [CONTRIBUTING.md](CONTRIBUTING.md) for the dev loop.
