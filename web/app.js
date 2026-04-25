// Minimal PWA shell: loads web/data/index.json, lets the user pick a CEFR
// level + POS, then runs a flashcard loop over the matching dataset.
// Future drill views (gender-drill, conjugation-drill, case-drill) plug in
// via the same picker by appending more `<select>` options in the nav.

const dataRoot = "data";

const state = {
  index: null,
  level: null,
  pos: null,
  entries: [],
  cursor: 0,
  revealed: false,
};

const els = {
  picker: document.getElementById("picker"),
  app: document.getElementById("app"),
  status: document.getElementById("status"),
};

async function fetchJson(path) {
  const res = await fetch(path, { cache: "no-cache" });
  if (!res.ok) throw new Error(`fetch ${path}: ${res.status}`);
  return res.json();
}

function renderPicker() {
  const levels = Object.keys(state.index.levels).sort();
  const posOrder = ["nouns", "verbs", "adjectives", "functional"];

  els.picker.innerHTML = "";
  const levelSel = document.createElement("select");
  levelSel.id = "level-select";
  for (const l of levels) {
    const opt = document.createElement("option");
    opt.value = l;
    opt.textContent = l;
    levelSel.appendChild(opt);
  }
  levelSel.value = state.level;
  levelSel.addEventListener("change", () => {
    state.level = levelSel.value;
    loadEntries();
  });
  els.picker.appendChild(levelSel);

  const posSel = document.createElement("select");
  posSel.id = "pos-select";
  for (const p of posOrder) {
    const opt = document.createElement("option");
    opt.value = p;
    opt.textContent = p;
    posSel.appendChild(opt);
  }
  posSel.value = state.pos;
  posSel.addEventListener("change", () => {
    state.pos = posSel.value;
    loadEntries();
  });
  els.picker.appendChild(posSel);
}

async function loadEntries() {
  const path = `${dataRoot}/cefr-${state.level.toLowerCase()}/${state.pos}.json`;
  try {
    state.entries = await fetchJson(path);
  } catch {
    state.entries = [];
  }
  state.cursor = 0;
  state.revealed = false;
  renderCard();
  updateStatus();
}

function genderClass(entry) {
  if (entry.pos !== "noun") return "";
  return `gender-${entry.gender}`;
}

function renderCard() {
  els.app.innerHTML = "";
  if (state.entries.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = `No entries for ${state.level} · ${state.pos} yet.`;
    els.app.appendChild(empty);
    return;
  }

  const entry = state.entries[state.cursor];
  const card = document.createElement("div");
  card.className = `card ${genderClass(entry)}`;
  card.tabIndex = 0;
  card.addEventListener("click", () => {
    state.revealed = !state.revealed;
    renderCard();
    updateStatus();
  });

  const lemma = document.createElement("div");
  lemma.className = "lemma";
  if (entry.pos === "noun") {
    const article = document.createElement("span");
    article.className = "article";
    article.textContent = entry.article;
    lemma.appendChild(article);
  }
  lemma.appendChild(document.createTextNode(entry.lemma));
  card.appendChild(lemma);

  const pos = document.createElement("div");
  pos.className = "pos";
  pos.textContent = posLabel(entry);
  card.appendChild(pos);

  if (state.revealed) {
    const meaning = document.createElement("div");
    meaning.className = "meaning";
    meaning.textContent = (entry.meaning_en ?? []).join(", ");
    card.appendChild(meaning);

    if (entry.examples?.length) {
      const ex = document.createElement("div");
      ex.className = "examples";
      for (const e of entry.examples) {
        const line = document.createElement("div");
        const de = document.createElement("span");
        de.className = "de";
        de.textContent = e.de + " — ";
        line.appendChild(de);
        line.appendChild(document.createTextNode(e.en));
        ex.appendChild(line);
      }
      card.appendChild(ex);
    }
  } else {
    const hint = document.createElement("div");
    hint.className = "examples";
    hint.textContent = "tap to reveal";
    card.appendChild(hint);
  }

  const controls = document.createElement("div");
  controls.className = "controls";
  const prev = document.createElement("button");
  prev.className = "ctrl";
  prev.textContent = "← prev";
  prev.addEventListener("click", (e) => {
    e.stopPropagation();
    state.cursor = (state.cursor - 1 + state.entries.length) % state.entries.length;
    state.revealed = false;
    renderCard();
    updateStatus();
  });
  const next = document.createElement("button");
  next.className = "ctrl";
  next.textContent = "next →";
  next.addEventListener("click", (e) => {
    e.stopPropagation();
    state.cursor = (state.cursor + 1) % state.entries.length;
    state.revealed = false;
    renderCard();
    updateStatus();
  });
  controls.appendChild(prev);
  controls.appendChild(next);
  card.appendChild(controls);

  els.app.appendChild(card);
}

function posLabel(entry) {
  if (entry.pos === "noun") return `noun · ${entry.gender}`;
  if (entry.pos === "verb") return `verb · ${entry.class}`;
  if (entry.pos === "functional") return `${entry.subtype}`;
  return entry.pos;
}

function updateStatus() {
  const total = state.entries.length;
  const idx = total > 0 ? state.cursor + 1 : 0;
  els.status.textContent = `${state.level} · ${state.pos} · ${idx}/${total}`;
}

function pickInitialBucket(index) {
  const levels = Object.keys(index.levels).sort();
  const posOrder = ["nouns", "verbs", "adjectives", "functional"];
  for (const l of levels) {
    for (const p of posOrder) {
      if ((index.levels[l]?.[p] ?? 0) > 0) return { level: l, pos: p };
    }
  }
  return { level: levels[0] ?? "A1", pos: "nouns" };
}

async function main() {
  state.index = await fetchJson(`${dataRoot}/index.json`);
  const { level, pos } = pickInitialBucket(state.index);
  state.level = level;
  state.pos = pos;
  renderPicker();
  await loadEntries();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
}

main().catch((err) => {
  els.app.innerHTML = `<div class="empty">Failed to load: ${err.message}</div>`;
});
