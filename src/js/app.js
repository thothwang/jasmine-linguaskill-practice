import { DOMAIN_LABELS, normaliseBank, domainKey, scoreSet, selectSets, progressSummary, datePhase, choicesForItem } from "./logic.js";
import { loadProgress, saveProgress, loadVocabularyProgress, saveVocabularyProgress, resetAllProgress, exportAllProgress, nextMessage } from "./store.js";
import { normaliseVocabulary, vocabularySummary, selectVocabularyCards, applyVocabularyReview } from "./vocabulary.js";

const app = document.querySelector("#app");
const live = document.querySelector("#liveRegion");
const menuButton = document.querySelector("#menuButton");
const nav = document.querySelector("#topnav");
const offlineBanner = document.querySelector("#offlineBanner");
const LISTENING_PREP_SECONDS = 5;
let bank = [], progress = loadProgress(), session = null, audioState = null, timer = null;
let vocabulary = null, vocabularyProgress = loadVocabularyProgress(), vocabularySession = null;

const MESSAGES = [
  { id:"b1", phase:"business", text:"Jasmine，今天的每一題，都讓你更熟悉考試節奏。" },
  { id:"b2", phase:"business", text:"Business 模式啟動：先抓情境，再鎖定真正的要求。" },
  { id:"b3", phase:"business", text:"數字會干擾你，但語意會帶你找到答案。" },
  { id:"g1", phase:"general", text:"實用英語接棒：旅行、學習與生活情境，穩穩拿下。" },
  { id:"g2", phase:"general", text:"不用一次完美，只要每次多聽懂一點。" },
  { id:"g3", phase:"general", text:"先讀問題，再聽重點；你已經知道怎麼找線索。" },
  { id:"a1", phase:"balanced", text:"You’re not guessing—you’re learning how the test thinks." },
  { id:"a2", phase:"balanced", text:"穩穩聽、仔細讀，你的實力正在累積。" },
  { id:"a3", phase:"balanced", text:"今天累積的線索，會變成考場上的直覺。" }
];

menuButton.addEventListener("click", () => { const open = nav.classList.toggle("open"); menuButton.setAttribute("aria-expanded", open); });
nav.addEventListener("click", () => { nav.classList.remove("open"); menuButton.setAttribute("aria-expanded", "false"); });
window.addEventListener("hashchange", route);
window.addEventListener("online", updateOnline); window.addEventListener("offline", updateOnline);
function updateOnline() { offlineBanner.hidden = navigator.onLine; }
function announce(text) { live.textContent = ""; requestAnimationFrame(() => live.textContent = text); }
function esc(value) { return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c])); }
function parseHash() { const raw = location.hash.slice(1) || "/"; const [path, query=""] = raw.split("?"); return { path, params: new URLSearchParams(query) }; }

async function loadBank() {
  for (const url of ["./content/questions.json", "./content/demo-questions.json"]) {
    try { const response = await fetch(url); if (!response.ok) throw new Error(String(response.status)); bank = normaliseBank(await response.json()); if (bank.length) return; } catch (error) { console.warn(`Could not load ${url}`, error); }
  }
  throw new Error("No usable question bank");
}

function route() {
  clearInterval(timer); timer = null; audioState = null;
  window.speechSynthesis?.cancel?.();
  const { path, params } = parseHash();
  if (path === "/" || path === "/areas") renderHome();
  else if (path === "/section") renderSection(params.get("key"));
  else if (path === "/quiz") renderQuiz();
  else if (path === "/review") renderReview();
  else if (path === "/vocabulary") void renderVocabularyHome();
  else if (path === "/vocabulary/study") void renderVocabularyStudy(params);
  else if (path === "/settings") renderSettings();
  else if (path === "/about") renderAbout();
  else renderNotFound();
  app.focus(); window.scrollTo({ top: 0, behavior: "instant" });
}

async function loadVocabulary() {
  if (vocabulary) return vocabulary;
  app.innerHTML = `<p class="loading">載入 5,000+ 單字庫中…</p>`;
  const response = await fetch("./content/vocabulary.json");
  if (!response.ok) throw new Error(`單字庫載入失敗 (${response.status})`);
  const raw = await response.json();
  vocabulary = { cards:normaliseVocabulary(raw), metadata:raw.metadata || {} };
  return vocabulary;
}

