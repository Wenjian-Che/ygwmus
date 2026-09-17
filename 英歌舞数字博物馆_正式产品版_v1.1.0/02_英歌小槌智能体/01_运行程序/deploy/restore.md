# 恢复演练与回滚（模板）

本文件仅描述恢复流程；不要在未经授权的服务器上直接执行。恢复前先确认备份来源、操作者、目标 release 和维护窗口，并保留当前私密状态副本。

1. 停止服务：`sudo systemctl stop yingge-museum`。
2. 校验备份包：在隔离目录运行 `sha256sum -c private-state.tar.gz.sha256`，并确认归档内只有预期的私密状态路径。
3. 将当前 `/var/lib/yingge-museum/private` 重命名为带时间戳的保留目录；不要直接删除。
4. 解压受校验的归档到 `/var/lib/yingge-museum/`，恢复 `private` 目录所有者为 `yingge:yingge`、权限为 `0700`。
5. 将 `/srv/yingge-museum/current` 原子切回已验证的 release；公众 `web/mugeda-agent.js` 与运行程序必须来自同一 release。
6. 执行 `sudo systemctl start yingge-museum`，然后检查 `/api/health`、`/api/ready` 和管理员会话。
7. 用无痕浏览器请求 `https://yinggemus.cn/mugeda-agent.js`；确认响应含 `Cache-Control: no-cache, max-age=0, must-revalidate, s-maxage=0`，再进行一次 If-None-Match 复验。

恢复演练至少应在非生产环境完成一次，验证知识库、回答引用、语音会话和木疙瘩裸脚本加载；不应把真实用户对话或凭据复制到演练环境。
