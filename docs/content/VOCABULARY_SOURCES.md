# Vocabulary sources and licence notes

The vocabulary feature is an independent study aid. It is not an official Cambridge vocabulary list and does not reproduce Cambridge test items.

## Selection lists

- New General Service List 1.2 (NGSL), Browne, Culligan, and Phillips. CC BY-SA 4.0. <https://www.newgeneralservicelist.com/new-general-service-list>
- Business Service List 1.2 (BSL), Browne and Culligan. CC BY-SA 4.0. <https://www.newgeneralservicelist.com/business-service-list>
- New Academic Word List 1.2 (NAWL), Browne, Culligan, and Phillips. CC BY-SA 4.0. <https://www.newgeneralservicelist.com/new-academic-word-list>

The generated `content/vocabulary.json` is a combined and enriched adaptation of these lists and is distributed under CC BY-SA 4.0.

## Dictionary enrichment

- ECDICT by skywind3000, MIT Licence. <https://github.com/skywind3000/ECDICT>

ECDICT supplies phonetic transcriptions, part-of-speech hints, English definitions, and Chinese meanings. Chinese text is converted to Traditional Chinese during the build.

## Example sentences

- Tatoeba English CC0 export (CC0 1.0) and detailed export (CC BY 2.0 FR). <https://downloads.tatoeba.org/exports/per_language/eng/>

Where three suitable CC0 examples are unavailable, the build uses attributed CC BY examples and retains the Tatoeba sentence ID and contributor name. If no suitable natural example is available, it creates a short original fallback sentence.

## Rebuild

Source downloads are kept outside the deployable site. Place the documented CSV files in `content/vocabulary-sources`, the full `ecdict.csv` and Tatoeba CC0 export in `.tools/vocabulary-sources`, install `scripts/vocabulary/requirements.txt`, and run:

```powershell
python scripts/vocabulary/build_vocabulary.py
```
