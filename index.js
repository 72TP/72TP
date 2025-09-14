require('dotenv').config();
const fs = require('fs');
const path = require('path');
const simpleGit = require('simple-git');
const { DiscordBot } = require('./discord.js'); // ملف الأوامر
const memoryDir = './memory';
if (!fs.existsSync(memoryDir)) fs.mkdirSync(memoryDir);

const token = process.env.DISCORD_TOKEN;
const geminiKey = process.env.GEMINI_KEY;
const githubToken = process.env.GITHUB_TOKEN; // توكن شخصي مع صلاحية repo
const githubUser = process.env.GITHUB_USER;   // اسم المستخدم في GitHub
const githubRepo = process.env.GITHUB_REPO;   // اسم المستودع

if (!token || !geminiKey || !githubToken || !githubUser || !githubRepo) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

class InMemoryStorage {
  async getUserByDiscordId(discordId) {
    const file = path.join(memoryDir, `${discordId}.json`);
    if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file));
    return null;
  }
  async createUser({ discordId, username, language }) {
    const user = { discordId, username, language };
    fs.writeFileSync(path.join(memoryDir, `${discordId}.json`), JSON.stringify(user, null, 2));
    return user;
  }
  async updateUserLanguage(discordId, language) {
    const file = path.join(memoryDir, `${discordId}.json`);
    if (fs.existsSync(file)) {
      const user = JSON.parse(fs.readFileSync(file));
      user.language = language;
      fs.writeFileSync(file, JSON.stringify(user, null, 2));
    }
  }
  async getActiveSession(userId) {
    const file = path.join(memoryDir, `${userId}_session.json`);
    if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file));
    return null;
  }
  async createSession({ userId, channelId, currentQuestion, answers, isCompleted }) {
    const session = { userId, channelId, currentQuestion, answers, isCompleted };
    fs.writeFileSync(path.join(memoryDir, `${userId}_session.json`), JSON.stringify(session, null, 2));
    return session;
  }
  async updateSession(userId, updateData) {
    const file = path.join(memoryDir, `${userId}_session.json`);
    if (fs.existsSync(file)) {
      const session = JSON.parse(fs.readFileSync(file));
      Object.assign(session, updateData);
      fs.writeFileSync(file, JSON.stringify(session, null, 2));
    }
  }
  async saveAnswer(userId, questionId, answer) {
    const file = path.join(memoryDir, `${userId}_session.json`);
    if (fs.existsSync(file)) {
      const session = JSON.parse(fs.readFileSync(file));
      session.answers[questionId] = answer;
      fs.writeFileSync(file, JSON.stringify(session, null, 2));
    }
  }
  async completeSession(userId) {
    const file = path.join(memoryDir, `${userId}_session.json`);
    if (fs.existsSync(file)) {
      const session = JSON.parse(fs.readFileSync(file));
      session.isCompleted = true;
      fs.writeFileSync(file, JSON.stringify(session, null, 2));
    }
  }
}

// رفع الملفات إلى GitHub
async function pushToGitHub() {
  try {
    const git = simpleGit();
    await git.addConfig('user.name', githubUser);
    await git.addConfig('user.email', `${githubUser}@users.noreply.github.com`);
    await git.add('./memory/*');
    await git.commit(`Auto-save memory at ${new Date().toISOString()}`);
    await git.push(`https://${githubToken}@github.com/${githubUser}/${githubRepo}.git`, 'main');
    console.log('✅ Memory pushed to GitHub');
  } catch (err) {
    console.error('❌ Failed to push memory to GitHub:', err.message);
  }
}

// تشغيل البوت
async function main() {
  const storage = new InMemoryStorage();
  const bot = new DiscordBot(storage);

  try {
    console.log('🚀 Starting 72TP Discord Bot...');
    await bot.login(token);
    console.log('✅ Bot is online and ready!');

    // رفع تلقائي كل 10 دقائق
    setInterval(pushToGitHub, 10 * 60 * 1000);
  } catch (err) {
    console.error('❌ Failed to start bot:', err);
    process.exit(1);
  }
}

process.on('SIGINT', () => {
  console.log('👋 Shutting down bot...');
  process.exit(0);
});
process.on('SIGTERM', () => {
  console.log('👋 Shutting down bot...');
  process.exit(0);
});

main();
