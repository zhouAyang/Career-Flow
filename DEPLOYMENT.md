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
| `SOMARK_API_KEY` | SoMark PDF 解析 API 密钥 | `sk-xxxx...` |

> **注意**：前端代码中不需要配置此变量，它们仅在 `api/` 目录下的服务端代码中通过 `process.env` 访问。

## 3. 目录结构说明

- `/src`: 前端 React 源代码。
- `/api`: Vercel Serverless Functions 目录。
  - `/api/ai/chat.ts`: 统一的 AI 聊天代理接口，对应路径 `/api/ai/chat`。
  - `/api/parse-resume.ts`: 简历文件解析接口，对应路径 `/api/parse-resume`，支持 PDF、DOC、DOCX 格式。

## 4. AI 功能接入

本项目已全面接入真实 AI 能力（基于 `gpt-4o-mini`）：
- **JD 匹配分析**：自动分析简历与岗位的匹配度。
- **简历优化**：针对性润色简历文案。
- **面试问题生成**：基于背景预测高频面试题。
- **面试回答点评**：实时反馈回答质量。

## 5. 文件上传解析功能

本项目支持 PDF 和 Word 简历文件上传解析：

### 支持的文件格式
- **PDF 文件**：通过 SoMark API 进行解析（需要 `SOMARK_API_KEY` 环境变量）
- **Word 文件**：DOC 和 DOCX 格式，使用 mammoth 库解析

### 文件大小限制
- 最大文件大小：10MB
- Vercel 函数配置：已在 `vercel.json` 中设置 `maxRequestBodySize: 10485760`（10MB）

### API 端点
- `POST /api/parse-resume`：简历文件解析接口
  - 请求：`multipart/form-data`，字段名 `file`
  - 响应：`{ text: string, fileName: string, fileType: string }`

## 6. 本地开发

本地开发支持两种方式：

### 前端开发
运行 `npm run dev` 启动前端开发服务器。

### 后端 API 开发
1. **完整服务器模式**：运行 `npm run dev:full` 启动 Express 服务器（包含文件上传功能）
2. **Vercel 函数模式**：运行 `vercel dev` 启动 Vercel 开发服务器，支持所有 API 端点

> **注意**：文件上传功能在 Vercel 部署中需要使用 `SOMARK_API_KEY` 环境变量，本地开发时可在 `.env` 文件中配置。
