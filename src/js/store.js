const KEY = "jlp.progress.v1";
const MESSAGE_KEY = "jlp.messageDeck.v1";

function defaults() { return { schemaVersion: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), attempts: [], flaggedQuestionIds: [], disclosureSeen: false }; }
export function loadProgress() {
  try {
    const value = JSON.parse(localStorage.getItem(KEY));
    if (!value || value.schemaVersion !== 1 || !Array.isArray(value.attempts)) return defaults();
    return { ...defaults(), ...value, attempts: value.attempts.slice(-2000), flaggedQuestionIds: Array.isArray(value.flaggedQuestionIds) ? value.flaggedQuestionIds : [] };
  } catch { return defaults(); }
}
export function saveProgress(progress) {
  progress.updatedAt = new Date().toISOString();
  progress.attempts = (progress.attempts || []).slice(-2000);
  localStorage.setItem(KEY, JSON.stringify(progress));
}
export function resetProgress() { localStorage.removeItem(KEY); localStorage.removeItem(MESSAGE_KEY); }
export function exportProgress(progress) {
  const blob = new Blob([JSON.stringify(progress, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob); const link = document.createElement("a");
  link.href = url; link.download = `jasmine-practice-progress-${new Date().toISOString().slice(0,10)}.json`; link.click(); URL.revokeObjectURL(url);
}
export function nextMessage(messages) {
  let deck;
  try { deck = JSON.parse(localStorage.getItem(MESSAGE_KEY)); } catch { deck = null; }
  const ids = messages.map(x => x.id);
  if (!deck || !Array.isArray(deck.remaining) || !deck.remaining.some(id => ids.includes(id))) {
    const shuffled = [...ids].sort(() => Math.random() - .5);
    if (shuffled[0] === deck?.last && shuffled.length > 1) [shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]];
    deck = { remaining: shuffled, last: deck?.last || null };
  }
  const id = deck.remaining.shift(); deck.last = id;
  try { localStorage.setItem(MESSAGE_KEY, JSON.stringify(deck)); } catch {}
  return messages.find(x => x.id === id)?.text || messages[0]?.text || "今天穩穩練，考場穩穩拿分。";
}
