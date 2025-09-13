require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

this.handleLanguageCommand(message, user, lang);
      } else if (command === '!reset') {
        await this.handleResetCommand(message, user, channelId, lang);
      } else if (command === '!continue') {
        await this.handleContinueCommand(message, user, channelId, lang);
      } else if (command === '!status') {
        await this.handleStatusCommand(message, user, channelId, lang);
      } else if (command.match(/^!\d+\.[0-4]$/)) {
        await this.handleAnswerCommand(message, user, channelId, command, lang);
      } else {
        await message.reply(t.invalid_command[lang]);
      }
    } catch (error) {
      console.error('Error handling command:', error);
      await message.reply('An error occurred while processing your command.');
    }
  }

  async handleStartCommand(message, user, channelId, lang) {
    // Check for existing active session
    let session = await this.storage.getActiveSession(user.id, channelId);
    
    if (session) {
      await this.presentQuestion(message, session, lang);
      return;
    }

    // Create new session
    session = await this.storage.createSession({
      userId: user.id,
      channelId,
      currentQuestion: 1,
      answers: {},
      isCompleted: false
    });
const embed = new EmbedBuilder()
      .setTitle(translations.responses.test_started[lang])
      .setDescription(translations.responses.welcome[lang])
      .setColor(0x5865F2)
      .setTimestamp();

    await message.reply({ embeds: [embed] });
    await this.presentQuestion(message, session, lang);
  }

  async handleHelpCommand(message, lang) {
    const embed = new EmbedBuilder()
      .setTitle('72TP Bot Help')
      .setDescription(translations.responses.help_message[lang])
      .setColor(0x00FF00)
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  }

  async handleLanguageCommand(message, user, currentLang) {
    const newLang = currentLang === 'ar' ? 'en' : 'ar';
    await this.storage.updateUserLanguage(user.discordId, newLang);
    
    const responseMsg = newLang === 'ar' 
      ? translations.responses.language_changed.ar
      : translations.responses.language_changed.en;
    
    await message.reply(responseMsg);
  }

  async handleResetCommand(message, user, channelId, lang) {
    const session = await this.storage.getActiveSession(user.id, channelId);
    if (session) {
      await this.storage.updateSession(session.id, {
        currentQuestion: 1,
        answers: {},
        isCompleted: false
      });
    }

    const resetMsg = lang === 'ar' 
      ? '🔄 تم إعادة تعيين الاختبار. اكتب `!start` للبدء من جديد.'
      : '🔄 Test reset. Type `!start` to begin again.';
    
    await message.reply(resetMsg);
  }

  async handleContinueCommand(message, user, channelId, lang) {
    const session = await this.storage.getActiveSession(user.id, channelId);
    if (!session) {
      const noSessionMsg = lang === 'ar' 
        ? 'لا يوجد اختبار نشط. اكتب `!start` لبدء اختبار جديد.'
        : 'No active test found. Type `!start` to begin a new test.';
      await message.reply(noSessionMsg);
      return;
    }
    await this.presentQuestion(message, session, lang);
  }

  async handleStatusCommand(message, user, channelId, lang) {
    const session = await this.storage.getActiveSession(user.id, channelId);
    if (!session) {
      const noSessionMsg = lang === 'ar' 
        ? 'لا يوجد اختبار نشط.'
        : 'No active test found.';
      await message.reply(noSessionMsg);
      return;
    }

    const answers = await this.storage.getSessionAnswers(session.id);
    const answeredCount = Object.keys(answers).length;
    const percentage = ((answeredCount / 360) * 100).toFixed(1);
    
    const progressMsg = translations.responses.progress[lang]
      .replace('{current}', answeredCount.toString())
      .replace('{total}', '360')
      .replace('{percentage}', percentage);

    await message.reply(progressMsg);
  }

  async handleAnswerCommand(message, user, channelId, command, lang) {
    const session = await this.storage.getActiveSession(user.id, channelId);
    if (!session) {
      const noSessionMsg = lang === 'ar' 
        ? 'لا يوجد اختبار نشط. اكتب `!start` لبدء اختبار جديد.'
        : 'No active test found. Type `!start` to begin a new test.';
      await message.reply(noSessionMsg);
      return;
    }

    // Parse command (!123.2 -> questionId: 123, answer: 2)
    const match = command.match(/^!(\d+)\.([0-4])$/);
    if (!match) return;

    const questionId = parseInt(match[1]);
    const answer = parseInt(match[2]);

    // Validate question ID
    if (questionId < 1 || questionId > 360) {
      const invalidMsg = lang === 'ar' 
        ? 'رقم السؤال غير صحيح. يجب أن يكون بين 1 و 360.'
        : 'Invalid question number. Must be between 1 and 360.';
      await message.reply(invalidMsg);
      return;
    }

    // Save answer
    await this.storage.saveAnswer(session.id, questionId, answer);

    // Always update to the next sequential question after the one just answered
    const nextQuestion = questionId + 1;
    await this.storage.updateSession(session.id, {
      currentQuestion: nextQuestion
    });

    await message.react('✅');
        // Check if test is complete
    const answers = await this.storage.getSessionAnswers(session.id);
    if (Object.keys(answers).length >= 360) {
      await this.completeTest(message, session, lang);
    } else if (nextQuestion <= 360) {
      // Get the updated session and automatically show the next question
      const updatedSession = await this.storage.getActiveSession(user.id, channelId);
      if (updatedSession) {
        await this.presentQuestion(message, updatedSession, lang);
      }
    }
  }

  async presentQuestion(message, session, lang) {
    const questionData = this.getQuestionById(session.currentQuestion);
    if (!questionData) return;

    const answers = await this.storage.getSessionAnswers(session.id);
    const answeredCount = Object.keys(answers).length;
    const percentage = ((answeredCount / 360) * 100).toFixed(1);

    const embed = new EmbedBuilder()
      .setTitle(`${questionData.category[lang]} | ${questionData.trait[lang]}`)
      .setDescription(
        `**${translations.responses.question_format[lang]
          .replace('{current}', session.currentQuestion.toString())
          .replace('{total}', '360')}**\n\n${questionData.text[lang]}`
      )
      .addFields({
        name: 'Answer Options',
        value: `\`!${session.currentQuestion}.0\` - ${translations.responses.answer_options.strongly_disagree[lang]}\n` +
               `\`!${session.currentQuestion}.1\` - ${translations.responses.answer_options.disagree[lang]}\n` +
               `\`!${session.currentQuestion}.2\` - ${translations.responses.answer_options.neutral[lang]}\n` +
               `\`!${session.currentQuestion}.3\` - ${translations.responses.answer_options.agree[lang]}\n` +
               `\`!${session.currentQuestion}.4\` - ${translations.responses.answer_options.strongly_agree[lang]}`
      })
      .setFooter({ 
        text: translations.responses.progress[lang]
          .replace('{current}', answeredCount.toString())
          .replace('{total}', '360')
          .replace('{percentage}', percentage)
      })
      .setColor(0x5865F2);
    message.channel.createMessageComponentCollector({ 
      filter, 
      time: 300000 // 5 minutes
    });

    collector.on('collect', async (interaction) => {
      const analysisType = interaction.customId.split('_')[1];
      await this.generateAnalysis(interaction, session.id, analysisType, lang);
    });
  }

  async generateAnalysis(interaction, sessionId, analysisType, lang) {
    await interaction.deferReply();

    try {
      const answers = await this.storage.getSessionAnswers(sessionId);
      const traitScores = this.calculateTraitScores(answers);
      
      const aiAnalysis = await analyzePersonality(traitScores, analysisType, lang);
      
      await this.storage.saveAnalysis({
        sessionId,
        analysisType,
        traitScores,
        personalityType: aiAnalysis.personalityType,
        aiAnalysis: aiAnalysis.analysis,
        strengths: aiAnalysis.strengths,
        challenges: aiAnalysis.challenges,
        recommendations: aiAnalysis.recommendations
      });
            const embed = new EmbedBuilder()
        .setTitle(`🧠 ${lang === 'ar' ? 'تحليل شخصيتك' : 'Your Personality Analysis'}`)
        .setDescription(aiAnalysis.analysis)
        .addFields(
          {
            name: lang === 'ar' ? '🎯 النمط الأساسي' : '🎯 Primary Type',
            value: aiAnalysis.personalityType || 'N/A',
            inline: true
          },
          {
            name: lang === 'ar' ? '💪 نقاط القوة' : '💪 Strengths',
            value: Array.isArray(aiAnalysis.strengths) 
              ? aiAnalysis.strengths.slice(0, 3).join('\n• ') 
              : 'Analysis in progress...',
            inline: true
          },
          {
            name: lang === 'ar' ? '⚠️ التحديات' : '⚠️ Challenges',
            value: Array.isArray(aiAnalysis.challenges) 
              ? aiAnalysis.challenges.slice(0, 3).join('\n• ') 
              : 'Analysis in progress...',
            inline: true
          }
        )
        .setColor(0x9932CC)
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('Error generating analysis:', error);
      await interaction.editReply('❌ Error generating analysis. Please try again.');
    }
  }

  calculateTraitScores(answers) {
    const traitScores = [];
    let currentQuestionId = 1;
    for (const category of questionsData.categories) {
      for (const trait of category.traits) {
        let traitTotal = 0;
        let questionCount = 0;

        for (const question of trait.questions) {
          if (answers[currentQuestionId.toString()] !== undefined) {
            traitTotal += answers[currentQuestionId.toString()];
            questionCount++;
          }
          currentQuestionId++;
        }

        if (questionCount > 0) {
          const averageScore = traitTotal / questionCount;
          const percentage = (averageScore / 4) * 100; // Convert to percentage (0-4 scale to 0-100)
          
          let level;
          if (percentage <= 40) level = 'low';
          else if (percentage <= 70) level = 'medium';
          else level = 'high';

          traitScores.push({
            traitId: trait.id,
            name: trait.name,
            score: averageScore,
            percentage: Math.round(percentage),
            level
          });
        }
      }
    }

    return traitScores;
  }

  async login(token) {
    await this.client.login(token);
  }
}

module.exports = { DiscordBot };

const memoryDir = './memory';
if (!fs.existsSync(memoryDir)) fs.mkdirSync(memoryDir);

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
