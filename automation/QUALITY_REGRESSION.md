# 每日质量回归

`quality_regression.mjs` 会调用本地 Agent API，记录检索指标、上线前质量门禁和模型可用性，不会修改正式知识库。

```powershell
node automation/quality_regression.mjs
```

默认只跑检索回归，不消耗模型额度。需要抽样模型回答时再显式开启：

```powershell
$env:YINGGE_RUN_MODEL_QA = "1"
$env:YINGGE_MODEL_QA_LIMIT = "4"
node automation/quality_regression.mjs --with-model
```

结果写入 `agent/generated/daily_quality_runs.jsonl`。模型接口不可达时会记录 `unavailable`，不会伪造通过结果；只有加 `--strict` 才会以失败码退出。
