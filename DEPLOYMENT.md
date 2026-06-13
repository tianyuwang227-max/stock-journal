# Cloudflare Pages + D1 部署清单

这份清单用于把 A 股研究手账从本地预览切到 Cloudflare Pages + D1。前端会自动请求 `/api/state`，只要 D1 绑定名是 `DB`，部署后顶部会显示 `D1 模式`。

## 1. 创建 D1 数据库

在 Cloudflare 控制台创建一个 D1 数据库，建议名称：

```text
stock-journal
```

创建后复制真实的 `database_id`。

## 2. 绑定数据库

打开 `wrangler.toml`，取消下面这段注释，并把 `database_id` 换成真实 UUID：

```toml
[[d1_databases]]
binding = "DB"
database_name = "stock-journal"
database_id = "你的真实 database_id"
```

`binding` 必须保持为 `DB`，因为 `functions/api/state.js` 和 `functions/api/health.js` 都读取 `env.DB`。

## 3. 初始化表结构

用 `schema.sql` 或 `migrations/0001_initial.sql` 初始化 D1。需要存在的核心表是：

```text
app_state
daily_notes
stocks
company_research
decision_reviews
weekly_plans
weekly_tasks
weekly_archives
market_watch
```

当前前端主要把完整手账状态保存到 `app_state`，其它表为后续拆分和统计预留。

## 4. 部署 Pages

部署到 Cloudflare Pages 时，项目根目录就是静态站点输出目录；`functions/api/state.js` 和 `functions/api/health.js` 会作为 Pages Functions 生效。

部署后检查：

```text
https://你的域名/api/health
```

正常 D1 绑定结果应包含：

```json
{"ok":true,"storage":"d1","dbBound":true}
```

然后打开站点首页，顶部存储模式应显示：

```text
D1 模式
```

## 5. 本地上线前检查

上线前先跑：

```bash
npm run qa
```

如果你已经手动启动预览服务，也可以指定当前端口：

```bash
SMOKE_URL=http://127.0.0.1:4178 npm run smoke
```

## 6. 数据备份习惯

正式使用前，建议先点顶部 `导出` 保存一份 JSON。后续每周归档后也可以导出一次，作为 D1 之外的本地备份。
