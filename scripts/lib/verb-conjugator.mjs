// Tiny weak-verb conjugator. Handles regular -en weak verbs only.
// Strong, mixed, modal, and irregular verbs must supply `forms` manually
// in their augment JSON; we warn (in merge-augment) when a weak-or-unknown
// verb is missing forms.
//
// This is a stub — it does not handle:
//   - separable prefixes (e.g. abfahren)
//   - stems ending in -d/-t (which take Bindungs-e: arbeitest, not arbeitst)
//   - stems ending in -s/-ß/-x/-z (du-form contraction)
//   - any vowel change
//
// When you need those cases, add them to the augment JSON or extend this
// module under its own feat PR.

const PERSON_KEYS = ["ich", "du", "er", "wir", "ihr", "sie"];

function presentEndings(stem) {
  return {
    ich: stem + "e",
    du: stem + "st",
    er: stem + "t",
    wir: stem + "en",
    ihr: stem + "t",
    sie: stem + "en",
  };
}

function preteriteEndings(stem) {
  // Weak: stem + te + person ending
  const base = stem + "te";
  return {
    ich: base,
    du: base + "st",
    er: base,
    wir: base + "n",
    ihr: base + "t",
    sie: base + "n",
  };
}

export function conjugateWeakVerb(infinitive) {
  if (!/en$/.test(infinitive)) {
    throw new Error(`conjugateWeakVerb: ${infinitive} does not end in -en`);
  }
  const stem = infinitive.replace(/en$/, "");
  return {
    praesens: presentEndings(stem),
    praeteritum: preteriteEndings(stem),
    perfekt: `hat ge${stem}t`,
    konjunktiv_ii: preteriteEndings(stem),
  };
}

export const _PERSON_KEYS = PERSON_KEYS;
