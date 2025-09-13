require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const memoryDir = './memory';
if (!fs.existsSync(memoryDir)) fs.mkdirSync(memoryDir);

// التحقق من المتغيرات البيئية
if (!process.env.DISCORD_TOKEN) {
  console.error('❌ DISCORD_TOKEN is required');
  process.exit(1);
}

if (!process.env.GEMINI_KEY) {
  console.error('❌ GEMINI_KEY is required');
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

client.on('messageCreate', async msg => {
  if (msg.author.bot) return;

  const userFile = path.join(memoryDir, `${msg.author.id}.json`);
  let userMemory = [];
  if (fs.existsSync(userFile)) {
    userMemory = JSON.parse(fs.readFileSync(userFile));
  }

  // إضافة الرسالة الجديدة
  userMemory.push(msg.content);

  // حفظ الملف
  fs.writeFileSync(userFile, JSON.stringify(userMemory, null, 2));

  // مثال أمر: عرض آخر رسالة تذكرها
  if (msg.content === '!اخر') {
    const last = userMemory.slice(-2, -1)[0];
    msg.reply(last ? `آخر شيء قلته كان: "${last}"` : 'لا أتذكر أي شيء بعد.');
  }
});

client.login(process.env.DISCORD_TOKEN)
  .then(() => console.log('✅ 72TP Discord Bot is online and ready!'))
  .catch(err => {
    console.error('❌ Failed to login:', err);
    process.exit(1);
  });

// التعامل مع الإغلاق بطريقة نظيفة
process.on('SIGINT', () => {
  console.log('👋 Shutting down 72TP Discord Bot...');
  process.exit(0);
});
process.on('SIGTERM', () => {
  console.log('👋 Shutting down 72TP Discord Bot...');
  process.exit(0);
});
