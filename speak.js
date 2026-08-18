// Shared audio playback for all four decks.
//
// Clips are pre-generated into audio/<hash>.mp3 by tools/build-audio.mjs. The
// hash below MUST stay identical to the one in that script — it is the only
// thing tying a card's text to its file, which is why there is no manifest.
//
// If a clip is missing (cards added but the generator not re-run), playback
// falls back to the browser's own Korean voice rather than going silent.

// FNV-1a, 32-bit, as 8 lowercase hex digits.
function audioKey(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

// The text a card should speak: an explicit `speech` field wins, `null`
// suppresses audio entirely, otherwise the hangul itself is used.
function speechTextOf(card) {
  if (!card) return null;
  return card.speech !== undefined ? card.speech : card.korean;
}

let koVoice = null;
function koreanVoice() {
  if (koVoice) return koVoice;
  const voices = window.speechSynthesis ? speechSynthesis.getVoices() : [];
  koVoice = voices.find(v => v.lang === "ko-KR" || v.lang === "ko_KR")
         || voices.find(v => v.lang && v.lang.startsWith("ko"))
         || null;
  return koVoice;
}

// Voices populate asynchronously in Chrome; re-resolve when they arrive.
if (window.speechSynthesis) {
  speechSynthesis.addEventListener("voiceschanged", () => { koVoice = null; koreanVoice(); });
  koreanVoice();
}

function speakFallback(text) {
  if (!window.speechSynthesis) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "ko-KR";
  u.rate = 0.85;
  const v = koreanVoice();
  if (v) u.voice = v;
  speechSynthesis.speak(u);
}

let current = null;

function speak(text) {
  if (!text) return;
  if (current) { current.pause(); current = null; }

  const el = new Audio(`audio/${audioKey(text)}.mp3`);
  // A missing file surfaces as an error event; a rejected play() covers
  // autoplay blocking and decode failures. Both can fire for the same miss,
  // so the fallback is latched to speak only once.
  let fellBack = false;
  const fallback = () => {
    if (fellBack) return;
    fellBack = true;
    speakFallback(text);
  };

  el.addEventListener("error", fallback, { once: true });
  current = el;
  const p = el.play();
  if (p && p.catch) p.catch(fallback);
}

// A 🔊 button. `getText` may be a string or a function, so callers can bind a
// button once and still have it read whatever card is showing.
function speakerButton(getText, extraClass) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "speak-btn" + (extraClass ? " " + extraClass : "");
  btn.textContent = "🔊";
  btn.setAttribute("aria-label", "Play pronunciation");
  btn.addEventListener("click", (e) => {
    // The card flips on click; the speaker must not trigger that.
    e.stopPropagation();
    speak(typeof getText === "function" ? getText() : getText);
  });
  return btn;
}
