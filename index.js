require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const memoryDir = './memory';
const databaseDir = './database';

// التأكد من وجود المجلدات
if (!fs.existsSync(memoryDir)) fs.mkdirSync(memoryDir);
if (!fs.existsSync(databaseDir)) fs.mkdirSync(databaseDir);

// تحميل ملفات database إلى memory عند بدء البوت
function loadDatabaseToMemory() {
  const files = fs.readdirSync(databaseDir);
  files.forEach(file => {
    const src = path.join(databaseDir, file);
    const dest = path.join(memoryDir, file);
    fs.copyFileSync(src, dest);
  });
  console.log('✅ Database loaded into memory.');
}

loadDatabaseToMemory();

// دالة نسخ memory إلى database
function backupMemoryFiles() {
  const files = fs.readdirSync(memoryDir);
  files.forEach(file => {
    const src = path.join(memoryDir, file);
    const dest = path.join(databaseDir, file);
    fs.copyFileSync(src, dest);
  });
  console.log('✅ Memory files copied to database.');
}

// دفع الملفات إلى GitHub
function pushToGitHub() {
  exec('git add database && git commit -m "Auto backup" && git push', (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ Git push failed: ${error.message}`);
      return;
    }
    if (stderr) console.error(`❌ Git push stderr: ${stderr}`);
    else console.log('✅ Database pushed to GitHub.');
  });
}

// ضبط نسخة احتياطية ودفع تلقائي كل 10 دقائق
setInterval(() => {
  backupMemoryFiles();
  pushToGitHub();
}, 10 * 60 * 1000); // 10 دقائق

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

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

// حفظ رسائل المستخدمين في memory
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
