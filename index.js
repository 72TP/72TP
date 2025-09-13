require('dotenv').config();
const { DiscordBot } = require('./discord.js'); // ✅ الاسم الجديد
const { InMemoryStorage } = require('./storage.js');

// قراءة المتغيرات من البيئة
const token = process.env.DISCORD_TOKEN;
const gemini = process.env.GEMINI_KEY;

if (!token) {
  console.error('❌ DISCORD_TOKEN is required');
  process.exit(1);
}

if (!gemini) {
  console.error('❌ GEMINI_KEY is required');
  process.exit(1);
}

// تهيئة التخزين (مؤقتًا بالذاكرة أو لاحقًا بالملفات)
const storage = new InMemoryStorage();

// إنشاء نسخة من البوت
const bot = new DiscordBot(storage);

// تسجيل الدخول
bot.login(token)
  .then(() => console.log('✅ 72TP Discord Bot is online and ready!'))
  .catch(err => {
    console.error('❌ Failed to login:', err);
    process.exit(1);
  });

// إيقاف البوت بشكل آمن عند إغلاق السيرفر
process.on('SIGINT', () => {
  console.log('👋 Shutting down...');
  process.exit(0);
});
process.on('SIGTERM', () => {
  console.log('👋 Shutting down...');
  process.exit(0);
});
