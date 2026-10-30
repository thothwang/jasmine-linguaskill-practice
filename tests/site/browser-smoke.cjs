const { chromium } = require("playwright");
const { pathToFileURL } = require("node:url");
const { resolve } = require("node:path");

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PLAYWRIGHT_BROWSER || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    args: ["--allow-file-access-from-files"]
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
  const failures = [];
  page.on("pageerror", error => failures.push(`pageerror: ${error.message}`));
  page.on("console", message => { if (message.type() === "error") failures.push(`console: ${message.text()}`); });
  const target = process.env.SITE_URL || pathToFileURL(resolve(__dirname,"..","..","dist","index.html")).href;
  await page.goto(target, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Listen closely. Read confidently." }).waitFor();
  const cards = await page.locator(".domain-card").count();
  if (cards !== 4) throw new Error(`Expected four domain cards, found ${cards}`);
  await page.getByRole("link", { name: "開始", exact: true }).first().click();
  await page.getByRole("heading", { name: "職場聽力" }).waitFor();
  await page.getByRole("button", { name: "開始 5 題組" }).click();
  const playButton = page.getByRole("button", { name: "播放錄音" });
  await playButton.waitFor();
  if (!(await playButton.isDisabled())) throw new Error("Listening play button should wait for the five-second preparation period");
  const audioStatus = await page.locator("#audioStatus").textContent();
  if (audioStatus !== "準備時間：5 秒") throw new Error(`Expected a five-second countdown, found ${audioStatus}`);
  const audioSource = await page.locator("#audioElement").getAttribute("src");
  if (!audioSource?.endsWith(".mp3")) throw new Error(`Expected a linked MP3 source, found ${audioSource}`);
  await page.waitForFunction(() => !document.querySelector("#playButton")?.disabled, null, { timeout: 7000 });
  if ((await page.locator("#audioStatus").textContent()) !== "準備完成，按下播放後請專心聆聽。") {
    throw new Error("Listening player did not become ready after five seconds");
  }
  await page.goto(target, { waitUntil: "networkidle" });
  await page.getByRole("link", { name: "開始", exact: true }).nth(1).click();
  await page.getByRole("heading", { name: "職場閱讀" }).waitFor();
  await page.getByRole("button", { name: "開始 5 題組" }).click();
  await page.locator("#answerForm").waitFor();
  for (const fieldset of await page.locator("fieldset.question").all()) await fieldset.locator("input").first().check();
  for (const select of await page.locator("select.matching-select").all()) await select.selectOption({ index: 1 });
  for (const input of await page.locator("input.text-answer").all()) await input.fill("answer");
  await page.getByRole("button", { name: "檢查答案" }).click();
  await page.getByRole("heading", { name: /^本題組/ }).waitFor();
  const attempts = await page.evaluate(() => JSON.parse(localStorage.getItem("jlp.progress.v1") || "{}").attempts?.length || 0);
  if (!attempts) throw new Error("No attempt was persisted to localStorage");
  if (failures.length) throw new Error(failures.join("\n"));
  console.log(`browser smoke passed: ${cards} domain cards, ${attempts} attempts saved`);
  await browser.close();
})().catch(error => { console.error(error); process.exitCode = 1; });