function renderHome() {
  const phase = datePhase();
  const phaseMessages = MESSAGES.filter(x => x.phase === phase || x.phase === "balanced");
  app.innerHTML = `<section class="hero"><p class="eyebrow">Your practice space</p><h1>Listen closely. Read confidently.</h1><p class="hero-message">${esc(nextMessage(phaseMessages))}</p></section>
    <section class="grid domain-grid" aria-label="練習類別">${Object.entries(DOMAIN_LABELS).map(([key,d]) => domainCard(key,d)).join("")}</section>
    <p class="footer-note">本網站為原創、非官方練習工具，與 Cambridge 無隸屬或背書關係；練習結果不是正式分數預測。</p>`;
}
function domainCard(key,d) { const stats = progressSummary(progress.attempts,key); return `<article class="card domain-card"><span class="domain-icon" aria-hidden="true">${d[3]}</span><div><h2>${esc(d[0])}</h2><p>${esc(d[1])}</p></div><p>${esc(d[2])}</p><div class="progress-track" aria-label="正確率 ${stats.accuracy}%"><span style="width:${stats.accuracy}%"></span></div><div class="card-actions"><a class="button secondary" href="#/section?key=${key}">${stats.attempts ? "繼續練習" : "開始"}</a></div></article>`; }

function renderSection(key) {
  if (!DOMAIN_LABELS[key]) return renderNotFound();
  const [domain,skill] = key.split("-"); const d = DOMAIN_LABELS[key]; const available = bank.filter(s => domainKey(s) === key); const stats = progressSummary(progress.attempts,key);
  const questionCount = available.reduce((sum,set) => sum + set.items.length,0);
  const modeCopy = skill === "listening" ? "每個題組先準備 5 秒，錄音將播放兩次；作答後立即查看解析與逐字稿。" : "每個題組作答後立即查看中文解析、答案線索與閱讀內容。";
  const officialResource = officialSampleLinks(domain,skill);
  app.innerHTML = `<header class="section-header"><div><span class="tag">${esc(d[1])}</span><h1>${esc(d[0])}</h1><p>${esc(d[2])}</p></div></header>
    <section class="grid stats"><div class="card stat"><strong>${available.length}</strong><span>題組數</span></div><div class="card stat"><strong>${questionCount}</strong><span>題目數</span></div><div class="card stat"><strong>${stats.attempts}</strong><span>已作答</span></div><div class="card stat"><strong>${stats.accuracy}%</strong><span>正確率</span></div></section>
    <section class="card"><span class="tag">Practice</span><h2>開始一個題組</h2><p>${esc(modeCopy)}</p><div class="card-actions"><button class="button" id="startPractice">開始練習</button><a class="button secondary" href="#/">回主選單</a></div></section>${officialResource}`;
  app.querySelector("#startPractice").addEventListener("click", () => startSession(domain,skill));
}

function officialSampleLinks(domain,skill) {
  const isBusiness = domain === "business";
  const isListening = skill === "listening";
  const variant = isBusiness ? "Business" : "General";
  const module = isListening ? "Listening" : "Reading";
  const sampleUrl = `https://www.metritests.com/metricatestdelivery_QA/Assessment/Assignment?test=CLS_${variant}_${module}_sample2023`;
  const answerUrls = {
    "general-reading": "https://www.cambridgeenglish.org/Images/745728-linguaskill-reading-sample-test-answer-key.pdf",
    "general-listening": "https://www.cambridgeenglish.org/Images/745730-linguaskill-listening-sample-test-answer-key.pdf",
    "business-reading": "https://www.cambridgeenglish.org/Images/745731-linguaskill-business-reading-sample-test-answer-key.pdf",
    "business-listening": "https://www.cambridgeenglish.org/Images/745729-linguaskill-business-listening-sample-test-answer-key.pdf",
  };
  const answerUrl = answerUrls[`${domain}-${skill}`];
  return `<aside class="card official-resource"><span class="tag">Cambridge Official</span><h2>官方${isListening ? "聽力" : "閱讀"}示範題</h2><p>Cambridge 提供的免費示範測驗；會另開官方網站。示範測驗較正式考試短，而且不是自適應測驗。</p><div class="card-actions"><a class="button secondary" href="${sampleUrl}" target="_blank" rel="noopener noreferrer">開啟官方示範題</a><a class="button secondary" href="${answerUrl}" target="_blank" rel="noopener noreferrer">查看官方答案</a></div></aside>`;
}

function startSession(domain,skill,sourceSet = null) {
  const sets = sourceSet ? [sourceSet] : selectSets(bank,{ domain,skill,progress,count: 1 });
  if (!sets.length) { announce("這個區域目前還沒有題目"); return; }
  session = { domain, skill, sets, index: 0, completedSets: 0, responses: {}, results: [], startedAt: Date.now() };
  location.hash = "#/quiz";
}

