// Deterministic gift recommendation engine.
// Interest keyword -> tiered ideas. Cheap, testable, zero cold-start cost.
const GIFT_MAP = [
  { match: ['cricket', 'cricketer'], ideas: [
    ['Cricket bat (Kashmir willow, ₹500+)', 'Team India jersey (₹800+)', 'Cricket ball set (₹300)'],
    ['Premium English willow bat (₹3,000+)', 'Smart sports watch (₹5,000+)'],
  ]},
  { match: ['gaming', 'gamer', 'games'], ideas: [
    ['Steam / PlayStation gift card', 'Gaming mouse (₹1,200+)', 'Mousepad XL (₹600)'],
    ['Mechanical keyboard (₹4,000+)', 'Headset (₹3,500+)', 'Controller (₹4,500+)'],
  ]},
  { match: ['reading', 'books', 'reader'], ideas: [
    ['Bestseller in their favorite genre (₹400+)', 'Bookstore voucher', 'Handmade bookmarks (₹200)'],
    ['Kindle (₹8,000+)', 'Leather-bound classic set'],
  ]},
  { match: ['cooking', 'food', 'chef'], ideas: [
    ['Cast-iron pan (₹1,500+)', 'Spice kit', 'Recipe book (₹600)'],
    ['Stand mixer / air fryer (₹6,000+)'],
  ]},
  { match: ['music'], ideas: [
    ['Concert/festival ticket', 'Vinyl of their favorite artist', 'Bluetooth speaker (₹2,000+)'],
    ['Noise-cancelling headphones (₹8,000+)'],
  ]},
  { match: ['fitness', 'gym', 'yoga', 'running'], ideas: [
    ['Resistance band set (₹800)', 'Gym shaker + accessories', 'Yoga mat (₹900)'],
    ['Smart fitness band (₹3,000+)', 'Gym membership voucher'],
  ]},
  { match: ['travel', 'travelling', 'trip'], ideas: [
    ['Travel journal', 'Packing cubes set (₹900)', 'Neck pillow + eye mask kit'],
    ['Weekend getaway contribution', 'GoPro / action camera (₹15,000+)'],
  ]},
  { match: ['photography', 'photo'], ideas: [
    ['Camera strap + SD card kit', 'Photo frame of a shared memory'],
    ['Instant camera (₹8,000+)', 'Photography workshop voucher'],
  ]},
];

const GENERIC_BY_RELATIONSHIP = {
  partner: [['Custom star map of your first date', 'Couples spa voucher', 'Handwritten letter + flowers']],
  family: [['Their favorite sweet/dry-fruit box', 'Personalized photo mug (₹400)', 'Home gadget they keep mentioning']],
  colleague: [['Desk plant (₹500)', 'Premium coffee/tea sampler', 'Notebook + nice pen set']],
  friend: [['Board game you can play together', 'Gift card to their favorite café', 'Custom photo book of memories']],
  other: [['Gift card (Amazon/Flipkart)', 'Scented candle set', 'Experience voucher (movie/concert)']],
};

exports.suggestGifts = function suggestGifts({ interests = [], relationship = 'friend' } = {}) {
  const normalized = interests.map((i) => i.toLowerCase());
  for (const entry of GIFT_MAP) {
    if (normalized.some((i) => entry.match.some((m) => i.includes(m)))) {
      return { matchedInterest: entry.match[0], budget: entry.ideas[0], premium: entry.ideas[1] ?? [] };
    }
  }
  const tier = GENERIC_BY_RELATIONSHIP[relationship] || GENERIC_BY_RELATIONSHIP.friend;
  return { matchedInterest: null, budget: tier[0], premium: [] };
};
