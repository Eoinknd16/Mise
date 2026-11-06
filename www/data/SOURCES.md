# Data sources (all allow commercial use)

- **USDA FNDDS 2.0** (Food and Nutrient Database for Dietary Studies) — public domain, U.S. Government work. Dish compositions used as evidence of which ingredients are combined (chefdb.json) and survey-food nutrition (nutrition.json).
- **USDA National Nutrient Database for Standard Reference, Release 28** — public domain. Ingredient nutrition (nutrition.json).
- **Canadian Nutrient File, Health Canada** — Contains information licensed under the Open Government Licence – Canada.
- **Mise's own authored data** — aroma families (js/flavour.js), pairing knowledge (js/pairings.js), techniques and food-safety guidance (js/techniques.js), recipe grammar and rules (js/chef.js, js/builder.js).

Rebuild with `python3 tools/build_chefdb.py FNDDS_DIR SR28_DIR CNF_DIR`.
