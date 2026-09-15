import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const server = fs.readFileSync(path.resolve("backend/server.mjs"), "utf8");

assert.match(server, /先回应用户真正问的对象/, "回答协议必须优先对题，而不是先铺背景");
assert.match(server, /不为凑字数重复概念/, "回答协议必须禁止为了篇幅重复内容");
assert.match(server, /至少提供一个可观察的细节或可核验的例子/, "解释型回答必须帮助访客继续观察，而不是只给定义");
assert.match(server, /看它由什么组成/, "常见问题应提供有层次的馆内讲解");
assert.match(server, /const depthLensByIntent/, "离线回答应按问题类型补充理解框架，而不是只堆一段通用话");
assert.match(server, /放回现场理解/, "深度回答应把抽象术语带回到观演场景");
assert.match(server, /history:"### 放回现场理解/, "历史问题必须使用独立的理解路径");
assert.match(server, /percussion:"### 放回现场理解/, "锣鼓问题必须使用独立的理解路径");
assert.match(server, /用户明确要求[“\"]一句话[”\"]时/, "只有用户明确要求一句话时才压缩表达");
assert.match(server, /oneSentenceRequest/, "离线知识库回答也必须识别用户明确的一句话请求");
assert.doesNotMatch(server, /概念题通常 350—700 字/, "回答协议不应以固定字数驱动冗长回答");

console.log("agent answer protocol ok");
