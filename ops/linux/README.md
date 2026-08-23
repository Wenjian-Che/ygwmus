# Linux 生产部署

建议环境：Ubuntu 22.04/24.04、Node.js 22、Python 3、Caddy。

生产结构：

- `/opt/yingge`：应用代码、静态页面和本地数据；
- `/etc/yingge/agent.env`：仅服务账户可读的模型与管理密钥；
- `yingge-agent.service`：Node API 守护进程；
- Caddy：同域提供静态 H5，把 `/api/*` 反向代理到 `127.0.0.1:8787`；
- `yingge-backup.timer`：每天备份 SQLite 和核心知识清单，保留 14 天。
- `yingge-refresh.timer`：每天发现动态候选、运行检索回归并重算问题聚类；候选仍需人工审核，不会自动污染正式知识库。

上线前必须替换 `Caddyfile` 与 `agent.env` 中的示例域名，生成随机 `ADMIN_TOKEN`，并把 `AGENT_ALLOWED_ORIGINS` 限定为正式 HTTPS 域名。真实 `.env`、私钥和 API Key 不进入代码目录。

验证顺序：

1. `systemctl status yingge-agent --no-pager`
2. `curl -fsS http://127.0.0.1:8787/api/health`
3. `caddy validate --config /etc/caddy/Caddyfile`
4. `curl -fsS https://正式域名/api/health`
5. 浏览器验证首页、智能体问答、后台登录和移动端布局。
