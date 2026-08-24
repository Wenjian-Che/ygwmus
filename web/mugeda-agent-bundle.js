/*
 * 英歌智能体 · 木疙瘩单文件接入包
 * 生成自 build-mugeda-bundle.cjs，请修改 DEFAULT_CONFIG.apiBase 后部署。
 */
(function (window, document) {
  "use strict";

  var DEFAULT_CONFIG = {
    apiBase: "https://请替换为你的-agent-api-域名",
    appId: "yingge-mugeda",
    title: "问英歌小槌",
    subtitle: "英歌文化知识助手 · 证据优先",
    position: "right",
    mobileFullscreen: true,
    autoOpen: false,
    primaryColor: "#a55d51",
    darkColor: "#1f3b54"
  };
  var config = Object.assign({}, DEFAULT_CONFIG, window.YINGGE_MUGEDA_AGENT_CONFIG || {});
  var booted = false;

  function emit(name, detail) {
    window.dispatchEvent(new CustomEvent(name, { detail: detail || {} }));
  }

  function validConfig() {
    var isHttps = /^https:\/\//i.test(config.apiBase);
    var isLocal = /^http:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?(?:\/|$)/i.test(config.apiBase);
    return (isHttps || isLocal) && config.apiBase.indexOf("请替换") === -1;
  }

  function boot() {
    if (booted || (window.YinggeAgentWidget && window.YinggeAgentWidget.__ready)) return;
    if (!validConfig()) {
      var error = new Error("请先在 mugeda-agent-bundle.js 中配置 HTTPS 的 apiBase");
      emit("yingge-mugeda:error", { error: error });
      if (window.console) console.error("[英歌智能体]", error.message);
      return;
    }
    booted = true;
    window.YINGGE_AGENT_CONFIG = Object.assign({}, config);
    /*
     * Yingge Agent embeddable widget
     *
     * Standard usage:
     * <script
     *   src="https://static.example.com/agent-widget.js"
     *   data-api-base="https://api.example.com"
     *   data-app-id="yingge-h5"
     *   data-title="问英歌小槌">
     * </script>
     *
     * Platform usage (Mugeda and other script importers):
     * window.YINGGE_AGENT_CONFIG = { apiBase: "https://api.example.com" };
     */
    (function (window, document) {
      "use strict";
    
      if (window.YinggeAgentWidget && window.YinggeAgentWidget.__ready) {
        window.dispatchEvent(new CustomEvent("yingge-agent:ready", { detail: window.YinggeAgentWidget }));
        return;
      }
    
      var currentScript = document.currentScript;
      var globalConfig = window.YINGGE_AGENT_CONFIG || {};
      var scriptConfig = currentScript && currentScript.dataset ? currentScript.dataset : {};
      var config = {
        apiBase: scriptConfig.apiBase || globalConfig.apiBase || window.location.origin,
        appId: scriptConfig.appId || globalConfig.appId || "yingge-h5",
        title: scriptConfig.title || globalConfig.title || "问英歌小槌",
        subtitle: scriptConfig.subtitle || globalConfig.subtitle || "英歌文化知识助手 · 证据优先",
        knowledgeVersion: scriptConfig.knowledgeVersion || globalConfig.knowledgeVersion || "2026.08.01.1",
        position: scriptConfig.position || globalConfig.position || "right",
        mobileFullscreen: String(scriptConfig.mobileFullscreen || globalConfig.mobileFullscreen || "true") !== "false",
        autoOpen: String(scriptConfig.autoOpen || globalConfig.autoOpen || "false") === "true",
        primaryColor: scriptConfig.primaryColor || globalConfig.primaryColor || "#a55d51",
        darkColor: scriptConfig.darkColor || globalConfig.darkColor || "#1f3b54"
      };
    
      var history = [];
      var citations = [];
      var busy = false;
      var destroyed = false;
      var widget;
      var log;
      var input;
      var send;
    
      function escapeHtml(value) {
        return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
          return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char];
        });
      }
    
      function cleanAnswerPresentation(value) {
        return String(value == null ? "" : value)
          .replace(/^\s*(?:#{1,3}\s*)?(?:(?:\*\*|__)?(?:直接回答|直接结论)(?:\*\*|__)?)\s*[:：]?\s*/u, "")
          .replace(/^\s*#{1,3}\s*(?:直接回答|直接结论)\s*\r?\n?/imu, "")
          .trim();
      }
    
      function renderMarkdown(value) {
        var safe = escapeHtml(cleanAnswerPresentation(value))
          .replace(/^###\s+(.+)$/gm, "<h4>$1</h4>")
          .replace(/^##\s+(.+)$/gm, "<h4>$1</h4>")
          .replace(/^#\s+(.+)$/gm, "<h4>$1</h4>")
          .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
          .replace(/^\s*[-*]\s+(.+)$/gm, "<li>$1</li>")
          .replace(/(?:<li>.*<\/li>\n?)+/g, function (list) { return "<ul>" + list + "</ul>"; });
        return safe.replace(/\n/g, "<br>");
      }
    
      function injectStyle() {
        if (document.getElementById("yingge-agent-widget-style")) return;
        var style = document.createElement("style");
        style.id = "yingge-agent-widget-style";
        style.textContent = [
          ".ygw-widget{--ygw-ink:#132a3d;--ygw-navy:" + config.darkColor + ";--ygw-red:" + config.primaryColor + ";--ygw-gold:#c6a66b;position:fixed;right:22px;bottom:max(22px,env(safe-area-inset-bottom));z-index:2147483000;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif;color:var(--ygw-ink);text-align:left;line-height:1.5;box-sizing:border-box}",
          ".ygw-widget.left{right:auto;left:22px}.ygw-widget *{box-sizing:border-box}.ygw-launch{display:flex;align-items:center;gap:9px;border:0;border-radius:999px;padding:11px 17px 11px 12px;background:var(--ygw-navy);color:#fff;box-shadow:0 14px 34px rgba(9,39,67,.28);cursor:pointer;font-size:14px;font-weight:700;transition:transform .2s,box-shadow .2s}.ygw-launch:hover{transform:translateY(-2px);box-shadow:0 18px 40px rgba(9,39,67,.36)}",
          ".ygw-launch-mark{display:grid;place-items:center;width:30px;height:30px;border-radius:50%;background:linear-gradient(145deg,#c87363,var(--ygw-red));font-family:Georgia,'Songti SC',serif;font-size:18px}.ygw-panel{display:none;width:min(390px,calc(100vw - 32px));height:min(640px,calc(100dvh - 44px));margin-bottom:12px;overflow:hidden;border:1px solid #d5cab6;border-radius:20px;background:#eee7d8;box-shadow:0 22px 68px rgba(9,21,30,.28)}",
          ".ygw-widget.open .ygw-panel{display:flex;flex-direction:column;animation:ygw-in .24s cubic-bezier(.22,.8,.3,1)}.ygw-widget.open .ygw-launch{display:none}@keyframes ygw-in{from{opacity:0;transform:translateY(14px) scale(.975)}to{opacity:1;transform:none}}",
          ".ygw-head{display:flex;align-items:center;justify-content:space-between;padding:16px 17px;background:linear-gradient(135deg,var(--ygw-navy),#2e5872);color:#fff}.ygw-head h3{margin:0;font:700 21px Georgia,'Songti SC',serif}.ygw-head p{margin:4px 0 0;color:#d5cab6;font-size:11px}.ygw-close{border:0;background:transparent;color:#eee7d8;font-size:25px;line-height:1;cursor:pointer}.ygw-log{flex:1;overflow:auto;-webkit-overflow-scrolling:touch;padding:15px 13px 9px}.ygw-msg{display:flex;margin:0 0 13px}.ygw-msg.user{justify-content:flex-end}",
          ".ygw-bubble{max-width:90%;padding:10px 12px;border-radius:13px 13px 13px 4px;background:#fff;border:1px solid #e3e8ec;line-height:1.72;font-size:13px;overflow-wrap:anywhere}.ygw-msg.user .ygw-bubble{border:0;border-radius:13px 13px 4px 13px;background:#e9f1f7;color:#1f3b54}.ygw-bubble h4{margin:9px 0 4px;color:var(--ygw-red);font-size:14px}.ygw-bubble ul{margin:6px 0;padding-left:20px}.ygw-meta{margin-top:7px;color:#82909b;font-size:10px}",
          ".ygw-citations{display:grid;gap:6px;margin-top:10px;padding-top:9px;border-top:1px solid #edf0f2}.ygw-source{display:block;padding:8px;border-radius:8px;background:#f6f8fa;color:#526978;text-decoration:none;font-size:10px;line-height:1.45}.ygw-source:hover{background:#eaf1f6}.ygw-source b{display:block;color:#1f3b54;font-size:11px}.ygw-quick{display:flex;gap:6px;overflow:auto;padding:0 13px 9px;scrollbar-width:none}.ygw-quick::-webkit-scrollbar{display:none}.ygw-quick button{flex:0 0 auto;border:1px solid #d5e0e8;border-radius:999px;background:#fff;color:#2e5872;padding:6px 9px;cursor:pointer;font-size:11px}",
          ".ygw-feedback{display:flex;align-items:center;gap:6px;margin-top:8px;padding-top:8px;border-top:1px solid #edf0f2;color:#82909b;font-size:10px}.ygw-feedback span{margin-right:auto}.ygw-feedback button{border:1px solid #d5e0e8;border-radius:999px;background:#fff;color:#2e5872;padding:4px 8px;cursor:pointer;font-size:10px}.ygw-feedback button:hover{border-color:var(--ygw-red);color:var(--ygw-red)}",
          ".ygw-compose{display:flex;gap:8px;padding:11px 13px calc(11px + env(safe-area-inset-bottom));border-top:1px solid #dfe5e9;background:#fff}.ygw-input{flex:1;min-width:0;resize:none;border:1px solid #cfdae2;border-radius:10px;padding:9px 10px;outline:none;font:13px/1.5 inherit}.ygw-input:focus{border-color:#5d91b7;box-shadow:0 0 0 3px rgba(93,145,183,.13)}.ygw-send{align-self:flex-end;border:0;border-radius:10px;background:var(--ygw-red);color:#fff;padding:9px 12px;cursor:pointer;font-weight:700}.ygw-send:disabled{opacity:.55;cursor:wait}.ygw-error{color:#a3372e;background:#fff3f0;border-color:#f0c6bd}.ygw-typing:after{content:'…';animation:ygw-dots 1s infinite}@keyframes ygw-dots{0%,100%{opacity:.2}50%{opacity:1}}",
          "@media(max-width:520px){.ygw-widget{right:12px;bottom:max(12px,env(safe-area-inset-bottom))}.ygw-widget.left{left:12px}.ygw-widget.mobile-fullscreen .ygw-panel{position:fixed;inset:0;width:100vw;height:100dvh;max-width:none;margin:0;border:0;border-radius:0}.ygw-widget.mobile-fullscreen .ygw-head{padding-top:calc(16px + env(safe-area-inset-top))}}",
          "@media(prefers-reduced-motion:reduce){.ygw-widget *{animation:none!important;transition:none!important}}"
        ].join("");
        (document.head || document.documentElement).appendChild(style);
      }
    
      function sourceHtml(items) {
        if (!items || !items.length) return "";
        return '<div class="ygw-citations">' + items.slice(0, 8).map(function (item) {
          var url = /^https:\/\//i.test(item.url || "") ? item.url : "";
          var titleText = escapeHtml(item.title || item.publisher || "知识来源");
          var refs = Array.isArray(item.evidence_numbers) && item.evidence_numbers.length ? "证据 " + item.evidence_numbers.join("、") + " · " : "";
          var detail = escapeHtml(refs + (item.publisher || "待核验来源"));
          return url
            ? '<a class="ygw-source" target="_blank" rel="noopener noreferrer" href="' + escapeHtml(url) + '"><b>' + titleText + "</b>" + detail + "</a>"
            : '<div class="ygw-source"><b>' + titleText + "</b>" + detail + "</div>";
        }).join("") + "</div>";
      }
    
      function addMessage(role, content, meta, sources) {
        var item = document.createElement("div");
        item.className = "ygw-msg " + role;
        var bubble = document.createElement("div");
        bubble.className = "ygw-bubble";
        bubble.innerHTML = role === "assistant" ? renderMarkdown(content) + sourceHtml(sources) : escapeHtml(content);
        if (meta) {
          var footer = document.createElement("div");
          footer.className = "ygw-meta";
          footer.textContent = meta;
          bubble.appendChild(footer);
        }
        item.appendChild(bubble);
        log.appendChild(item);
        log.scrollTop = log.scrollHeight;
        return bubble;
      }
    
      function parseSsePacket(packet, bubble, state) {
        var lines = packet.split(/\r?\n/);
        var eventLine = lines.find(function (line) { return line.indexOf("event:") === 0; }) || "";
        var dataLine = lines.find(function (line) { return line.indexOf("data:") === 0; });
        if (!dataLine) return;
        try {
          var event = eventLine.slice(6).trim();
          var data = JSON.parse(dataLine.slice(5).trim());
          if (event === "meta") {
            state.messageId = data.message_id || state.messageId;
          } else if (event === "delta") {
            state.answer += data.text || "";
            bubble.classList.remove("ygw-typing");
            bubble.innerHTML = renderMarkdown(state.answer);
            log.scrollTop = log.scrollHeight;
          } else if (event === "citations") {
            citations = data.items || [];
          } else if (event === "done") {
            state.confidence = data.confidence || "";
            state.messageId = data.message_id || state.messageId;
            if (data.knowledge_version) state.knowledgeVersion = data.knowledge_version;
          }
        } catch (_) {}
      }
    
      async function ask(query) {
        query = String(query || "").trim();
        if (!query || busy || destroyed) return;
        busy = true;
        send.disabled = true;
        input.value = "";
        addMessage("user", query);
        var bubble = addMessage("assistant", "", "正在查阅英歌知识库…");
        bubble.classList.add("ygw-typing");
        citations = [];
        var state = { answer: "", confidence: "", knowledgeVersion: config.knowledgeVersion, messageId: "" };
    
        try {
          var response = await fetch(config.apiBase.replace(/\/$/, "") + "/api/agent/chat", {
            method: "POST",
            headers: { "content-type": "application/json", "x-app-id": config.appId },
            body: JSON.stringify({
              message: query,
              history: history.slice(-8),
              app_id: config.appId,
              client: { knowledge_version: config.knowledgeVersion, locale: "zh-CN", embed: "floating-widget" }
            })
          });
    
          if (!response.ok) {
            var errorText = await response.text();
            throw new Error(response.status === 503 ? "智能体暂时无法连接模型，请稍后再试。" : (errorText || "请求失败"));
          }
    
          if (response.body && response.body.getReader) {
            var reader = response.body.getReader();
            var decoder = new TextDecoder();
            var buffer = "";
            while (true) {
              var chunk = await reader.read();
              if (chunk.done) break;
              buffer += decoder.decode(chunk.value, { stream: true });
              var packets = buffer.split(/\r?\n\r?\n/);
              buffer = packets.pop() || "";
              packets.forEach(function (packet) { parseSsePacket(packet, bubble, state); });
            }
            if (buffer.trim()) parseSsePacket(buffer, bubble, state);
          } else {
            var payload = await response.json();
            state.answer = payload.answer || "";
            citations = payload.citations || [];
            state.confidence = payload.confidence || "";
          }
    
          if (!state.answer.trim()) throw new Error("没有收到有效回答");
          bubble.classList.remove("ygw-typing");
          bubble.innerHTML = renderMarkdown(state.answer) + sourceHtml(citations) + '<div class="ygw-meta">' + escapeHtml(state.confidence || "证据优先") + " · " + escapeHtml(state.knowledgeVersion) + "</div>" + (state.messageId ? '<div class="ygw-feedback" data-message-id="' + escapeHtml(state.messageId) + '"><span>回答有帮助吗？</span><button type="button" data-rating="up">赞</button><button type="button" data-rating="down">踩</button></div>' : "");
          history.push({ role: "user", content: query }, { role: "assistant", content: state.answer });
          history = history.slice(-8);
          window.dispatchEvent(new CustomEvent("yingge-agent:answer", { detail: { question: query, answer: state.answer, citations: citations } }));
        } catch (error) {
          bubble.classList.remove("ygw-typing");
          bubble.classList.add("ygw-error");
          bubble.innerHTML = escapeHtml(error && error.message ? error.message : "请求失败");
          window.dispatchEvent(new CustomEvent("yingge-agent:error", { detail: { error: error } }));
        } finally {
          busy = false;
          send.disabled = false;
          log.scrollTop = log.scrollHeight;
        }
      }
    
      async function submitFeedback(element, rating) {
        var messageId = element && element.getAttribute("data-message-id");
        if (!messageId) return;
        Array.prototype.forEach.call(element.querySelectorAll("button"), function (button) { button.disabled = true; });
        try {
          var response = await fetch(config.apiBase.replace(/\/$/, "") + "/api/agent/feedback", { method: "POST", headers: { "content-type": "application/json", "x-app-id": config.appId }, body: JSON.stringify({ message_id: messageId, rating: rating, reasons: rating === "down" ? ["嵌入组件点踩"] : [], app_id: config.appId }) });
          element.innerHTML = response.ok ? "<span>已收到，谢谢反馈。</span>" : "<span>反馈发送失败。</span>";
        } catch (_) { element.innerHTML = "<span>反馈发送失败。</span>"; }
      }
    
      function mount() {
        if (destroyed || document.getElementById("yingge-agent-widget")) return;
        injectStyle();
        widget = document.createElement("div");
        widget.id = "yingge-agent-widget";
        widget.className = "ygw-widget " + (config.position === "left" ? "left" : "right") + (config.mobileFullscreen ? " mobile-fullscreen" : "");
        widget.innerHTML = '<section class="ygw-panel" role="dialog" aria-label="英歌智能体" aria-modal="false"><header class="ygw-head"><div><h3>' + escapeHtml(config.title) + '</h3><p>' + escapeHtml(config.subtitle) + '</p></div><button class="ygw-close" type="button" aria-label="关闭">×</button></header><div class="ygw-log" aria-live="polite"></div><div class="ygw-quick"><button type="button" data-q="英歌舞和英歌有什么区别？">英歌是什么</button><button type="button" data-q="英歌舞有哪些主要表演角色？">角色与脸谱</button><button type="button" data-q="英歌舞的动作和队形有什么特点？">动作与队形</button></div><form class="ygw-compose"><textarea class="ygw-input" rows="1" placeholder="问问英歌舞…" aria-label="输入问题"></textarea><button class="ygw-send" type="submit">发送</button></form></section><button class="ygw-launch" type="button" aria-label="打开英歌智能体"><span class="ygw-launch-mark">英</span><span>' + escapeHtml(config.title) + "</span></button>";
        (document.body || document.documentElement).appendChild(widget);
        log = widget.querySelector(".ygw-log");
        input = widget.querySelector(".ygw-input");
        send = widget.querySelector(".ygw-send");
        widget.querySelector(".ygw-launch").addEventListener("click", open);
        widget.querySelector(".ygw-close").addEventListener("click", close);
        widget.querySelector(".ygw-compose").addEventListener("submit", function (event) { event.preventDefault(); ask(input.value); });
        log.addEventListener("click", function (event) { var button = event.target.closest && event.target.closest("[data-rating]"); if (!button) return; var container = button.closest(".ygw-feedback"); submitFeedback(container, button.getAttribute("data-rating")); });
        input.addEventListener("keydown", function (event) {
          if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); ask(input.value); }
        });
        Array.prototype.forEach.call(widget.querySelectorAll(".ygw-quick button"), function (button) {
          button.addEventListener("click", function () { ask(button.getAttribute("data-q")); });
        });
        addMessage("assistant", "你好，我是英歌智能体。可以问我英歌的历史、角色、脸谱、动作、阵形、锣鼓，以及不同地区和队伍的表演差异。", "知识库已连接");
        if (config.autoOpen) open();
      }
    
      function open() {
        if (!widget) return;
        widget.classList.add("open");
        window.setTimeout(function () { if (input) input.focus(); }, 40);
        window.dispatchEvent(new CustomEvent("yingge-agent:open"));
      }
    
      function close() {
        if (!widget) return;
        widget.classList.remove("open");
        window.dispatchEvent(new CustomEvent("yingge-agent:close"));
      }
    
      function destroy() {
        destroyed = true;
        if (widget && widget.parentNode) widget.parentNode.removeChild(widget);
        var style = document.getElementById("yingge-agent-widget-style");
        if (style && style.parentNode) style.parentNode.removeChild(style);
        delete window.YinggeAgentWidget;
      }
    
      window.YinggeAgentWidget = {
        __ready: true,
        config: config,
        open: open,
        close: close,
        ask: ask,
        destroy: destroy
      };
    
      if (document.body) mount();
      else document.addEventListener("DOMContentLoaded", mount, { once: true });
    
      window.dispatchEvent(new CustomEvent("yingge-agent:ready", { detail: window.YinggeAgentWidget }));
    }(window, document));
    
    emit("yingge-mugeda:ready", window.YinggeAgentWidget || {});
  }

  window.MugedaYinggeAgent = {
    boot: boot,
    open: function () { boot(); if (window.YinggeAgentWidget) window.YinggeAgentWidget.open(); },
    close: function () { if (window.YinggeAgentWidget) window.YinggeAgentWidget.close(); },
    ask: function (question) { boot(); if (window.YinggeAgentWidget) window.YinggeAgentWidget.ask(question); },
    getConfig: function () { return Object.assign({}, config); }
  };

  if (window.mugeda && typeof window.mugeda.addEventListener === "function") {
    window.mugeda.addEventListener("renderReady", boot);
    window.setTimeout(boot, 1800);
  } else if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
}(window, document));
