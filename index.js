require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord-bot.js');
const fs = require('fs');
const path = require('path');

const memoryDir = './memory';
if (!fs.existsSync(memoryDir)) fs.mkdirSync(memoryDir);

const token = process.env.DISCORD_BOT_TOKEN;
const gemini = process.env.GEMINI_API_KEY;

if (!token) {
  console.error('❌ DISCORD_BOT_TOKEN is required');
  process.exit(1);
}

if (!gemini) {
  console.error('❌ GEMINI_API_KEY is required');
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

  userMemory.push(msg.content);
  fs.writeFileSync(userFile, JSON.stringify(userMemory, null, 2));

  if (msg.content === '!اخر') {
    const last = userMemory.slice(-2, -1)[0];
    msg.reply(last ? `آخر شيء قلته كان: "${last}"` : 'لا أتذكر أي شيء بعد.');
  }
});

client.login(token)
  .then(() => console.log('✅ 72TP Discord Bot is online and ready!'))
  .catch(err => {
    console.error('❌ Failed to login:', err);
    process.exit(1);
  });

process.on('SIGINT', () => { console.log('👋 Shutting down...'); process.exit(0); });
process.on('SIGTERM', () => { console.log('👋 Shutting down...'); process.exit(0); });
