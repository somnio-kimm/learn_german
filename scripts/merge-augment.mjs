#!/usr/bin/env node
// Reads data/_built/cefr-<level>/<pos>.json and applies any per-entry overrides
// from data/augment.json into a final data/_merged/ tree. Overrides are matched
// by lemma+pos.
//
// For verbs, if `forms` is missing and `class === "weak"`, the weak-verb
// conjugator stub fills it in. Other classes must supply forms manually.

import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { conjugateWeakVerb } from "./lib/verb-conjugator.mjs";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const BUILT = join(ROOT, "data", "_built");
const OUT = join(ROOT, "data", "_merged");
const AUGMENT_FILE = join(ROOT, "data", "augment.json");

async function loadAugmentOverrides() {
  try {
    const raw = await readFile(AUGMENT_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.overrides) ? parsed.overrides : [];
  } catch {
    return [];
  }
}

function applyOverride(entry, override) {
  return { ...entry, ...override };
}

function fillMissingVerbForms(entry) {
  if (entry.pos !== "verb") return entry;
  if (entry.forms) return entry;
  if (entry.class !== "weak") {
    console.warn(
      `${entry.lemma}: missing forms and class is "${entry.class}"; supply manually.`,
    );
    return entry;
  }
  return { ...entry, forms: conjugateWeakVerb(entry.infinitive ?? entry.lemma) };
}

async function main() {
  const overrides = await loadAugmentOverrides();
  const overrideIndex = new Map(
    overrides.map((o) => [`${o.pos}:${o.lemma}`, o]),
  );

  let levelDirs;
  try {
    levelDirs = await readdir(BUILT);
  } catch {
    console.error(`no built tree at ${BUILT}; run build:cefr first.`);
    process.exit(1);
  }

  for (const levelDir of levelDirs) {
    const inDir = join(BUILT, levelDir);
    const outDir = join(OUT, levelDir);
    await mkdir(outDir, { recursive: true });

    const files = await readdir(inDir);
    for (const file of files) {
      if (!file.endsWith(".json")) continue;
      const raw = await readFile(join(inDir, file), "utf8");
      const items = JSON.parse(raw);

      const merged = items.map((entry) => {
        const key = `${entry.pos}:${entry.lemma}`;
        const overridden = overrideIndex.has(key)
          ? applyOverride(entry, overrideIndex.get(key))
          : entry;
        return fillMissingVerbForms(overridden);
      });

      await writeFile(join(outDir, file), JSON.stringify(merged, null, 2) + "\n");
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
