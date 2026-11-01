#!/usr/bin/env python3
"""Build the deployable vocabulary library from open, attributed sources.

Run from the repository root after downloading the source files documented in
docs/content/VOCABULARY_SOURCES.md. The generated JSON is committed so the
browser never needs third-party services or API keys.
"""

from __future__ import annotations

import bz2
import csv
import json
import re
from collections import defaultdict
from pathlib import Path

from opencc import OpenCC


ROOT = Path(__file__).resolve().parents[2]
TOOLS = ROOT / ".tools" / "vocabulary-sources"
OUTPUT = ROOT / "content" / "vocabulary.json"
SOURCES = ROOT / "content" / "vocabulary-sources"
CONVERTER = OpenCC("s2twp")

BAD_FRAGMENTS = {
    "kill yourself", "porn", "nigger", "faggot", "rape", "suicide", "nazi",
}


def clean_word(value: str) -> str:
    return value.strip().lower().replace("’", "'")


def add_word(catalog: dict, word: str, source: str, rank: int) -> None:
    word = clean_word(word)
    if not re.fullmatch(r"[a-z][a-z' -]{1,38}", word):
        return
    row = catalog.setdefault(word, {"sources": {}, "domains": set()})
    row["sources"][source] = min(rank, row["sources"].get(source, rank))
    if source == "bsl":
        row["domains"].add("business")
    elif source in {"ngsl", "supplementary"}:
        row["domains"].add("general")
    else:
        row["domains"].update(("business", "general"))


def load_lists() -> dict:
    catalog: dict[str, dict] = {}
    with (SOURCES / "ngsl-1.2-stats.csv").open(encoding="utf-8-sig", newline="") as handle:
        for row in csv.DictReader(handle):
            add_word(catalog, row["Lemma"], "ngsl", int(row["SFI Rank"]))
    for source, filename in (("bsl", "bsl-1.2.csv"), ("nawl", "nawl-1.2.csv")):
        # The official teaching CSVs contain a small number of Windows-1252
        # punctuation bytes even though most rows are plain ASCII.
        with (SOURCES / filename).open(encoding="cp1252", newline="") as handle:
            for rank, row in enumerate(csv.reader(handle), start=1):
                if row:
                    add_word(catalog, row[0], source, rank)
    with (SOURCES / "ngsl-supplementary.csv").open(encoding="utf-8-sig", newline="") as handle:
        for rank, row in enumerate(csv.reader(handle), start=1):
            if row:
                add_word(catalog, row[0], "supplementary", rank)
    return catalog


def clean_lines(value: str, limit: int = 3) -> list[str]:
    lines = []
    for raw in re.split(r"\\n|\n", value or ""):
        line = raw.strip(" ;")
        if not line or re.match(r"^\[(?:網路|网络|化|醫|医|法|計|计|經|经)\]", line):
            continue
        line = re.sub(r"\s+", " ", line)
        if line not in lines:
            lines.append(line)
        if len(lines) >= limit:
            break
    return lines


def primary_pos(raw_pos: str, translation: str) -> str:
    scores = []
    for part in (raw_pos or "").split("/"):
        match = re.fullmatch(r"([a-z]+):(\d+)", part)
        if match:
            scores.append((int(match.group(2)), match.group(1)))
    code = max(scores, default=(0, ""))[1]
    if not code:
        prefix = re.match(r"^(n|v|vt|vi|a|adj|ad|adv|prep|conj|pron)\.", translation or "", re.I)
        code = prefix.group(1).lower() if prefix else ""
    return {
        "n": "noun", "v": "verb", "vt": "verb", "vi": "verb",
        "a": "adjective", "adj": "adjective", "ad": "adverb", "adv": "adverb",
        "prep": "preposition", "conj": "conjunction", "pron": "pronoun",
    }.get(code, "word")


def load_dictionary(targets: set[str]) -> dict[str, dict]:
    found = {}
    with (TOOLS / "ecdict.csv").open(encoding="utf-8", newline="", errors="replace") as handle:
        for row in csv.DictReader(handle):
            word = clean_word(row.get("word", ""))
            if word not in targets or word in found:
                continue
            translations = clean_lines(row.get("translation", ""))
            definitions = clean_lines(row.get("definition", ""), 2)
            found[word] = {
                "phonetic": (row.get("phonetic") or "").strip(),
                "definitionEn": " · ".join(definitions)[:320],
                "definitionZh": CONVERTER.convert("；".join(translations))[:240],
                "partOfSpeech": primary_pos(row.get("pos", ""), row.get("translation", "")),
            }
    return found


def load_examples(targets: set[str]) -> dict[str, list[dict]]:
    examples: dict[str, list[dict]] = defaultdict(list)
    seen_by_word: dict[str, set[str]] = defaultdict(set)
    token_re = re.compile(r"[A-Za-z]+(?:['-][A-Za-z]+)*")
    def add_rows(path: Path, *, cc0: bool, eligible: set[str]) -> None:
        with bz2.open(path, "rt", encoding="utf-8", errors="replace") as handle:
            for line in handle:
                pieces = line.rstrip("\n").split("\t")
                if len(pieces) < 3:
                    continue
                sentence_id, _, sentence = pieces[:3]
                lowered = sentence.lower()
                words = token_re.findall(lowered)
                if not 5 <= len(words) <= 18 or any(fragment in lowered for fragment in BAD_FRAGMENTS):
                    continue
                if not sentence.endswith((".", "?", "!")) or "http" in lowered:
                    continue
                present = set(words) & eligible
                for word in present:
                    if len(examples[word]) < 8 and sentence_id not in seen_by_word[word]:
                        examples[word].append({
                            "text": sentence,
                            "sourceId": sentence_id,
                            "sourceUser": None if cc0 else (pieces[3] if len(pieces) > 3 else None),
                            "sourceLicense": "CC0" if cc0 else "CC BY 2.0 FR",
                        })
                        seen_by_word[word].add(sentence_id)

    add_rows(TOOLS / "eng_sentences_CC0.tsv.bz2", cc0=True, eligible=targets)
    # Only words with fewer than three public-domain examples need the larger
    # attributed export. The per-card source link and author are retained.
    missing = {word for word in targets if len(examples[word]) < 3}
    if missing:
        add_rows(TOOLS / "eng_sentences_detailed.tsv.bz2", cc0=False, eligible=missing)
    for word, rows in examples.items():
        rows.sort(key=lambda row: (abs(len(row["text"].split()) - 10), len(row["text"]), int(row["sourceId"])))
        examples[word] = rows[:3]
    return examples


