require('dotenv').config();
const { DiscordBot } = require('./discord-bot.js');
const { InMemoryStorage } = require('./storage.js');

// تحقق من وجود Secrets
if (!process.env.DISCORD_TOKEN) {
  console.error('❌ DISCORD_TOKEN is required');
  process.exit(1);
}

if (!process.env.GEMINI_KEY) {
  console.error('❌ GEMINI_KEY is required');
  process.exit(1);
}

// أنشئ التخزين
const storage = new InMemoryStorage();

// أنشئ البوت
const bot = new DiscordBot(storage);

// تسجيل الدخول باستخدام التوكن
bot.login(process.env.DISCORD_TOKEN)
  .then(() => console.log('✅ 72TP Discord Bot is online and ready!'))
  .catch(err => {
    console.error('❌ Failed to login:', err);
    process.exit(1);
  });

// التعامل مع إغلاق البوت بشكل نظيف
process.on('SIGINT', () => {
  console.log('👋 Shutting down 72TP Discord Bot...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('👋 Shutting down 72TP Discord Bot...');
  process.exit(0);
});
