import { spawnSync } from "node:child_process";
import readline from "node:readline";

if (process.stdin.isTTY && typeof process.stdin.setRawMode === "function") {
  process.stdin.setRawMode(true);
}

const input = readline.createInterface({ input: process.stdin, terminal: false });

input.once("line", (line) => {
  const credential = JSON.parse(line);
  const env = {
    ...process.env,
    GIT_CONFIG_COUNT: "1",
    GIT_CONFIG_KEY_0: "http.extraHeader",
    GIT_CONFIG_VALUE_0: `Authorization: Bearer ${credential.token}`,
  };
  const result = spawnSync(
    "git",
    ["push", credential.remote_url, `HEAD:${credential.branch}`],
    { cwd: process.argv[2], env, stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" },
  );
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  process.exit(result.status ?? 1);
});
