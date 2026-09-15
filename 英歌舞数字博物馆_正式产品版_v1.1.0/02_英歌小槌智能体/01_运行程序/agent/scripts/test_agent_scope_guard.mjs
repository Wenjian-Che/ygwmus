import assert from "node:assert/strict";
import { assessQuestionGrounding, classifyAgentScope, scopedAgentReply } from "../../backend/agent-scope.mjs";

const identity = classifyAgentScope("你好，你是哪个智能体？");
assert.equal(identity.kind, "identity", "身份提问不能被路由到英歌资料检索");
const identityReply = scopedAgentReply(identity, "你好，你是哪个智能体？");
assert.match(identityReply, /我是“英歌小槌”|我叫英歌小槌/);
assert.doesNotMatch(identityReply, /我是“问英歌小槌”/, "智能体正式名称是英歌小槌");
assert.match(identityReply, /英歌舞数字博物馆/);
assert.doesNotMatch(identityReply, /傩文化|女子英歌|发源|起源/, "身份回答不得拼接相邻英歌知识");

const identityVariant = classifyAgentScope("你是什么智能体？");
assert.equal(identityVariant.kind, "identity", "自然的身份问法也必须进入身份说明");

const scopeQuestion = classifyAgentScope("你是只能回答英歌相关的问题吗？");
assert.equal(scopeQuestion.kind, "capability", "能力边界提问不应被当作泛英歌知识题");
assert.match(scopedAgentReply(scopeQuestion), /日常常识/);

const capability = classifyAgentScope("你会做什么？");
assert.equal(capability.kind, "capability");
assert.match(scopedAgentReply(capability), /动作、锣鼓、队形、角色/);

const shortDomainQuestion = classifyAgentScope("木棒叫什么？");
assert.equal(shortDomainQuestion.kind, "knowledge", "英歌常用器具的自然问法不能被误判为站外问题");

const contextualFollowUp = classifyAgentScope("那它怎么变？", [
  { role: "user", content: "英歌的阵形为什么会变化？" },
]);
assert.equal(contextualFollowUp.kind, "knowledge", "承接上一句英歌问题的短追问应继续检索，而不是被拒答");

const unrelated = classifyAgentScope("今天北京天气怎么样？");
assert.equal(unrelated.kind, "general", "一般问题应交给通用对话能力，而不是被英歌范围守卫拒绝");

const age = classifyAgentScope("小槌你今年几岁了？");
assert.equal(age.kind, "identity");
assert.match(scopedAgentReply(age, "小槌你今年几岁了？"), /18岁/);
const repeatedNameAge = classifyAgentScope("小槌小槌，你今年多大了？");
assert.equal(repeatedNameAge.kind, "identity", "重复称呼小槌时也应识别为人物年龄提问");
assert.doesNotMatch(scopedAgentReply(repeatedNameAge, "小槌小槌，你今年多大了？"), /人物设定/);

const unsupported = assessQuestionGrounding({
  question: "某某英歌队的队长是谁？",
  evidence: [{ content: "英歌在潮汕地区流传，队伍的称谓和组织方式存在差异。" }],
});
assert.equal(unsupported.grounded, false, "缺少具体队伍资料时不能用泛化段落回答人物身份");
assert.match(scopedAgentReply({ kind: "knowledge_gap" }, "某某英歌队的队长是谁？"), /不能据相邻资料推断/);

const unsupportedTeam = assessQuestionGrounding({
  question: "某某英歌队的队长是谁？",
  evidence: [{ content: "西岐英歌队曾参与公开展演，英歌队的组织会因社区而异。" }],
});
assert.equal(unsupportedTeam.grounded, false, "检索到其他英歌队也不能替代被问队伍的人员事实");

const grounded = assessQuestionGrounding({
  question: "英歌的阵形为什么会变化？",
  evidence: [{ content: "英歌阵形在行进中不断处理方向、间距和路线，穿插与回旋会带来队伍空间的变化。" }],
});
assert.equal(grounded.grounded, true, "命中具体表演概念时应保留正常知识回答路径");

console.log("agent scope guard ok");
