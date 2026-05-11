# mono_srq

个人 monorepo 仓库，用于承载自己的多个项目。当前主要项目是 `apps/json-diagram`，后续也会继续在这个仓库中迭代，并逐步完善仓库级的 AI 友好化配置。
## 当前项目快速开始

  ### 1. 克隆仓库                                                                                                              
                                                                                                                               
  ```bash                                                                                                                      
  git clone <你的仓库地址>                                                                                                     
  cd mono_srq                                                                                                                  
                                                                                                                               
  ### 2. 安装依赖                                                                                                              
                                                                                                                               
  pnpm install                                                                                                                 
                                                                                                                               
  ### 3. 配置环境变量                                                                                                          
                                                                                                                               
  将下面这个文件：                                                                                                             
                                                                                                                               
  apps/json-diagram/.env.example                                                                                               
                                                                                                                               
  重命名为：                                                                                                                   
                                                                                                                               
  apps/json-diagram/.env.local                                                                                                 
                                                                                                                               
  然后打开 apps/json-diagram/.env.local，把里面的占位内容替换成你自己的 DeepSeek API Key：                                     
                                                                                                                               
  DEEPSEEK_API_KEY=你的 DeepSeek API Key                                                                                       
  DEEPSEEK_MODEL=deepseek-v4-flash                                                                                             
  DEEPSEEK_BASE_URL=https://api.deepseek.com                                                                                   
                                                                                                                               
  ### 4. 启动项目                                                                                                              
                                                                                                                               
  pnpm dev                                                                                                                     
                                                                                                                               
  ### 5. 打开页面                                                                                                              
                                                                                                                               
  浏览器访问：                                                                                                                 
                                                                                                                               
  http://localhost:xxxx   

## 仓库定位

这个仓库采用 `pnpm workspace` 管理，当前已经落地的核心项目是一个面向架构图生成场景的最小 MVP：

- 自然语言 -> Diagram JSON
- Diagram JSON -> 固定风格的生图 Prompt
- 历史记录保存：自然语言、JSON、Prompt 全链路快照

## 当前目录结构

```text
apps/
  json-diagram/       当前 MVP 项目

packages/
  shared/             共享 schema、preset、校验逻辑
```

## 当前阶段

`apps/json-diagram` 目前已经完成最小 MVP 验证，重点能力是：

- 将自然语言需求映射成分层架构图 JSON
- 通过固定单一风格 preset 生成更稳定的架构图 Prompt
- 支持结果页 JSON 编辑与 Prompt 再生成
- 支持历史记录查看与重新载入工作区

当前版本刻意收敛：

- 只支持 `layered_architecture`
- 只保留一个固定风格 preset
- 不追求复杂版本 diff / rollback
- 不追求多图类型与多主题系统

## 常用命令

在仓库根目录执行：

```bash
pnpm install
pnpm dev
pnpm build
pnpm test
```

说明：

- `pnpm dev`：启动当前主项目 `apps/json-diagram`
- `pnpm build`：构建当前主项目
- `pnpm test`：运行 workspace 测试

## 开发原则

- 新应用统一放到 `apps/<name>`
- 共享协议、preset、校验逻辑统一放到 `packages/shared`
- 不在仓库根目录堆放业务代码
- 当前优先保持 MVP 收敛，不急于扩展伪需求

## 后续方向

当前 MVP 已可用于验证产品方向。下一阶段重点更可能是：

- 固定风格进一步收敛
- 自然语言到 JSON 的稳定性优化
- JSON 到 Prompt 的风格一致性优化
- 基于真实样本继续验证生成质量
