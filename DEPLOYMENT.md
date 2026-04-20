# CareerFlow AI 部署与说明 (Full-Stack Express + Vite)

本项目已从纯前端架构升级为 **Full-Stack ( Express + Vite )** 全栈架构，专为 AI 应用的安全性与扩展性而设计。

## 1. 架构方案：Express 代理与托管

为了确保 **API Key 的安全性** 以及 **PDF 智能解析** 的实现，我们采用了统一的后端入口：

- **前端 (Frontend)**: 基于 Vite 6 + React 19 的现代化单页应用。
- **后端 (Backend)**: 基于 Express 的全栈 Node.js 监听服务。
- **解析引擎 (Parser)**: 集成 **SoMark** 第三方智能解析服务，通过后端中转解决浏览器端的 PDF 无法解析问题。

### 为什么采用此架构？
- **安全隔离**：`OPENAI_API_KEY` 与 `SOMARK_API_KEY` 仅保存在服务端环境变量中，永远不会暴露给客户端。
- **处理复杂请求**：PDF 解析需要 `multipart/form-data` 处理，后端 `multer` 配合 `form-data` 库比前端直接调用第三方接口更稳定、更安全。
- **统一路由**：所有 `/api/*` 请求均由 Express 处理，其余静态资源由 Express 托管 dist 目录。

## 2. 环境变量配置 (Secrets)

在部署环境（如 Cloud Run, Vercel, Docker）中，必须配置以下环境变量：

| 变量名 | 必填 | 说明 |
| :--- | :--- | :--- |
| `OPENAI_API_KEY` | 是 | OpenAI 或其兼容中转站的 API 密钥 (用于聊天及优化) |
| `SOMARK_API_KEY` | 是 | SoMark 智能解析平台的 API 密钥 (用于 PDF 解析) |
| `GEMINI_API_KEY` | 否 | 用于特定 Google AI 功能的密钥 (AI Studio 自动注入) |

## 3. 开发与构建命令

| 命令 | 描述 |
| :--- | :--- |
| `npm run dev` | 启动开发服务器。由 `tsx server.ts` 启动，集成 Vite 中间件。 |
| `npm run build` | **部署前必运行**。编译前端代码到 `dist/` 目录。 |
| `npm start` | 在生产环境中运行 Express 服务（需先运行 build）。 |

## 4. API 接口概览

- **POST `/api/ai/chat`**: 智能对话中转。
- **POST `/api/parse`**: 简历上传与解析。支持 PDF/DOC/DOCX。
- **GET `/api/health`**: 服务运行状态检查。
- **GET `/api/debug`**: (建议仅开发环境) 检查 API Key 加载状态。

## 5. 部署步骤 (通用)

1. **环境准备**：确保环境变量已在运行环境配置。
2. **构建**：执行 `npm run build` 产出静态文件。
3. **启动**：生产环境执行 `NODE_ENV=production node server.ts` (或 `npm start`)。

---
*注意：在 AI Studio 预览环境中，所有修改已实时生效，只需在 Secrets 面板配置密钥即可体验完整功能。*
