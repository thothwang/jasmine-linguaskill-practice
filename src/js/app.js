import { DOMAIN_LABELS, normaliseBank, domainKey, scoreSet, selectSets, progressSummary, datePhase, choicesForItem } from "./logic.js";
import { loadProgress, saveProgress, resetProgress, exportProgress, nextMessage } from "./store.js";

const app = document.querySelector("#app");
const live = document.querySelector("#liveRegion");
const menuButton = document.querySelector("#menuButton");
const nav = document.querySelector("#topnav");
const offlineBanner = document.querySelector("#offlineBanner");
const LISTENING_PREP_SECONDS = 5;
let bank = [], progress = loadProgress(), session = null, audioState = null, timer = null;

const MESSAGES = [
  { id:"b1", phase:"business", text:"Jasmine，今天的每一題，都讓 160+ 更靠近一步。" },
  { id:"b2", phase:"business", text:"Business 模式啟動：先抓情境，再鎖定真正的要求。" },
  { id:"b3", phase:"business", text:"數字會干擾你，但語意會帶你找到答案。" },
  { id:"g1", phase:"general", text:"實用英語接棒：旅行、學習與生活情境，穩穩拿下。" },
  { id:"g2", phase:"general", text:"不用一次完美，只要每次多聽懂一點。" },
  { id:"g3", phase:"general", text:"先讀問題，再聽重點；你已經知道怎麼找線索。" },
  { id:"a1", phase:"balanced", text:"You’re not guessing—you’re learning how the test thinks." },
  { id:"a2", phase:"balanced", text:"穩穩聽、仔細讀，B2 已經在路上。" },
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
  const { path, params } = parseHash();
  if (path === "/") renderHome();
  else if (path === "/section") renderSection(params.get("key"));
  else if (path === "/quiz") renderQuiz();
  else if (path === "/review") renderReview();
  else if (path === "/settings") renderSettings();
  else if (path === "/about") renderAbout();
  else renderNotFound();
  app.focus(); window.scrollTo({ top: 0, behavior: "instant" });
}

function renderHome() {
  const phase = datePhase();
  const phaseMessages = MESSAGES.filter(x => x.phase === phase || x.phase === "balanced");
  const recommended = phase === "general" ? "general-listening" : phase === "business" ? "business-listening" : weakestKey();
  const total = progressSummary(progress.attempts);
  app.innerHTML = `<section class="hero"><p class="eyebrow">Your practice space</p><h1>Listen closely. Read confidently.</h1><p class="hero-message">${esc(nextMessage(phaseMessages))}</p><span class="target-pill">Target B2+ · Cambridge scale goal 160+</span></section>
    <section class="grid stats" aria-label="練習摘要"><div class="card stat"><strong>${total.attempts}</strong><span>已作答</span></div><div class="card stat"><strong>${total.accuracy}%</strong><span>目前正確率</span></div><div class="card stat"><strong>${esc(total.band)}</strong><span>練習區間</span></div><div class="card stat"><strong>Local</strong><span>進度只存在本機</span></div></section>
    <section class="card" aria-labelledby="next-title"><span class="tag">今日建議</span><h2 id="next-title">${esc(DOMAIN_LABELS[recommended][0])}</h2><p>${esc(DOMAIN_LABELS[recommended][2])}</p><div class="card-actions"><a class="button" href="#/section?key=${recommended}">開始建議練習</a><a class="button secondary" href="#/review">複習錯題</a></div></section>
    <section class="grid domain-grid" aria-label="四大練習區">${Object.entries(DOMAIN_LABELS).map(([key,d]) => domainCard(key,d)).join("")}</section>
    <p class="footer-note">本網站為原創、非官方練習工具，與 Cambridge 無隸屬或背書關係；練習結果不是正式分數預測。</p>`;
}
function domainCard(key,d) { const stats = progressSummary(progress.attempts,key); return `<article class="card domain-card"><span class="domain-icon" aria-hidden="true">${d[3]}</span><div><h2>${esc(d[0])}</h2><p>${esc(d[1])}</p></div><p>${esc(d[2])}</p><div class="progress-track" aria-label="正確率 ${stats.accuracy}%"><span style="width:${stats.accuracy}%"></span></div><div class="card-actions"><a class="button secondary" href="#/section?key=${key}">${stats.attempts ? "繼續練習" : "開始"}</a></div></article>`; }
function weakestKey() { return Object.keys(DOMAIN_LABELS).sort((a,b) => progressSummary(progress.attempts,a).accuracy - progressSummary(progress.attempts,b).accuracy)[0]; }

