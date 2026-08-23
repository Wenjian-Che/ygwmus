# H5 与木疙瘩嵌入智能体

## 标准网页接入

在目标 H5 的 `body` 末尾加入：

```html
<script
  src="https://你的静态域名/agent-widget.js"
  data-api-base="https://你的 Agent API 域名"
  data-app-id="yingge-h5"
  data-title="问家雀">
</script>
```

组件会自动创建右下角悬浮入口，支持流式回答、Markdown、真实引用来源、移动端全屏模式和错误提示。DeepSeek API Key 只保存在后端，不会进入 H5。

## 木疙瘩一键接入

1. 修改 `web/mugeda-agent-bundle.js` 顶部 `DEFAULT_CONFIG.apiBase` 为线上 Agent API 地址。
2. 将这个文件部署到 HTTPS 静态地址。
3. 在木疙瘩专业版中选择“文件 → 导入 → JS 脚本”，只导入 `mugeda-agent-bundle.js`。
4. 发布作品后，将发布页面的真实 Origin 加入后端 `AGENT_ALLOWED_ORIGINS`。

也可以不修改单文件包，在木疙瘩的自定义脚本中先写配置：

```js
window.YINGGE_MUGEDA_AGENT_CONFIG = {
  apiBase: "https://api.example.com",
  appId: "yingge-mugeda",
  title: "问家雀",
  position: "right",
  mobileFullscreen: true
};
```

单文件包会等待木疙瘩 `renderReady` 事件；在非木疙瘩页面中则等待 DOM 就绪。它会把组件挂载到 `document.body`，避免被舞台缩放、裁剪和 transform 影响。

### 木疙瘩页面按钮控制

```js
MugedaYinggeAgent.open();
MugedaYinggeAgent.ask("英歌为什么要敲槌？");
MugedaYinggeAgent.close();
```

如果直接控制组件，也可以使用：

```js
YinggeAgentWidget.open();
YinggeAgentWidget.ask("英歌舞和英歌有什么区别？");
YinggeAgentWidget.close();
```

## 上线前配置

服务端 `.env` 示例：

```dotenv
AGENT_ALLOWED_ORIGINS=https://作品发布域名,https://你的自定义域名
AGENT_RATE_LIMIT_PER_MINUTE=30
```

生产环境不要使用 `*`。静态组件、Agent API 和木疙瘩作品都应使用 HTTPS。组件只获得业务 API 地址，不获得模型密钥。

## 验证页

- 标准 H5：`web/agent-embed.html`
- 木疙瘩生命周期模拟：`web/mugeda-agent-demo.html`
- 组件本体：`web/agent-widget.js`
- 木疙瘩单文件包：`web/mugeda-agent-bundle.js`
- 双文件加载器（高级部署方式）：`web/mugeda-agent-loader.js`
