/*
 * 木疙瘩（Mugeda）英歌智能体加载器
 *
 * 部署前只需修改 DEFAULT_CONFIG 中的 apiBase；如果组件脚本不和本文件
 * 放在同一目录，再修改 widgetUrl。也可以在木疙瘩中提前设置：
 * window.YINGGE_MUGEDA_AGENT_CONFIG = { apiBase: "https://api.example.com" };
 */
(function (window, document) {
  "use strict";

  var DEFAULT_CONFIG = {
    apiBase: "https://请替换为你的-agent-api-域名",
    widgetUrl: "",
    appId: "yingge-mugeda",
    title: "问英歌小槌",
    subtitle: "英歌文化知识助手 · 证据优先",
    position: "right",
    mobileFullscreen: true,
    autoOpen: false,
    primaryColor: "#b9362d",
    darkColor: "#092743"
  };

  var loaderScript = document.currentScript;
  var runtimeConfig = window.YINGGE_MUGEDA_AGENT_CONFIG || {};
  var queryConfig = {};

  try {
    var loaderUrl = new URL(loaderScript && loaderScript.src ? loaderScript.src : window.location.href, window.location.href);
    ["apiBase", "widgetUrl", "appId", "title", "position"].forEach(function (key) {
      if (loaderUrl.searchParams.get(key)) queryConfig[key] = loaderUrl.searchParams.get(key);
    });
  } catch (_) {}

  var config = Object.assign({}, DEFAULT_CONFIG, queryConfig, runtimeConfig);
  var loading = false;
  var loaded = false;

  function resolveWidgetUrl() {
    if (config.widgetUrl) return config.widgetUrl;
    if (loaderScript && loaderScript.src) return loaderScript.src.replace(/mugeda-agent-loader(?:\.min)?\.js(?:\?.*)?$/i, "agent-widget.js");
    return "./agent-widget.js";
  }

  function validConfig() {
    var isHttps = /^https:\/\//i.test(config.apiBase);
    var isLocal = /^http:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?(?:\/|$)/i.test(config.apiBase);
    return (isHttps || isLocal) && config.apiBase.indexOf("请替换") === -1;
  }

  function emit(name, detail) {
    window.dispatchEvent(new CustomEvent(name, { detail: detail || {} }));
  }

  function boot() {
    if (loaded || loading) return;
    if (window.YinggeAgentWidget && window.YinggeAgentWidget.__ready) {
      loaded = true;
      emit("yingge-mugeda:ready", window.YinggeAgentWidget);
      return;
    }
    if (!validConfig()) {
      var configError = new Error("请先在 mugeda-agent-loader.js 中配置 HTTPS 的 apiBase");
      emit("yingge-mugeda:error", { error: configError });
      if (window.console) console.error("[英歌智能体]", configError.message);
      return;
    }

    loading = true;
    window.YINGGE_AGENT_CONFIG = {
      apiBase: config.apiBase,
      appId: config.appId,
      title: config.title,
      subtitle: config.subtitle,
      position: config.position,
      mobileFullscreen: config.mobileFullscreen,
      autoOpen: config.autoOpen,
      primaryColor: config.primaryColor,
      darkColor: config.darkColor
    };

    var script = document.createElement("script");
    script.id = "yingge-agent-runtime";
    script.src = resolveWidgetUrl();
    script.async = true;
    script.dataset.apiBase = config.apiBase;
    script.dataset.appId = config.appId;
    script.dataset.title = config.title;
    script.dataset.subtitle = config.subtitle;
    script.dataset.position = config.position;
    script.dataset.mobileFullscreen = String(config.mobileFullscreen);
    script.dataset.autoOpen = String(config.autoOpen);
    script.onload = function () {
      loading = false;
      loaded = true;
      emit("yingge-mugeda:ready", window.YinggeAgentWidget || {});
    };
    script.onerror = function () {
      loading = false;
      var loadError = new Error("英歌智能体组件加载失败，请检查 widgetUrl、HTTPS 和木疙瘩发布策略");
      emit("yingge-mugeda:error", { error: loadError });
      if (window.console) console.error("[英歌智能体]", loadError.message);
    };
    (document.head || document.documentElement).appendChild(script);
  }

  function onMugedaReady() {
    var mugedaApi = window.mugeda;
    if (mugedaApi && typeof mugedaApi.addEventListener === "function") {
      mugedaApi.addEventListener("renderReady", boot);
      window.setTimeout(boot, 1800);
    } else if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", boot, { once: true });
    } else {
      boot();
    }
  }

  window.MugedaYinggeAgent = {
    boot: boot,
    open: function () { if (window.YinggeAgentWidget) window.YinggeAgentWidget.open(); else boot(); },
    close: function () { if (window.YinggeAgentWidget) window.YinggeAgentWidget.close(); },
    ask: function (question) {
      if (window.YinggeAgentWidget) window.YinggeAgentWidget.ask(question);
      else window.addEventListener("yingge-mugeda:ready", function () { window.YinggeAgentWidget.ask(question); }, { once: true });
      boot();
    },
    getConfig: function () { return Object.assign({}, config); }
  };

  onMugedaReady();
}(window, document));
