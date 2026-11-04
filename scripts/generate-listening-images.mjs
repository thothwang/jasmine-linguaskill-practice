#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname,"..");
const output = resolve(root,"src","assets","listening");
await mkdir(output,{ recursive:true });

const shell = (title,body,background="#eef7f5") => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 450" role="img" aria-label="${title}">
  <rect width="600" height="450" fill="${background}"/>
  ${body}
</svg>
`;

function doorScene({ title, door="#2778a5", key="mat" }) {
  const keyShape = `<g fill="none" stroke="#d69227" stroke-width="10" stroke-linecap="round"><circle cx="0" cy="0" r="16"/><path d="M16 0h48m-14 0v18m-18-18v13"/></g>`;
  return shell(title,`
  <rect x="56" y="55" width="488" height="342" rx="12" fill="#fff9ec" stroke="#294b58" stroke-width="7"/>
  <rect x="220" y="105" width="170" height="292" rx="7" fill="${door}" stroke="#294b58" stroke-width="7"/>
  <circle cx="360" cy="252" r="10" fill="#f4c05d"/>
  <rect x="196" y="385" width="218" height="35" rx="8" fill="#8a684f"/>
  <path d="M94 145h92l-13 100H107z" fill="#b97743" stroke="#294b58" stroke-width="6"/>
  <path d="M106 145c10-55 58-55 68 0" fill="none" stroke="#294b58" stroke-width="6"/>
  <g fill="#4f9d61"><circle cx="119" cy="143" r="29"/><circle cx="151" cy="136" r="31"/><circle cx="169" cy="159" r="24"/></g>
  <g transform="${key === "mat" ? "translate(292 402) scale(.65)" : "translate(134 194) scale(.65)"}">${keyShape}</g>
  <path d="M60 397h480" stroke="#294b58" stroke-width="7"/>`);
}

function roomScene({ title, layout, table }) {
  const chair = (x,y,angle=0) => `<g transform="translate(${x} ${y}) rotate(${angle})"><rect x="-16" y="-12" width="32" height="24" rx="7" fill="#f3a53f" stroke="#294b58" stroke-width="4"/><path d="M-12 12v11m24-11v11" stroke="#294b58" stroke-width="4"/></g>`;
  let chairs = "";
  if (layout === "rows") {
    for (const y of [170,240,310]) for (const x of [170,260,350,440]) chairs += chair(x,y);
  } else if (layout === "semicircle") {
    [[135,290,-45],[175,235,-30],[235,200,-12],[300,188,0],[365,200,12],[425,235,30],[465,290,45]].forEach(args => chairs += chair(...args));
  } else {
    [[300,168,0],[390,195,35],[438,270,75],[390,340,130],[300,360,180],[210,340,225],[162,270,285],[210,195,325]].forEach(args => chairs += chair(...args));
  }
  const tableShape = table === "front"
    ? `<rect x="205" y="102" width="190" height="45" rx="8" fill="#75a989" stroke="#294b58" stroke-width="5"/>`
    : table === "back"
      ? `<rect x="205" y="365" width="190" height="45" rx="8" fill="#75a989" stroke="#294b58" stroke-width="5"/>`
      : `<rect x="490" y="210" width="65" height="150" rx="8" fill="#75a989" stroke="#294b58" stroke-width="5"/>`;
  return shell(title,`
  <rect x="45" y="45" width="510" height="365" rx="16" fill="#fff" stroke="#294b58" stroke-width="7"/>
  <rect x="205" y="66" width="190" height="28" rx="5" fill="#cce8e5" stroke="#294b58" stroke-width="4"/>
  ${tableShape}${chairs}`);
}

function routeScene({ title, route }) {
  const path = route === "left"
    ? "M95 390 C155 330 240 325 285 275 L310 225 C350 185 380 135 320 85"
    : route === "right"
      ? "M95 390 C155 330 240 325 285 275 L310 225 C350 185 405 150 505 105"
      : "M95 390 C155 330 170 275 125 220 C105 190 120 145 185 110";
  return shell(title,`
  <path d="M40 322c95-72 170-43 250-90s150-25 270-120" fill="none" stroke="#c9b69b" stroke-width="34" stroke-linecap="round"/>
  <ellipse cx="120" cy="175" rx="75" ry="48" fill="#9ed7e7" stroke="#37778b" stroke-width="5"/>
  <g stroke="#7f5e3f" stroke-width="9"><path d="M246 258l94-42"/><path d="M250 275l94-42"/></g>
  <g fill="#4d9460" stroke="#2f6842" stroke-width="3"><path d="M360 164l27-67 27 67z"/><path d="M400 171l27-74 27 74z"/><path d="M440 166l27-65 27 65z"/></g>
  <rect x="486" y="62" width="72" height="60" rx="8" fill="#f2d697" stroke="#294b58" stroke-width="5"/><path d="M500 95h44" stroke="#294b58" stroke-width="5"/>
  <path d="${path}" fill="none" stroke="#d65145" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="95" cy="390" r="15" fill="#176b66"/><path d="M492 106l20 0-10-15m10 15-10 15" fill="none" stroke="#d65145" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>`);
}

const images = {
  "key-under-blue-mat.svg": doorScene({ title:"Key beneath the mat at a blue door", key:"mat" }),
  "key-in-blue-door-basket.svg": doorScene({ title:"Key in a hanging basket beside a blue door", key:"basket" }),
  "key-in-red-door-basket.svg": doorScene({ title:"Key in a hanging basket beside a red door", door:"#b9564f", key:"basket" }),
  "room-rows-front-table.svg": roomScene({ title:"Rows of chairs and a table at the front", layout:"rows", table:"front" }),
  "room-semicircle-back-table.svg": roomScene({ title:"Semicircle of chairs and a table at the back", layout:"semicircle", table:"back" }),
  "room-circle-side-table.svg": roomScene({ title:"Circle of chairs and a table at the side", layout:"circle", table:"side" }),
  "route-bridge-left.svg": routeScene({ title:"Route crossing the bridge then turning left", route:"left" }),
  "route-bridge-right.svg": routeScene({ title:"Route crossing the bridge then turning right", route:"right" }),
  "route-lake-before-bridge.svg": routeScene({ title:"Route turning beside the lake before the bridge", route:"lake" }),
};

for (const [name,source] of Object.entries(images)) await writeFile(resolve(output,name),source,"utf8");
console.log(`Wrote ${Object.keys(images).length} listening image assets to ${output}`);

