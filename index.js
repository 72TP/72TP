require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
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

// إعداد مجلد الذاكرة لحفظ الرسائل لكل مستخدم
const memoryDir = './memory';
if (!fs.existsSync(memoryDir)) fs.mkdirSync(memoryDir);

class FileStorage {
  constructor() { this.memoryDir = memoryDir; }
  getUserFile(userId) { return path.join(this.memoryDir, `${userId}.json`); }
  getUserMemory(userId) { return fs.existsSync(this.getUserFile(userId)) ? JSON.parse(fs.readFileSync(this.getUserFile(userId))) : []; }
  saveUserMessage(userId, message) {
    const mem = this.getUserMemory(userId);
    mem.push(message);
    fs.writeFileSync(this.getUserFile(userId), JSON.stringify(mem, null, 2));
  }
  resetUserMemory(userId) { fs.writeFileSync(this.getUserFile(userId), JSON.stringify([])); }
}

// تخزين البيانات
const storage = new FileStorage();

// Discord client
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

// مثال: ملف الأسئلة والترجمات
const questionsData = require('./data/questions.json');
const translations = require('./data/translations.json');

// معالجة الرسائل
client.on('messageCreate', async message => {
  if (message.author.bot) return;
  if (!message.content.startsWith('!')) return;

  const command = message.content.toLowerCase();
  const userId = message.author.id;

  // حفظ الرسالة دائمًا
  storage.saveUserMessage(userId, message.content);

  try {
    if (command === '!help') {
      const embed = new EmbedBuilder()
        .setTitle('72TP Bot Help')
        .setDescription('Available commands:\n!start\n!continue\n!status\n!reset\n!help\n!language\n!<question>.<0-4>')
        .setColor(0x00FF00);
      await message.reply({ embeds: [embed] });

    } else if (command === '!start') {
      await message.reply('✅ اختبار 72TP بدأ! أجب على الأسئلة باستخدام !<رقم السؤال>.<0-4>');

    } else if (command === '!reset') {
      storage.resetUserMemory(userId);
      await message.reply('🔄 تم إعادة تعيين الاختبار. اكتب !start للبدء من جديد.');

    } else if (command === '!status') {
      const mem = storage.getUserMemory(userId);
      await message.reply(`لقد أجبت على ${mem.length} رسالة حتى الآن.`);

    } else {
      // مثال على الرد على الأسئلة بشكل بسيط
      const match = command.match(/^!(\d+)\.([0-4])$/);
      if (match) {
        const questionId = parseInt(match[1]);
        const answer = parseInt(match[2]);
        await message.reply(`تم تسجيل إجابتك للسؤال ${questionId}: ${answer}`);
      } else {
        await message.reply('❌ أمر غير معروف، استخدم !help للحصول على القائمة.');
      }
    }
  } catch (error) {
    console.error('Error handling command:', error);
    await message.reply('❌ حدث خطأ أثناء معالجة الأمر.');
  }
});

// تسجيل الدخول
client.login(process.env.DISCORD_TOKEN)
  .then(() => console.log('✅ 72TP Discord Bot is online and ready!'))
  .catch(err => {
    console.error('❌ Failed to login:', err);
    process.exit(1);
  });

// إغلاق نظيف
process.on('SIGINT', () => { console.log('👋 Shutting down 72TP Discord Bot...'); process.exit(0); });
process.on('SIGTERM', () => { console.log('👋 Shutting down 72TP Discord Bot...'); process.exit(0); });
