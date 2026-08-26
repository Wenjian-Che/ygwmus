# 英歌舞数字博物馆

独立的英歌舞数字博物馆原型仓库。项目从旧工作区中经过筛选迁移，只保留当前 v3 前台、英歌小槌后端、知识检索数据和接管文档。

## 当前能力

- Logo SVG 描边、显影、归位与馆名波浪入场
- 首页与九个主题页面
- GSAP 页面转场、滚动动效与 reduced-motion 降级
- Three.js 阵法互动演示
- 中国地图与英歌地区交互索引
- 英歌小槌本地知识库问答接口
- 团队视频与木疙瘩 H5 的明确接入位置

后台当前以受保护的管理 API 形式提供，覆盖反馈、知识任务、答案修订、证据审计、评测和应用注册。旧工作区中的管理 HTML 页面没有迁入本仓库，后续应在 API 稳定后单独做一套干净的管理前端。

## 本地启动

要求：Node.js 18+、Python 3。

```powershell
Copy-Item backend/.env.example backend/.env
# 在 backend/.env 中填写 DEEPSEEK_API_KEY
./start-local.ps1
```

打开：

- 博物馆：http://127.0.0.1:8096/
- 智能体健康检查：http://127.0.0.1:8787/api/health

不启用智能体时，也可以只运行静态站：

```powershell
python -m http.server 8096 --bind 127.0.0.1 --directory web
```

## 项目结构

```text
web/          当前数字博物馆前台与检索数据
backend/      英歌小槌 HTTP 服务
agent/        智能体配置、结构化知识与测试
automation/   运行时审核队列（仓库只保留目录）
docs/         接管说明、方案和审计结论
```

## 接管入口

新 Agent 请先阅读 [docs/HANDOFF.md](docs/HANDOFF.md)，再看 [docs/PROJECT_PLAN.md](docs/PROJECT_PLAN.md)。

## 安全边界

- 仓库不包含真实 `.env`、API Key、本地 SQLite、日志或用户对话。
- 当前仅为本地原型，不代表已部署生产环境。
- 地图为交互原型，正式发布前必须替换为合规标准地图并核验审图信息。
