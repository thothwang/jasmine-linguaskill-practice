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
try { await access(bank,constants.R_OK); await mkdir(resolve(dist,"content"),{recursive:true}); await cp(bank,resolve(dist,"content","questions.json")); }
catch { console.warn("No production question bank found; demo bank only."); }

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