function renderQuiz() {
  if (!session?.sets?.length) { location.hash = "#/"; return; }
  const set = session.sets[0];
  app.innerHTML = `<div class="quiz-head"><div class="quiz-meta"><span>練習模式</span><span>第 ${session.completedSets + 1} 題組</span></div></div>
    <article class="card task-card"><span class="tag">${esc(set.topic || "Practice")}</span><h1>${esc(set.title)}</h1><p class="directions">${esc(set.directions || set.instructions)}</p>${renderStimulus(set)}${set.skill === "listening" ? renderAudio() : ""}<form id="answerForm">${set.items.map((item,i) => renderItem(set,item,i)).join("")}<div class="actions"><button class="button" id="submitButton" type="submit" ${set.skill === "listening" ? "disabled" : ""}>檢查答案</button></div></form><div id="feedbackArea"></div></article>`;
  app.querySelector("#answerForm").addEventListener("submit", event => submitSet(event,set));
  if (set.skill === "listening") initAudio(set);
}
function renderStimulus(set) {
  if (!set.stimulus) return "";
  if (Array.isArray(set.stimulus.texts)) return `<section class="stimulus" aria-label="閱讀材料">${set.stimulus.texts.map(t => `<article class="stimulus-text"><strong>${esc(t.id)}${t.heading ? ` · ${esc(t.heading)}` : ""}</strong><p>${esc(t.text)}</p></article>`).join("")}</section>`;
  const extras = Array.isArray(set.stimulus.removed) ? `<ol>${set.stimulus.removed.map(x => `<li>${esc(x.text ?? x)}</li>`).join("")}</ol>` : "";
  return `<section class="stimulus" aria-label="閱讀材料">${esc(set.stimulus.text || "")}${extras}</section>`;
}
function renderAudio() { return `<section class="audio-box" aria-label="聽力播放器"><span class="audio-status" id="audioStatus">按下開始後，準備時間為 ${LISTENING_PREP_SECONDS} 秒。</span><button class="button" id="playButton" type="button">開始聽力題組</button><span id="playCount">錄音將播放兩次，中間會短暫停頓。</span><audio id="audioElement" preload="auto"></audio></section>`; }
function renderItem(set,item,i) {
  const name = `answer-${item.id}`;
  const choices = choicesForItem(set,item);
  if (item.responseType === "short_text" || item.responseType === "gap_text") return `<div class="question"><label for="${name}"><strong>${i+1}. ${esc(item.question)}</strong></label><input class="text-answer" id="${name}" name="${name}" autocomplete="off" ${item.maxWords ? `aria-describedby="hint-${item.id}"` : ""}><small id="hint-${item.id}">${item.maxWords ? `最多 ${item.maxWords} 個英文字` : ""}</small></div>`;
  if (item.responseType === "matching") return `<div class="question"><label for="${name}"><strong>${i+1}. ${esc(item.question)}</strong></label><select class="matching-select" id="${name}" name="${name}" required><option value="">請選擇</option>${choices.map(o => `<option value="${esc(o.id)}">${esc(o.id)} · ${esc(o.text)}</option>`).join("")}</select></div>`;
  return `<fieldset class="question"><legend>${i+1}. ${esc(item.question)}</legend>${choices.map(o => `<label class="option"><input type="radio" name="${name}" value="${esc(o.id)}" required><span><strong>${esc(o.id)}</strong> ${esc(o.text)}</span></label>`).join("")}</fieldset>`;
}

