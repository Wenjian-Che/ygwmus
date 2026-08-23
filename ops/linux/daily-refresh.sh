#!/usr/bin/env bash
set -euo pipefail

cd /opt/yingge

/usr/bin/node automation/daily_refresh.mjs
/usr/bin/node automation/quality_regression.mjs --strict
/usr/bin/node automation/question_cluster.mjs
