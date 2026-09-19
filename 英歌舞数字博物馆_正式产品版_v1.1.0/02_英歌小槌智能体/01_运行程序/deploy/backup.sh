#!/usr/bin/env sh
# Run as the service operator or a dedicated backup account. This template
# only backs up private persistent state; public release files come from Git.
set -eu
umask 027

state_root="${YINGGE_PRIVATE_STATE_ROOT:-/var/lib/yingge-museum/private}"
backup_root="${YINGGE_BACKUP_DIR:-/var/lib/yingge-museum/backups}"
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
target="$backup_root/$stamp"

if [ ! -d "$state_root" ]; then
  echo "private state root does not exist: $state_root" >&2
  exit 1
fi

mkdir -p "$target"
tar -C "$(dirname "$state_root")" -czf "$target/private-state.tar.gz" "$(basename "$state_root")"
sha256sum "$target/private-state.tar.gz" > "$target/private-state.tar.gz.sha256"
printf '%s\n' "$(git -C /srv/yingge-museum/current/runtime rev-parse --verify HEAD 2>/dev/null || printf unknown)" > "$target/release-revision.txt"
printf '%s\n' "backup complete: $target"