function initAudio(set) {
  const status = app.querySelector("#audioStatus"), button = app.querySelector("#playButton"), element = app.querySelector("#audioElement"), count = app.querySelector("#playCount");
  const submit = app.querySelector("#submitButton");
  const asset = set.audio?.asset || set.audio?.src;
  audioState = { plays: 0, ready: false, started: false };
  if (asset) {
    element.src = `./${String(asset).replace(/^\.\//,"")}`;
  } else { button.disabled = true; status.textContent = "此題音檔尚未完成。"; }
  const playPass = async pass => {
    audioState.plays = pass;
    element.currentTime = 0;
    status.textContent = `第 ${pass} 次播放中…`;
    count.textContent = `錄音將播放兩次，目前為第 ${pass} 次。`;
    try { await element.play(); }
    catch {
      status.textContent = "音檔暫時無法播放，請檢查網路後重新開始。";
      button.textContent = "重新開始 5 秒準備";
      button.disabled = false;
      audioState.started = false;
    }
  };
  button.addEventListener("click", async () => {
    if (audioState.started || !asset) return;
    audioState.started = true; button.disabled = true; submit.disabled = true;
    try {
      element.muted = true; await element.play(); element.pause(); element.currentTime = 0; element.muted = false;
    } catch { element.muted = false; }
    let remaining = LISTENING_PREP_SECONDS;
    status.textContent = `準備時間：${remaining} 秒`;
    timer = setInterval(() => {
      remaining -= 1;
      status.textContent = `準備時間：${remaining} 秒`;
      if (remaining <= 0) { clearInterval(timer); timer = null; audioState.ready = true; playPass(1); }
    }, 1000);
  });
  element.addEventListener("ended", () => {
    if (!audioState.started) return;
    if (audioState.plays === 1) {
      status.textContent = "第一次播放完畢，短暫停頓後將自動播放第二次。";
      timer = setTimeout(() => { timer = null; playPass(2); }, 1500);
    } else if (audioState.plays === 2) {
      status.textContent = "兩次錄音皆已播放完畢，現在可以提交答案。";
      count.textContent = "錄音已播放兩次。";
      submit.disabled = false;
    }
  });
  element.addEventListener("error", () => {
    status.textContent = "音檔尚未下載或暫時無法播放。";
    button.textContent = "重新開始 5 秒準備";
    button.disabled = false;
    audioState.started = false;
  });
}

