#!/usr/bin/env bash
set -euo pipefail

archive="/tmp/yingge-linux-deploy.tar.gz"
uploaded_env="/tmp/.env"
app_dir="/opt/yingge"
config_dir="/etc/yingge"
domain="${1:-yingge.wenjian.asia}"
server_ip="${2:?server ip is required}"
expected_sha256="${3:?archive sha256 is required}"

test -s "$archive"
test -s "$uploaded_env"

actual_sha256="$(sha256sum "$archive" | awk '{print toupper($1)}')"
if [[ "$actual_sha256" != "${expected_sha256^^}" ]]; then
  echo "archive checksum mismatch" >&2
  exit 1
fi

if ! id yingge >/dev/null 2>&1; then
  useradd --system --home-dir "$app_dir" --shell /sbin/nologin yingge
fi

# Nginx needs read-only access to generated public knowledge data. Keeping it
# in the application group allows the API to write with UMask=0027 without
# making backend runtime files world-readable.
if id nginx >/dev/null 2>&1; then
  usermod -aG yingge nginx
fi

if [[ -d "$app_dir" && -n "$(find "$app_dir" -mindepth 1 -maxdepth 1 -print -quit 2>/dev/null)" ]]; then
  backup_dir="/opt/yingge-before-$(date +%Y%m%d-%H%M%S)"
  mv "$app_dir" "$backup_dir"
fi

install -d -m 0755 -o root -g yingge "$app_dir"
tar -xzf "$archive" -C "$app_dir"

install -d -m 0750 -o root -g yingge "$config_dir"
install -m 0640 -o root -g yingge "$uploaded_env" "$config_dir/agent.env"
sed -i 's/\r$//' "$config_dir/agent.env"
sed -i -E '/^(ADMIN_TOKEN|AGENT_PORT|AGENT_ALLOWED_ORIGINS|AGENT_RATE_LIMIT_PER_MINUTE|PYTHON_BIN|DEEPSEEK_BASE_URL|DEEPSEEK_MODEL|DEEPSEEK_THINKING|DEEPSEEK_MAX_TOKENS)=/d' "$config_dir/agent.env"

if [[ -s "$config_dir/admin-token" ]]; then
  admin_token="$(cat "$config_dir/admin-token")"
else
  admin_token="$(openssl rand -hex 32)"
  printf '%s\n' "$admin_token" > "$config_dir/admin-token"
  chmod 0640 "$config_dir/admin-token"
  chown root:yingge "$config_dir/admin-token"
fi

cat >> "$config_dir/agent.env" <<EOF
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-v4-flash
DEEPSEEK_THINKING=true
DEEPSEEK_MAX_TOKENS=4096
AGENT_PORT=8787
AGENT_ALLOWED_ORIGINS=http://${server_ip},http://${domain},https://${domain}
AGENT_RATE_LIMIT_PER_MINUTE=30
ADMIN_TOKEN=${admin_token}
PYTHON_BIN=/usr/bin/python3
EOF

if ! grep -Eq '^DEEPSEEK_API_KEY=.+$' "$config_dir/agent.env"; then
  echo "DEEPSEEK_API_KEY is missing" >&2
  exit 1
fi

install -d -m 0750 -o yingge -g yingge \
  "$app_dir/backups" \
  "$app_dir/agent/generated" \
  "$app_dir/automation" \
  "$app_dir/web/data"

chown -R root:yingge "$app_dir"
chown -R yingge:yingge \
  "$app_dir/backend" \
  "$app_dir/agent/generated" \
  "$app_dir/automation" \
  "$app_dir/backups" \
  "$app_dir/web/data"
chown yingge:yingge "$app_dir/84_审核通过知识补充.md"
chmod 0750 "$app_dir/ops/linux/backup.sh"

install -m 0644 "$app_dir/ops/linux/yingge-agent.service" /etc/systemd/system/yingge-agent.service
install -m 0644 "$app_dir/ops/linux/yingge-backup.service" /etc/systemd/system/yingge-backup.service
install -m 0644 "$app_dir/ops/linux/yingge-backup.timer" /etc/systemd/system/yingge-backup.timer

sed -e "s/__SERVER_NAME__/${domain}/g" -e "s/__SERVER_IP__/${server_ip}/g" \
  "$app_dir/ops/linux/nginx.conf" > /etc/nginx/conf.d/yingge.conf

printf '%s\n' \
  "deployed_at=$(date --iso-8601=seconds)" \
  "archive_sha256=${actual_sha256}" \
  "domain=${domain}" > "$app_dir/DEPLOYMENT"

nginx -t
systemctl daemon-reload
systemctl enable --now yingge-agent.service
systemctl enable --now yingge-backup.timer
systemctl reload nginx

for _ in $(seq 1 20); do
  if curl -fsS http://127.0.0.1:8787/api/health >/dev/null; then
    break
  fi
  sleep 1
done

curl -fsS http://127.0.0.1:8787/api/health >/dev/null
curl -fsS -H "Host: ${server_ip}" http://127.0.0.1/ >/dev/null

rm -f "$uploaded_env"
echo "INSTALL_OK"
