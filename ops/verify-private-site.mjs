import readline from "node:readline";

if (process.stdin.isTTY && typeof process.stdin.setRawMode === "function") {
  process.stdin.setRawMode(true);
}

const input = readline.createInterface({ input: process.stdin, terminal: false });

input.once("line", async (line) => {
  try {
    const { url, token } = JSON.parse(line);
    let headers = { "OAI-Sites-Authorization": token };
    let probe = await fetch(`${url}/api/health`, { headers });
    if (!String(probe.headers.get("content-type") || "").includes("application/json")) {
      headers = { "OAI-Sites-Authorization": `Bearer ${token}` };
      probe = await fetch(`${url}/api/health`, { headers });
    }
    const page = await fetch(url, { headers });
    const html = await page.text();
    const health = probe;
    const healthText = await health.text();
    const healthBody = String(health.headers.get("content-type") || "").includes("application/json")
      ? JSON.parse(healthText)
      : {};
    const chat = await fetch(`${url}/api/agent/chat`, {
      method: "POST",
      headers: { ...headers, "content-type": "application/json", origin: url },
      body: JSON.stringify({ app_id: "yingge-sites", message: "英歌为什么要敲槌？" }),
    });
    const stream = await chat.text();
    process.stdout.write(JSON.stringify({
      page_status: page.status,
      page_has_site: html.includes("/site/index.html"),
      health_status: health.status,
      health_ok: healthBody.ok === true,
      api_key_configured: healthBody.api_key_configured === true,
      chat_status: chat.status,
      has_meta: stream.includes("event: meta"),
      has_delta: stream.includes("event: delta"),
      has_citations: stream.includes("event: citations"),
      has_done: stream.includes("event: done"),
      response_bytes: Buffer.byteLength(stream),
    }));
    process.exit(chat.ok ? 0 : 1);
  } catch (error) {
    process.stderr.write(JSON.stringify({ error: String(error?.message || error) }));
    process.exit(1);
  }
});