function collectResponses(set, form) { return Object.fromEntries(set.items.map(item => [item.id, new FormData(form).get(`answer-${item.id}`) || ""])); }
function submitSet(event,set) {
  event.preventDefault(); const responses = collectResponses(set,event.currentTarget); const result = scoreSet(set,responses); const now = new Date().toISOString();
  result.details.forEach(detail => progress.attempts.push({ attemptId: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`, taskSetId:set.id, questionId:`${set.id}-${detail.item.id}`, domainKey:domainKey(set), taskType:set.taskType, level:set.level, mode:"practice", answeredAt:now, correct:detail.correct, response:detail.response, playsUsed:audioState?.plays || 0 }));
  saveProgress(progress); session.responses[set.id] = responses; session.results.push({ set, result });
  showFeedback(set,result);
}
function showFeedback(set,result) {
  const area = app.querySelector("#feedbackArea"); app.querySelector("#answerForm").querySelectorAll("input,select,button[type=submit]").forEach(x => x.disabled = true);
  area.innerHTML = `<section aria-labelledby="result-title"><h2 id="result-title" tabindex="-1">本題組 ${result.correct} / ${result.total}</h2>${result.details.map(d => `<div class="feedback ${d.correct ? "good" : "bad"}"><strong>${d.correct ? "答對了" : `正確答案：${esc(Array.isArray(d.item.answer) ? d.item.answer[0] : d.item.answer)}`}</strong><p>${esc(d.item.explanationZh || d.item.explanation?.zhHant || "請對照答案線索。")}</p>${!d.correct && d.item.distractorRationales?.[d.response] ? `<p>為什麼不是這個答案：${esc(d.item.distractorRationales[d.response])}</p>` : ""}<p><em>線索：</em> ${esc(d.item.evidence || "—")}</p></div>`).join("")}${set.skill === "listening" ? transcript(set) : ""}<div class="actions"><button class="button" id="nextButton">下一題組</button><a class="button secondary" href="#/">回主選單</a></div></section>`;
  area.querySelector("#nextButton").addEventListener("click", advanceSession); area.querySelector("#result-title").focus?.(); announce(`本題組答對 ${result.correct} 題，共 ${result.total} 題`);
}
function transcript(set) { const segments = set.audio?.segments || []; return `<details class="transcript"><summary>查看逐字稿（AI 生成語音）</summary>${segments.map(s => `<p><strong>${esc(s.speaker)}：</strong>${esc(s.text)}</p>`).join("")}</details>`; }
function advanceSession() {
  session.completedSets += 1;
  const next = selectSets(bank,{ domain:session.domain, skill:session.skill, progress, count:1 })[0];
  if (!next) { location.hash = "#/"; return; }
  session.sets = [next]; session.index = 0; session.responses = {}; session.results = [];
  renderQuiz(); window.scrollTo(0,0);
}
function renderReview() {
  const latest = new Map();
  progress.attempts.forEach(attempt => latest.set(attempt.questionId,attempt));
  const wrong = [...latest.values()].filter(attempt => !attempt.correct).reverse().map(attempt => {
    const set = bank.find(candidate => candidate.id === attempt.taskSetId);
    const item = set?.items.find(candidate => `${set.id}-${candidate.id}` === attempt.questionId);
    return { attempt,set,item };
  }).filter(row => row.set && row.item);
  app.innerHTML = `<header class="section-header"><div><span class="tag">Review</span><h1>錯題複習</h1><p>只顯示每題最新一次作答仍未答對的項目；重新答對後會自動移出清單。</p></div></header>${wrong.length ? `<section class="review-list">${wrong.slice(0,50).map(({attempt,set,item},index) => `<article class="card review-row"><span class="tag">${esc(DOMAIN_LABELS[attempt.domainKey]?.[0] || "練習")}</span><h2>${esc(set.title)}</h2><p>${esc(item.question)}</p><button class="button secondary" data-redo="${esc(set.id)}" data-index="${index}">再做一次</button></article>`).join("")}</section>` : `<div class="card empty">目前沒有待複習的錯題。完成一些練習後再回來看看。</div>`}<div class="actions page-actions"><a class="button secondary" href="#/">回主選單</a></div>`;
  app.querySelectorAll("[data-redo]").forEach(button => button.addEventListener("click", () => {
    const set = bank.find(candidate => candidate.id === button.dataset.redo);
    if (set) startSession(set.domain,set.skill,set);
  }));
}

async function renderVocabularyHome() {
  vocabularySession = null;
  try { await loadVocabulary(); }
  catch (error) { app.innerHTML = `<div class="card empty"><h1>暫時無法載入單字庫</h1><p>${esc(error.message)}</p><button class="button" id="retryVocabulary">重新載入</button></div>`; app.querySelector("#retryVocabulary")?.addEventListener("click",renderVocabularyHome); return; }
  const business = vocabularySummary(vocabulary.cards,vocabularyProgress,"business");
  const general = vocabularySummary(vocabulary.cards,vocabularyProgress,"general");
  const overall = vocabularySummary(vocabulary.cards,vocabularyProgress);
  const sprintCount = vocabulary.cards.filter(card => card.sprint && card.level !== "Foundation").length;
  app.innerHTML = `<header class="section-header"><div><span class="tag">Vocabulary</span><h1>單字複習</h1><p>依職場與生活情境練習；「考前衝刺」集中在 B2、B2+ 與 C1，不會從太簡單的字開始。</p></div></header>
    <section class="vocab-overview card"><div><strong>${vocabulary.cards.length.toLocaleString("en")}</strong><span>完整字庫</span></div><div><strong>${sprintCount.toLocaleString("en")}</strong><span>考前衝刺</span></div><div><strong>${overall.due}</strong><span>目前到期</span></div></section>
    <section class="card vocab-forgotten-card"><span class="forgotten-icon" aria-hidden="true">↺</span><div><span class="tag">Review</span><h2>忘記單字</h2><p>按過「忘記了」的單字會立即出現在這裡；之後選擇「記得」就會自動移除。</p></div><div class="forgotten-count"><strong>${overall.forgotten}</strong><span>個待複習</span></div><button class="button${overall.forgotten ? "" : " secondary"}" data-vocab-start data-domain="all" data-mode="forgotten" ${overall.forgotten ? "" : "disabled"}>${overall.forgotten ? "開始複習" : "目前沒有忘記的單字"}</button></section>
    <section class="grid vocab-deck-grid" aria-label="單字類別">
      ${vocabularyDeckCard("business","職場單字","Business Vocabulary","會議、專案、財務、人資與商務溝通常見語彙。",business)}
      ${vocabularyDeckCard("general","實用單字","General Vocabulary","學習、旅行、科技、服務與日常生活常見語彙。",general)}
    </section>
    <section class="card vocab-search"><h2>查一個字</h2><p>可直接從 5,000+ 字庫中搜尋，並從搜尋結果開始複習。</p><form id="vocabSearchForm" class="vocab-search-form"><label><span>情境</span><select id="vocabSearchDomain"><option value="general">實用英語</option><option value="business">職場英語</option></select></label><label><span>英文單字</span><input id="vocabSearchInput" type="search" autocomplete="off" minlength="2" required placeholder="例如 negotiate"></label><button class="button" type="submit">搜尋並開始</button></form></section>
    <p class="footer-note">這是獨立、非官方的學習字庫，不是 Cambridge 公布的 Linguaskill 必考字表。進度只儲存在這台裝置。</p>`;
  app.querySelectorAll("[data-vocab-start]").forEach(button => button.addEventListener("click", () => {
    const { domain,mode } = button.dataset;
    location.hash = `#/vocabulary/study?domain=${domain}&mode=${mode}`;
  }));
  app.querySelector("#vocabSearchForm").addEventListener("submit", event => {
    event.preventDefault();
    const domain = app.querySelector("#vocabSearchDomain").value;
    const query = app.querySelector("#vocabSearchInput").value.trim();
    location.hash = `#/vocabulary/study?domain=${domain}&mode=full&q=${encodeURIComponent(query)}`;
  });
}

