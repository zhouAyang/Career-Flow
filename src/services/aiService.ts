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
   * Generates structured resume optimization suggestions with strict grounding.
   */
  async generateResumeSuggestions(resumeContent: string, jdText: string): Promise<ResumeOptimizationResult> {
    console.log('AI Service: Generating grounded resume suggestions...');
    
    if (this.USE_REAL_API) {
      const systemPrompt = `
你是一名资深 AI 产品工程师和简历优化专家。你的任务是提供“有证据约束的建议生成”，而不是自由润色。

【核心规则 - 严禁编造】
1. 必须严格以用户上传的简历原文为唯一事实来源。
2. 只能对简历原句做重组、提炼、压缩和职业化表达，禁止新增任何原简历中没有出现的事实（如虚构的职责、工具、成果、数据）。
3. 禁止根据 JD 脑补用户经历。
4. 当信息不足以支持某项优化时，宁可少写，也不要补写。
5. 如果无法确认某条内容是否被简历支持，默认判定为不支持。

【输出结构】
你必须返回一个 JSON 对象，包含以下字段：
- left_panel: 基于简历原文的具体修改建议。
- right_panel: 基于 JD 的关键词匹配建议。
- overall_note: 整体建议。

【左侧建议区要求】
- section: 简历所属模块（如：实习经历、项目经历、技能工具）。
- original_text: 必须是简历中的原句。
- issue: 说明这句存在的问题（如：表达冗长、缺乏结果导向、关键词不突出）。
- revised_text: 修改建议。只能基于原句改写，禁止新增事实。如果原句信息不足，直接提示“建议补充真实内容后再优化”。
- grounded: 布尔值，是否严格基于原文。
- note: 补充说明。

【右侧建议区要求】
- jd_keyword: 从 JD 中提取的关键词。
- jd_reason: 为什么这个关键词重要。
- matched_resume_section: 建议在简历哪个模块强化。
- matched_resume_evidence: 简历中是否有内容支撑该关键词。
- suggestion: 强化建议。如果简历里没有真实依据，必须明确写：“当前简历缺少经历支撑，需从其他经历加入该关键词”。
- safe_to_add: 只能是 "yes" 或 "no"。只有当简历中有明确证据支撑时才为 "yes"。
`;

      const userPrompt = `
请分析以下 JD 和简历内容，生成优化建议。

JD 内容：
${jdText}

简历内容：
${resumeContent}

请严格按照以下 JSON 格式输出：
{
  "left_panel": [
    {
      "section": "...",
      "original_text": "...",
      "issue": "...",
      "revised_text": "...",
      "grounded": true,
      "note": "..."
    }
  ],
  "right_panel": [
    {
      "jd_keyword": "...",
      "jd_reason": "...",
      "matched_resume_section": "...",
      "matched_resume_evidence": "...",
      "suggestion": "...",
      "safe_to_add": "yes/no"
    }
  ],
  "overall_note": "..."
}
`;

      return await this.callAI([
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ], true);
    }

    // Mock fallback
    await new Promise(resolve => setTimeout(resolve, 2000));
    return {
      left_panel: [
        {
          section: "实习经历",
          original_text: "负责前端架构设计与核心组件开发",
          issue: "描述较为笼统，未体现技术栈与最终产出",
          revised_text: "负责前端架构设计与核心组件开发，提升了组件复用率",
          grounded: true,
          note: "仅对原句进行了精炼，未添加虚构成果"
        }
      ],
      right_panel: [
        {
          jd_keyword: "TypeScript",
          jd_reason: "JD 明确要求熟练使用 TypeScript",
          matched_resume_section: "技能工具",
          matched_resume_evidence: "简历中已提到 TypeScript",
          suggestion: "建议在项目经历中更多体现 TypeScript 的类型定义实践",
          safe_to_add: "yes"
        },
        {
          jd_keyword: "Node.js",
          jd_reason: "岗位涉及全栈开发，需要 Node.js 背景",
          matched_resume_section: "无",
          matched_resume_evidence: "当前简历未提及 Node.js 相关经历",
          suggestion: "当前简历缺少经历支撑，需从其他经历加入该关键词",
          safe_to_add: "no"
        }
      ],
      overall_note: "简历整体真实度高，建议针对 JD 关键词在已有经历中做更深度的表达强化。"
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
    { "question": "问题内容", "type": "jd | company | resume" },
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
