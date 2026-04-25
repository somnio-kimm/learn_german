# Data Schema

Every entry in `data/augment/parts/<pos>/*.json` and the generated
`web/data/cefr-<level>/<pos>.json` files shares an envelope and adds
POS-specific fields. The envelope and POS contracts are versioned
via the top-level `schema_version` in `web/data/index.json`.

## Shared envelope

| Field            | Type                                  | Notes                                                                                  |
| ---------------- | ------------------------------------- | -------------------------------------------------------------------------------------- |
| `lemma`          | string                                | Citation form, German orthography. Nouns are capitalized.                              |
| `pos`            | `"noun" \| "verb" \| "adjective" \| "functional"` | Drives which extra fields are required.                                    |
| `cefr`           | `"A1" \| "A2" \| "B1" \| "B2" \| "C1" \| "C2"` | Level bucket for filtering / lazy loading.                                |
| `meaning_en`     | string[]                              | Short English glosses, one or more.                                                    |
| `examples`       | `{ de: string, en: string }[]`        | Optional; recommended at least one.                                                    |
| `frequency_rank` | number \| null                        | Lower = more frequent. Used to weight spaced-repetition scheduling.                    |
| `notes`          | string \| null                        | Free-form note (false friends, register, etc.).                                        |
| `source`         | string                                | Provenance tag (e.g. `goethe-a1`, `wiktionary`, `manual-augment`).                     |

## POS-specific fields

### `pos: "noun"`

| Field          | Type                                                                                  | Notes                                                                |
| -------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `article`      | `"der" \| "die" \| "das"`                                                             | Definite article in nominative singular.                             |
| `gender`       | `"masculine" \| "feminine" \| "neuter"`                                               | Redundant with `article` but explicit for filtering and color cues.  |
| `plural`       | string \| null                                                                        | Nominative plural; `null` for *Singularetantum*.                     |
| `declension`   | `{ nom: [sg, pl], acc: [sg, pl], dat: [sg, pl], gen: [sg, pl] }`                      | Forms include the article (`das Haus`, `dem Haus(e)`).               |

### `pos: "verb"`

| Field              | Type                                                                                            | Notes                                                                                |
| ------------------ | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `infinitive`       | string                                                                                          | Same as `lemma` for verbs.                                                           |
| `class`            | `"strong" \| "weak" \| "mixed" \| "modal" \| "separable" \| "irregular"`                        | Drives conjugator strategy.                                                          |
| `separable_prefix` | string \| null                                                                                  | e.g. `"ab"` for `abfahren`.                                                          |
| `auxiliary`        | `"haben" \| "sein"`                                                                             | For Perfekt construction.                                                            |
| `stems`            | `{ present: string, preterite: string, participle: string }`                                    | Used by the conjugator and the conjugation-drill view.                               |
| `forms`            | `{ praesens: PersonForms, praeteritum: PersonForms, perfekt: string, konjunktiv_ii: PersonForms }` | `PersonForms = { ich, du, er, wir, ihr, sie }`. `perfekt` is the canonical 3rd-sg. |

### `pos: "adjective"`

| Field               | Type            | Notes                                              |
| ------------------- | --------------- | -------------------------------------------------- |
| `comparative`       | string \| null  | e.g. `"größer"`. `null` if not gradable.           |
| `superlative`       | string \| null  | e.g. `"am größten"`.                               |
| `predicative_only`  | boolean         | `true` for `egal`, `schade`, etc.                  |
| `declension_notes`  | string \| null  | Free-form note about strong/mixed/weak endings.    |

### `pos: "functional"`

| Field      | Type                                                                                                | Notes                                                          |
| ---------- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `subtype`  | `"pronoun" \| "preposition" \| "article" \| "conjunction" \| "particle" \| "adverb"`                | Discriminator for views that handle pronouns vs prepositions.  |
| `case`     | `("nom" \| "acc" \| "dat" \| "gen")[]` \| null                                                      | For prepositions: cases governed (`["dat", "acc"]` for *in*).  |
| `governs`  | string \| null                                                                                      | For subordinating conjunctions: usage hint.                    |

## Augment files

Files under `data/augment/parts/<pos>/*.json` are the **manual source of truth**. The
build pipeline reads these, applies the weak-verb conjugator stub for entries
that omit `forms`, and emits sharded JSON under `web/data/cefr-<level>/<pos>.json`.

Each augment file is a JSON array of entries.

## Index manifest

`web/data/index.json` is generated by `sync-web-data.mjs`:

```jsonc
{
  "schema_version": 1,
  "generated_at": "2026-04-25T00:00:00Z",
  "levels": {
    "A1": { "nouns": 0, "verbs": 0, "adjectives": 0, "functional": 0 },
    "A2": { "nouns": 0, "verbs": 0, "adjectives": 0, "functional": 0 }
  }
}
```

Clients read `index.json` first to decide which `cefr-<level>/<pos>.json` to fetch.
