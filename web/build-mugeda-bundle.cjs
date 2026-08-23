const fs = require("node:fs");
const path = require("node:path");

const root = __dirname;
const widgetSource = fs.readFileSync(path.join(root, "agent-widget.js"), "utf8");
const output = `/*
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
    primaryColor: "#b9362d",
    darkColor: "#092743"
  };
  var config = Object.assign({}, DEFAULT_CONFIG, window.YINGGE_MUGEDA_AGENT_CONFIG || {});
  var booted = false;

  function emit(name, detail) {
    window.dispatchEvent(new CustomEvent(name, { detail: detail || {} }));
  }

  function validConfig() {
    var isHttps = /^https:\\/\\//i.test(config.apiBase);
    var isLocal = /^http:\\/\\/(?:127\\.0\\.0\\.1|localhost)(?::\\d+)?(?:\\/|$)/i.test(config.apiBase);
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
${widgetSource.split("\n").map((line) => `    ${line}`).join("\n")}
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
`;

fs.writeFileSync(path.join(root, "mugeda-agent-bundle.js"), output, "utf8");
console.log(`Built mugeda-agent-bundle.js (${Buffer.byteLength(output)} bytes)`);