function renderSection(key) {
  if (!DOMAIN_LABELS[key]) return renderNotFound();
  const [domain,skill] = key.split("-"); const d = DOMAIN_LABELS[key]; const available = bank.filter(s => domainKey(s) === key); const stats = progressSummary(progress.attempts,key);
  app.innerHTML = `<header class="section-header"><div><span class="tag">${esc(d[1])}</span><h1>${esc(d[0])}</h1><p>${esc(d[2])}</p></div></header>
    <section class="grid stats"><div class="card stat"><strong>${stats.attempts}</strong><span>已作答</span></div><div class="card stat"><strong>${stats.accuracy}%</strong><span>正確率</span></div><div class="card stat"><strong>${available.length}</strong><span>可用題組</span></div><div class="card stat"><strong>${esc(stats.band)}</strong><span>練習區間</span></div></section>
    <section class="grid domain-grid"><article class="card"><span class="tag">Practice</span><h2>練習模式</h2><p>每題作答後立即查看中文解析、答案線索與逐字稿。</p><div class="card-actions"><button class="button" data-start="practice">開始 5 題組</button></div></article><article class="card"><span class="tag">Mock</span><h2>模擬模式</h2><p>完成整組後才顯示解析；聽力最多播放兩次。</p><div class="card-actions"><button class="button" data-start="mock">開始小型模擬</button></div></article></section>
    <div class="notice" role="note">練習區間依本站作答紀錄提供學習提示，並非 Cambridge 正式成績或電腦適性測驗結果。</div>`;
  app.querySelectorAll("[data-start]").forEach(btn => btn.addEventListener("click", () => startSession(domain,skill,btn.dataset.start)));
}

function startSession(domain,skill,mode) {
  const sets = selectSets(bank,{ domain,skill,progress,count: mode === "mock" ? 8 : 5,mock: mode === "mock" });
  if (!sets.length) { announce("這個區域目前還沒有題目"); return; }
  session = { mode, sets, index: 0, responses: {}, results: [], startedAt: Date.now() };
  location.hash = "#/quiz";
}

