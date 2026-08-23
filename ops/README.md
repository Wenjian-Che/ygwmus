# 英歌智能体运维

## 备份

在项目根目录执行：

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\ops\backup.ps1
```

备份写入 `backups/YYYYMMDD-HHmmss/`，包含 SQLite、应用清单、来源注册表、知识版本和动态候选池；不会复制 `backend/.env`。

建议在每日动态任务完成后再运行一次备份，并把 `backups` 目录同步到受控存储。恢复前先停止 backend 服务，确认目标备份目录后再人工替换文件。

## 上线检查

## 反向代理模板

- `Caddyfile.example`：适合快速获得自动 HTTPS；
- `nginx.conf.example`：适合已有 Nginx 环境。

两个模板都把 `/api/` 转发到 `127.0.0.1:8787`，其他路径提供 `web/` 静态 H5。部署时请替换域名和项目绝对路径，并只让反向代理暴露公网端口，后端 API 保持本机监听。

上线前可以先运行自检：

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\ops\preflight.ps1
powershell.exe -ExecutionPolicy Bypass -File .\ops\preflight.ps1 -Production
```

第二条命令会把 `ADMIN_TOKEN` 视为必填，并以退出码表示是否通过。

- 使用 HTTPS 反向代理；
- 设置 `ADMIN_TOKEN`，不要保持本地空值；
- 轮换曾经出现在聊天记录中的 API Key；
- 限制管理接口来源和请求频率；
- 只公开 `/api/health`、`/api/dynamic` 和智能体接口；
- 定期验证 SQLite 备份可读取；
- 每日抓取失败时配置告警。
