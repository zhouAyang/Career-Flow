/// <reference types="vite/client" />
import { ContentSession, InterviewQuestion, ResumeOptimizationResult } from '../types';

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
   * 是否启用真实 AI 调用
   * - 生产环境默认启用真实API
   * - 开发环境默认使用Mock数据，可通过设置 VITE_USE_REAL_API=true 启用真实API
   */
  USE_REAL_API: import.meta.env.PROD || import.meta.env.VITE_USE_REAL_API === 'true',

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
      pros: ['经验丰富', '技能匹配'],
      gaps: ['缺少部分项目说明'],
      suggestions: ['建议补充量化指标'],
    };
  },

  async optimizeResumeText(text: string, action: string, jdContext?: string): Promise<string> {
    console.log('AI Service: Optimizing text...', { action });
    
    if (this.USE_REAL_API) {
      const prompt = `
# Role
你是一名拥有 10 年经验的资深猎头与简历专家，擅长使用结果导向（Action-oriented）的语言提升简历专业度。

# Task
目标要求：${action}
${jdContext ? `目标岗位背景：${jdContext}` : ''}

# Constraints
1. **深度重构**：严禁仅做词语替换。必须通过调整句式、优化强力动词（如“主导”、“驱动”、“重构”）来显著提升专业感。
2. **拒绝平庸**：改写后的内容必须与原句有明显差异，体现更高的职业素养和逻辑性。
3. **字数平衡**：优化后的长度应与原句保持接近（±15% 以内）。
4. **禁止编造**：严禁虚构任何简历中不存在的项目数据、技术栈或职责。

原始文本：
${text}

请直接输出优化后的结果，不要包含任何解释或辅助文字。
      `;

      return await this.callAI([
        { role: "system", content: "你是一个精通简历深层优化的资深专家，只输出润色结果。" },
        { role: "user", content: prompt }
      ]);
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
    return text + `\n\n[AI 优化：执行了 ${action} 操作]`;
  },

  /**
   * Generates structured resume optimization suggestions with strict groundedness rules.
   */
  async generateResumeSuggestions(resumeContent: string, jdText: string): Promise<ResumeOptimizationResult> {
    console.log('AI Service: Generating grounded resume suggestions...');
    
    if (this.USE_REAL_API) {
      const systemPrompt = `你是一名极其严谨的简历优化专家和 AI 产品工程师。你的核心任务是执行“有证据约束的文案优化”。

【最高禁令：严禁虚构】
1. 事实来源：必须且只能以用户提供的“简历内容”为唯一事实来源。
2. 零编造规则：严禁给用户增加任何原简历中没有的工作职责、项目成果（尤其是具体的数据如 30%）、所选工具或技术栈。
3. 身份完整：不要猜测用户的经历背景。如果简历中没写某个项目，严禁根据 JD 脑补。
4. 鲁棒性处理：如果“简历内容”看起来像是元数据（如只有文件名）、或者内容过少（少于 50 字）无法提供有效的改写建议，请将 left_panel 返回为空数组 []，并在 overall_note 中提示用户：“当前简历解析内容过少或格式不正确，请尝试手动粘贴简历文本或上传更高质量的 PDF 文件。”

【左侧建议区要求】
- section: 简历模块。
- original_text: 必须是简历中真实存在的句子。
- issue: 诊断该句在表达上的不足。
- revised_text: 优化方案。要求：通过更好的动词、指标前置、结构调整来提升专业感，但【绝对禁止】加入原句中没有的任何新名词（工具、职责、具体数字）。
- grounded: 必须确认为 true 且经过二次校验。
- note: 补充说明。

【右侧建议区要求】
- jd_keyword: 从 JD 中提取的关键词。
- matched_resume_evidence: 简历中是否有内容支撑。
- suggestion: 强化建议。如果简历里没有真实依据，必须明确写：“当前简历缺少经历支撑，需从其他经历加入该关键词”。
- safe_to_add: 只能是 "yes" 或 "no"。`;

      const userPrompt = `请分析以下 JD 和简历内容。

JD 内容：
${jdText}

简历原文：
${resumeContent}

请严格按照 JSON 格式输出，包含 left_panel, right_panel 和 overall_note。
如果“简历原文”中没有实质性的经历内容，请让 left_panel 为 []。`;

      return await this.callAI([
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ], true);
    }

    // Mock fallback
    await new Promise(resolve => setTimeout(resolve, 2000));
    return {
      left_panel: [],
      right_panel: [],
      overall_note: "AI 接口未启用或处于模拟模式。"
    };
  },

  /**
   * Generates interview questions based on resume and JD.
   */
  async generateInterviewQuestions(resumeContent: string, jdText: string, type?: 'jd' | 'company' | 'resume', count: number = 3): Promise<InterviewQuestion[]> {
    console.log('AI Service: Generating questions...', { type, count });
    
    if (this.USE_REAL_API) {
      const typePrompt = type 
        ? `请专门生成 ${count} 个【${type === 'jd' ? '岗位相关' : type === 'company' ? '公司相关' : '简历相关'}】的面试问题。`
        : `请生成 ${count} 个面试问题，涵盖岗位匹配度、公司了解程度和简历项目细节。`;

      const prompt = `
你是一名资深面试官。请根据以下 JD 和简历，${typePrompt}
请严格按照以下 JSON 格式输出结果：
{
  "questions": [
    { "question": "问题内容", "type": "jd | company | resume" }
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
      
      if (result && result.questions) {
        return result.questions.map((q: any) => ({
          id: Math.random().toString(36).substr(2, 9),
          ...q
        }));
      }
      return [];
    }

    await new Promise(resolve => setTimeout(resolve, 1200));
    const mockQuestions: InterviewQuestion[] = [
      { id: '1', question: '请详细介绍一下你在项目中的架构设计。', type: 'resume' },
      { id: '2', question: '你是如何处理性能优化问题的？', type: 'jd' },
      { id: '3', question: '你对我们公司的业务模式有什么看法？', type: 'company' }
    ];
    return type ? mockQuestions.filter(q => q.type === type) : mockQuestions;
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