def template_examples(word: str, pos: str, domains: set[str]) -> list[dict]:
    title = word[:1].upper() + word[1:]
    if "business" in domains:
        setting = "The report"
        situation = "the meeting"
    else:
        setting = "The article"
        situation = "the discussion"
    if pos == "noun":
        texts = [
            f"{setting} highlights the importance of {word}.",
            f"They talked about {word} during {situation}.",
            f"{title} can affect how people make decisions.",
        ]
    elif pos == "verb":
        texts = [
            f"The team may need to {word} before making a decision.",
            f"They agreed to {word} when the situation changed.",
            f"A clear plan can help people {word} effectively.",
        ]
    elif pos == "adjective":
        texts = [
            f"The manager described the proposal as {word}.",
            f"It was a {word} response to an unexpected problem.",
            f"The situation became more {word} as the day continued.",
        ]
    elif pos == "adverb":
        texts = [
            f"The team responded {word} to the request.",
            f"She explained the process {word} during the meeting.",
            f"The two systems operate {word} in practice.",
        ]
    else:
        texts = [
            f"The article uses the word {word} in an important context.",
            f"Listen for {word} when the speaker explains the situation.",
            f"The meaning of {word} becomes clearer from the whole sentence.",
        ]
    return [{"text": text, "sourceId": None, "sourceUser": None, "sourceLicense": "Original"} for text in texts]


def level_for(row: dict) -> str:
    sources = row["sources"]
    if "supplementary" in sources and len(sources) == 1:
        return "Foundation"
    if "nawl" in sources:
        return "C1" if sources["nawl"] > 500 else "B2+"
    if "bsl" in sources:
        return "B2+" if sources["bsl"] > 850 else "B2"
    rank = sources.get("ngsl", 9999)
    if rank <= 1200:
        return "Foundation"
    if rank <= 2200:
        return "B2"
    return "B2+"


def rank_for(row: dict) -> int:
    scores = []
    if "bsl" in row["sources"]:
        scores.append(row["sources"]["bsl"])
    if "nawl" in row["sources"]:
        scores.append(900 + row["sources"]["nawl"])
    if "ngsl" in row["sources"]:
        scores.append(1400 + row["sources"]["ngsl"])
    if "supplementary" in row["sources"]:
        scores.append(9000 + row["sources"]["supplementary"])
    return min(scores)


def main() -> None:
    catalog = load_lists()
    dictionary = load_dictionary(set(catalog))
    natural_examples = load_examples(set(catalog))
    cards = []
    missing_dictionary = []
    natural_count = 0
    for word, row in catalog.items():
        info = dictionary.get(word, {})
        if not info.get("definitionZh") and not info.get("definitionEn"):
            missing_dictionary.append(word)
            continue
        domains = row["domains"] or {"general"}
        examples = natural_examples.get(word, [])
        natural_count += len(examples)
        if len(examples) < 3:
            existing = {example["text"] for example in examples}
            for example in template_examples(word, info.get("partOfSpeech", "word"), domains):
                if example["text"] not in existing:
                    examples.append(example)
                if len(examples) == 3:
                    break
        sources = row["sources"]
        sprint = (
            ("bsl" in sources and sources["bsl"] <= 450)
            or ("nawl" in sources and sources["nawl"] <= 150)
            or ("ngsl" in sources and 1500 <= sources["ngsl"] <= 1750)
        )
        cards.append({
            "id": re.sub(r"[^a-z0-9]+", "-", word).strip("-"),
            "word": word,
            "partOfSpeech": info.get("partOfSpeech", "word"),
            "phonetic": info.get("phonetic", ""),
            "definitionEn": info.get("definitionEn", ""),
            "definitionZh": info.get("definitionZh", ""),
            "level": level_for(row),
            "domains": sorted(domains),
            "sprint": sprint,
            "rank": rank_for(row),
            "examples": examples[:3],
            "sourceLists": sorted(sources),
        })
    cards.sort(key=lambda card: (card["rank"], card["word"]))
    # Guard against rare punctuation variants producing the same slug.
    seen = set()
    cards = [card for card in cards if not (card["id"] in seen or seen.add(card["id"]))]
    payload = {
        "schemaVersion": "1.0.0",
        "generatedAt": "2026-11-01",
        "metadata": {
            "title": "Jasmine Linguaskill Vocabulary",
            "cardCount": len(cards),
            "sprintCount": sum(card["sprint"] for card in cards),
            "naturalExampleCount": natural_count,
            "defaultLevels": ["B2", "B2+", "C1"],
            "notice": "Independent vocabulary practice; not an official Cambridge word list.",
        },
        "cards": cards,
    }
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"Built {len(cards)} cards ({payload['metadata']['sprintCount']} sprint; {natural_count} sourced examples).")
    if missing_dictionary:
        print(f"Skipped {len(missing_dictionary)} entries with no dictionary definition: {', '.join(missing_dictionary[:20])}")


if __name__ == "__main__":
    main()