function vocabularyDeckCard(domain,title,english,description,stats) {
  const available = vocabulary.cards.filter(card => card.domains.includes(domain)).length;
  return `<article class="card vocab-deck-card"><span class="domain-icon" aria-hidden="true">${domain === "business" ? "▦" : "◎"}</span><div><h2>${title}</h2><p>${english}</p></div><p>${description}</p><div class="vocab-mini-stats"><span>${available.toLocaleString("en")} 字</span><span>已複習 ${stats.reviewed}</span><span>到期 ${stats.due}</span></div><div class="card-actions"><button class="button" data-vocab-start data-domain="${domain}" data-mode="sprint">考前衝刺</button><button class="button secondary" data-vocab-start data-domain="${domain}" data-mode="${stats.due ? "due" : "full"}">${stats.due ? `複習到期 ${stats.due} 字` : "完整字庫"}</button>${stats.due ? `<button class="button ghost" data-vocab-start data-domain="${domain}" data-mode="full">完整字庫</button>` : ""}</div></article>`;
}

async function renderVocabularyStudy(params) {
  try { await loadVocabulary(); }
  catch (error) { app.innerHTML = `<div class="card empty"><h1>暫時無法載入單字庫</h1><p>${esc(error.message)}</p><a class="button" href="#/vocabulary">回單字選單</a></div>`; return; }
  const mode = ["sprint","full","due","forgotten"].includes(params.get("mode")) ? params.get("mode") : "sprint";
  const domain = mode === "forgotten" ? "all" : (params.get("domain") === "business" ? "business" : "general");
  const query = params.get("q") || "";
  const key = `${domain}:${mode}:${query}`;
  if (!vocabularySession || vocabularySession.key !== key) {
    vocabularySession = { key,domain,mode,query,cards:selectVocabularyCards(vocabulary.cards,{domain,mode,progress:vocabularyProgress,query}),index:0,revealed:false,usedChinese:false,remembered:0,forgotten:0 };
  }
  renderCurrentVocabularyCard();
}

function renderCurrentVocabularyCard() {
  const current = vocabularySession?.cards[vocabularySession.index];
  if (!current) return renderVocabularyComplete();
  const total = vocabularySession.cards.length;
  const modeLabel = vocabularySession.query ? `搜尋「${vocabularySession.query}」` : ({sprint:"考前衝刺",full:"完整字庫",due:"到期複習",forgotten:"忘記單字複習"}[vocabularySession.mode]);
  const domainLabel = vocabularySession.domain === "all" ? "全部單字" : (vocabularySession.domain === "business" ? "職場單字" : "實用單字");
  app.innerHTML = `<div class="vocab-study-head"><a class="back-link" href="#/vocabulary">← 回單字選單</a><span>${domainLabel} · ${modeLabel}</span><strong>${vocabularySession.index + 1} / ${total}</strong></div>
    <div class="progress-track" aria-label="複習進度"><span style="width:${Math.round((vocabularySession.index / total) * 100)}%"></span></div>
    <article class="vocab-card" id="vocabCard" tabindex="0" aria-label="單字卡：${esc(current.word)}">
      <div class="vocab-card-top"><div><span class="tag">${esc(current.level)}</span><span class="vocab-pos">${esc(current.partOfSpeech)}</span></div><button class="icon-button speak-button" id="speakWord" type="button" aria-label="播放 ${esc(current.word)} 發音">🔊</button></div>
      <h1>${esc(current.word)}</h1>${current.phonetic ? `<p class="vocab-phonetic">/${esc(current.phonetic)}/</p>` : ""}
      <section class="vocab-examples" aria-label="例句"><h2>Examples</h2><ol>${current.examples.map(example => `<li><span>${highlightVocabularyWord(example.text,current.word)}</span>${example.sourceId ? `<a class="example-source" href="https://tatoeba.org/en/sentences/show/${encodeURIComponent(example.sourceId)}" target="_blank" rel="noopener noreferrer" aria-label="Tatoeba 例句來源">Tatoeba${example.sourceUser && example.sourceUser !== "\\N" ? ` · ${esc(example.sourceUser)}` : ""}</a>` : ""}</li>`).join("")}</ol></section>
      <section class="vocab-answer" id="vocabAnswer" ${vocabularySession.revealed ? "" : "hidden"}>${current.definitionEn ? `<div><span>English</span><p>${esc(current.definitionEn)}</p></div>` : ""}<div id="chineseMeaning" ${vocabularySession.usedChinese ? "" : "hidden"}><span>中文提示</span><p>${esc(current.definitionZh || "此詞暫無中文解釋。")}</p></div></section>
      <div class="vocab-reveal-actions" id="vocabRevealActions">${vocabularySession.revealed ? `<button class="button secondary" id="toggleChinese" type="button">${vocabularySession.usedChinese ? "已顯示中文" : "需要中文提示"}</button>` : `<button class="button" id="revealMeaning" type="button">看英文解釋</button>`}</div>
    </article>
    <div class="vocab-grade-actions" id="vocabGradeActions"><button class="button danger" id="forgotWord" type="button">← 忘記了</button><button class="button remember" id="rememberWord" type="button">記得 →</button></div>
    <p class="swipe-hint">看到單字就可以向左滑「忘記了」、向右滑「記得」；英文與中文解釋可自由選擇是否查看。</p>`;
  app.querySelector("#speakWord").addEventListener("click", () => speakVocabularyWord(current.word));
  app.querySelector("#revealMeaning")?.addEventListener("click", () => { vocabularySession.revealed = true; renderCurrentVocabularyCard(); announce("已顯示英文解釋"); });
  app.querySelector("#toggleChinese")?.addEventListener("click", () => {
    vocabularySession.usedChinese = true;
    app.querySelector("#chineseMeaning").hidden = false;
    app.querySelector("#toggleChinese").textContent = "已顯示中文";
    app.querySelector("#toggleChinese").disabled = true;
    announce("已顯示中文提示；這張卡會提早再出現");
  });
  app.querySelector("#forgotWord")?.addEventListener("click", () => gradeVocabulary(false));
  app.querySelector("#rememberWord")?.addEventListener("click", () => gradeVocabulary(true));
  initVocabularySwipe(app.querySelector("#vocabCard"));
}

