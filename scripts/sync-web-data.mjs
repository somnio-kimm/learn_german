#!/usr/bin/env node
// Copies data/_merged/cefr-<level>/<pos>.json to web/data/<...> and emits
// web/data/index.json with counts per level × POS.

import { copyFile, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const MERGED = join(ROOT, "data", "_merged");
const WEB_DATA = join(ROOT, "web", "data");

const SCHEMA_VERSION = 1;

function levelLabelFromDir(dir) {
  // cefr-a1 → A1
  return dir.replace(/^cefr-/, "").toUpperCase();
}

async function main() {
  let levelDirs;
  try {
    levelDirs = await readdir(MERGED);
  } catch {
    console.error(`no merged tree at ${MERGED}; run merge:augment first.`);
    process.exit(1);
  }

  const levels = {};

  for (const levelDir of levelDirs) {
    const inDir = join(MERGED, levelDir);
    const outDir = join(WEB_DATA, levelDir);
    await mkdir(outDir, { recursive: true });

    const files = await readdir(inDir);
    const levelLabel = levelLabelFromDir(levelDir);
    levels[levelLabel] = {};

    for (const file of files) {
      if (!file.endsWith(".json")) continue;
      const src = join(inDir, file);
      const dst = join(outDir, file);
      await copyFile(src, dst);

      const arr = JSON.parse(await readFile(src, "utf8"));
      const pos = file.replace(/\.json$/, "");
      levels[levelLabel][pos] = arr.length;
    }
  }

  const index = {
    schema_version: SCHEMA_VERSION,
    generated_at: new Date().toISOString(),
    levels,
  };
  await mkdir(WEB_DATA, { recursive: true });
  await writeFile(join(WEB_DATA, "index.json"), JSON.stringify(index, null, 2) + "\n");
  console.log(`wrote ${join("web", "data", "index.json")}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