function renderQuiz() {
  if (!session?.sets?.length) { location.hash = "#/"; return; }
  if (session.index >= session.sets.length) return renderSessionResult();
  const set = session.sets[session.index]; const progressPct = Math.round(session.index / session.sets.length * 100);
  app.innerHTML = `<div class="quiz-head"><div class="quiz-meta"><span>${session.mode === "mock" ? "模擬模式" : "練習模式"}</span><span>${session.index + 1} / ${session.sets.length}</span></div><div class="progress-track"><span style="width:${progressPct}%"></span></div></div>
    <article class="card task-card"><span class="tag">${esc(set.level)} · ${esc(set.topic || set.taskType)}</span><h1>${esc(set.title)}</h1><p class="directions">${esc(set.directions || set.instructions)}</p>${renderStimulus(set)}${set.skill === "listening" ? renderAudio(set) : ""}<form id="answerForm">${set.items.map((item,i) => renderItem(set,item,i)).join("")}<div class="actions"><button class="button" type="submit">${session.mode === "mock" ? "儲存並繼續" : "檢查答案"}</button><button class="button ghost" type="button" id="flagButton">標記題組</button></div></form><div id="feedbackArea"></div></article>`;
  app.querySelector("#answerForm").addEventListener("submit", event => submitSet(event,set));
  app.querySelector("#flagButton").addEventListener("click", () => toggleFlag(set));
  if (set.skill === "listening") initAudio(set);
}
function renderStimulus(set) {
  if (!set.stimulus) return "";
  if (Array.isArray(set.stimulus.texts)) return `<section class="stimulus" aria-label="閱讀材料">${set.stimulus.texts.map(t => `<article class="stimulus-text"><strong>${esc(t.id)}${t.heading ? ` · ${esc(t.heading)}` : ""}</strong><p>${esc(t.text)}</p></article>`).join("")}</section>`;
  const extras = Array.isArray(set.stimulus.removed) ? `<ol>${set.stimulus.removed.map(x => `<li>${esc(x.text ?? x)}</li>`).join("")}</ol>` : "";
  return `<section class="stimulus" aria-label="閱讀材料">${esc(set.stimulus.text || "")}${extras}</section>`;
}
function renderAudio(set) { return `<section class="audio-box" aria-label="聽力播放器"><span class="audio-status" id="audioStatus">準備時間：${LISTENING_PREP_SECONDS} 秒</span><button class="button" id="playButton" type="button" disabled>播放錄音</button><span id="playCount">可播放 ${set.maxPlays || 2} 次</span><audio id="audioElement" preload="metadata"></audio></section>`; }
function renderItem(set,item,i) {
  const name = `answer-${item.id}`;
  const choices = choicesForItem(set,item);
  if (item.responseType === "short_text" || item.responseType === "gap_text") return `<div class="question"><label for="${name}"><strong>${i+1}. ${esc(item.question)}</strong></label><input class="text-answer" id="${name}" name="${name}" autocomplete="off" ${item.maxWords ? `aria-describedby="hint-${item.id}"` : ""}><small id="hint-${item.id}">${item.maxWords ? `最多 ${item.maxWords} 個英文字` : ""}</small></div>`;
  if (item.responseType === "matching") return `<div class="question"><label for="${name}"><strong>${i+1}. ${esc(item.question)}</strong></label><select class="matching-select" id="${name}" name="${name}" required><option value="">請選擇</option>${choices.map(o => `<option value="${esc(o.id)}">${esc(o.id)} · ${esc(o.text)}</option>`).join("")}</select></div>`;
  return `<fieldset class="question"><legend>${i+1}. ${esc(item.question)}</legend>${choices.map(o => `<label class="option"><input type="radio" name="${name}" value="${esc(o.id)}" required><span><strong>${esc(o.id)}</strong> ${esc(o.text)}</span></label>`).join("")}</fieldset>`;
}

function initAudio(set) {
  const status = app.querySelector("#audioStatus"), button = app.querySelector("#playButton"), element = app.querySelector("#audioElement"), count = app.querySelector("#playCount");
  const asset = set.audio?.asset || set.audio?.src; const max = set.maxPlays || 2;
  audioState = { plays: 0, max, ready: false };
  if (asset) {
    element.src = `./${String(asset).replace(/^\.\//,"")}`;
    let remaining = LISTENING_PREP_SECONDS;
    timer = setInterval(() => {
      remaining -= 1;
      status.textContent = `準備時間：${remaining} 秒`;
      if (remaining <= 0) {
        clearInterval(timer); timer = null; audioState.ready = true; button.disabled = false;
        status.textContent = "準備完成，按下播放後請專心聆聽。";
      }
    }, 1000);
  } else { button.disabled = true; status.textContent = "此題音檔尚未完成。"; }
  button.addEventListener("click", async () => { if (!audioState.ready || audioState.plays >= max) return; audioState.plays++; count.textContent = `已播放 ${audioState.plays} / ${max} 次`; button.disabled = true; status.textContent = "播放中…"; try { await element.play(); } catch { audioState.plays = Math.max(0,audioState.plays - 1); count.textContent = `已播放 ${audioState.plays} / ${max} 次`; status.textContent = "音檔暫時無法播放，請檢查網路後重試。"; button.disabled = audioState.plays >= max; } });
  element.addEventListener("ended", () => { status.textContent = "錄音播放完畢。"; button.disabled = audioState.plays >= max; });
  element.addEventListener("error", () => { status.textContent = "音檔尚未下載或暫時無法播放。"; button.disabled = audioState.plays >= max; });
}

