import assert from "node:assert/strict";
import { normalizeTencentTranscript } from "../../backend/tencent-voice.mjs";

assert.equal(
  normalizeTencentTranscript("英歌舞里的快班和慢版有什么区别"),
  "英歌舞里的快板和慢板有什么区别",
  "ASR 将‘板’误识别为班/版时，必须在进入检索前统一为板式术语",
);

assert.equal(
  normalizeTencentTranscript("中快班英歌的鼓点"),
  "中快板英歌的鼓点",
  "中快板的同音转写也必须被保留为可检索术语",
);

assert.equal(
  normalizeTencentTranscript("快班的槌法和慢版的步法"),
  "快板的槌法和慢板的步法",
  "带结构助词的板式同音词也必须在进入检索前被校正",
);

console.log("board style voice normalization tests passed");
