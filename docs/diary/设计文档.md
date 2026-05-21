# 语音日记 App 设计文档

## 概述

一个自用的语音转文字日记 PWA，核心流程：iPhone 键盘语音输入口述片段 → DeepSeek AI 整理成完整日记 → 时间线 + 日历两种方式浏览。

## 技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 前端 | Next.js (App Router) | PWA，部署到 Vercel |
| 数据库 | Supabase Postgres | 免费额度够个人使用 |
| AI | DeepSeek API | 通过 Supabase Edge Function 中转 |
| 认证 | 无 | Supabase 预置一个用户，前端硬编码 token |
| 语音输入 | iOS 键盘自带 | 零开发成本，利用系统级语音识别 |

## 数据模型

```sql
diary_entries (
  id              uuid primary key default gen_random_uuid()
  user_id         uuid not null
  date            date not null
  raw_notes       jsonb[] not null default '{}'
  generations     jsonb[] not null default '{}'
  pinned_gen_idx  int                   -- null or index into generations
  created_at      timestamptz default now()
  updated_at      timestamptz default now()

  unique(user_id, date)
);

-- Row-Level Security：只允许用户读写自己的日记
alter table diary_entries enable row level security;
create policy "只能读写自己的日记" on diary_entries
  for all using (auth.uid() = user_id);
```

- `raw_notes`: `[{time: "10:30", text: "早上想到..."}, ...]`，按追加顺序排列
- `generations`: `[{gen_at, content, summary, raw_snapshot}, ...]`，每次触发生成追加一条
- `pinned_gen_idx`: 指向当前选中的 generation，默认指向最新那条
- `unique(user_id, date)`: 每人每天最多一条记录

## 页面结构

### 页面 1：输入页（首页，`/`）

页面布局（固定三段式）：

```
┌──────────────────────────┐
│                          │
│   今天的历史记录时间线     │  ← 可滚动区域
│   · 10:30  "早上想到..." │     只有存在记录的
│   · 14:00  "午饭时..."   │     时间点才出现节点
│                          │
├────────── 分割线 ────────┤
│                          │
│   ▼ 18:30 ▼              │  ← 输入区，固定锚点
│   [输入框 + 保存片段]     │     始终在页面同一位置
│                          │
├────────── 分割线 ────────┤
│                          │
│   今天日记                │  ← 日记区，固定位置
│   (未生成时为空)          │     可编辑
│   (已生成则显示正文)      │
│                          │
│   [生成日记] / [查看版本] │
│                          │
└──────────────────────────┘
```

交互规则：
- 首次打开（今天无记录）：只有输入框和空的日记区，时间线区为空
- 每次保存片段后：节点自动出现在时间线正确的时间位置
- 上下滑动：仅时间线区域可滚动，输入框和日记区始终不动
- 时间戳严格实时，不可手动修改
- 时间线节点可滑动删除（iOS 风格 swipe-to-delete），删除后该片段从 raw_notes 移除
- "生成日记"按钮：调用 DeepSeek API，将当前所有 raw_notes 汇总成一篇日记
  - 每次都追加一个新 version 到 generations 数组
  - 不覆盖历史版本
- "查看版本"：列出所有历史 generation，可切换当前显示的版本
- 日记区内容在确认保存前可编辑，确认后更新 pinned_gen_idx

### 页面 2：日历浏览页（`/calendar`）

- iOS 日历风格的周/月/年视图切换
- 有日记的日期用圆点标记
- 点击某一天 → 显示该天的 raw_notes 时间线 + 日记正文
- 不可在历史天编辑或添加片段

### 导航

- 底部 tab bar：时间线 | 日历
- iPhone Safari PWA 模式下与原生切换体验一致

## Edge Function API 契约

### 端点

`POST /generate-diary`

### 鉴权

前端请求携带 Supabase JWT（通过 `supabase.auth.getSession()` 获取），Edge Function 验证 JWT 有效性后放行。DeepSeek API Key 存储在 Supabase Edge Function 的环境变量中（`DEEPSEEK_API_KEY`），不暴露到前端。

### 请求

```json
{
  "rawNotes": [
    { "time": "10:30", "text": "早上想到..." },
    { "time": "14:00", "text": "午饭时..." }
  ]
}
```

### 响应（成功）

```json
{
  "content": "今天上午想到了一个关于日记应用的设计方案...",
  "summary": "日记应用设计构思"
}
```

### 响应（失败）

```json
{
  "error": "DeepSeek API 调用失败，请稍后重试",
  "code": "API_ERROR"
}
```

错误码：`API_ERROR`（DeepSeek 返回错误）、`TIMEOUT`（超时）、`RATE_LIMITED`（频率限制）

### UI 状态对应

| 状态 | UI 表现 |
|------|---------|
| 生成中 | 按钮置灰 + loading spinner，日记区显示骨架屏 |
| 成功 | 日记区填入内容，可编辑 |
| 失败 | 日记区显示错误提示 + 重试按钮 |

---

## AI Prompt 设计

Edge Function 中调用 DeepSeek API：

```
系统提示：你是一个私人日记助手。用户会提供一天中多个时间点记录的口述片段，
请将其整理成一篇简洁、通顺的日记。要求：
- 以第一人称书写
- 保持口语化、自然，不要过于文学化
- 按时间顺序组织内容
- 去除明显的语气词和重复
- 同时生成一个8字以内的一句话摘要

用户输入：{raw_notes 按时间排列的文本}
```

## 部署

- Next.js 部署到 Vercel（Hobby 计划免费）
- Supabase 项目（免费额度：500MB 数据库、每月 2M Edge Function 调用）
- DeepSeek API Key 存储在 Supabase Secrets（`supabase secrets set DEEPSEEK_API_KEY`），Edge Function 运行时读取，不接触前端
- DeepSeek API 按量付费
- 添加 `.superpowers/` 到 `.gitignore`

## 不做的

- 不需要登录/注册界面（硬编码单用户）
- 不需要离线模式（PWA 基础缓存除外）
- 不需要导出功能
- 不需要搜索
- 不需要情绪/标签分类
- 不需要电脑端的语音输入
- 不需要多设备同步冲突处理（单用户顺序操作不会冲突）
