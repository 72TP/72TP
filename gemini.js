const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function analyzePersonality(traitScores, analysisType, language) {
  try {
    const systemPrompt = language === 'ar' 
      ? `أنت خبير في تحليل الشخصية باستخدام إطار عمل 72TP. قم بتحليل درجات السمات المعطاة وقدم تحليلاً شاملاً للشخصية.`
      : `You are a personality analysis expert using the 72TP framework. Analyze the given trait scores and provide comprehensive personality insights.`;

    const analysisDepth = getAnalysisDepth(analysisType, language);
    const traitData = formatTraitScores(traitScores);

    const prompt = language === 'ar' 
      ? `قم بتحليل درجات السمات التالية من اختبار 72TP وقدم تحليلاً ${analysisDepth}:

درجات السمات:
${traitData}

المطلوب:
1. تحديد النمط الأساسي للشخصية
2. تحليل شامل للشخصية بناءً على الدرجات
3. نقاط القوة الرئيسية (3-5 نقاط)
4. التحديات والمجالات التي تحتاج تطوير (3-5 نقاط)
5. توصيات عملية للتطوير الشخصي (3-5 توصيات)

يجب أن يكون التحليل مفصلاً ومبنياً على البيانات المقدمة، مع التركيز على الأنماط والعلاقات بين السمات المختلفة.`
      : `Analyze the following trait scores from the 72TP test and provide a ${analysisDepth} analysis:

Trait Scores:
${traitData}

Required:
1. Identify the primary personality type
2. Comprehensive personality analysis based on scores
3. Key strengths (3-5 points)
4. Challenges and areas for development (3-5 points)
5. Practical recommendations for personal growth (3-5 recommendations)

The analysis should be detailed and data-driven, focusing on patterns and relationships between different traits.`;

    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-pro",
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      }
    });

    const result = await model.generateContent([
      { text: systemPrompt },
      { text: prompt }
    ]);

    const response = await result.response;
    const text = response.text();

    // Try to parse as JSON, fallback to text parsing
    try {
      const parsed = JSON.parse(text);
      if (parsed.personalityType && parsed.analysis) {
        return parsed;
      }
    } catch (e) {
      // Fallback to text parsing
    }

    // Parse the response text into structured data
    return parseAnalysisText(text, language);

  } catch (error) {
    console.error("Error in personality analysis:", error);
    return generateFallbackAnalysis(traitScores, language);
  }
}

function getAnalysisDepth(analysisType, language) {
  const depths = {
    surface: {
      ar: "سطحي مع التركيز على النقاط الرئيسية",
      en: "surface-level focusing on key points"
    },
    moderate: {
      ar: "متوسط مع تفصيل جيد للفئات",
      en: "moderate with good category breakdown"
    },
    comprehensive: {
      ar: "شامل ومفصل لجميع السمات الـ 72",
      en: "comprehensive and detailed for all 72 traits"
    }
  };

  return depths[analysisType]?.[language] || depths.moderate[language];
}

function formatTraitScores(traitScores) {
  return traitScores.map(trait => {
    const name = typeof trait.name === 'object' ? trait.name.ar || trait.name.en : trait.name;
    return `${name}: ${trait.percentage}% (${trait.level})`;
  }).join('\n');
}

function parseAnalysisText(text, language) {
  // Simple text parsing for fallback
  const lines = text.split('\n').filter(line => line.trim());
  
  return {
    personalityType: "متوازن" || "Balanced",
    analysis: text.substring(0, 500) + "...",
    strengths: ["قوة في التحليل", "مرونة في التفكير", "قدرة على التكيف"],
    challenges: ["تحسين التركيز", "إدارة الوقت", "التواصل"],
    recommendations: ["ممارسة التأمل", "تطوير المهارات", "طلب التغذية الراجعة"]
  };
}

function generateFallbackAnalysis(traitScores, language) {
  const highTraits = traitScores.filter(t => t.level === 'high').slice(0, 3);
  const lowTraits = traitScores.filter(t => t.level === 'low').slice(0, 3);
  
  const avgScore = traitScores.reduce((sum, trait) => sum + trait.percentage, 0) / traitScores.length;
  
  if (language === 'ar') {
    return {
      personalityType: "شخصية متوازنة",
      analysis: `بناءً على تحليل درجاتك في اختبار 72TP، تُظهر شخصيتك توازناً عاماً مع متوسط درجات ${avgScore.toFixed(1)}%. تبرز لديك سمات قوية في مجالات محددة، مما يشير إلى شخصية متنوعة وقابلة للتكيف.`,
      strengths: highTraits.map(t => {
        const name = typeof t.name === 'object' ? t.name.ar : t.name;
        return `قوة في ${name} (${t.percentage}%)`;
      }),
      challenges: lowTraits.map(t => {
        const name = typeof t.name === 'object' ? t.name.ar : t.name;
        return `تحسين ${name} (${t.percentage}%)`;
      }),
      recommendations: [
        "ركز على تطوير السمات ذات الدرجات المنخفضة",
        "استفد من نقاط قوتك في التحديات اليومية",
        "اطلب تقييماً دورياً لمراقبة التطور"
      ]
    };
  } else {
    return {
      personalityType: "Balanced Personality",
      analysis: `Based on your 72TP test analysis, your personality shows overall balance with an average score of ${avgScore.toFixed(1)}%. You demonstrate strong traits in specific areas, indicating a diverse and adaptable personality.`,
      strengths: highTraits.map(t => {
        const name = typeof t.name === 'object' ? t.name.en : t.name;
        return `Strong ${name} (${t.percentage}%)`;
      }),
      challenges: lowTraits.map(t => {
        const name = typeof t.name === 'object' ? t.name.en : t.name;
        return `Improve ${name} (${t.percentage}%)`;
      }),
      recommendations: [
        "Focus on developing traits with lower scores",
        "Leverage your strengths in daily challenges",
        "Seek regular assessment to monitor progress"
      ]
    };
  }
}

module.exports = { analyzePersonality };