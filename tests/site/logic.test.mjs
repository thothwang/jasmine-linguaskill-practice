import assert from "node:assert/strict";
import { normaliseBank, isCorrect, scoreSet, datePhase, selectSets, progressSummary, choicesForItem } from "../../src/js/logic.js";

const set = { id:"s1",domain:"business",skill:"reading",level:"B2",items:[
  {id:"q1",responseType:"single_choice",answer:"B",options:[]},
  {id:"q2",responseType:"short_text",answer:["project plan","the project plan"],maxWords:3}
]};
assert.equal(normaliseBank({sets:[set]}).length,1);
assert.equal(isCorrect(set.items[0],"B"),true);
assert.equal(isCorrect(set.items[0],"A"),false);
assert.equal(isCorrect(set.items[1],"Project plan."),true);
assert.equal(isCorrect(set.items[1],"a very long project plan"),false);
assert.deepEqual(scoreSet(set,{q1:"B",q2:"the project plan"}),{correct:2,total:2,details:[
  {item:set.items[0],response:"B",correct:true},{item:set.items[1],response:"the project plan",correct:true}
]});
assert.equal(datePhase(new Date("2026-11-04T03:00:00Z")),"business");
assert.equal(datePhase(new Date("2026-11-06T03:00:00Z")),"general");
assert.equal(datePhase(new Date("2026-11-08T03:00:00Z")),"balanced");
const selected = selectSets([set,{...set,id:"s2",level:"C1"}],{domain:"business",skill:"reading",progress:{attempts:[{taskSetId:"s1"}]},count:1});
assert.equal(selected[0].id,"s2");
assert.deepEqual(progressSummary(Array.from({length:8},(_,i)=>({correct:i<6}))),{attempts:8,correct:6,accuracy:75});
const dualMatching = { sharedOptions:[
  {id:"S1",text:"Situation one"},{id:"S2",text:"Situation two"},
  {id:"L1",text:"Lesson one"},{id:"L2",text:"Lesson two"}
]};
assert.deepEqual(choicesForItem(dualMatching,{responseType:"matching",answer:"S2"}).map(x=>x.id),["S1","S2"]);
assert.deepEqual(choicesForItem(dualMatching,{responseType:"matching",answer:"L1"}).map(x=>x.id),["L1","L2"]);
console.log("site logic tests passed");
