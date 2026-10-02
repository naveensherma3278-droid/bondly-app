// Notification gateway. One interface, multiple providers.
// - push: Firebase Cloud Messaging (used if service-account credentials exist)
// - whatsapp/sms/email: provider-agnostic stubs (plug Twilio/nodemailer later)

let fcm = null;
try {
  const path = process.env.FIREBASE_SERVICE_ACCOUNT || './firebaseServiceAccount.json';
  // eslint-disable-next-line global-require
  const admin = require('firebase-admin');
  const serviceAccount = require(path);
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  fcm = admin.messaging();
  console.log('FCM enabled — real push notifications active');
} catch {
  console.log('FCM credentials not found — notifications will be logged (dev mode)');
}

exports.sendPush = async function sendPush(user, { title, body, data }) {
  if (!fcm || !user.fcmTokens?.length) {
    console.log(`[dev-push] → ${user.name}: ${title} — ${body}`);
    return { delivered: false, mode: 'logged' };
  }
  const res = await fcm.sendEachForMulticast({
    tokens: user.fcmTokens,
    notification: { title, body },
    data: data || {},
  });
  return { delivered: res.successCount > 0, mode: 'fcm', success: res.successCount, failure: res.failureCount };
};

// Stubs — implement with Twilio / nodemailer behind env flags when ready.
exports.sendWhatsApp = async (to, text) => console.log(`[dev-whatsapp] → ${to}: ${text}`);
exports.sendSms = async (to, text) => console.log(`[dev-sms] → ${to}: ${text}`);
exports.sendEmail = async (to, subject, text) => console.log(`[dev-email] → ${to}: ${subject}
${text}`);
