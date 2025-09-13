const { Client, GatewayIntentBits, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const { analyzePersonality } = require('./gemini.js');
const questionsData = require('./questions.json');
const translations = require('./translations.json');

class DiscordBot {
  constructor(storage) {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
    });
    this.storage = storage;
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.client.once('ready', () => {
      console.log(`Discord bot ready! Logged in as ${this.client.user?.tag}`);
    });

    this.client.on('messageCreate', async (message) => {
      if (message.author.bot) return;
      if (!message.content.startsWith('!')) return;

      await this.handleCommand(message);
    });
  }

  async handleCommand(message) {
    const command = message.content.toLowerCase();
    const userId = message.author.id;
    const channelId = message.channel.id;

    try {
      // Get or create user
      let user = await this.storage.getUserByDiscordId(userId);
      if (!user) {
        user = await this.storage.createUser({
          discordId: userId,
          username: message.author.username,
          language: 'ar'
        });
      }

      const lang = user.language;
      const t = translations.responses;

      // Handle different commands
      if (command === '!start') {
        await this.handleStartCommand(message, user, channelId, lang);
      } else if (command === '!help') {
        await this.handleHelpCommand(message, lang);
      } else if (command === '!language') {
        await this.handleLanguageCommand(message, user, lang);
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

    await message.reply({ embeds: [embed] });
  }

  getQuestionById(questionId) {
    let currentId = 1;
    
    for (const category of questionsData.categories) {
      for (const trait of category.traits) {
        for (const question of trait.questions) {
          if (currentId === questionId) {
            return {
              id: questionId,
              categoryId: category.id,
              traitId: trait.id,
              text: question.text,
              category: category.name,
              trait: trait.name
            };
          }
          currentId++;
        }
      }
    }
    
    return null;
  }

  async completeTest(message, session, lang) {
    await this.storage.completeSession(session.id);

    const embed = new EmbedBuilder()
      .setTitle(translations.responses.test_completed[lang])
      .setDescription('🤖 Processing your personality analysis with AI...')
      .setColor(0x00FF00);

    const analysisButtons = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`analysis_surface_${session.id}`)
          .setLabel(translations.responses.analysis_types.surface[lang])
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId(`analysis_moderate_${session.id}`)
          .setLabel(translations.responses.analysis_types.moderate[lang])
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`analysis_comprehensive_${session.id}`)
          .setLabel(translations.responses.analysis_types.comprehensive[lang])
          .setStyle(ButtonStyle.Success)
      );

    await message.reply({ 
      embeds: [embed], 
      components: [analysisButtons] 
    });

    // Set up button interaction handler
    const filter = (interaction) => 
      interaction.user.id === message.author.id && 
      interaction.customId.startsWith('analysis_');

    const collector = message.channel.createMessageComponentCollector({ 
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
