# Data sources (all allow commercial use)

- **USDA FNDDS 2.0** (Food and Nutrient Database for Dietary Studies) — public domain, U.S. Government work. Dish compositions used as evidence of which ingredients are combined (chefdb.json) and survey-food nutrition (nutrition.json).
- **USDA National Nutrient Database for Standard Reference, Release 28** — public domain. Ingredient nutrition (nutrition.json).
- **Canadian Nutrient File, Health Canada** — Contains information licensed under the Open Government Licence – Canada.
- **Mise's own authored data** — aroma families (js/flavour.js), pairing knowledge (js/pairings.js), techniques and food-safety guidance (js/techniques.js), recipe grammar and rules (js/chef.js, js/builder.js).

Rebuild with `python3 tools/build_chefdb.py FNDDS_DIR SR28_DIR CNF_DIR`.

## Fonts

Fraunces and Inter, both under the SIL Open Font Licence 1.1 (licence texts in `www/fonts/`). Free to bundle in a commercial app.

## World ingredients (data/ingdb.json)

- `tools/world_ingredients.txt`: written for Mise.
- FoodOn food ontology (https://foodon.org, https://github.com/FoodOntology/foodon), CC BY 4.0. Names, synonyms and the family tree were used to map each ingredient to the Mise ingredient it cooks like. Built with `tools/foodon_extract.py`, `tools/foodon_map.mjs` and `tools/build_ingdb.mjs`.
- Wikidata (https://www.wikidata.org), CC0 1.0 (public domain). Food and ingredient items, their "subclass of" tree and their names in 18 languages, harvested by tools/wikidata_harvest.mjs and tools/wikidata_catalog.mjs (run in GitHub Actions) and turned into data/ingwd.json and data/names/*.json by tools/build_wikidata.mjs.
- Everyday ingredient names in Irish, Polish, Romanian, Portuguese, Spanish, Lithuanian and Ukrainian (tools/names_core.txt) were written for Mise.
