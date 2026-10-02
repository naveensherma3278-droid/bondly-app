// AI wish generation with a pluggable provider.
// - OPENAI_API_KEY set  -> LLM-generated wish (structured prompt)
// - otherwise           -> offline template engine (7 tones, personalized)
const OpenAI = require('openai');

const TONES = ['funny', 'emotional', 'romantic', 'friend', 'colleague', 'family', 'professional'];

const TEMPLATES = {
  funny: [
    `Happy Birthday, {name}! 🎂 You're not getting older — you're leveling up. May your Wi-Fi be strong and your cake be chocolate.`,
    `{name}, happiest of birthdays! Another year of you being awesome (and me being lucky enough to know you).`,
  ],
  emotional: [
    `Happy Birthday, {name}.

Some people make the world brighter just by being in it — you're one of them. May this year give back even a fraction of the warmth you've given everyone around you.`,
    `{name}, on your birthday I just want you to know: the ordinary days are the ones you've made special. Here's to many more of them. Happy Birthday.`,
  ],
  romantic: [
    `Happy Birthday, {name}. Every year with you is my favorite one yet. Here's to you — today and always. ❤️`,
  ],
  friend: [
    `Happy Birthday, {name}! Your friendship has made countless ordinary days special. May this year bring you happiness, success, and unforgettable memories.`,
  ],
  colleague: [
    `Happy Birthday, {name}! Working with you makes the hard days easier and the good days better. Wishing you a fantastic year ahead.`,
  ],
  family: [
    `Happy Birthday, {name}! Family like you is life's greatest gift. Wishing you health, laughter, and everything that makes you happy.`,
  ],
  professional: [
    `Wishing you a very happy birthday, {name}. May the year ahead be filled with success, growth, and new opportunities.`,
  ],
};

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function templateWish({ name, relationship = 'friend', tone, interests = [] }) {
  const key = TONES.includes(tone) ? tone : relationship === 'partner' ? 'romantic' : relationship;
  let wish = pick(TEMPLATES[key] || TEMPLATES.friend).replaceAll('{name}', name);
  const interest = interests.find((i) => i && i.trim());
  if (interest && key !== 'professional') {
    wish += `

P.S. I know how much you love ${interest.trim()} — may your year be full of it.`;
  }
  return wish;
}

async function llmWish({ name, relationship, tone, interests }) {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const prompt = [
    `Write a warm, personalized birthday wish for "${name}".`,
    `Tone: ${tone || relationship || 'warm'}.`,
    interests?.length ? `Their interests: ${interests.join(', ')}.` : '',
    `Keep it 2-4 short paragraphs. No emojis unless the tone is funny. Never mention that you are an AI.`,
  ].filter(Boolean).join(' ');

  const res = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 250,
    temperature: 0.9,
  });
  return res.choices[0].message.content.trim();
}

exports.TONES = TONES;

exports.generateWish = async function generateWish(input) {
  try {
    if (process.env.OPENAI_API_KEY) return await llmWish(input);
  } catch (err) {
    console.warn('LLM wish failed, falling back to templates:', err.message);
  }
  return templateWish(input);
};
