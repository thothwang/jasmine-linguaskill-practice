#!/usr/bin/env python3
"""Create a conservative EFLLex supplement for the vocabulary library.

The input is the open EFLLex-derived CSV supplied for review.  The output keeps
only headwords that are absent from the other selection lists, occur in at
least two documents at their derived CEFR level, have an established ECDICT
entry, and have at least one natural Tatoeba example.  A word must also occur
in at least three EFLLex documents or carry an IELTS, TOEFL, or CET6 tag in
ECDICT.  This avoids importing one-off corpus fragments as study cards.
"""

from __future__ import annotations

import argparse
import csv
import json
import re
from pathlib import Path

from build_vocabulary import load_examples


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_INPUT = ROOT / "outputs" / "efllex_b1_b2_c1_open_alternative.csv"
OUTPUT = ROOT / "content" / "vocabulary-sources" / "efllex-curated.csv"
ECDICT = ROOT / ".tools" / "vocabulary-sources" / "ecdict.csv"
VOCABULARY = ROOT / "content" / "vocabulary.json"

SOURCE_URL = "https://cental.uclouvain.be/cefrlex/efllex/download/"
SOURCE_LICENSE = "CC BY-NC-SA 4.0"
EXAM_TAGS = {"ielts", "toefl", "cet6"}
EXCLUDED_HEADWORDS = {"ss", "whore", "soma", "sou", "sudeten"}
PLURAL_ONLY = {"barracks", "clothes", "goods", "headquarters", "premises", "proceedings", "surroundings"}
HEADWORD_RE = re.compile(r"[A-Za-z][A-Za-z'-]{1,28}")
ROOT_RE = re.compile(r"(?:^|/)0:([^/]+)")


def number(value: str) -> int:
    try:
        return int(value or 0)
    except ValueError:
        return 0


def load_existing_base_words() -> set[str]:
    payload = json.loads(VOCABULARY.read_text(encoding="utf-8"))
    return {
        card["word"].strip().lower()
        for card in payload.get("cards", [])
        if any(source != "efllex" for source in card.get("sourceLists", []))
    }


def load_ecdict(targets: set[str]) -> dict[str, dict]:
    found = {}
    with ECDICT.open(encoding="utf-8", errors="replace", newline="") as handle:
        for row in csv.DictReader(handle):
            word = (row.get("word") or "").strip().lower()
            if word in targets and word not in found:
                found[word] = row
    return found


def is_lemma_like(word: str, source_row: dict, dictionary_row: dict) -> bool:
    if len(word) <= 2 and word != "cv":
        return False
    if word in EXCLUDED_HEADWORDS:
        return False
    if (dictionary_row.get("word") or "")[:1].isupper() and word != "cv":
        return False
    exchange = dictionary_row.get("exchange") or ""
    match = ROOT_RE.search(exchange)
    root = match.group(1).lower() if match else ""
    if root and root != word:
        if source_row["part_of_speech"] == "verb":
            return False
        if source_row["part_of_speech"] == "noun" and "/1:s" in exchange and word not in PLURAL_ONLY:
            return False
    return True


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", nargs="?", type=Path, default=DEFAULT_INPUT)
    args = parser.parse_args()

    with args.input.open(encoding="utf-8-sig", newline="") as handle:
        raw_rows = list(csv.DictReader(handle))
    unique = {(row.get("word") or "").strip().lower(): row for row in raw_rows}
    existing = load_existing_base_words()
    candidates = {
        word: row
        for word, row in unique.items()
        if word not in existing
        and HEADWORD_RE.fullmatch(row.get("word") or "")
        and float(row.get("level_document_count") or 0) >= 2
        and row.get("cefr_level") in {"B1", "B2", "C1"}
    }

    dictionary = load_ecdict(set(candidates))
    filtered = []
    for word, row in candidates.items():
        entry = dictionary.get(word)
        if not entry or not (entry.get("definition") or entry.get("translation")):
            continue
        if not any(number(entry.get(key, "")) for key in ("oxford", "collins", "bnc", "frq")):
            continue
        if not is_lemma_like(word, row, entry):
            continue
        tags = set((entry.get("tag") or "").lower().split())
        if float(row["level_document_count"]) < 3 and not tags.intersection(EXAM_TAGS):
            continue
        filtered.append(row)

    examples = load_examples({row["word"].strip().lower() for row in filtered})
    selected = [row for row in filtered if examples.get(row["word"].strip().lower())]
    level_order = {"B2": 0, "C1": 1, "B1": 2}
    selected.sort(key=lambda row: (
        level_order[row["cefr_level"]],
        -float(row["level_document_count"]),
        -float(row["level_frequency_per_million"]),
        row["word"].lower(),
    ))

    columns = [
        "word", "cefr_level", "part_of_speech", "level_document_count",
        "level_frequency_per_million", "source_url", "license",
    ]
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=columns)
        writer.writeheader()
        for row in selected:
            writer.writerow({
                "word": row["word"].strip().lower(),
                "cefr_level": row["cefr_level"],
                "part_of_speech": row["part_of_speech"],
                "level_document_count": row["level_document_count"],
                "level_frequency_per_million": row["level_frequency_per_million"],
                "source_url": SOURCE_URL,
                "license": SOURCE_LICENSE,
            })

    levels = {level: sum(row["cefr_level"] == level for row in selected) for level in ("B1", "B2", "C1")}
    print(f"Wrote {len(selected)} curated EFLLex headwords to {OUTPUT} ({levels}).")


if __name__ == "__main__":
    main()
