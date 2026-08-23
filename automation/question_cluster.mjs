const baseUrl = (process.env.AGENT_BASE_URL || "http://127.0.0.1:8787").replace(/\/$/, "");
const headers = { "content-type": "application/json", ...(process.env.ADMIN_TOKEN ? { authorization: `Bearer ${process.env.ADMIN_TOKEN}` } : {}) };
try {
  const response = await fetch(`${baseUrl}/api/admin/feedback/clusters/run`, { method: "POST", headers });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || `HTTP ${response.status}`);
  console.log(JSON.stringify({ generated_at: data.generated_at, interactions: data.interaction_count, clusters: data.cluster_count, priority_counts: data.priority_counts, output: "agent/generated/question_clusters.json" }, null, 2));
} catch (error) {
  console.error(JSON.stringify({ status: "error", message: String(error?.message || error) }));
  process.exitCode = 1;
}
