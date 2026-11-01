import assert from "node:assert/strict";
import { applyVocabularyReview, cardIsDue, normaliseVocabulary, selectVocabularyCards, shuffleVocabularyCards, vocabularySummary } from "../../src/js/vocabulary.js";

const now = Date.parse("2026-11-01T00:00:00Z");
const cards = normaliseVocabulary({cards:[
  {id:"allocate",word:"allocate",domains:["business"],level:"B2",sprint:true,rank:1,examples:[{},{},{}]},
  {id:"journey",word:"journey",domains:["general"],level:"B2+",sprint:true,rank:2,examples:[{},{},{}]},
  {id:"simple",word:"simple",domains:["general"],level:"Foundation",sprint:false,rank:3,examples:[{},{},{}]},
]});

let progress = {schemaVersion:1,cards:{}};
progress = applyVocabularyReview(progress,"allocate",true,{now});
assert.equal(progress.cards.allocate.reps,1);
assert.equal(progress.cards.allocate.step,0);
assert.equal(cardIsDue(progress.cards.allocate,now),false);
assert.equal(cardIsDue(progress.cards.allocate,now + 86400000),true);

progress = applyVocabularyReview(progress,"allocate",false,{now:now + 1000});
assert.equal(progress.cards.allocate.lapses,1);
assert.equal(progress.cards.allocate.step,-1);
assert.equal(progress.cards.allocate.dueAt,null);
assert.equal(cardIsDue(progress.cards.allocate,now + 86400000),false);
assert.deepEqual(selectVocabularyCards(cards,{domain:"all",mode:"forgotten",progress,now}).map(card => card.id),["allocate"]);

progress = applyVocabularyReview(progress,"allocate",true,{now:now + 2000});
assert.equal(progress.cards.allocate.lastResult,"remembered");
assert.equal(progress.cards.allocate.step,0);
assert.deepEqual(selectVocabularyCards(cards,{domain:"all",mode:"forgotten",progress,now}).map(card => card.id),[]);

const hinted = applyVocabularyReview({schemaVersion:1,cards:{allocate:{step:4,reps:5,lapses:0}}},"allocate",true,{usedChinese:true,now});
assert.equal(Date.parse(hinted.cards.allocate.dueAt),now + 86400000);

const businessSprint = selectVocabularyCards(cards,{domain:"business",mode:"sprint",progress:{cards:{}},now});
assert.deepEqual(businessSprint.map(card => card.id),["allocate"]);
const generalFull = selectVocabularyCards(cards,{domain:"general",mode:"full",progress:{cards:{}},now});
assert.deepEqual(generalFull.map(card => card.id),["journey","simple"]);
const shuffled = shuffleVocabularyCards(generalFull,() => 0);
assert.deepEqual(shuffled.map(card => card.id),["simple","journey"]);
assert.deepEqual(generalFull.map(card => card.id),["journey","simple"]);
assert.deepEqual(vocabularySummary(cards,progress,"business",now + 86400000 + 2000),{total:1,reviewed:1,mastered:0,due:1,forgotten:0});

console.log("Vocabulary logic tests passed.");
