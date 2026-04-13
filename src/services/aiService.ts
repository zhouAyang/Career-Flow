import { ContentSession, InterviewQuestion } from '../types';

/**
 * AI Service Layer
 * 
 * This service handles all AI-related logic.
 * It uses a secure serverless proxy (/api/ai/chat) to call the OpenAI API.
 * 
 * SECURITY NOTE: 
 * API keys are stored in environment variables on the server (Vercel) 
 * and are never exposed to the client.
 */

export const aiService = {
  /**
   * 是否启用真实 AI 调用 (部署在 Vercel 后可设为 true)
   * 注意：在本地开发时，如果未配置 OPENAI_API_KEY，请保持为 false 以使用 Mock 数据
   */
  USE_REAL_API: true,

  /**
   * 统一调用 AI 聊天接口
   */
  async callAI(messages: { role: string; content: string }[], jsonMode: boolean = false): Promise<any> {
    if (!this.USE_REAL_API) return null;

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages,
          response_format: jsonMode ? { type: "json_object" } : undefined
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `AI API responded with status ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      if (jsonMode) {
        try {
          // Sometimes AI wraps JSON in markdown blocks
          const jsonStr = content.replace(/```json\n?|\n?```/g, '').trim();
          return JSON.parse(jsonStr);
        } catch (e) {
          console.error('Failed to parse AI JSON response:', content);
          throw new Error('AI 返回的数据格式不正确');
        }
      }
      
      return content;
    } catch (error) {
      console.error('AI Service Error:', error);
      throw error;
    }
  },

  /**
   * Analyzes the match between a resume and a job description.
   */
  async analyzeJDMatch(resumeContent: string, jdText: string): Promise<ContentSession['matchResult']> {
    console.log('AI Service: Analyzing JD match...');
    
    if (this.USE_REAL_API) {
      const prompt = `
你是一名资深招聘经理。请分析以下 JD（职位描述）与候选人简历的匹配程度。
请严格按照以下 JSON 格式输出结果：
{
  "score": 匹配评分(0-100),
  "pros": ["优势点1", "优势点2", ...],
  "gaps": ["不足/缺口1", "不足/缺口2", ...],
  "suggestions": ["针对性的修改建议1", "针对性的修改建议2", ...]
}

JD 内容：
${jdText}

简历内容：
${resumeContent}
      `;

      return await this.callAI([
        { role: "system", content: "你是一个专业的简历分析助手，只输出 JSON 格式的数据。" },
        { role: "user", content: prompt }
      ], true);
    }

    // Fallback to mock
    await new Promise(resolve => setTimeout(resolve, 1500));
    return {
      score: 85,
      pros: ['5年+ 前端开发经验', '精通 React 生态', '有大型项目背景'],
      gaps: ['缺乏 Node.js 经验', '未体现构建优化成果'],
      suggestions: ['补充 Node.js 描述', '量化工作成果'],
    };
  },

  /**
   * Optimizes resume text based on specific actions.
   */
  async optimizeResumeText(text: string, action: string, jdContext?: string): Promise<string> {
    console.log('AI Service: Optimizing text...', { action });
    
    if (this.USE_REAL_API) {
      const prompt = `
你是一名专业的简历优化专家。请根据以下要求优化简历片段。
要求：${action}
${jdContext ? `目标岗位背景：${jdContext}` : ''}

原始文本：
${text}

请直接输出优化后的文本，不要包含任何解释或开场白。
      `;

      return await this.callAI([
        { role: "system", content: "你是一个专业的简历文案优化专家。" },
        { role: "user", content: prompt }
      ]);
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
    return text + `\n\n[AI 优化：执行了 ${action} 操作]`;
  },

  /**
   * Generates interview questions based on resume and JD.
   */
  async generateInterviewQuestions(resumeContent: string, jdText: string, count: number = 4): Promise<InterviewQuestion[]> {
    console.log('AI Service: Generating questions...', { count });
    
    if (this.USE_REAL_API) {
      const prompt = `
你是一名资深面试官。请根据以下 JD 和简历，生成 ${count} 个针对性的面试问题。
请严格按照以下 JSON 格式输出结果：
{
  "questions": [
    { "id": "唯一ID", "question": "问题内容" },
    ...
  ]
}

JD 内容：
${jdText}

简历内容：
${resumeContent}
      `;

      const result = await this.callAI([
        { role: "system", content: "你是一个专业的面试官，只输出 JSON 格式的数据。" },
        { role: "user", content: prompt }
      ], true);
      
      return result.questions;
    }

    await new Promise(resolve => setTimeout(resolve, 1200));
    return [
      { id: '1', question: '请详细介绍一下你在项目中的架构设计。' },
      { id: '2', question: '你是如何处理性能优化问题的？' }
    ];
  },

  /**
   * Reviews a user's interview answer and provides feedback.
   */
  async reviewInterviewAnswer(question: string, answer: string): Promise<{ feedback: string; tags: string[] }> {
    console.log('AI Service: Reviewing answer...');
    
    if (this.USE_REAL_API) {
      const prompt = `
你是一名面试辅导专家。请点评用户对以下面试问题的回答。
请严格按照以下 JSON 格式输出结果：
{
  "feedback": "详细的点评建议",
  "tags": ["标签1", "标签2", "标签3"]
}

面试问题：
${question}

用户回答：
${answer}
      `;

      return await this.callAI([
        { role: "system", content: "你是一个专业的面试辅导专家，只输出 JSON 格式的数据。" },
        { role: "user", content: prompt }
      ], true);
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      feedback: '回答逻辑清晰，但建议增加更多量化指标。',
      tags: ['逻辑清晰', '建议量化']
    };
  }
};
