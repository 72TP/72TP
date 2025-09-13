require('dotenv').config();
const { DiscordBot } = require('./discord-bot.js'); // كود الأوامر
const fs = require('fs');
const path = require('path');

// تحقق من وجود التوكن والمفتاح
if (!process.env.DISCORD_TOKEN) {
  console.error('❌ DISCORD_TOKEN is required');
  process.exit(1);
}

if (!process.env.GEMINI_KEY) {
  console.error('❌ GEMINI_KEY is required');
  process.exit(1);
}

// إعداد مجلد لحفظ الرسائل لكل مستخدم
const memoryDir = './memory';
if (!fs.existsSync(memoryDir)) fs.mkdirSync(memoryDir);

class FileStorage {
  constructor() { this.memoryDir = memoryDir; }

  getUserFile(userId) { return path.join(this.memoryDir, `${userId}.json`); }

  getUserMemory(userId) {
    return fs.existsSync(this.getUserFile(userId)) ? JSON.parse(fs.readFileSync(this.getUserFile(userId))) : [];
  }

  saveUserMessage(userId, message) {
    const mem = this.getUserMemory(userId);
    mem.push(message);
    fs.writeFileSync(this.getUserFile(userId), JSON.stringify(mem, null, 2));
  }

  resetUserMemory(userId) {
    fs.writeFileSync(this.getUserFile(userId), JSON.stringify([]));
  }
}

// إنشاء التخزين
const storage = new FileStorage();

// إنشاء البوت وربطه بالتخزين
const bot = new DiscordBot(storage);

// تسجيل الدخول
bot.login(process.env.DISCORD_TOKEN)
  .then(() => console.log('✅ 72TP Discord Bot is online and ready!'))
  .catch(err => {
    console.error('❌ Failed to login:', err);
    process.exit(1);
  });

// إغلاق نظيف للبوت
process.on('SIGINT', () => { console.log('👋 Shutting down 72TP Discord Bot...'); process.exit(0); });
process.on('SIGTERM', () => { console.log('👋 Shutting down 72TP Discord Bot...'); process.exit(0); });
