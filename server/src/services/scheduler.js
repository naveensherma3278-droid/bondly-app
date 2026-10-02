// The heart of Bondly: schedules all reminder moments for a contact and
// runs a minute-tick worker that fires due jobs.
//
// Flow:
//   contact created/updated → scheduleJobsForContact()
//     → jobs for T-30, T-7, T-3, T-1, birthday-morning, midnight (next occurrence)
//   cron tick → claim due jobs → build payload (AI wish + T-7 gift ideas)
//     → send via notifier → mark sent
//   midnight job fires → auto-reschedule for next year (self-sustaining loop)
const cron = require('node-cron');
const ReminderJob = require('../models/ReminderJob');
const Contact = require('../models/Contact');
const User = require('../models/User');
const { nextBirthdayDate, atTime, addDays } = require('../utils/dates');
const { generateWish } = require('./ai');
const { suggestGifts } = require('./gifts');
const notifier = require('./notifier');

const REMINDER_OFFSETS = [
  { type: 't30', days: 30, at: [9, 0] },
  { type: 't7', days: 7, at: [9, 0] },
  { type: 't3', days: 3, at: [9, 0] },
  { type: 't1', days: 1, at: [9, 0] },
  { type: 'morning', days: 0, at: [8, 0] },
  { type: 'midnight', days: 0, at: [0, 0] },
];

const TITLES = {
  t30: (n) => `${n}'s birthday is in 30 days`,
  t7: (n) => `${n}'s birthday is in 7 days — time for a gift`,
  t3: (n) => `${n}'s birthday is in 3 days`,
  t1: (n) => `${n}'s birthday is tomorrow`,
  morning: (n) => `It's ${n}'s birthday today! 🎉`,
  midnight: (n) => `🎂 Midnight wish sent to ${n}`,
};

exports.scheduleJobsForContact = async function scheduleJobsForContact(contact, from = new Date()) {
  const birthday = nextBirthdayDate(contact.day, contact.month, from);
  const year = birthday.getFullYear();
  const ops = REMINDER_OFFSETS.map(({ type, days, at }) => ({
    updateOne: {
      filter: { contact: contact._id, type, year },
      update: {
        $setOnInsert: {
          user: contact.user,
          contact: contact._id,
          type,
          year,
          runAt: atTime(addDays(birthday, -days), at[0], at[1]),
          channel: 'push',
        },
      },
      upsert: true,
    },
  }));
  await ReminderJob.bulkWrite(ops, { ordered: false });
  return { birthday, year };
};

async function buildPayload(job, contact) {
  const name = contact.name;
  if (job.type === 'midnight') {
    const wishText = await generateWish({
      name,
      relationship: contact.relationship,
      interests: contact.interests,
    });
    return {
      title: `🎂 Happy Birthday, ${name}!`,
      body: wishText.slice(0, 120) + (wishText.length > 120 ? '…' : ''),
      wishText,
    };
  }
  const payload = {
    title: TITLES[job.type](name),
    body:
      job.type === 't7'
        ? `Plan the wish, the gift, and the midnight surprise — we've got ideas.`
        : `Tap to open Bondly and get everything ready.`,
  };
  if (job.type === 't7') {
    const { budget, premium, matchedInterest } = suggestGifts(contact);
    payload.giftIdeas = [...budget, ...premium];
    if (matchedInterest) payload.body = `They love ${matchedInterest}. Gift ideas are ready.`;
  }
  return payload;
}

async function deliver(job, user, contact) {
  const payload = await buildPayload(job, contact);
  // Midnight wish: deliver on real channels when available
  if (job.type === 'midnight') {
    if (contact.phone) await notifier.sendWhatsApp(contact.phone, payload.wishText);
    if (contact.email) await notifier.sendEmail(contact.email, `Happy Birthday, ${contact.name}!`, payload.wishText);
  }
  await notifier.sendPush(user, { title: payload.title, body: payload.body });
  return payload;
}

const STALE_PROCESSING_MS = 10 * 60 * 1000;

async function requeueStaleJobs() {
  await ReminderJob.updateMany(
    { status: 'processing', updatedAt: { $lt: new Date(Date.now() - STALE_PROCESSING_MS) } },
    { $set: { status: 'pending' } }
  );
}

async function processDueJobs() {
  const now = new Date();
  // Claim jobs atomically so multiple server instances never double-send
  const job = await ReminderJob.findOneAndUpdate(
    { status: 'pending', runAt: { $lte: now } },
    { $set: { status: 'processing' } },
    { sort: { runAt: 1 } }
  );
  if (!job) return null;

  try {
    const [user, contact] = await Promise.all([
      User.findById(job.user),
      Contact.findById(job.contact),
    ]);
    if (!user || !contact) throw new Error('Owner or contact no longer exists');

    const payload = await deliver(job, user, contact);
    job.status = 'sent';
    job.payload = payload;
    await job.save();

    // Self-sustaining loop: after the midnight moment, schedule next year
    if (job.type === 'midnight') {
      await exports.scheduleJobsForContact(contact, addDays(new Date(), 1));
    }
    return job;
  } catch (err) {
    job.status = 'failed';
    job.error = err.message;
    await job.save();
    console.error(`Job ${job._id} (${job.type}) failed:`, err.message);
  }
}

exports.startScheduler = function startScheduler() {
  cron.schedule('* * * * *', async () => {
    try {
      await requeueStaleJobs();
      // Drain whatever is due this minute (bounded per tick)
      for (let i = 0; i < 100; i += 1) {
        const processed = await processDueJobs();
        if (!processed) break;
      }
    } catch (err) {
      console.error('Scheduler tick failed:', err.message);
    }
  });
  console.log('Reminder scheduler started (1-min tick)');
};
