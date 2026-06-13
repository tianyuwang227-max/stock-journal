# A 股研究手账

一个偏个人学习日记的 A 股研究工具。第一版是静态前端，包含总览、行情大屏、公司研究、反思判断、每周计划和打卡本。

界面支持桌面大屏和手机窄屏浏览，桌面偏行情/手账工作台，手机会自动切成单栏记录模式。

当前版本：`v1.0.0`。版本说明见 [RELEASE_NOTES.md](./RELEASE_NOTES.md)，部署清单见 [DEPLOYMENT.md](./DEPLOYMENT.md)。

## 本地预览

```bash
npm run dev
```

打开：

```text
http://127.0.0.1:4176
```

本地预览会模拟 `/api/state`，数据会写到 `.local-state.json`，顶部显示 `本地接口`。如果接口不可用，前端会退回浏览器 `localStorage`。`dev-server.mjs` 会关闭缓存，适合反复调试界面。本地和部署环境都提供 `/api/health`，用于快速确认接口与存储模式。

顶部的「导出 / 导入」可以把当前本地数据备份成 JSON，或者恢复之前的 JSON 备份。「导出MD」会生成一份适合放进笔记软件的 Markdown 复盘档案。

公司研究报告和本周复盘摘要支持一键复制，方便粘贴到外部笔记。

顶部会显示当前存储模式和保存状态：

- `本地模式`：数据保存在当前浏览器的 `localStorage`
- `本地接口`：本地预览服务模拟 `/api/state`，数据保存在 `.local-state.json`
- `D1 模式`：部署到 Cloudflare Pages 且 D1 绑定可用时，数据会写入 `/api/state`
- `有未保存更改 / 已自动备份 / 已保存 / 保存中 / D1 失败，已转本地`：用于确认当前保存结果

编辑停顿后会自动做本地备份；关闭或刷新页面前如果还有未手动保存内容，浏览器会提醒。也可以用 `Cmd/Ctrl + S` 快捷保存。

删除记录、填充示例、归档本周、开启新周等可能覆盖或清空内容的动作都会二次确认。

## 本地检查

完整检查：

```bash
npm run qa
```

单独语法检查：

```bash
npm run check
```

这个命令会检查前端脚本、本地预览服务和 Pages Function 的语法。

可以跑接口烟测：

```bash
npm run smoke
```

如果本地预览服务没有启动，smoke 会在 `4176-4186` 之间找可用端口临时启动，测完自动关闭；如果这些端口里已经有兼容的本地接口，会直接复用。

如果预览服务不在默认 `4176` 端口：

```bash
SMOKE_URL=http://127.0.0.1:4178 npm run smoke
```

烟测会验证页面关键工作表、`/api/health`、`/api/state` 的 GET/POST、非法 JSON、非对象状态拦截，并在结束时恢复原本的本地接口状态。

## D1 结构

- `schema.sql`：D1 表结构
- `migrations/0001_initial.sql`：第一版 D1 初始化迁移
- `functions/api/state.js`：Cloudflare Pages Function，绑定名使用 `DB`
- `functions/api/health.js`：Cloudflare Pages 健康检查接口，用来确认 D1 是否绑定
- `wrangler.toml`：D1 绑定模板，创建真实 D1 数据库后再填入 `database_id`

第一版前端会先请求 `/api/state`。如果接口不可用、D1 未绑定或保存失败，会自动退回本地模式。`/api/state` 支持 `GET`、`POST` 和 `OPTIONS`，错误会返回 JSON，并且只接受对象型手账状态。手账数据会带 `schemaVersion`，导入 JSON 时会先做基础结构校验。

### Cloudflare Pages 接入顺序

1. 创建 D1 数据库。
2. 把真实 `database_id` 填到 `wrangler.toml`，并取消 `[[d1_databases]]` 注释。
3. 用 `schema.sql` 或 `migrations/0001_initial.sql` 初始化数据库。
4. 部署到 Cloudflare Pages 后，前端会自动使用 `/api/state` 保存数据。

更完整的部署检查表见 [DEPLOYMENT.md](./DEPLOYMENT.md)。

## 页面结构

- 总览：最近研究公司、重点观察股票、本周复盘完成情况、本周复盘日历、今日任务、待复盘判断、研究阶段分布，并可从观察股票建研究卡
- 行情大屏：指数、板块、市场节奏、重点观察股票、今日市场笔记，并可从重点观察股票建研究卡
- 公司研究：基础问题、研究问题池、资料来源、自定义问题、研究完成度、搜索公司，可生成结构化研究报告，并可一键带入反思判断
- 反思判断：你自己判断可以买、观察、不买或放弃，并记录证据、下次复盘日期、验证结果、复盘提示、判断完整度和买入前检查表，支持搜索和状态筛选
- 每周计划：自己创建任务，可生成包含每日复盘的本周摘要，并支持归档本周与开启新周
- 打卡本：每周任务打卡、周一到周日生活日记、每日复盘卡、生活复盘提示、像素奖励