function highlightVocabularyWord(sentence,word) {
  const pattern = new RegExp(`(${word.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")})`,`ig`);
  return esc(sentence).replace(pattern,"<mark>$1</mark>");
}

function speakVocabularyWord(word) {
  if (!("speechSynthesis" in window)) { announce("這個瀏覽器不支援發音功能"); return; }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = "en-GB"; utterance.rate = .82;
  window.speechSynthesis.speak(utterance);
}

function initVocabularySwipe(card) {
  let startX = null, startY = null;
  card.addEventListener("pointerdown", event => { startX = event.clientX; startY = event.clientY; card.setPointerCapture?.(event.pointerId); });
  card.addEventListener("pointerup", event => {
    if (startX === null) return;
    const dx = event.clientX - startX, dy = event.clientY - startY; startX = startY = null;
    if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
    gradeVocabulary(dx > 0);
  });
}

function gradeVocabulary(remembered) {
  const current = vocabularySession.cards[vocabularySession.index];
  if (!current) return;
  vocabularyProgress = applyVocabularyReview(vocabularyProgress,current.id,remembered,{usedChinese:vocabularySession.usedChinese});
  saveVocabularyProgress(vocabularyProgress);
  if (remembered) vocabularySession.remembered += 1; else vocabularySession.forgotten += 1;
  vocabularySession.index += 1; vocabularySession.revealed = false; vocabularySession.usedChinese = false;
  announce(remembered ? "已記錄為記得；若在忘記單字中，現在已移除" : "已加入忘記單字");
  renderCurrentVocabularyCard(); window.scrollTo({top:0,behavior:"instant"});
}

function renderVocabularyComplete() {
  const session = vocabularySession;
  const attempted = session.remembered + session.forgotten;
  app.innerHTML = `<section class="card vocab-complete"><span class="tag">Session complete</span><h1>${session.query ? "搜尋結果複習完成" : "這一輪完成了"}</h1><p>這次看了 ${attempted} 個字：記得 ${session.remembered}，忘記 ${session.forgotten}。選擇「忘記了」會保留在忘記單字區；之後選擇「記得」就會移除。</p><div class="card-actions"><a class="button" href="#/vocabulary">回單字選單</a><button class="button secondary" id="restartVocabulary">再練一次</button></div></section>`;
  app.querySelector("#restartVocabulary").addEventListener("click", () => { vocabularySession = null; const {domain,mode,query} = session; location.hash = `#/vocabulary/study?domain=${domain}&mode=${mode}${query ? `&q=${encodeURIComponent(query)}` : ""}`; route(); });
}