function collectResponses(set, form) { return Object.fromEntries(set.items.map(item => [item.id, new FormData(form).get(`answer-${item.id}`) || ""])); }
function submitSet(event,set) {
  event.preventDefault(); const responses = collectResponses(set,event.currentTarget); const result = scoreSet(set,responses); const now = new Date().toISOString();
  result.details.forEach(detail => progress.attempts.push({ attemptId: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`, taskSetId:set.id, questionId:`${set.id}-${detail.item.id}`, domainKey:domainKey(set), taskType:set.taskType, level:set.level, mode:session.mode, answeredAt:now, correct:detail.correct, response:detail.response, playsUsed:audioState?.plays || 0 }));
  saveProgress(progress); session.responses[set.id] = responses; session.results.push({ set, result });
  if (session.mode === "practice") showFeedback(set,result); else advanceSession();
}
function showFeedback(set,result) {
  const area = app.querySelector("#feedbackArea"); app.querySelector("#answerForm").querySelectorAll("input,select,button[type=submit]").forEach(x => x.disabled = true);
  area.innerHTML = `<section aria-labelledby="result-title"><h2 id="result-title" tabindex="-1">本題組 ${result.correct} / ${result.total}</h2>${result.details.map(d => `<div class="feedback ${d.correct ? "good" : "bad"}"><strong>${d.correct ? "答對了" : `正確答案：${esc(Array.isArray(d.item.answer) ? d.item.answer[0] : d.item.answer)}`}</strong><p>${esc(d.item.explanationZh || d.item.explanation?.zhHant || "請對照答案線索。")}</p>${!d.correct && d.item.distractorRationales?.[d.response] ? `<p>為什麼不是這個答案：${esc(d.item.distractorRationales[d.response])}</p>` : ""}<p><em>線索：</em> ${esc(d.item.evidence || "—")}</p></div>`).join("")}${set.skill === "listening" ? transcript(set) : ""}<div class="actions"><button class="button" id="nextButton">${session.index + 1 >= session.sets.length ? "查看結果" : "下一題組"}</button></div></section>`;
  area.querySelector("#nextButton").addEventListener("click", advanceSession); area.querySelector("#result-title").focus?.(); announce(`本題組答對 ${result.correct} 題，共 ${result.total} 題`);
}
function transcript(set) { const segments = set.audio?.segments || []; return `<details class="transcript"><summary>查看逐字稿（AI 生成語音）</summary>${segments.map(s => `<p><strong>${esc(s.speaker)}：</strong>${esc(s.text)}</p>`).join("")}</details>`; }
function advanceSession() { session.index++; renderQuiz(); window.scrollTo(0,0); }
function toggleFlag(set) { const id = set.id; const index = progress.flaggedQuestionIds.indexOf(id); if (index >= 0) progress.flaggedQuestionIds.splice(index,1); else progress.flaggedQuestionIds.push(id); saveProgress(progress); announce(index >= 0 ? "已取消標記" : "已標記題組"); }

function renderSessionResult() {
  const correct = session.results.reduce((sum,x) => sum + x.result.correct,0); const total = session.results.reduce((sum,x) => sum + x.result.total,0); const pct = total ? Math.round(correct/total*100) : 0;
  app.innerHTML = `<section class="hero"><p class="eyebrow">Practice complete</p><h1>完成這一輪練習</h1><p class="hero-message">${correct} / ${total}，正確率 ${pct}%</p><span class="target-pill">練習結果，不是正式 Cambridge 分數</span></section>${session.mode === "mock" ? `<section class="review-list" style="margin-top:1rem">${session.results.map(({set,result}) => `<article class="card"><span class="tag">${esc(set.title)}</span><h2>${result.correct} / ${result.total}</h2>${result.details.map(d => `<div class="feedback ${d.correct ? "good" : "bad"}"><strong>${esc(d.item.question)}</strong><p>${d.correct ? "答對了" : `你的答案：${esc(d.response || "未作答")}；正確答案：${esc(Array.isArray(d.item.answer) ? d.item.answer[0] : d.item.answer)}`}</p><p>${esc(d.item.explanationZh || "")}</p></div>`).join("")}${set.skill === "listening" ? transcript(set) : ""}</article>`).join("")}</section>` : ""}<div class="actions" style="margin-top:1rem"><a class="button" href="#/section?key=${domainKey(session.sets[0])}">再練一輪</a><a class="button secondary" href="#/">回首頁</a></div>`;
}

function renderReview() {
  const wrong = [...progress.attempts].reverse().filter(a => !a.correct); const flagged = new Set(progress.flaggedQuestionIds);
  app.innerHTML = `<header class="section-header"><div><span class="tag">Review</span><h1>錯題複習</h1><p>最近的錯誤會保留在這台裝置上，讓你看見真正需要補強的題型。</p></div></header>${wrong.length ? `<section class="review-list">${wrong.slice(0,50).map(a => `<article class="card review-row"><strong>${esc(a.taskSetId)} · ${esc(a.questionId)}</strong><span>${esc(DOMAIN_LABELS[a.domainKey]?.[0] || a.domainKey)} · ${esc(a.taskType)}</span><span class="tag">${esc(a.level)}</span></article>`).join("")}</section>` : `<div class="card empty">目前沒有錯題紀錄。完成一些練習後再回來看看。</div>`}${flagged.size ? `<p class="footer-note">另有 ${flagged.size} 個已標記題組。</p>` : ""}`;
}
function renderSettings() {
  app.innerHTML = `<header class="section-header"><div><span class="tag">Settings</span><h1>設定與資料</h1><p>進度只儲存在目前瀏覽器，不會上傳。</p></div></header><section class="card settings-grid"><div class="setting-row"><strong>匯出練習紀錄</strong><span>下載 JSON 備份，可保留目前的作答紀錄。</span><button class="button secondary" id="exportButton">匯出進度</button></div><div class="setting-row"><strong>清除所有本機紀錄</strong><span>此動作無法復原，請先匯出備份。</span><button class="button danger" id="resetButton">清除進度</button></div></section>`;
  app.querySelector("#exportButton").addEventListener("click", () => exportProgress(progress));
  app.querySelector("#resetButton").addEventListener("click", () => { if (confirm("確定要清除這台裝置上的所有練習紀錄嗎？")) { resetProgress(); progress = loadProgress(); announce("已清除本機練習紀錄"); renderSettings(); } });
}
function renderAbout() {
  app.innerHTML = `<header class="section-header"><div><span class="tag">About</span><h1>關於這個練習站</h1></div></header><section class="card"><h2>原創、非官方的學習工具</h2><p>本網站為 Jasmine 製作的 Listening 與 Reading 練習，涵蓋 Business 與 General 情境。本站與 Cambridge University Press & Assessment 無隸屬、合作或背書關係，也不使用真實考題。</p><h2>分數說明</h2><p>正確率、練習區間與學習建議只反映本站原創題目的表現，不是正式 Linguaskill 成績、證書或分數預測。</p><h2>聽力與 AI 語音</h2><p>所有聽力腳本均為原創；語音由 AI 生成，不是真人或 Cambridge 考試錄音。逐字稿只會在練習作答後或模擬完成後顯示。</p><h2>隱私</h2><p>本站不設帳號、不使用追蹤分析，也不會上傳進度。作答紀錄只存在目前瀏覽器；清除網站資料或更換裝置後可能遺失。</p></section>`;
}
function renderNotFound() { app.innerHTML = `<div class="card empty"><h1>找不到這個頁面</h1><a class="button" href="#/">回首頁</a></div>`; }

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
