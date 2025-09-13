// Simple in-memory storage for the standalone Discord bot
class InMemoryStorage {
  constructor() {
    this.users = new Map();
    this.sessions = new Map();
    this.answers = new Map(); // sessionId -> answers object
    this.analyses = new Map();
    this.idCounter = 1;
  }

  // User methods
  async getUserByDiscordId(discordId) {
    return Array.from(this.users.values()).find(user => user.discordId === discordId) || null;
  }

  async createUser(userData) {
    const user = {
      id: this.idCounter++,
      discordId: userData.discordId,
      username: userData.username,
      language: userData.language || 'ar'
    };
    this.users.set(user.id, user);
    return user;
  }

  async updateUserLanguage(discordId, language) {
    const user = await this.getUserByDiscordId(discordId);
    if (user) {
      user.language = language;
      this.users.set(user.id, user);
    }
    return user;
  }

  // Session methods
  async getActiveSession(userId, channelId) {
    return Array.from(this.sessions.values()).find(
      session => session.userId === userId && 
                session.channelId === channelId && 
                !session.isCompleted
    ) || null;
  }

  async createSession(sessionData) {
    const session = {
      id: this.idCounter++,
      userId: sessionData.userId,
      channelId: sessionData.channelId,
      currentQuestion: sessionData.currentQuestion || 1,
      isCompleted: false,
      createdAt: new Date()
    };
    this.sessions.set(session.id, session);
    this.answers.set(session.id, {});
    return session;
  }

  async updateSession(sessionId, updates) {
    const session = this.sessions.get(sessionId);
    if (session) {
      Object.assign(session, updates);
      this.sessions.set(sessionId, session);
    }
    return session;
  }

  async completeSession(sessionId) {
    return this.updateSession(sessionId, { isCompleted: true });
  }

  // Answer methods
  async saveAnswer(sessionId, questionId, answer) {
    if (!this.answers.has(sessionId)) {
      this.answers.set(sessionId, {});
    }
    const sessionAnswers = this.answers.get(sessionId);
    sessionAnswers[questionId.toString()] = answer;
    this.answers.set(sessionId, sessionAnswers);
  }

  async getSessionAnswers(sessionId) {
    return this.answers.get(sessionId) || {};
  }

  // Analysis methods
  async saveAnalysis(analysisData) {
    const analysis = {
      id: this.idCounter++,
      sessionId: analysisData.sessionId,
      analysisType: analysisData.analysisType,
      traitScores: analysisData.traitScores,
      personalityType: analysisData.personalityType,
      aiAnalysis: analysisData.aiAnalysis,
      strengths: analysisData.strengths,
      challenges: analysisData.challenges,
      recommendations: analysisData.recommendations,
      createdAt: new Date()
    };
    this.analyses.set(analysis.id, analysis);
    return analysis;
  }
}

module.exports = { InMemoryStorage };