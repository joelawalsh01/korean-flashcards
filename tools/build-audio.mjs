// Generates one mp3 per unique Korean string across the four decks, using the
// macOS voice Yuna. Run it by hand after adding cards:
//
//   node tools/build-audio.mjs
//
// Existing clips are skipped, so re-runs after a few new cards take seconds.
// Requires macOS `say` (with the Korean voice Yuna installed) and `ffmpeg`.

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFileSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import os from "node:os";

const run = promisify(execFile);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const AUDIO_DIR = join(ROOT, "audio");
const VOICE = "Yuna";

// Must match audioKey() in speak.js exactly.
function audioKey(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

// Slices an array literal out of a page and evaluates it. Anchored on the
// declaration line and the first line-start `];` after it — verbs.html and
// particles.html both declare a smaller array (TENSES, PARTICLES) earlier in
// the same script, so an unanchored search would grab the wrong block.
function readCards(file, declaration) {
  const html = readFileSync(join(ROOT, file), "utf8");
  const start = html.indexOf(declaration);
  if (start === -1) throw new Error(`${file}: could not find "${declaration}"`);
  const from = html.slice(start + declaration.length - 1);
  const end = from.indexOf("\n];");
  if (end === -1) throw new Error(`${file}: could not find the end of ${declaration}`);
  return new Function("return " + from.slice(0, end + 2))();
}

function speechTextOf(card) {
  return card.speech !== undefined ? card.speech : card.korean;
}

// ===== Collect every string that should have a clip =====
function collect() {
  const found = new Map();  // text -> [sources]
  const add = (text, source) => {
    if (!text) return;
    if (!found.has(text)) found.set(text, []);
    found.get(text).push(source);
  };

  for (const file of ["index.html", "numbers.html"]) {
    for (const c of readCards(file, "const allCards = [")) add(speechTextOf(c), file);
  }

  for (const v of readCards("verbs.html", "const allVerbs = [")) {
    add(speechTextOf(v), "verbs.html");
    for (const form of Object.values(v.conjugations || {})) {
      if (form) add(form.korean, "verbs.html");
    }
  }

  // Particle cards speak the completed sentence, blanks filled in.
  for (const c of readCards("particles.html", "const allCards = [")) {
    const parts = c.parts || [c.before, c.after];
    const answers = c.answers || [c.answer];
    add(parts.map((p, i) => p + (answers[i] || "")).join("").trim(), "particles.html");
  }

  return found;
}

// ===== Generate =====
const strings = collect();

// A collision would make two different words share a clip — refuse to build.
const byKey = new Map();
for (const text of strings.keys()) {
  const key = audioKey(text);
  if (byKey.has(key)) {
    console.error(`hash collision on ${key}: "${byKey.get(key)}" vs "${text}"`);
    process.exit(1);
  }
  byKey.set(key, text);
}

mkdirSync(AUDIO_DIR, { recursive: true });

const tmp = join(os.tmpdir(), `flashcard-tts-${process.pid}.aiff`);
let written = 0, skipped = 0;
const total = strings.size;
let i = 0;

for (const text of strings.keys()) {
  i++;
  const out = join(AUDIO_DIR, `${audioKey(text)}.mp3`);
  if (existsSync(out)) { skipped++; continue; }

  await run("say", ["-v", VOICE, "-o", tmp, text]);
  await run("ffmpeg", ["-loglevel", "error", "-y", "-i", tmp,
                       "-ac", "1", "-c:a", "libmp3lame", "-b:a", "48k", out]);
  written++;
  if (written % 25 === 0) console.log(`  ${i}/${total} …`);
}

rmSync(tmp, { force: true });

console.log(`\n${total} unique strings — ${written} written, ${skipped} already present`);
console.log(`audio/ now holds the clips for:`);
const perFile = new Map();
for (const sources of strings.values()) {
  for (const s of new Set(sources)) perFile.set(s, (perFile.get(s) || 0) + 1);
}
for (const [file, n] of perFile) console.log(`  ${file.padEnd(16)} ${n}`);
