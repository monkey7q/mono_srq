# JSON Diagram Workbench

`apps/json-diagram` 是当前仓库里的主项目，一个面向架构图生成场景的最小 MVP。

## 项目目标

这个项目不做通用绘图工具，而是做一条收敛的生成链路：

1. 用户输入自然语言需求
2. 大模型将需求解析成结构化 Diagram JSON
3. 本地逻辑校验并规范化 JSON
4. 系统基于固定风格 preset 生成稳定 Prompt
5. 保存历史记录，保留输入 / JSON / Prompt 全链路快照

## 当前能力

- 支持 `layered_architecture`
- 支持自然语言生成 Diagram JSON
- 支持结果页直接编辑 JSON
- 支持根据编辑后的 JSON 重新生成 Prompt
- 支持保存历史记录
- 支持查看历史详情并重新载入工作区

## 当前收敛策略

当前版本不是多风格、多图类型平台，而是故意收紧：

- 只保留一个固定风格 preset
- 重点保证层级结构清晰
- Prompt 重点强调层与层之间的依赖
- 历史记录只做快照查看，不做复杂 diff / rollback

## 技术栈

- `Next.js`
- `React`
- `TDesign`
- `Prisma`
- `SQLite`
- `DeepSeek API`
- `@repo/shared` 共享 schema / preset / 校验逻辑

## 数据存储

当前使用 `Prisma + SQLite`。

核心表：

- `GenerationRecord`

保存字段包括：

- 原始自然语言输入
- `diagramJson`
- `generationPrompt`
- `presetId`
- `provider`
- 时间信息

## 本地开发

在仓库根目录执行：

```bash
pnpm dev
```

如果需要单独在项目目录执行：

```bash
pnpm dev
pnpm build
pnpm test
pnpm db:generate
pnpm db:push
```

## 环境变量

本地需要在 `apps/json-diagram/.env.local` 中配置：

```env
DEEPSEEK_API_KEY=your_key
DEEPSEEK_MODEL=deepseek-v4-flash
DEEPSEEK_BASE_URL=https://api.deepseek.com
```

不要把真实 key 提交到仓库。

## 目录说明

```text
app/               Next.js 页面与 Route Handlers
src/               主链路、模型调用、prompt 生成、记录逻辑
prisma/            SQLite schema
test/              Node 原生测试
ui/                参考图、样式素材
```

## 当前最重要的产品判断

这个项目当前真正要验证的是：

- 模糊自然语言能否稳定变成清晰 JSON
- 固定风格下的生图 Prompt 是否能尽量收敛

而不是优先做复杂功能堆叠。
