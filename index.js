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

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// اسم المجلد
const dbDir = './database';

// إنشاء المجلد إذا لم يكن موجود
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log(`✅ تم إنشاء مجلد ${dbDir}`);
}

// دالة لحفظ رسالة مستخدم
function saveUserMessage(userId, message) {
  const userFile = path.join(dbDir, `${userId}.json`);
  let userMemory = [];

  if (fs.existsSync(userFile)) {
    try {
      userMemory = JSON.parse(fs.readFileSync(userFile));
    } catch (err) {
      console.error('⚠️ خطأ في قراءة الملف:', err);
    }
  }

  userMemory.push(message);

  fs.writeFileSync(userFile, JSON.stringify(userMemory, null, 2));
  console.log(`💾 تم حفظ رسالة للمستخدم ${userId}`);
}

// النسخ الاحتياطي إلى GitHub كل 10 دقائق
setInterval(() => {
  console.log('💾 بدء عملية النسخ الاحتياطي...');
  exec(`
    git config --global user.email "bot@example.com"
    git config --global user.name "72TP-Bot"
    git remote set-url origin https://x-access-token:${process.env.GH_TOKEN}@github.com/72TP/72TP.git
    git add database
    git commit -m "Auto-backup at $(date)" || echo "⚠️ لا تغييرات للنسخ"
    git push origin main
  `, (err, stdout, stderr) => {
    if (err) {
      console.error('❌ خطأ أثناء النسخ الاحتياطي:', stderr);
    } else {
      console.log('✅ تم رفع النسخة الاحتياطية بنجاح');
    }
  });
}, 10 * 60 * 1000); // كل 10 دقائق

module.exports = { saveUserMessage };

// إيقاف البوت بشكل آمن عند إغلاق السيرفر
process.on('SIGINT', () => {
  console.log('👋 Shutting down...');
  process.exit(0);
});
process.on('SIGTERM', () => {
  console.log('👋 Shutting down...');
  process.exit(0);
});
