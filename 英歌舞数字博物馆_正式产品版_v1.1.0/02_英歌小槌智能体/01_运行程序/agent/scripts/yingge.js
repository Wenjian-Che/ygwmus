(function () {
  window.YINGGE_MUGEDA_AGENT_CONFIG = {
    scene: "general",
    title: "英歌小槌",
    autoOpen: false
  };

  var script = document.createElement("script");
  // Keep this URL stable for Mugeda embeds. The exact Nginx location sends
  // no-cache + ETag headers, so each new page load revalidates safely without
  // requiring authors to edit a release query string by hand.
  script.src = "https://yinggemus.cn/mugeda-agent.js";
  script.async = true;
  document.head.appendChild(script);
})();
