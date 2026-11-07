// Mise ratios: the proportions cooks and bakers work from, by weight unless noted.
// Change the size and everything scales; give it what you have and it tells you how much you can make.
// Parts are relative weights; 'anchor' is the ingredient the ratio is usually scaled from.
export const RATIOS = {
  bread:      { n: 'Bread dough', parts: { 'strong-flour': 100, water: 65, salt: 2, yeast: 1 }, anchor: 'strong-flour', why: '5 parts flour to 3 parts water; 2% salt, 1% dried yeast' },
  pizza:      { n: 'Pizza dough', parts: { 'strong-flour': 100, water: 62, salt: 2, yeast: 1, 'olive-oil': 3 }, anchor: 'strong-flour', why: 'a slightly drier bread dough with a little oil so it stretches thin' },
  soda:       { n: 'Soda bread', parts: { flour: 100, buttermilk: 85, 'bread-soda': 1.8, salt: 1.8 }, anchor: 'flour', why: 'buttermilk\'s acid reacts with the bread soda; no yeast, no proving' },
  flatbread:  { n: 'Quick flatbread', parts: { 'self-raising-flour': 100, yogurt: 100, salt: 1 }, anchor: 'self-raising-flour', why: 'equal weights of self-raising flour and yogurt' },
  pancake:    { n: 'Thick pancakes', parts: { 'self-raising-flour': 100, milk: 120, eggs: 50, sugar: 10, butter: 15, 'baking-powder': 2 }, anchor: 'self-raising-flour', why: 'roughly equal flour and milk, half as much egg' },
  crepe:      { n: 'Crêpes', parts: { flour: 100, milk: 250, eggs: 100, butter: 15 }, anchor: 'flour', why: '1 part flour : 2½ milk : 1 egg, a thin pouring batter' },
  popover:    { n: 'Yorkshire pudding batter', parts: { flour: 70, milk: 100, eggs: 100 }, anchor: 'eggs', why: 'equal volumes of egg, flour and milk' },
  sponge:     { n: 'Sponge cake', parts: { butter: 100, sugar: 100, eggs: 100, 'self-raising-flour': 100 }, anchor: 'eggs', why: 'equal weights of butter, sugar, egg and self-raising flour (weigh the eggs)' },
  shortcrust: { n: 'Shortcrust pastry', parts: { flour: 300, butter: 150, water: 50 }, anchor: 'flour', why: '3 parts flour : 2 fat : 1 water by the old rule; this is a richer, shorter version' },
  crumble:    { n: 'Crumble topping', parts: { flour: 100, butter: 60, 'brown-sugar': 50, oats: 40 }, anchor: 'flour', why: 'about 2 flour : 1 butter : 1 sugar, with oats for crunch' },
  cookie:     { n: 'Cookie dough', parts: { flour: 150, butter: 100, 'brown-sugar': 60, sugar: 40, eggs: 25, 'bread-soda': 1.5 }, anchor: 'flour', why: '3 flour : 2 butter : 2 sugar; brown sugar for chew' },
  scone:      { n: 'Scones', parts: { 'self-raising-flour': 225, butter: 55, sugar: 25, milk: 125, 'baking-powder': 2 }, anchor: 'self-raising-flour', why: '4 parts flour to 1 butter, bound with just enough milk' },
  brownie:    { n: 'Brownies', parts: { 'dark-chocolate': 100, butter: 100, sugar: 150, eggs: 100, flour: 50, cocoa: 15 }, anchor: 'dark-chocolate', why: 'equal chocolate and butter, more sugar than either, very little flour' },
  banana:     { n: 'Banana bread', parts: { banana: 300, 'self-raising-flour': 225, butter: 100, 'brown-sugar': 100, eggs: 100, 'bread-soda': 2 }, anchor: 'banana', why: 'the riper the bananas, the less sugar it needs' },
  custard:    { n: 'Custard', parts: { milk: 500, eggs: 100, sugar: 60, flour: 10 }, anchor: 'milk', why: 'about 1 egg per 100 ml milk; a spoon of cornflour stops it splitting' },
  ricepud:    { n: 'Rice pudding', parts: { rice: 100, milk: 900, sugar: 60, butter: 15 }, anchor: 'rice', why: '1 part rice to 9 parts milk, cooked slowly' },
  porridge:   { n: 'Porridge', parts: { oats: 50, milk: 150, water: 150 }, anchor: 'oats', why: '1 part oats to 6 parts liquid; half milk, half water' },
  bechamel:   { n: 'Béchamel', parts: { butter: 25, flour: 25, milk: 250 }, anchor: 'milk', why: '1 butter : 1 flour : 10 milk for a coating sauce' },
  vinaigrette:{ n: 'Vinaigrette', parts: { 'olive-oil': 90, vinegar: 30, mustard: 5 }, anchor: 'olive-oil', why: '3 parts oil to 1 acid, mustard to hold it together' },
  risotto:    { n: 'Risotto', parts: { 'risotto-rice': 80, stock: 300 }, anchor: 'risotto-rice', why: 'roughly 1 part rice to 4 parts hot stock, added a ladle at a time' },
  rice:       { n: 'Rice (absorption)', parts: { rice: 100, water: 150 }, anchor: 'rice', why: '1 part rice to 1½ parts water by volume, lid on, then rest' },
  brine:      { n: 'Wet brine', parts: { water: 1000, salt: 60, sugar: 30 }, anchor: 'water', why: '6% salt; brine meat 1 hour per 500 g for juicier roasts' }
};
// scale a ratio so the anchor is `grams`; returns { id: grams }
export function scale(key, grams) { const R = RATIOS[key]; if (!R) return null; const f = grams / R.parts[R.anchor]; const out = {}; for (const [id, p] of Object.entries(R.parts)) out[id] = Math.round(p * f * 10) / 10; return out; }
// the most of a ratio you can make from what you have: limited by whichever ingredient runs out first
// have(id) returns grams on hand (or Infinity for water); returns { scale, limitedBy, amounts }
export function maxFrom(key, have) {
  const R = RATIOS[key]; if (!R) return null; let best = Infinity, lim = null;
  for (const [id, p] of Object.entries(R.parts)) { if (id === 'water') continue; const h = have(id); if (h == null) continue; const f = h / p; if (f < best) { best = f; lim = id; } }
  if (!isFinite(best)) return null;
  const amounts = {}; for (const [id, p] of Object.entries(R.parts)) amounts[id] = Math.round(p * best);
  return { scale: best, limitedBy: lim, amounts };
}
