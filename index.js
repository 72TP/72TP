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