const { chromium } = require("playwright");
const { pathToFileURL } = require("node:url");
const { resolve } = require("node:path");
const bank = require("../../content/questions.json");

async function fillSet(page,set,useAnswers) {
  for (const item of set.items) {
    const name = `answer-${item.id}`;
    const answer = Array.isArray(item.answer) ? item.answer[0] : item.answer;
    if (item.responseType === "short_text" || item.responseType === "gap_text") {
      await page.locator(`[name="${name}"]`).fill(useAnswers ? String(answer) : "definitely wrong");
    } else if (item.responseType === "matching") {
      const select = page.locator(`[name="${name}"]`);
      if (useAnswers) await select.selectOption(String(answer));
      else {
        const values = await select.locator("option").evaluateAll(options => options.map(option => option.value).filter(Boolean));
        await select.selectOption(values.find(value => value !== String(answer)));
      }
    } else {
      const choice = useAnswers ? page.locator(`[name="${name}"][value="${answer}"]`) : page.locator(`[name="${name}"]:not([value="${answer}"])`).first();
      await choice.check();
    }
  }
}

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PLAYWRIGHT_BROWSER || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    args: ["--allow-file-access-from-files"]
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
  await page.addInitScript(() => {
    HTMLMediaElement.prototype.play = function () { return Promise.resolve(); };
    HTMLMediaElement.prototype.pause = function () {};
  });
  const failures = [];
  page.on("pageerror", error => failures.push(`pageerror: ${error.message}`));
  page.on("console", message => { if (message.type() === "error") failures.push(`console: ${message.text()}`); });
  page.on("requestfailed", request => failures.push(`request: ${request.url()} ${request.failure()?.errorText || "failed"}`));
  const target = process.env.SITE_URL || pathToFileURL(resolve(__dirname,"..","..","dist","index.html")).href;

  await page.goto(target, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Listen closely. Read confidently." }).waitFor();
  const cards = await page.locator(".domain-card").count();
  if (cards !== 4) throw new Error(`Expected four domain cards, found ${cards}`);
  if (await page.getByText("今日建議").count()) throw new Error("Homepage still shows 今日建議");
  if (await page.getByText(/Target B2|Local|練習區間/).count()) throw new Error("Homepage still shows a removed label");
  if (await page.locator("#topnav a",{hasText:"主選單"}).count() !== 1) throw new Error("Top navigation lacks 主選單");
  if (await page.locator("#topnav a",{hasText:"四大練習區"}).count() !== 0) throw new Error("Top navigation still contains the redundant 四大練習區 link");

  await page.getByRole("link", { name: /開始|繼續練習/, exact: true }).first().click();
  await page.getByRole("heading", { name: "職場聽力" }).waitFor();
  if (!(await page.locator(".stat").nth(0).textContent()).includes("題組數")) throw new Error("Section lacks task-set count");
  if (!(await page.locator(".stat").nth(1).textContent()).includes("題目數")) throw new Error("Section lacks question count");
  await page.getByRole("button", { name: "開始練習" }).click();
  const audioButton = page.locator("#playButton");
  await audioButton.waitFor();
  if (await page.getByRole("button", { name: "標記題組" }).count()) throw new Error("Quiz still contains 標記題組");
  if (!(await page.getByText("錄音將播放兩次，中間會短暫停頓。").count())) throw new Error("Listening wording does not promise two plays");
  await audioButton.click();
  await page.waitForFunction(() => document.querySelector("#audioStatus")?.textContent === "準備時間：5 秒", null, { timeout: 3000 });
  await page.waitForFunction(() => document.querySelector("#audioStatus")?.textContent === "第 1 次播放中…", null, { timeout: 7000 });
  await page.locator("#audioElement").dispatchEvent("ended");
  await page.waitForFunction(() => document.querySelector("#audioStatus")?.textContent === "第 2 次播放中…", null, { timeout: 3000 });
  await page.locator("#audioElement").dispatchEvent("ended");
  await page.waitForFunction(() => !document.querySelector("#submitButton")?.disabled);
  if ((await page.locator("#playCount").textContent()) !== "錄音已播放兩次。") throw new Error("Listening did not complete exactly two plays");

  await page.goto(`${target}#/section?key=business-reading`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "職場閱讀" }).waitFor();
  if (await page.getByText(/錄音|播放兩次/).count()) throw new Error("Reading section mentions listening playback");
  await page.getByRole("button", { name: "開始練習" }).click();
  await page.locator("#answerForm").waitFor();
  const title = await page.locator(".task-card h1").textContent();
  const set = bank.sets.find(candidate => candidate.title === title);
  if (!set) throw new Error(`Could not resolve source set for ${title}`);
  await fillSet(page,set,false);
  await page.getByRole("button", { name: "檢查答案" }).click();
  await page.getByRole("heading", { name: /^本題組/ }).waitFor();
  if (!(await page.getByRole("button", { name: "下一題組" }).count())) throw new Error("Feedback lacks 下一題組");
  if (!(await page.locator("#feedbackArea").getByRole("link", { name: "回主選單" }).count())) throw new Error("Feedback lacks 回主選單");
  if (await page.getByText("換一種類", { exact: true }).count()) throw new Error("Feedback still contains 換一種類");
  if (await page.getByText("結束練習", { exact: true }).count()) throw new Error("Feedback still contains 結束練習");

  await page.evaluate(() => { location.hash = "#/review"; });
  await page.getByRole("heading", { name: "錯題複習" }).waitFor();
  const redo = page.locator(`[data-redo="${set.id}"]`).first();
  await redo.waitFor();
  const reviewText = await page.locator(".review-row").first().textContent();
  if (reviewText.includes(set.id) || /-q\d/.test(reviewText)) throw new Error("Review exposes an internal ID");
  await redo.click();
  await page.locator("#answerForm").waitFor();
  await fillSet(page,set,true);
  await page.getByRole("button", { name: "檢查答案" }).click();
  await page.getByRole("heading", { name: /^本題組/ }).waitFor();
  await page.evaluate(() => { location.hash = "#/review"; });
  await page.getByRole("heading", { name: "錯題複習" }).waitFor();
  if (await page.locator(`[data-redo="${set.id}"]`).count()) throw new Error("Successfully redone wrong items remain active");

  const attempts = await page.evaluate(() => JSON.parse(localStorage.getItem("jlp.progress.v1") || "{}").attempts?.length || 0);
  if (!attempts) throw new Error("No attempt was persisted to localStorage");
  if (failures.length) throw new Error(failures.join("\n"));
  console.log(`browser smoke passed: ${cards} cards, automatic two-play listening, review resolution, ${attempts} attempts`);
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
