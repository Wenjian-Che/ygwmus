# 正式服务部署模板

这些文件只提供单机部署的可审查模板，不会执行部署。这是一个单实例服务：运行需要 Node.js 22.14 或更高版本、Nginx，以及一个 `yingge` 系统账户；公众静态站点由 Nginx 提供，Node 仅绑定 `127.0.0.1:8787`。

## 发布结构

将一次正式发布组装为同一 release 中的两个目录：

```text
/srv/yingge-museum/releases/v1.5.2/runtime/   # 本目录 01_运行程序 的内容
/srv/yingge-museum/releases/v1.5.2/web/       # 01_公众网站 的内容
/srv/yingge-museum/current -> releases/v1.5.2
```

环境文件中必须把运行时和 Nginx 指向同一个正式公众目录：

```sh
YINGGE_PUBLIC_WEB_ROOT=/srv/yingge-museum/current/web
```

服务会优先使用这个绝对路径。未设置时，运行程序只会在存在 `index.html` 和 `app.js` 的兼容布局中识别 `../web`（发布包）、同一正式包的 `../../01_公众网站`（本地正式包）或旧式 `runtime/web`；不会从私密状态路径猜测目录。生产预检会拒绝不存在、不是目录或服务账户不可读的公众根目录。

不要把私密状态、知识索引、SQLite、管理员配置或真实 `.env` 放入 release。私密数据位于 `/var/lib/yingge-museum/private`，唯一的公众生成投影是同级、但不属于私密根的 `/var/lib/yingge-museum/public/data/exhibits.public.json`。初始化目录时，需保证 Nginx 可读、服务账户可写：

```sh
sudo install -d -o yingge -g yingge -m 0700 /var/lib/yingge-museum/private
sudo install -d -o yingge -g nginx -m 2750 /var/lib/yingge-museum/public/data
```

将 `yingge-museum.env.example` 复制到 `/etc/yingge-museum/yingge-museum.env` 后填入真实凭据。`AGENT_ALLOWED_ORIGINS` 必须列出实际公众站和木疙瘩的精确来源；模板包含 `https://5.mgd5.com`，如果木疙瘩改用其他域名，应增加该精确来源，不使用通配符。

## 稳定的木疙瘩脚本地址

木疙瘩工程只需保留下面这一句，不再随每次发布修改 `?v=` 参数：

```js
script.src = "https://yinggemus.cn/mugeda-agent.js";
```

`nginx.yingge-museum.conf` 为这个精确路径单独设置 `Cache-Control: no-cache, max-age=0, must-revalidate, s-maxage=0` 和 ETag。这样浏览器或微信 WebView 可保存副本，但每次新页面加载会向源站重新校验；文件改变时会得到新脚本，未改变时可使用 304。该策略不强制刷新已经打开且未重新载入的网页，也不能绕过第三方平台自行写死的缓存层。

发布前先确认 release 中的 `web/mugeda-agent.js` 是本次代码。服务器必须安装本目录的精确文件 `deploy/nginx.yingge-museum.conf`（或把其中同名 `location = /mugeda-agent.js` 原样合入现有站点）；裸 URL 的更新正确性依赖这一段配置，不能只改木疙瘩脚本。安装后运行：

```sh
sudo nginx -t
sudo systemctl reload nginx
curl -sSI https://yinggemus.cn/mugeda-agent.js
```

最后一条必须显示上述 `Cache-Control` 值和 ETag。取得 ETag 后再发送带 `If-None-Match` 的 HEAD/GET 请求，未变更时应得到 `304 Not Modified`。

## 服务、首次管理员与检查

安装 systemd unit 后执行 `sudo systemctl daemon-reload && sudo systemctl enable --now yingge-museum`。首次管理员只能从服务器本机回环地址创建：在服务已启动的终端临时提供 `YINGGE_ADMIN_USERNAME`、`YINGGE_ADMIN_PASSWORD` 后运行 `node deploy/bootstrap-admin.mjs`。该脚本不接受命令行密码，也不把密码打印到日志。

每次切换 release 后检查：

```sh
curl -fsS https://yinggemus.cn/api/health
curl -fsS https://yinggemus.cn/api/ready
sudo systemctl status yingge-museum --no-pager
```

`/api/ready` 必须确认知识文件和 SQLite 持久化均已就绪。管理员页面依赖 Nginx 内部鉴权子请求；不要公开 `/_museum_auth`，也不要暴露未授权素材、检索 chunks 或来源注册表。

## 备份与回滚

使用 `backup.sh` 备份私密持久状态并保存哈希；release 本身应由 Git tag/制品保留。发生问题时按 [restore.md](restore.md) 停止服务、校验、恢复并切回上一个 release。回滚后仍要验证网站问答、语音、木疙瘩加载和未授权素材拦截，而不是只看进程是否存活。
