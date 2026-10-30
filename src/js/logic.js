export const DOMAIN_LABELS = {
  "business-listening": ["職場聽力", "Business Listening", "在會議、電話與工作情境中抓住關鍵資訊。", "🎧"],
  "business-reading": ["職場閱讀", "Business Reading", "掌握電郵、通知、報告與專業語意。", "⌁"],
  "general-listening": ["實用聽力", "General Listening", "練習生活、學習、旅遊與服務情境。", "◉"],
  "general-reading": ["實用閱讀", "General Reading", "理解訊息、文章、公告與跨文本資訊。", "▤"]
};

export function domainKey(set) { return `${set.domain}-${set.skill}`; }

export function normaliseBank(raw) {
  const sets = Array.isArray(raw) ? raw : raw?.sets;
  if (!Array.isArray(sets)) throw new Error("Question bank has no sets array");
  return sets.filter(set => set?.id && set?.domain && set?.skill && Array.isArray(set.items)).map(set => ({
    ...set,
    prepSeconds: Number(set.prepSeconds ?? set.preparationSeconds ?? 0),
    maxPlays: Number(set.maxPlays ?? set.audio?.maxPlays ?? (set.skill === "listening" ? 2 : 0)),
    items: set.items.map((item, index) => ({ ...item, id: item.id || `q${index + 1}` }))
  }));
}

export function words(value) { return String(value || "").trim().split(/\s+/).filter(Boolean); }
export function normaliseText(value) { return words(value).join(" ").toLocaleLowerCase("en").replace(/[.,!?;:'“”‘’]/g, ""); }

export function isCorrect(item, response) {
  const accepted = Array.isArray(item.answer) ? item.answer : [item.answer];
  if (item.responseType === "short_text" || item.responseType === "gap_text") {
    if (item.maxWords && words(response).length > item.maxWords) return false;
    return accepted.some(answer => normaliseText(answer) === normaliseText(response));
  }
  return accepted.map(String).includes(String(response ?? ""));
}

export function scoreSet(set, responses = {}) {
  const details = set.items.map(item => ({ item, response: responses[item.id], correct: isCorrect(item, responses[item.id]) }));
  return { correct: details.filter(x => x.correct).length, total: details.length, details };
}

export function choicesForItem(set,item) {
  let choices = item.options?.length ? item.options : set.sharedOptions || [];
  if (item.responseType === "matching" && !item.options?.length) {
    const keyedAnswer = String(Array.isArray(item.answer) ? item.answer[0] : item.answer || "");
    const family = keyedAnswer.match(/^[A-Z]+(?=\d)/)?.[0];
    if (family) choices = choices.filter(option => String(option.id).startsWith(family));
  }
  return choices;
}

export function getTaipeiDate(now = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Taipei", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now).filter(x => x.type !== "literal").map(x => [x.type, x.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function datePhase(now = new Date()) {
  const date = getTaipeiDate(now);
  if (date <= "2026-11-04") return "business";
  if (date <= "2026-11-07") return "general";
  return "balanced";
}

export function selectSets(sets, { domain, skill, progress, count = 5, mock = false }) {
  const eligible = sets.filter(set => set.domain === domain && set.skill === skill);
  const attempts = progress?.attempts || [];
  const seen = new Map();
  attempts.forEach(a => seen.set(a.taskSetId, (seen.get(a.taskSetId) || 0) + 1));
  return [...eligible].sort((a,b) => {
    const aSeen = seen.get(a.id) || 0, bSeen = seen.get(b.id) || 0;
    if (aSeen !== bSeen) return aSeen - bSeen;
    const rank = { B2: 0, "B2+": 1, B2_PLUS: 1, C1: 2 };
    return (rank[a.level] ?? 0) - (rank[b.level] ?? 0) || a.id.localeCompare(b.id);
  }).slice(0, mock ? Math.min(count, eligible.length) : Math.min(count, eligible.length));
}

export function progressSummary(attempts = [], key) {
  const rows = key ? attempts.filter(a => a.domainKey === key) : attempts;
  const correct = rows.filter(a => a.correct).length;
  const accuracy = rows.length ? Math.round(correct / rows.length * 100) : 0;
  let band = "建立練習資料中";
  if (rows.length >= 8) band = accuracy >= 80 ? "B2+/C1 挑戰區" : accuracy >= 65 ? "B2 練習範圍" : "B2 技能養成中";
  return { attempts: rows.length, correct, accuracy, band };
}
