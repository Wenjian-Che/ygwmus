import assert from "node:assert/strict";
import { normalizeMuseumTerms } from "../../backend/local-voice.mjs";

assert.equal(
  normalizeMuseumTerms("英歌舞里的快班和慢版有什么区别"),
  "英歌舞里的快板和慢板有什么区别",
  "腾讯 ASR 不可用时，本地 ASR 回退也必须校正板式同音结果",
);

console.log("local board style normalization tests passed");
