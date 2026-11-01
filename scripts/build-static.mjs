import { cp, mkdir, rm, access, readFile, readdir, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { createHash } from "node:crypto";
import { join, relative, resolve } from "node:path";

const root = resolve(import.meta.dirname,"..");
const dist = resolve(root,"dist");
await rm(dist,{recursive:true,force:true});
await mkdir(dist,{recursive:true});
await cp(resolve(root,"src"),dist,{recursive:true});
await cp(resolve(root,"public"),dist,{recursive:true});
const bank = resolve(root,"content","questions.json");
try {
  await access(bank,constants.R_OK);
  const questionBank = JSON.parse(await readFile(bank,"utf8"));
  const omitted = [];
  const deployableSets = [];
  for (const set of questionBank.sets || []) {
    if (set.skill === "listening" && set.audio?.asset) {
      try { await access(resolve(root,"public",set.audio.asset),constants.R_OK); }
      catch { omitted.push(set.id); continue; }
    }
    deployableSets.push(set);
  }
  await mkdir(resolve(dist,"content"),{recursive:true});
  await writeFile(resolve(dist,"content","questions.json"),JSON.stringify({ ...questionBank, sets:deployableSets },null,2),"utf8");
  if (omitted.length) console.warn(`Omitted ${omitted.length} listening sets without generated audio: ${omitted.join(", ")}`);
}
catch { console.warn("No production question bank found; demo bank only."); }

const vocabulary = resolve(root,"content","vocabulary.json");
try {
  await access(vocabulary,constants.R_OK);
  await mkdir(resolve(dist,"content"),{recursive:true});
  await cp(vocabulary,resolve(dist,"content","vocabulary.json"));
} catch { console.warn("No production vocabulary library found."); }

async function filesUnder(directory) {
  const files = [];
  for (const entry of await readdir(directory,{withFileTypes:true})) {
    const full = join(directory,entry.name);
    if (entry.isDirectory()) files.push(...await filesUnder(full));
    else if (entry.isFile()) files.push(full);
  }
  return files;
}

const serviceWorker = resolve(dist,"service-worker.js");
const hash = createHash("sha256");
hash.update(await readFile(resolve(root,"public","service-worker.js")));
for (const file of (await filesUnder(dist)).filter(file => file !== serviceWorker).sort()) {
  hash.update(relative(dist,file).replaceAll("\\","/"));
  hash.update(await readFile(file));
}
const version = `jlp-shell-${hash.digest("hex").slice(0,12)}`;
const workerSource = (await readFile(serviceWorker,"utf8")).replace("__BUILD_VERSION__",version);
await writeFile(serviceWorker,workerSource,"utf8");
console.log(`Built static site at ${dist} (${version})`);
