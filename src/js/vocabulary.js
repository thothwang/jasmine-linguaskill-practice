const DAY = 24 * 60 * 60 * 1000;
const INTERVAL_DAYS = [1, 3, 7, 14, 30, 60, 120];

export function normaliseVocabulary(raw) {
  const cards = Array.isArray(raw) ? raw : raw?.cards;
  if (!Array.isArray(cards)) throw new Error("Vocabulary library has no cards array");
  return cards.filter(card => card?.id && card?.word && Array.isArray(card.examples)).map(card => ({
    ...card,
    domains: Array.isArray(card.domains) ? card.domains : ["general"],
    examples: card.examples.slice(0, 3),
  }));
}

export function cardIsDue(record, now = Date.now()) {
  return Boolean(record?.dueAt) && new Date(record.dueAt).getTime() <= Number(now);
}

export function vocabularySummary(cards, progress, domain, now = Date.now()) {
  const eligible = cards.filter(card => !domain || card.domains.includes(domain));
  const records = progress?.cards || {};
  const reviewed = eligible.filter(card => records[card.id]?.reps > 0).length;
  const mastered = eligible.filter(card => records[card.id]?.step >= 4).length;
  const due = eligible.filter(card => cardIsDue(records[card.id], now)).length;
  return { total: eligible.length, reviewed, mastered, due };
}

export function selectVocabularyCards(cards, { domain, mode = "sprint", progress, now = Date.now(), query = "" }) {
  const records = progress?.cards || {};
  const normalizedQuery = query.trim().toLocaleLowerCase("en");
  let eligible = cards.filter(card => card.domains.includes(domain));
  if (mode === "sprint") eligible = eligible.filter(card => card.sprint && card.level !== "Foundation");
  else if (mode === "due") eligible = eligible.filter(card => cardIsDue(records[card.id], now));
  if (normalizedQuery) eligible = eligible.filter(card => card.word.toLocaleLowerCase("en").includes(normalizedQuery));
  return [...eligible].sort((left, right) => {
    const leftRecord = records[left.id], rightRecord = records[right.id];
    const leftDue = cardIsDue(leftRecord, now) ? 0 : leftRecord?.reps ? 2 : 1;
    const rightDue = cardIsDue(rightRecord, now) ? 0 : rightRecord?.reps ? 2 : 1;
    return leftDue - rightDue || (leftRecord?.dueAt || "").localeCompare(rightRecord?.dueAt || "") || left.rank - right.rank || left.word.localeCompare(right.word);
  });
}

export function applyVocabularyReview(progress, cardId, remembered, { usedChinese = false, now = Date.now() } = {}) {
  const next = { ...progress, cards: { ...(progress?.cards || {}) } };
  const previous = next.cards[cardId] || { step: -1, reps: 0, lapses: 0 };
  let step;
  let dueAt;
  if (!remembered) {
    step = 0;
    dueAt = new Date(Number(now) + 10 * 60 * 1000).toISOString();
  } else {
    step = Math.min(Math.max(0, previous.step + 1), INTERVAL_DAYS.length - 1);
    const interval = usedChinese ? Math.min(1, INTERVAL_DAYS[step]) : INTERVAL_DAYS[step];
    dueAt = new Date(Number(now) + interval * DAY).toISOString();
  }
  next.cards[cardId] = {
    step,
    reps: previous.reps + 1,
    lapses: previous.lapses + (remembered ? 0 : 1),
    lastResult: remembered ? (usedChinese ? "hinted" : "remembered") : "forgotten",
    usedChinese,
    lastReviewedAt: new Date(Number(now)).toISOString(),
    dueAt,
  };
  next.updatedAt = new Date(Number(now)).toISOString();
  return next;
}
