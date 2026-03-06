# 设计流程再造平台

基于 Next.js 15 + Supabase 的设计数据标准化与流程可视化管理平台，支持数据字典、流程建模、项目管理与交付文档。

## 技术栈

- Next.js 16 (App Router) + TypeScript
- Supabase (PostgreSQL + Auth)
- Shadcn/ui + Tailwind CSS v4
- ReactFlow、Zustand、React Query

## 本地运行

1. 复制 `.env.local.example` 为 `.env.local`，填入 Supabase 项目 URL 与 Anon Key。
2. 在 Supabase Dashboard → SQL Editor 中依次执行 `supabase/migrations/` 下 SQL：`001_init_schema.sql`、`002_rpc_functions.sql` 完成建表与 RPC；可选执行 `003_seed_data.sql` 导入模拟数据（数据字典、数据源、流程模型、项目、文档等）。
3. 安装依赖并启动：

```bash
pnpm install
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000)，未登录会跳转登录页；在 Supabase Dashboard → Authentication → Users 中创建用户后即可登录。

## 同步到 GitHub

当前仓库已在本地完成首次提交，如需推送到 GitHub，任选其一：

**方式一：用 GitHub CLI 创建仓库并推送**

```bash
gh auth login
gh repo create design-flow-platform-demo --public --source=. --remote=origin --push --description "设计流程再造平台"
```

**方式二：在网页上创建仓库后推送**

1. 在 [GitHub New Repository](https://github.com/new) 创建新仓库（如 `design-flow-platform-demo`），不要勾选 “Add a README”。
2. 在项目目录执行：

```bash
git remote add origin https://github.com/你的用户名/design-flow-platform-demo.git
git push -u origin main
```
