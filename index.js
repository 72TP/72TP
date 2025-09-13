require('dotenv').config();
const { DiscordBot } = require('./discord-bot.js');
const { InMemoryStorage } = require('./storage.js');

async function main() {
  try {
    console.log('🚀 Starting 72TP Discord Bot...');
    
    // Check required environment variables
    if (!process.env.DISCORD_BOT_TOKEN) {
      console.error('❌ DISCORD_BOT_TOKEN is required');
      process.exit(1);
    }
    
    if (!process.env.GEMINI_API_KEY) {
      console.error('❌ GEMINI_API_KEY is required');
      process.exit(1);
    }

    // Initialize storage
    const storage = new InMemoryStorage();
    console.log('✅ In-memory storage initialized');

    require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const memoryDir = './memory';
if (!fs.existsSync(memoryDir)) fs.mkdirSync(memoryDir);

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

  // حفظ الملف بدون حد للرسائل
  fs.writeFileSync(userFile, JSON.stringify(userMemory, null, 2));

  // مثال أمر: عرض آخر رسالة تذكرها
  if (msg.content === '!اخر') {
    const last = userMemory.slice(-2, -1)[0];
    msg.reply(last ? `آخر شيء قلته كان: "${last}"` : 'لا أتذكر أي شيء بعد.');
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);
    
    // Initialize Discord bot
    console.log('🤖 Initializing Discord bot...');
    const bot = new DiscordBot(storage);
    
    console.log('🔑 Attempting to login with Discord...');
    await bot.login(process.env.DISCORD_BOT_TOKEN);
    
    console.log('✅ 72TP Discord Bot is online and ready!');
    console.log('📊 Features available:');
    console.log('  • 360 questions across 72 personality traits');
    console.log('  • Bilingual support (Arabic/English)');
    console.log('  • AI-powered personality analysis');
    console.log('  • Automatic question progression');
    console.log('  • Complete test management');

  } catch (error) {
    console.error('❌ Error starting bot:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down 72TP Discord Bot...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Shutting down 72TP Discord Bot...');
  process.exit(0);
});

// Start the bot
main();