function renderSettings() {
  app.innerHTML = `<header class="section-header"><div><span class="tag">Settings</span><h1>設定與資料</h1><p>題目與單字進度只儲存在目前瀏覽器，不會上傳。</p></div></header><section class="card settings-grid"><div class="setting-row"><strong>匯出全部練習紀錄</strong><span>下載 JSON 備份，包含聽讀作答與單字複習進度。</span><button class="button secondary" id="exportButton">匯出進度</button></div><div class="setting-row"><strong>清除所有本機紀錄</strong><span>此動作會同時清除聽讀與單字進度，且無法復原。</span><button class="button danger" id="resetButton">清除進度</button></div></section><div class="actions page-actions"><a class="button secondary" href="#/">回主選單</a></div>`;
  app.querySelector("#exportButton").addEventListener("click", () => exportAllProgress(progress,vocabularyProgress));
  app.querySelector("#resetButton").addEventListener("click", () => { if (confirm("確定要清除這台裝置上的所有練習紀錄嗎？")) { resetAllProgress(); progress = loadProgress(); vocabularyProgress = loadVocabularyProgress(); announce("已清除本機練習紀錄"); renderSettings(); } });
}
function renderAbout() {
  app.innerHTML = `<header class="section-header"><div><span class="tag">About</span><h1>關於這個練習站</h1></div></header><section class="card"><h2>原創、非官方的學習工具</h2><p>本網站為 Jasmine 製作的 Listening、Reading 與 Vocabulary 練習，涵蓋 Business 與 General 情境。本站與 Cambridge University Press & Assessment 無隸屬、合作或背書關係。本站不重製或冒充 Cambridge 真實考題；閱讀區另提供 Cambridge 官方示範測驗與答案的外部連結。</p><h2>分數說明</h2><p>本站的正確率與學習建議只反映原創題目的表現，不是正式 Linguaskill 成績、證書或分數預測。</p><h2>聽力與 AI 語音</h2><p>所有聽力腳本均為原創；語音由 AI 生成，不是真人或 Cambridge 考試錄音。每個聽力題組的錄音將播放兩次，逐字稿只會在題組作答後顯示。</p><h2>單字資料來源</h2><p>單字選字結合 <a href="https://www.newgeneralservicelist.com/new-general-service-list" target="_blank" rel="noopener noreferrer">NGSL</a>、<a href="https://www.newgeneralservicelist.com/business-service-list" target="_blank" rel="noopener noreferrer">BSL</a> 與 <a href="https://www.newgeneralservicelist.com/new-academic-word-list" target="_blank" rel="noopener noreferrer">NAWL</a>（CC BY-SA 4.0），另加入 Dürlich 與 François（2018）的 <a href="https://cental.uclouvain.be/cefrlex/efllex/download/" target="_blank" rel="noopener noreferrer">EFLLex</a> 精選詞（CC BY-NC-SA 4.0）；音標與中英文釋義來自 <a href="https://github.com/skywind3000/ECDICT" target="_blank" rel="noopener noreferrer">ECDICT</a>（MIT）；部分自然例句來自 <a href="https://tatoeba.org/" target="_blank" rel="noopener noreferrer">Tatoeba</a>，每句旁保留原句連結與作者。這是本站整理的獨立字庫，不是 Cambridge 官方 Linguaskill 字表。</p><h2>官方練習材料</h2><p><a href="https://www.cambridgeenglish.org/exams-and-tests/linguaskill/information-about-the-exam/practice-materials/" target="_blank" rel="noopener noreferrer">Cambridge Linguaskill 官方練習材料</a>包含免費的 General 與 Business Reading、Listening 示範測驗、答案及學習影片。官方說明指出 Reading 與 Listening 示範測驗較正式考試短，而且不是自適應測驗。</p><h2>隱私</h2><p>本站不設帳號、不使用追蹤分析，也不會上傳進度。作答與單字複習紀錄只存在目前瀏覽器；清除網站資料或更換裝置後可能遺失。</p></section><div class="actions page-actions"><a class="button secondary" href="#/">回主選單</a></div>`;
}
function renderNotFound() { app.innerHTML = `<div class="card empty"><h1>找不到這個頁面</h1><div class="actions"><a class="button" href="#/">回主選單</a></div></div>`; }

async function init() {
  updateOnline();
  try { await loadBank(); } catch (error) {
    app.innerHTML = `<div class="card empty"><h1>暫時無法載入題庫</h1><p>${esc(error.message)}</p><button class="button" id="reloadButton">重新載入</button></div>`;
    app.querySelector("#reloadButton").addEventListener("click", () => location.reload());
    return;
  }
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("./service-worker.js").catch(error => console.warn("Service worker unavailable",error));
  route();
}
init();
