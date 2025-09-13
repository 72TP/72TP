require('dotenv').config();
const { DiscordBot } = require('./discord-bot.js'); // ملف الأوامر
const { InMemoryStorage } = require('./storage.js'); // أو FileStorage إذا كنت تريد حفظ الرسائل في ملفات

// تحقق من وجود التوكن والمفتاح
if (!process.env.DISCORD_TOKEN) {
  console.error('❌ DISCORD_TOKEN is required');
  process.exit(1);
}

if (!process.env.GEMINI_KEY) {
  console.error('❌ GEMINI_KEY is required');
  process.exit(1);
}

// إنشاء التخزين
const storage = new InMemoryStorage(); // أو FileStorage لحفظ الرسائل لكل مستخدم

// إنشاء البوت وربطه بالتخزين
const bot = new DiscordBot(storage);

// تسجيل الدخول
bot.login(process.env.DISCORD_TOKEN)
  .then(() => console.log('✅ 72TP Discord Bot is online and ready!'))
  .catch(err => {
    console.error('❌ Failed to login:', err);
    process.exit(1);
  });

// إغلاق نظيف
process.on('SIGINT', () => {
  console.log('👋 Shutting down 72TP Discord Bot...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('👋 Shutting down 72TP Discord Bot...');
  process.exit(0);
});
