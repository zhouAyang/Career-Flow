import { ContentSession, InterviewQuestion } from '../types';

/**
 * AI Service Layer
 * 
 * This service handles all AI-related logic.
 * Currently, it returns mock data to ensure stability during demonstrations.
 * The structure is designed to be easily replaced with real OpenAI/Gemini API calls.
 * 
 * SECURITY NOTE: 
 * For production (e.g., Vercel deployment), real API calls should be proxied 
 * through a serverless function (e.g., /api/ai/*) to keep API keys hidden.
 */

export const aiService = {
  /**
   * 是否启用真实 API 调用 (部署在 Vercel 后可设为 true)
   */
  USE_REAL_API: false,

  /**
   * Analyzes the match between a resume and a job description.
   */
  async analyzeJDMatch(resumeContent: string, jdText: string): Promise<ContentSession['matchResult']> {
    console.log('AI Service: Analyzing JD match...', { resumeLength: resumeContent.length, jdLength: jdText.length });
    
    if (this.USE_REAL_API) {
      try {
        const response = await fetch('/api/ai/analyze-jd', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resumeContent, jdText })
        });
        return await response.json();
      } catch (error) {
        console.error('API Error:', error);
      }
    }

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Mock response
    return {
      score: 85,
      pros: [
        '5年+ 前端开发经验，符合岗位高级职级要求',
        '精通 React 生态，与岗位技术栈高度契合',
        '有大型 SaaS 项目背景，具备复杂业务处理能力'
      ],
      gaps: [
        '缺乏 Node.js 服务端开发相关描述',
        '简历中未体现对 Webpack/Vite 构建优化的具体成果',
        '缺少跨部门协作与团队领导的相关案例'
      ],
      suggestions: [
        '在“技术栈”中增加对 Node.js 的描述，并在最近的项目中补充一个涉及前后端联调或简单中间件开发的场景。',
        '量化你的工作成果。例如：将“优化了页面加载速度”改为“通过引入 Vite 和按需加载，将首屏加载时间降低了 40%”。'
      ],
    };
  },

  /**
   * Optimizes resume text based on specific actions.
   * Future implementation: POST to /api/ai/optimize
   */
  async optimizeResumeText(text: string, action: string, jdContext?: string): Promise<string> {
    console.log('AI Service: Optimizing text...', { action, jdContext: !!jdContext });
    
    if (this.USE_REAL_API) {
      try {
        const response = await fetch('/api/ai/optimize-resume', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, action, jdContext })
        });
        const data = await response.json();
        return data.optimizedText;
      } catch (error) {
        console.error('API Error:', error);
      }
    }

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simple mock transformation based on action
    if (action === '更精炼') {
      return text + '\n\n[AI 优化：已精简冗余描述，强化核心贡献]';
    }
    if (action === '更贴近岗位') {
      return text + '\n\n[AI 优化：已根据 JD 关键词调整技能权重]';
    }
    return text + `\n\n[AI 优化：执行了 ${action} 操作]`;
  },

  /**
   * Generates interview questions based on resume and JD.
   * Future implementation: POST to /api/ai/generate-questions
   */
  async generateInterviewQuestions(resumeContent: string, jdText: string, count: number = 4): Promise<InterviewQuestion[]> {
    console.log('AI Service: Generating questions...', { count });
    
    if (this.USE_REAL_API) {
      try {
        const response = await fetch('/api/ai/interview-questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resumeContent, jdText, count })
        });
        const data = await response.json();
        return data.questions;
      } catch (error) {
        console.error('API Error:', error);
      }
    }

    await new Promise(resolve => setTimeout(resolve, 1200));

    const mockQuestions = [
      '请详细介绍一下你在 SaaS 项目中负责的前端架构设计。',
      '你是如何处理大规模 React 应用的性能优化问题的？',
      '在跨部门协作中，如果遇到技术方案分歧，你会如何处理？',
      '为什么选择我们公司？你认为你最大的核心竞争力是什么？',
      '你在项目中遇到过最难的技术挑战是什么？是如何解决的？',
      '谈谈你对前端工程化的理解。',
      '如何看待当前前端技术栈的快速迭代？你平时是如何学习的？',
      '描述一次你带领团队解决紧急线上 Bug 的经历。'
    ];

    return mockQuestions.slice(0, count).map(q => ({
      id: Math.random().toString(36).substr(2, 9),
      question: q
    }));
  },

  /**
   * Reviews a user's interview answer and provides feedback.
   * Future implementation: POST to /api/ai/review-answer
   */
  async reviewInterviewAnswer(question: string, answer: string): Promise<{ feedback: string; tags: string[] }> {
    console.log('AI Service: Reviewing answer...');
    
    if (this.USE_REAL_API) {
      try {
        const response = await fetch('/api/ai/review-answer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question, answer })
        });
        return await response.json();
      } catch (error) {
        console.error('API Error:', error);
      }
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      feedback: '“您的回答涵盖了技术细节，但建议增加更多关于‘为什么这么做’的思考。例如在提到性能优化时，可以先说明当时遇到的具体业务痛点（如首屏加载超过 5s），然后再引出优化手段和最终量化结果。”',
      tags: ['逻辑清晰', '建议增加量化数据', '技术深度达标']
    };
  }
};
