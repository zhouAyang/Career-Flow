# CareerFlow AI 部署说明 (Vercel)

本项目已针对 Vercel 部署进行了工程化准备，采用了 **前端 (Vite + React) + 后端代理 (Vercel Serverless Functions)** 的架构。

## 1. 为什么需要服务端代理？

**核心原因：安全性 (Security)**

- **隐藏 API Key**：如果直接在前端代码中调用 OpenAI API，你的 `OPENAI_API_KEY` 会暴露在浏览器的 Network 面板中，任何人都可以轻易窃取并消耗你的额度。
- **跨域处理 (CORS)**：通过同域下的 `/api/*` 路径调用，可以避免复杂的跨域配置。
- **请求流控**：可以在服务端对请求进行过滤、缓存或日志记录。

## 2. 环境变量配置

在 Vercel 部署时，请在项目设置的 **Environment Variables** 页面添加以下变量：

| 变量名 | 说明 | 示例值 |
| :--- | :--- | :--- |
| `OPENAI_API_KEY` | OpenAI 的官方 API 密钥 | `sk-xxxx...` |

> **注意**：前端代码中不需要配置此变量，它仅在 `api/` 目录下的服务端代码中通过 `process.env.OPENAI_API_KEY` 访问。

## 3. 目录结构说明

- `/src`: 前端 React 源代码。
- `/api`: Vercel Serverless Functions 目录。
  - `/api/ai/analyze-jd.ts`: 对应路径 `/api/ai/analyze-jd`
  - `/api/ai/optimize-resume.ts`: 对应路径 `/api/ai/optimize-resume`
  - `/api/ai/interview-questions.ts`: 对应路径 `/api/ai/interview-questions`
  - `/api/ai/review-answer.ts`: 对应路径 `/api/ai/review-answer`

## 4. 如何切换到真实 API？

1. 在 `src/services/aiService.ts` 中，将 `USE_REAL_API` 开关设为 `true`。
2. 在 `/api/ai/*.ts` 文件中，引入 OpenAI SDK 并替换模拟逻辑。
3. 确保 Vercel 后台已配置有效的 `OPENAI_API_KEY`。

## 5. 本地开发

运行 `npm run dev` 启动前端。
如果需要本地调试 API 接口，建议安装 [Vercel CLI](https://vercel.com/cli) 并运行 `vercel dev`。
