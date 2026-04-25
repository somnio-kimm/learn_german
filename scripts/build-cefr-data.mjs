#!/usr/bin/env node
// Reads data/augment/parts/<pos>/*.json (the manual source of truth) and
// writes a flat staging tree at data/_built/cefr-<level>/<pos>.json keyed
// only by lemma. merge-augment.mjs overlays additional augment data; the
// final web bundle is produced by sync-web-data.mjs.
//
// Usage: node scripts/build-cefr-data.mjs

import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const SRC = join(ROOT, "data", "augment", "parts");
const OUT = join(ROOT, "data", "_built");

const POS_DIRS = ["nouns", "verbs", "adjectives", "functional"];
const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

async function readPartFiles(pos) {
  const dir = join(SRC, pos);
  let names;
  try {
    names = await readdir(dir);
  } catch {
    return [];
  }
  const entries = [];
  for (const name of names) {
    if (!name.endsWith(".json")) continue;
    const raw = await readFile(join(dir, name), "utf8");
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) {
      throw new Error(`${pos}/${name}: expected JSON array, got ${typeof arr}`);
    }
    entries.push(...arr);
  }
  return entries;
}

async function main() {
  for (const level of LEVELS) {
    await mkdir(join(OUT, `cefr-${level.toLowerCase()}`), { recursive: true });
  }

  for (const pos of POS_DIRS) {
    const all = await readPartFiles(pos);
    const byLevel = new Map(LEVELS.map((l) => [l, []]));

    for (const entry of all) {
      if (!byLevel.has(entry.cefr)) {
        throw new Error(`${entry.lemma}: unknown cefr level "${entry.cefr}"`);
      }
      byLevel.get(entry.cefr).push(entry);
    }

    for (const level of LEVELS) {
      const items = byLevel.get(level);
      const path = join(OUT, `cefr-${level.toLowerCase()}`, `${pos}.json`);
      await writeFile(path, JSON.stringify(items, null, 2) + "\n");
      if (items.length > 0) {
        console.log(`built cefr-${level.toLowerCase()}/${pos}.json (${items.length} entries)`);
      }
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
