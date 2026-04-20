# CareerFlow AI 部署说明 (Vercel)

本项目已针对 Vercel 部署进行了工程化准备，采用了 **前端 (Vite + React) + 后端代理 (Vercel Serverless Functions)** 的架构。

## 1. 为什么需要服务端代理？

**核心原因：安全性 (Security)**

- **隐藏 API Key**：如果直接在前端代码中调用 OpenAI API，你的 `OPENAI_API_KEY` 会暴露在浏览器的 Network 面板中，任何人都可以轻易窃取并消耗你的额度。
- **跨域处理 (CORS)**：通过同域下的 `/api/*` 路径调用，可以避免复杂的跨域配置。
- **中转站支持**：通过代理可以方便地接入 `gptsapi` 等中转服务。

## 2. 环境变量配置

在 Vercel 部署时，请在项目设置的 **Environment Variables** 页面添加以下变量：

| 变量名 | 说明 | 示例值 |
| :--- | :--- | :--- |
| `OPENAI_API_KEY` | OpenAI 中转站的 API 密钥 | `sk-xxxx...` |

> **注意**：前端代码中不需要配置此变量，它仅在 `api/` 目录下的服务端代码中通过 `process.env.OPENAI_API_KEY` 访问。

## 3. 目录结构说明

- `/src`: 前端 React 源代码。
- `/api`: Vercel Serverless Functions 目录。
  - `/api/ai/chat.ts`: 统一的 AI 聊天代理接口，对应路径 `/api/ai/chat`。

## 4. AI 功能接入

本项目已全面接入真实 AI 能力（基于 `gpt-4o-mini`）：
- **JD 匹配分析**：自动分析简历与岗位的匹配度。
- **简历优化**：针对性润色简历文案。
- **面试问题生成**：基于背景预测高频面试题。
- **面试回答点评**：实时反馈回答质量。

## 5. 本地开发

运行 `npm run dev` 启动前端。
如果需要本地调试 API 接口，建议安装 [Vercel CLI](https://vercel.com/cli) 并运行 `vercel dev`。
