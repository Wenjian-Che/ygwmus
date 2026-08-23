const state = { faq: [], chunks: [], sourceRegistry: { sources: {}, file_map: {} }, ready: false, loadError: false, tempo: "slow" };
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const normalize = (text) => text.toLowerCase().replace(/[^\u4e00-\u9fffa-z0-9]/g, "");
const grams = (text) => {
  const s = normalize(text);
  const result = new Set();
  for (let i = 0; i < s.length; i++) {
    result.add(s[i]);
    if (i < s.length - 1) result.add(s.slice(i, i + 2));
  }
  return result;
};
const similarity = (a, b) => {
  const aa = grams(a), bb = grams(b);
  let hit = 0;
  aa.forEach((x) => { if (bb.has(x)) hit += x.length === 2 ? 2.2 : .25; });
  return hit / Math.max(3, Math.sqrt(aa.size * bb.size));
};
const questionMode = (text = "") => {
  if (/为什么|为何|为啥|有何作用|作用是什么|原因/.test(text)) return "why";
  if (/怎么|如何|怎样|步骤|方法/.test(text)) return "how";
  if (/区别|不同|比较|哪个好/.test(text)) return "compare";
  if (/是什么|什么是|指什么|叫什么/.test(text)) return "what";
  return "general";
};

const expandQuery = (query) => {
  const additions = [];
  if (/锣鼓|鼓点|司鼓/.test(query)) additions.push("节奏 重音 信号 起鼓 停鼓 吆喝");
  if (/时间码|逐帧|帧率|音画|变速|剪辑|原声/.test(query)) additions.push("视频证据 时间轴 声音事件 动作相位 队形轨道 连续镜头 音画同步");
  if (/吆喝|领喊|群喊|哨声|八拍/.test(query)) additions.push("听觉信号 领喊回应 离散号令 队伍信号词典");
  if (/穿双龙|穿8字|路线|交叉点/.test(query)) additions.push("空间语法 分行 合拢 穿插 俯视坐标 高位全景");
  if (/指挥|组织|提示/.test(query)) additions.push("组织 提示 协同 领舞 口令");
  if (/队形|变阵/.test(query)) additions.push("变阵 合拢 分行 穿双龙 穿8字 转向 收势");
  if (/动作/.test(query)) additions.push("起势 落脚 转身 对槌 发力 段落");
  if (/校园|小学生|孩子|儿童|研学/.test(query)) additions.push("分龄教学 软道具 文化理解 安全 传承人");
  if (/舞台|舞剧|音乐剧|短视频|改编/.test(query)) additions.push("传统巡游 集中展演 现代创作 媒介差异");
  if (/中华战舞|称呼|正式名称/.test(query)) additions.push("英歌 正式项目名 传播称谓 事实边界");
  if (/服饰|头饰|翎羽|英歌槌|道具/.test(query)) additions.push("脸谱 服装 视线 散热 动作范围 队形距离");
  if (/后溪|联兴|西门女子|忠精|岭东|西胪|和睦|桃园|古帅|金浦|塔馆|慈海|大棉田|泥沟|华市|南山|甲子/.test(query)) additions.push("代表队伍 成立 板式 槌法 锣鼓 阵法 证据冲突 活动年表");
  if (/保护单位|国家级传承人|代表性传承人|杨卫|陈来发|林炳光|林忠诚|林松|洪飞鹰|师承|授徒|司鼓|绘脸师/.test(query)) additions.push("国家级项目 认定批次 官方序号 保护单位 队伍职务 师承 授徒 隐性知识 时效审计 证据字段");
  if (/高校|职业教育|数字艺术馆|108.*脸谱|脸谱.*108/.test(query)) additions.push("汕头职业技术学院 当代设计 数字传习 课程 社区传承 边界");
  return `${query} ${additions.join(" ")}`;
};

function detailedTopicAnswer(query) {
  if (/(潮阳.*(?:七种|7种|地方标准|基础).*(?:队形|阵形|阵法))|((?:七种|7种|地方标准|基础).*(?:队形|阵形|阵法))|(?:英歌.*(?:有哪些|什么).*(?:队形|阵形|阵法))/.test(query)
    && !/(后溪|桃园|甲子|南山|泥沟|华市|忠精|岭东|西胪|金浦|慈海|文里)/.test(query)) {
    return {
      answer: [
        "若限定为潮阳英歌，2025年汕头市地方标准明确列出七种基础队形：**双列队形、方形阵、双龙出海、田螺阵、麦穗花阵、四海升平、八卦阵**。",
        "1. **双列队形**：两列平行、左右对称向前行进。\n2. **方形阵**：两列为一组、两组并列，组织成四列矩形方阵。\n3. **双龙出海**：对称队列从中间分开，逐步向左右展开。\n4. **田螺阵**：单列沿螺旋路线由外向内或由内向外盘旋。\n5. **麦穗花阵**：大队沿大圆行进，小队在内圈反向穿行。\n6. **四海升平**：全队均分四组，在十字方位形成四个对称转动的圆。\n7. **八卦阵**：队列衔接为内外圆，内圈以S形队列组织。",
        "这七种是《DB4405/T 315—2025 非物质文化遗产 潮阳英歌》附录D中的基础队形，不是全国英歌统一阵法。普宁、潮南、惠来、甲子及具体村落队伍可能使用不同名称、路线和变阵信号；判断照片或视频中的阵形，还要核对所属队伍和连续运动路径。"
      ].join("\n\n"),
      sources: ["88_潮阳英歌七种基础队形地方标准档案.md", "15_阵法与队形详解.md"],
      citationIds: ["shantou_yingge_standard_2025"],
      confidence: "较高（潮阳地方标准；其他地区需另行核对）"
    };
  }
  if (/英歌.*(为什么|为何|为啥).*(敲槌|木槌|木棒)|敲槌.*(为什么|为何|作用)|木槌.*(为什么|为何|作用)/.test(query)) {
    return {
      answer: [
        "英歌舞敲槌，主要不是为了单纯制造响声，而是把节奏、力量和队伍协同同时“打”出来。",
        "1. **建立节奏**：槌击和锣鼓共同标记拍点，帮助舞者统一落脚、转身、对槌和段落转换。",
        "2. **形成视觉与听觉冲击**：槌击、举槌和挥槌会放大动作幅度，让观众更清楚地感受到英歌的武术气势。",
        "3. **传递队伍信号**：在部分队伍和段落中，槌击强弱、停顿或连续变化会配合领舞、司鼓和队形变化，提示发力、合拢、分行或收势。",
        "4. **承载地方做法**：具体槌法、槌点、节拍和象征解释并不完全统一，必须以具体地区、队伍的鼓谱、口述或视频记录为准，不能把一种打法当成所有英歌的统一规则。"
      ].join("\n\n"),
      sources: ["05_道具与服饰.md", "36_动作与步法词典.md", "56_锣鼓动作队形协同机制.md", "39_锣鼓节奏与声音档案.md"],
      confidence: "较高（通用作用明确，具体槌法因队伍而异）"
    };
  }
  if (/(林忠诚|林松).*(第几批|第六批|国家级|编号|序号)|(第几批|第六批|国家级|编号|序号).*(林忠诚|林松)/.test(query)) {
    return {
      answer: [
        "林忠诚（林松）已经可以确认是第六批国家级非物质文化遗产代表性传承人，对应英歌（潮阳英歌）。文化和旅游部于2025年3月正式公布第六批名单，广东省文化和旅游厅公布的广东入选名单也明确列出其姓名、项目编号Ⅲ—8、项目名称和申报地区。",
        "需要保留一个字段边界：国家非遗数字博物馆的林忠诚个人页目前仍没有显示官方序号、出生日期和详细传承经历。所以“第六批”可以确定，但不能把广东入选名单中的排序号11当作他的个人官方序号，也不能从新闻或含敏感个人信息的附件拼接出生资料。",
        "这也是人物名录的时效性案例：旧个人页字段为空，不足以推翻后来正式公布的名单；正式名单没有展示的字段则仍然不能补造。"
      ].join("\n\n"),
      sources: ["74_英歌代表性传承人名录时效审计.md", "71_国家级代表性传承人证据档案.md", "77_人物资料隐私授权与智能体称谓规范.md"],
      citationIds: ["mct_sixth_inheritors", "gd_sixth_inheritors", "ihchina_linzongcheng"],
      confidence: "高（正式公布名单确认批次；个人序号仍未公开）"
    };
  }
  if (/洪飞鹰.*(国家级|省级|市级|区级|传承人)|(国家级|省级|市级|区级).*洪飞鹰/.test(query)) {
    return {
      answer: [
        "目前可以确认的是：中国非物质文化遗产网的潮阳英歌国家项目介绍把洪飞鹰列入“主要传承人”。这证明其姓名进入过潮阳英歌的国家项目传承叙述。",
        "但“主要传承人”不是自动等同于“国家级代表性传承人”的制度称谓。在当前已核对的国家级个人页和正式名单证据中，尚不足以把洪飞鹰确定为国家级；要判断其是否属于省、市或区级，也需要相应层级的正式认定名单。",
        "因此网页会回答“国家项目介绍列举的潮阳英歌主要传承人，正式认定层级待名单核验”，不会替他补造国家级、省级或市级头衔。"
      ].join("\n\n"),
      sources: ["74_英歌代表性传承人名录时效审计.md", "71_国家级代表性传承人证据档案.md"],
      citationIds: ["ihchina_chaoyang_project", "mct_inheritor_rules"],
      confidence: "中高（人物进入项目介绍已确认；认定层级证据不足）"
    };
  }
  if (/(司鼓|绘脸师|绘脸者|教练|队长).*(自动|是不是|算不算|等于).*(传承人|国家级|非遗)|(传承人|国家级|非遗).*(司鼓|绘脸师|绘脸者|教练|队长)/.test(query)) {
    return {
      answer: [
        "不自动等于。教练、队长、司鼓和绘脸者是队伍职务或传艺角色；国家、省、市、县区级代表性传承人是由相应文化和旅游主管部门按程序认定的制度身份。一个人可以同时具备两类身份，但两项都要分别有证据。",
        "这些角色的文化价值并不低。教练保存动作、步法、队形和安全知识；司鼓保存节奏循环、段落边界、转换信号和临场调度；绘脸者保存人物谱系、构图顺序、颜色配比和队伍版本。这些往往是文字资料最容易遗漏的隐性知识。",
        "所以知识库会记录其真实职务和贡献，但只有取得正式名单后才添加具体认定层级；公开人物档案还会排除身份证号码、私人电话和未授权住址。"
      ].join("\n\n"),
      sources: ["76_英歌传艺角色与隐性知识档案.md", "77_人物资料隐私授权与智能体称谓规范.md", "72_保护单位传承人队伍职责辨析.md"],
      citationIds: ["mct_inheritor_rules", "ihchina_vocational_yingge", "shanwei_jiazi"],
      confidence: "较高（制度身份与队伍职务需分别核验）"
    };
  }
  if (/林炳光.*(跟谁|师承|学习|授徒|徒弟)|(师承|余荣|授徒).*(林炳光)/.test(query)) {
    return {
      answer: [
        "国家非遗个人档案记载，林炳光12岁开始随余荣等老艺人学习甲子英歌。这里的“等”说明学艺来源不只一人，但公开页面没有给出完整教师名单，因此不能擅自补齐。",
        "他于2001年开始授徒；官方个人页形成时记载已教授五十多名徒弟。这个数字是档案当时的累计描述，不是今天的实时在训人数，也不能把这些徒弟自动写成各级代表性传承人。",
        "身份上，林炳光是第五批国家级代表性传承人，对应英歌（甲子英歌），官方序号05-2213。"
      ].join("\n\n"),
      sources: ["75_英歌传承人物队伍师承关系矩阵.md", "71_国家级代表性传承人证据档案.md"],
      citationIds: ["ihchina_linbingguang", "mct_inheritor_rules"],
      confidence: "高（国家非遗个人页）"
    };
  }
  if (/(英歌|潮阳|普宁|甲子).*(国家级代表性传承人|国家级传承人|有哪些传承人)|(国家级代表性传承人|国家级传承人).*(英歌|潮阳|普宁|甲子)/.test(query)) {
    return {
      answer: [
        "截至2026年7月30日本库核验，可确认四位英歌国家级代表性传承人：陈来发对应英歌（普宁英歌），第二批，序号02-0355；杨卫对应英歌（潮阳英歌），第二批，序号02-0356；林炳光对应英歌（甲子英歌），第五批，序号05-2213；林忠诚（林松）对应英歌（潮阳英歌），2025年正式公布为第六批。",
        "陈来发官方档案称其为普宁英歌第六代传人，18岁开始学习，1990年起任教练。杨卫通过家族传承学习，官方档案把“七下槌”记为其1991年编创。林炳光12岁随余荣等老艺人学习，2001年开始授徒。",
        "林忠诚需要单独说明：文化和旅游部及广东省文旅厅正式名单可以确认第六批身份，但国家非遗个人页当前仍没有显示官方序号、出生日期和详细经历。因此批次可以回答，个人序号仍不能补造。",
        "项目入选国家级非遗，不代表队长、教练或全体队员自动成为国家级代表性传承人；完整称谓必须与官方个人页或正式名单对应。"
      ].join("\n\n"),
      sources: ["74_英歌代表性传承人名录时效审计.md", "71_国家级代表性传承人证据档案.md", "41_传承人与保护单位档案.md"],
      citationIds: ["mct_sixth_inheritors", "gd_sixth_inheritors", "ihchina_chen", "ihchina_yangwei", "ihchina_linbingguang", "ihchina_linzongcheng"],
      confidence: "高（按2026-07-30可核验的正式名单；空缺字段不补造）"
    };
  }
  if (/(保护单位).*(是什么|是谁|职责|作用|能不能换|调整)|(潮阳|普宁|甲子).*(保护单位)/.test(query)) {
    return {
      answer: [
        "国家级英歌项目当前公开保护单位分别是：英歌（潮阳英歌）由汕头市潮阳区文化馆承担；英歌（普宁英歌）由普宁市文化馆承担；英歌（甲子英歌）由陆丰市甲子英歌文化艺术服务中心承担。",
        "保护单位不是“最正宗队伍”或英歌的所有者。依照文化和旅游部规章，它主要负责收集、登记和建档实物资料，为传承提供条件，保护相关文化场所，开展展示，报告保护实施情况并接受监督。",
        "保护单位可以依法调整。甲子英歌原保护单位是陆丰市甲子镇文化站；2022年因机构改革、原文化站撤销，汕尾市文旅部门公示重新推荐甲子英歌文化艺术服务中心，当前国家非遗项目页已显示新单位。所以旧资料不一定虚假，但必须注明它属于调整前状态。"
      ].join("\n\n"),
      sources: ["70_国家级项目保护单位与制度档案.md", "72_保护单位传承人队伍职责辨析.md", "08_非遗保护.md"],
      citationIds: ["ihchina_chaoyang_project", "ihchina_puning_project", "ihchina_jiazi_project", "mct_protection_rules", "shanwei_jiazi_unit_change"],
      confidence: "较高（保护单位属于时效性行政字段）"
    };
  }
  if (/(数字艺术馆|高校|职业教育|汕头职业技术学院|108.*脸谱|脸谱.*108).*(英歌|传承|传统|设计|课程)?/.test(query)) {
    return {
      answer: [
        "汕头职业技术学院已经形成一个较完整的英歌职业教育与数字传习个案。中国非遗网专题记录，学校建设了英歌舞传承发展中心、5个研究小组、林忠诚英歌舞技能大师工作室、传承基地和产业学院，并开发英歌舞体育、舞蹈表演、公共体育等课程。",
        "专题还记录，汕头市英歌舞数字艺术馆于2024年9月上线，由该校建设；学校在2024年整理约5.5万字人物资料，设计108个脸谱和108套服装，并形成相关版权、专利成果。",
        "这些108脸谱和服装属于高校团队的当代研究与设计，不能回答成“英歌自古统一拥有108张脸谱”。高校课程、数字馆和校园英歌队能够帮助研究、传播与人才培养，但仍需与具体社区队伍、传承人和地方旧谱区分。"
      ].join("\n\n"),
      sources: ["73_高校职业教育与数字传习档案.md", "72_保护单位传承人队伍职责辨析.md", "63_校园教学与分龄研学设计.md"],
      citationIds: ["ihchina_vocational_yingge", "mct_inheritor_rules"],
      confidence: "较高（当代教育项目；不等于统一传统版本）"
    };
  }
  if (/西门女子.*(成立|历史|多久|1952|2011)|(1952|2011).*西门女子/.test(query)) {
    return {
      answer: [
        "两个年份现在可以准确放回同一条队史：西门女子英歌队于1952年成立，后来因多种原因长期停滞，2011年在社区帮助下重新组建。",
        "汕头官方2024年队伍介绍确认1952年成立，并记录其传承“老五下套”、发展单打和对打；中国非物质文化遗产网转载人民日报的完整报道则明确解释了中间关系——不是2011年首次创立，而是停滞多年后的重新组建。",
        "因此，回答“成立于哪年”应报1952年；回答“何时恢复或重组”应报2011年。仍待田野档案补充的是停滞的准确起止、历届人员和套路连续传承细节，而不是这两个年份的基本关系。"
      ].join("\n\n"),
      sources: ["68_队伍资料冲突与时效性审计.md", "66_代表队伍证据档案扩充.md", "35_代表队伍档案.md"],
      citationIds: ["ihchina_ximen_rebuild", "shantou_teams"],
      confidence: "高（初建与重组关系已有完整官方转载报道解释）"
    };
  }
  if (/后溪.*(特点|历史|队伍|打法|阵法|板式)|棉北后溪/.test(query)) {
    return {
      answer: [
        "潮阳棉北后溪英歌队的公开队伍档案已经能回答到“队史—板式—节奏—阵图—传播”五层。",
        "队史与保护方面：汕头官方2024年资料称队伍成立于1948年，队中有国、省、市、区级传承人；2012年训练基地获授广东省非物质文化遗产传承基地。板式方面，资料把后溪列为潮阳中快板英歌代表之一。",
        "打法方面，官方描述其舞步稳健豪放、刚劲有力，鼓点有慢、中、快三段并可有序变调。公开阵图包括双龙出海、天罡朝圣、四打中街、双圈互逆、双金钱阵、四海欢腾、十字阵、八卦阵、满天星阵、众星拱月和群英欢庆。",
        "传播方面，官方转载报道记录其2012年赴马来西亚柔佛交流；汕头市委外办记录其2025年4月8日在北京参加中泰友好交流活动。需要注意：鼓点的慢中快三段不等于队伍拥有三套独立板式，具体阵图路线也仍需队伍谱本或同步视频核验。"
      ].join("\n\n"),
      sources: ["66_代表队伍证据档案扩充.md", "67_队伍动作锣鼓阵法证据矩阵.md", "69_代表队伍活动与海外传播年表.md"],
      citationIds: ["shantou_teams", "shantou_overseas_archive", "shantou_houxi_beijing"],
      confidence: "较高（公开队伍档案；精确阵图待田野核验）"
    };
  }
  if (/桃园.*(特点|历史|队伍|打法|阵法|板式|男女|混合)|文光桃园/.test(query)) {
    return {
      answer: [
        "文光桃园英歌队不能只写一个成立年份，它的公开队史应表述为：1953年由桃园农协会成立，后中断40年，2011年恢复。",
        "汕头官方资料将其列为中快板英歌，动作吸收南拳散手，锣鼓掌控节奏，领队以哨声发号。公开动作有“秦琼背锏”“落马跳磕”，队形有“瑞龙展须”“六合乾坤”“三拜谢”。",
        "2024年汕头市政协调研还记录桃园（龙凤）英歌队探索男女混合训练和混合对打。这说明当代组织与训练边界正在变化，但不代表所有桃园套路都已改为男女混合。2025年4月11日，汕头市委外办记录该队在迪拜经贸文旅交流会上演出。"
      ].join("\n\n"),
      sources: ["66_代表队伍证据档案扩充.md", "68_队伍资料冲突与时效性审计.md", "69_代表队伍活动与海外传播年表.md"],
      citationIds: ["shantou_teams", "shantou_cppcc_teams", "shantou_taoyuan_dubai"],
      confidence: "较高"
    };
  }
  if (/(15支|十五支|代表队伍).*(哪些|档案|资料|比较)|哪些.*(英歌队|代表队)/.test(query)) {
    return {
      answer: [
        "目前知识库已建立一批可追溯到官方公开资料的队伍级档案。2024年汕头春节活动资料一次性介绍了15支参演队伍：棉北后溪、普宁泥沟、濠江联兴、西门女子、普宁华市、城南忠精、文光岭东、潮阳西胪、海门和睦、文光桃园、文光古帅青年、金浦青年、塔馆、海门慈海和大棉田。",
        "这些队伍不能按一个模板理解。例如岭东是慢板“醉槌”个案；金浦是快板并以两名背16寸扁鼓的司鼓者和舞槌者互动见长；桃园是中快板、以锣鼓控节奏和领队吹哨发号；慈海公开有大战马、四平马及双人、四人对打；城南忠精公开资料称兼有慢、中、快三种风格。",
        "此外，知识库还补入普宁南山与陆丰甲子详档。南山有2024年启用的传承基地和女性参与记录；甲子有107人游行结构、武畔/文畔、完整步法槌法和锣鼓配置。对任何一队的成立时间、人数和活动经历，都应保留来源日期和适用范围。"
      ].join("\n\n"),
      sources: ["66_代表队伍证据档案扩充.md", "67_队伍动作锣鼓阵法证据矩阵.md", "35_代表队伍档案.md"],
      citationIds: ["shantou_teams", "puning_nanshan_base", "shanwei_jiazi"],
      confidence: "较高（代表个案，不是权威排行榜）"
    };
  }
  if (/(时间码|逐帧|视频标注|动作标注).*(动作|鼓点|吆喝|队形|英歌)|(动作|鼓点|吆喝|队形).*(时间码|逐帧|视频标注)/.test(query)) {
    return {
      answer: [
        "给英歌视频做细标，不能只写一个“动作名称”，应把声音、身体、队形和拍摄情境放进同一时间轴。最小记录单位包含起止时间、帧号、队伍、角色、声音事件、动作相位、步法、槌击点、队形变化、证据类型和置信度。",
        "1. 声音轨：分别标大鼓、锣钹、槌击、领喊、群喊和哨声。2. 身体轨：按准备、驱动、接触、回弹、恢复、转换记录槌路、脚步和重心。3. 队形轨：标开合、分并、转向、穿插、交叉点和领队路线。4. 情境轨：标入场、转角、镜头切换、变速、配乐替换和观众侵入路线。",
        "证据还要分三层：来源明确说过的叫“来源事实”；连续画面中直接看见或听见的叫“影像观察”；根据先后关系提出的机制解释叫“分析推断”。例如甲子官方资料能确认动作变化前有八拍吆喝、前四拍由李逵与杨志领喊、后四拍群体回应，但没有同步原视频时，不能编造每个音节落在哪拍、下一动作从哪一帧开始。",
        "若视频是可变帧率、慢动作、跳剪或音画漂移，应保留原始时间戳并标记不确定性。替换配乐的视频可以分析部分造型和队形，不能用来证明传统鼓点与动作的同步。"
      ].join("\n\n"),
      sources: ["78_动作节拍信号时间码标注规范.md", "82_表演视频证据与镜头可靠性审计.md", "29_数字化采集与档案规范.md"],
      citationIds: ["shanwei_jiazi", "ihchina_chaoyang_project"],
      confidence: "较高（标注方法；逐拍内容仍需原始同步视频）"
    };
  }
  if (/甲子.*(八拍|吆喝|领喊|群喊)|(八拍|吆喝).*(李逵|杨志|甲子)/.test(query)) {
    return {
      answer: [
        "甲子英歌公开资料记录的是一套动作转换前的“领喊—群答”结构：每变换一个动作前有八拍吆喝，前四拍由头槌“李逵”和二槌“杨志”领喊，后四拍由全体舞者回应。",
        "这八拍的作用可以稳妥解释为聚焦注意、建立转换边界和帮助群体同步，但公开文字没有给出逐拍鼓谱，也没有说明每个字落在哪拍、吆喝与锣鼓是否完全重合、下一动作在第八拍内还是拍后启动。",
        "同一甲子专页还记载：鼓点变急时，时迁带队合拢、分行并完成穿“8”字、穿双龙、穿龙仔等变化；一般速度时，时迁更多在队列间穿梭。它说明声音、角色和空间调度会协同，但不能据此给每种阵形编造一条固定鼓语。"
      ].join("\n\n"),
      sources: ["79_队伍动作鼓点阵形同步个案.md", "80_鼓语吆喝哨声与听觉信号词典.md", "39_锣鼓节奏与声音档案.md"],
      citationIds: ["shanwei_jiazi"],
      confidence: "高（八拍分工来自甲子官方专页；逐拍谱例未公开）"
    };
  }
  if (/(视频|短视频|宣传片).*(变速|剪辑|原声|鼓点|音画|能不能分析)|(变速|跳剪|配乐替换).*(英歌|鼓点|动作)/.test(query)) {
    return {
      answer: [
        "能否分析，取决于你要证明什么。剪辑或配乐视频仍可用于描述镜头中可见的脸谱、服饰和局部动作，但要分析鼓点—动作—队形同步，最低需要连续画面、现场原声、可核对的击槌或落脚瞬态，并确认没有变速和明显音画漂移。",
        "先检查六项：来源与原文件、队伍和地点、镜头连续性、原始帧率与播放倍率、现场原声、使用授权。若拿不到原文件或速度信息，就把“速度完整性”标成未知，不能据此计算BPM、步频或动作时长。",
        "阵形开合至少需要不中断的固定全景；穿双龙最好有高位或多机位全景；槌击点需要双人手臂完整可见的中近景。单一跟拍和特写很有感染力，却不足以复原整条路线。",
        "即使画面先出现鼓急、后出现变阵，也只能先记时间先后。要认定鼓句是约定信号，还需重复样本、司鼓或领队口述、队伍谱本或训练录像互证。"
      ].join("\n\n"),
      sources: ["82_表演视频证据与镜头可靠性审计.md", "78_动作节拍信号时间码标注规范.md", "54_多模态识别与问答边界.md"],
      citationIds: ["shanwei_jiazi", "shantou_teams"],
      confidence: "较高（视频证据审计方法）"
    };
  }
  if (/(古帅|桃园).*(哨声|吹哨|锣鼓|号令)|哨声.*(古帅|桃园|英歌)/.test(query)) {
    return {
      answer: [
        "桃园和古帅青年队的官方介绍都明确写到：锣鼓掌控节奏，领队吹哨发出号令。这说明至少有两层听觉系统——锣鼓提供连续的速度和段落能量，哨声提供较突出的离散指令，舞者还要结合领队身体和前后队员位置作视觉确认。",
        "桃园公开动作包括秦琼背锏、落马跳磕，队形包括瑞龙展须、六合乾坤、三拜谢；古帅则公开蛟龙出水、南拳北腿、猛虎下山、大鹏展翅、粉蝶游园等套路，并在同一中快板套式内部形成快、中、慢的质感对比。",
        "资料没有公布“几声哨对应哪一个动作或阵形”。所以智能体可以解释锣鼓与哨声的分工，不能生成一套看似精确、实际未经队伍确认的哨声密码。"
      ].join("\n\n"),
      sources: ["79_队伍动作鼓点阵形同步个案.md", "80_鼓语吆喝哨声与听觉信号词典.md", "67_队伍动作锣鼓阵法证据矩阵.md"],
      citationIds: ["shantou_teams"],
      confidence: "高到角色分工；具体哨声密码未公开"
    };
  }
  if (/(锣鼓|鼓点|司鼓).*(指挥|组织|提示|作用|动作|队形|变阵)|(动作|队形|变阵).*(锣鼓|鼓点|司鼓)/.test(query)) {
    return {
      answer: [
        "英歌锣鼓不是单纯的背景伴奏，更像整支队伍共享的“时间指令系统”。它通常从五个层面组织动作和队形：",
        "1. 起鼓与稳定循环：先给出速度和基本节拍，舞者据此统一入场、起势、落脚、转身和对槌时点。",
        "2. 重音与密度变化：重音常对应发力、击槌或段落节点；鼓点变密、响度增强时，动作往往由慢到快，槌击由弱到强。",
        "3. 约定的转换信号：特定鼓句、停顿或尾句可以提示合拢、分行、穿插、转向和收势，但各队的“信号词典”并不统一。",
        "4. 与领舞协同：变阵不只靠鼓点。司鼓还会和头槌、时迁、哨声、口令或前排舞者的视觉动作配合，舞者同时听声和看位。",
        "5. 吆喝呼应：部分队伍用领喊和群体回应衔接下一组动作。甲子英歌公开资料记录，动作变化前有八拍吆喝；鼓点变急时，队伍会配合合拢、分行、穿“8”字、穿双龙等变化。",
        "所以，锣鼓提供的是节奏骨架、段落边界和转换提示，不是逐拍遥控每个人。要确认“哪一声对应哪一个动作”，必须结合具体队伍的鼓谱、司鼓口述和带时间码的同步视频，不能把甲子等个案当成全部英歌的统一规则。"
      ].join("\n\n"),
      sources: ["56_锣鼓动作队形协同机制.md", "39_锣鼓节奏与声音档案.md", "15_阵法与队形详解.md"],
      citationIds: ["shanwei_jiazi", "npc_yingge"],
      confidence: "较高（通用机制；具体信号因队而异）"
    };
  }
  if (/(第一次|现场).*(看|观看|观察)|怎么看懂.*英歌/.test(query)) {
    return {
      answer: [
        "第一次看英歌，可以按“听、找、看脚、看关系、退远看全局”的顺序观察。",
        "1. 先听声音：分辨鼓、锣钹、槌击和吆喝何时进入，注意起鼓、加速、转段与收势。",
        "2. 找领舞关系：观察谁最早启动、谁回头确认队列、谁能离开固定位置。先判断表演职务，不急着猜文学人物。",
        "3. 看脚下：留意屈膝、踏地、转身和移动路线怎样与槌击同步。低重心还要看稳定与呼吸，不能只看蹲得多低。",
        "4. 看队员关系：对槌时观察距离、轨迹和收力。速度越快，安全控制与节拍清楚越重要。",
        "5. 退远看全局：近景看脸谱与槌法，远景看队形开合、交叉、转向和街巷适应。不要只拍高潮，完整的入场、变阵与收势更能说明表演机制。",
        "现场不要进入队伍与锣鼓组之间，也不要在窄巷和转角倒退拍摄。儿童应远离高声压位置，并保留随时退出的人流通道。"
      ].join("\n\n"),
      sources: ["57_现场观演导览与礼仪.md", "36_动作与步法词典.md", "43_仪式流程与巡游空间.md"],
      citationIds: ["shantou_event", "npc_yingge"],
      confidence: "较高"
    };
  }
  if (/(跳得好|表演质量|水平|怎么评价|如何评价|判断.*好)/.test(query)) {
    return {
      answer: [
        "判断英歌表演质量不能只看速度、响度和短视频冲击力，建议按七个维度观察。",
        "1. 安全与控制：槌距、落脚、碰撞风险和体力分配是否可控。2. 节奏稳定：动作、步法、槌击与锣鼓是否保持清楚关系。3. 动作质量：起止点、路线、幅度和重心是否明确。4. 队形协作：间距、轴线、交叉、转向与失误恢复是否稳定。5. 角色表达：领舞职能和人物塑造是否清楚，并符合该队自己的谱系。6. 空间适配：能否根据街巷、广场或舞台调整。7. 整体气韵：力量、呼吸、吆喝和群体状态能否统一。",
        "评价顺序应把安全放在速度之前。高速但不可控、低蹲导致动作变形、在拥挤空间强行维持舞台宽度，都不能视为高质量。短视频只能评价画面覆盖的局部，还要检查变速、跳剪和配乐替换。"
      ].join("\n\n"),
      sources: ["58_表演质量观察与评价框架.md", "26_训练体系与安全规范.md", "54_多模态识别与问答边界.md"],
      citationIds: ["npc_yingge", "shanwei_jiazi"],
      confidence: "较高（评价维度；不等于统一评分标准）"
    };
  }
  if (/108|多少人|人数/.test(query)) {
    return {
      answer: [
        "英歌不要求所有队伍都用108人。国家级非遗名录资料的通用描述是：舞者多为双数，少则12人，多至108人。普宁项目资料还记录过24人、36人、72人和最多108人的组合。",
        "108之所以经常被提到，主要与《水浒传》一百零八将的英雄叙事有关，但文学象征不等于每场表演的硬性编制。实际人数会受到队伍传统、可参加队员、街巷宽度、舞台尺寸、巡游路线、活动时长和安全间距影响。",
        "还要区分甲子英歌公开资料中的107人游行式结构。它包含武畔、文畔以及特定角色配置，是甲子英歌的具体个案，不能推成所有英歌的标准人数。",
        "判断某场人数是否“正确”，应先问这支队伍通常采用什么编制、本场是否经过舞台压缩，以及角色和队形能否完整运行，而不是只看有没有凑到108人。"
      ].join("\n\n"),
      sources: ["50_核心事实注册表.md", "03_表演形式.md", "53_地区板式队伍比较矩阵.md"],
      citationIds: ["npc_yingge", "shanwei_jiazi"],
      confidence: "较高"
    };
  }
  if (/普宁.*潮阳|潮阳.*普宁|地域差异|各地.*区别|地区.*区别/.test(query)) {
    return {
      answer: [
        "普宁英歌和潮阳英歌都属于英歌传统，也都包含持槌群舞、锣鼓、武术性身体表达和地方英雄叙事。它们的差别不能简化成“普宁快、潮阳慢”。",
        "从国家名录看，潮阳资料明确把节奏概括为慢板、中板和快板：慢板舞棒相对较长，中板有多种棒数组合，快板鼓点紧、舞槌较短且运槌灵便。普宁资料则记录了24、36、72至108人的人数组合，以及双龙出海、猛虎下山、麦穗花、田螺圈等队形名称。",
        "但地区内部差异同样重要。潮阳的文光岭东、西门女子、城南忠精等队伍并不共享一套完全相同的板式和套路；普宁的南山、泥沟、华市等队伍也有各自师承、脸谱和动作体系。一支队伍还可能同时掌握多种速度或为舞台重新编排。",
        "可靠比较应具体到队伍和时间，逐项比较板式、槌长、动作组合、锣鼓、角色、脸谱、队形和演出结构。行政区名称只能说明分布背景，不能直接替代流派或师承。"
      ].join("\n\n"),
      sources: ["53_地区板式队伍比较矩阵.md", "35_代表队伍档案.md", "14_快板中板慢板详解.md"],
      citationIds: ["npc_yingge", "shantou_teams", "shanwei_jiazi"],
      confidence: "较高（地区概括；队伍层面仍需具体核对）"
    };
  }
  if (/起源|多少年历史|水浒.*关系|历史.*多久/.test(query)) {
    return {
      answer: [
        "英歌有深厚的地方历史记忆，但目前不宜把它压缩成一条已经完全证实的单一起源线。国家名录和地方叙述常使用“三百多年”或“相传三百余年”的说法，这能说明传统记忆的重要性，却不等于已经建立了连续三百年的完整文献链。",
        "《水浒传》与英歌的关系最明确地体现在人物造型、梁山英雄叙事和地方解释上。很多队伍会使用时迁、李逵、关胜等人物，但这种叙事影响不能直接证明英歌唯一从《水浒传》产生。",
        "现有讨论还包括尚武习俗、南拳、秧歌、戏曲和傩文化等不同线索。它们可能解释英歌的不同组成部分，却不能在缺少连续材料时被写成唯一结论。",
        "较稳妥的说法是：英歌在潮汕及周边社区长期发展，吸收了英雄叙事、武术身体、戏曲造型和仪式文化等多种资源。具体形成过程仍需地方志、碑刻、谱本、旧照片、口述和同期报道互相验证。"
      ].join("\n\n"),
      sources: ["01_历史渊源.md", "40_历史年表与证据分层.md", "30_常见争议与事实辨析.md"],
      citationIds: ["npc_yingge", "gd_overseas"],
      confidence: "中高（源流仍存在多种观点）"
    };
  }
  if (/脸谱.*(人物|角色|颜色|识别)|红脸|黑脸|看图.*角色/.test(query)) {
    return {
      answer: [
        "不能只凭红、黑、白等主色直接确认英歌人物。大众熟悉的“红忠、黑刚、白奸”主要来自简化的戏曲脸谱解释，英歌虽然受戏曲影响，但不同村落、师承和绘脸艺人会重新安排人物与图案。",
        "可靠识别应分三层。第一层只描述可见事实：底色、额部图案、眉眼线条、头冠、服装、道具和队列位置。第二层根据已知队伍提出候选。第三层必须用节目单、队伍角色表、绘脸者说明或官方发布确认具体人物。",
        "连续视频通常比单张照片更有价值，因为它能显示舞者是否领舞、自由游动、提示变阵或承担特殊道具。即便如此，职务和文学人物也不能默认一一对应。",
        "如果只有一张没有地点和队名的照片，智能体最多给出低置信度候选，并说明还需要演出地点、队伍名称、日期或原始发布链接。"
      ].join("\n\n"),
      sources: ["38_脸谱服饰视觉辨识指南.md", "52_角色功能与辨识关系表.md", "54_多模态识别与问答边界.md"],
      citationIds: ["shanwei_jiazi", "shantou_teams"],
      confidence: "较高（识别方法；具体人物需队伍证据）"
    };
  }
  if (/前棚|后棚|完整.*演出结构/.test(query)) {
    return {
      answer: [
        "国家级非遗资料常用“前棚”和“后棚”概括英歌的传统演出结构。前棚通常以锣鼓和持槌群舞为主体，包含步法、对槌、角色行动与队形变化；后棚可包括小戏、武术或队伍的其他拿手节目。",
        "两者不是简单的“前半场”和“后半场”。前棚承担英歌最鲜明的声画主体，后棚体现地方节目组合和社区演出传统。具体节目、角色与顺序会随地区和队伍变化。",
        "现代巡游和舞台常因时长、路线、正面观看、灯光音响和节目调度压缩结构，后棚可能缩短、省略或拆成独立节目。短视频又通常只截取快速对槌和变阵高潮，因此观众容易把前棚片段误认为完整英歌。",
        "判断一场是否保留完整结构，应核对队伍自称的段落、总时长、是否行进、是否有后棚节目以及删改原因，不能用其他地区的固定模板套用。"
      ].join("\n\n"),
      sources: ["23_演出结构详解.md", "43_仪式流程与巡游空间.md", "50_核心事实注册表.md"],
      citationIds: ["npc_yingge", "shantou_event"],
      confidence: "较高（通用结构；具体节目因队而异）"
    };
  }
  if (/(完整流程|一场.*(怎么|如何).*(进行|表演)|从.*准备.*收队|集结.*收势|巡游.*流程)/.test(query)) {
    return {
      answer: [
        "一场英歌不能只从舞者进入镜头开始算。比较完整的观察框架包含六个阶段：演前准备、集结起鼓、行进巡游、定点展演、收势转场和回程收队。",
        "1. 演前准备：人员点名、绘脸着装、头饰与英歌槌检查、热身和路线确认。某些队伍还可能有本地礼俗程序，但没有队伍口述时，不能把后台出现的香案或仪式推广为所有英歌的通例。",
        "2. 集结起鼓：锣鼓建立速度和共同循环，领舞确认队列。可观察第一声鼓后谁先启动、第一次集体击槌落在哪一拍、全队怎样完成起势。",
        "3. 行进巡游：队伍边走边舞，并处理街宽、转角、人流和下一停点。这里更考验前后联络和临场压缩，不能用固定舞台队形机械评价。",
        "4. 定点展演：在广场或停点集中展示动作、对槌和变阵。短视频最常截取这一段，因此容易让人误以为高潮片段就是全部英歌。",
        "5. 收势转场：要区分一个动作结束、一个段落结束、一个停点结束。停鼓或定势之后继续行进，并不矛盾。",
        "6. 回程收队：人员清点、卸妆、器物归还和演后复盘也是队伍组织的一部分。",
        "传统资料还常用“前棚、后棚”概括节目结构：前棚以锣鼓和持槌群舞为主体，后棚可有小戏、武术或其他节目。现代舞台和巡游常因时间与空间压缩，不能假设每场都有完全相同的节目单。"
      ].join("\n\n"),
      sources: ["60_完整表演生命周期与段落观察.md", "23_演出结构详解.md", "43_仪式流程与巡游空间.md"],
      citationIds: ["npc_yingge", "shantou_event"],
      confidence: "较高（流程框架；具体程序因队伍和场景而异）"
    };
  }
  if (/(校园|小学生|孩子|儿童|研学).*(学|教|课程|体验|安全)|英歌.*进校园/.test(query)) {
    return {
      answer: [
        "儿童可以接触英歌，但“文化体验、基础身体训练、正式队伍套路”要分层，不能把成人高速对槌直接缩小给孩子。",
        "6—8岁适合听辨鼓点、观察队形、使用软道具做无接触节拍游戏；9—12岁可加入基础站位、踏步、复位和双人安全距离；13岁以上可学习段落结构、时间码标注、田野访谈和更系统的身体训练。复杂套路仍应由熟悉具体队伍体系的教习指导。",
        "一套完整校园课程最好同时有三条线：文化线讲非遗名录、地区差异和英雄叙事；身体线练节奏、空间和合作；研究线训练来源核验、照片描述和视频标注。不能只排一个热闹节目，却让学生把传播口号当成历史事实。",
        "安全上，硬质英歌槌不应作为低龄体验的默认器材；湿滑地面、空间拥挤、视线不清时停止对击；训练负荷逐步增加，疼痛、眩晕和碰撞必须立即报告。头饰、服装和道具还会改变视野、散热和动作范围。",
        "广东政协公开讨论也强调，体育类非遗进校园应由教育部门、学校和传承人共同制定方案，重视技艺本身与文化内涵，避免只追求形式上的热闹。"
      ].join("\n\n"),
      sources: ["63_校园教学与分龄研学设计.md", "28_校园课程与公众教育.md", "26_训练体系与安全规范.md"],
      citationIds: ["gdszx_campus", "shantou_youth_women"],
      confidence: "较高（课程框架；实际训练须由学校和教习评估）"
    };
  }
  if (/(舞台|舞剧|音乐剧|晚会|短视频|改编).*(传统|区别|差异|算不算|是不是)|传统.*(舞台|短视频|改编)/.test(query)) {
    return {
      answer: [
        "舞台作品、集中展演和社区巡游都可以出现英歌，但它们不是同一层级。关键不是判断“真或假”，而是说明作品类型、参考来源和改编范围。",
        "社区巡游要处理路线、转角、停点和人流；集中展演会压缩人数与时长，强化正面观看；舞剧、音乐剧则服务于人物、剧情、灯光和整体音乐，可能重写声响、服装与动作；短视频还会变速、跳剪或替换现场声。",
        "文化和旅游部发布的舞剧《英歌》资料将其表述为“以潮汕地区传统民俗英歌舞为蓝本”的舞台创作；广东省文化和旅游厅发布的音乐剧《英歌》则明确包含音乐剧、剪影戏、定制服装和面具。这些作品可以创造性转化英歌，但不能直接充当某个村落传统套路的证据。",
        "判断改编是否清楚，可检查五点：有没有说明参考的地区或队伍；有没有区分原有动作和新编动作；社区持有者是否参与指导或署名；宣传是否把艺术想象写成历史事实；观众能否知道自己看到的是传统展示还是现代作品。",
        "分析短视频时还要确认是否原声、是否变速、镜头是否连续、能否看见队形、能否确认队伍。"
      ].join("\n\n"),
      sources: ["62_传统巡游舞台改编与媒介差异.md", "54_多模态识别与问答边界.md", "13_传播与影响.md"],
      citationIds: ["mct_yingge_drama", "gdct_yingge_musical", "shantou_event"],
      confidence: "较高"
    };
  }
  if (/(怎么练|如何练|基本功|发力|动作.*错误|对槌.*安全|低重心)/.test(query)) {
    return {
      answer: [
        "英歌动作的力量不只是手臂砸槌，而是一条由脚下支撑、重心移动、躯干传递、手臂路线、接触和复位组成的动力链。",
        "可以分六步看：预备时建立站距和呼吸；蓄力时屈髋屈膝或转体；传递时由下肢和躯干把力量送向手臂；接触时控制对槌位置和拍点；收力时避免槌端继续失控穿出；复位时直接回到下一动作可用的位置。",
        "常见问题包括：只用肩臂硬砸、为了追鼓点越做越大、对槌后身体前冲、位置到了但抬槌和落脚不同步、只练快速高潮而忽略起势和转段。纠错应先降低速度，把脚步、轨迹、接触点和复位分别练清楚，再恢复强度。",
        "低重心也不是越低越好。还要看膝髋方向、落地缓冲、上身能否呼吸转动，以及连续动作后能否维持稳定。涉及未成年人、伤病和高强度训练时，应由教习或专业人员现场评估。"
      ].join("\n\n"),
      sources: ["61_动作动力链与常见错误.md", "36_动作与步法词典.md", "26_训练体系与安全规范.md"],
      citationIds: ["npc_yingge", "shanwei_jiazi"],
      confidence: "中高（观察与训练原则；具体套路随队伍）"
    };
  }
  if (/(服饰|衣服|头饰|翎羽|英歌槌|道具).*(作用|为什么|怎么看|影响|讲究)|为什么.*(头饰|脸谱|拿槌)/.test(query)) {
    return {
      answer: [
        "英歌造型不是脸谱、服装和短槌的简单拼装。它既建立人物气质，也会直接影响舞者的视线、散热、转头、槌路和队形距离。",
        "头冠和翎羽会放大身体节奏，同时增加上方与侧方净空；宽肩饰影响双人交叉距离；袖口、护腕和腰带可能限制翻槌、深蹲或转体；鞋底材质会改变落脚摩擦。因此正式演出前需要在完整服装条件下适应，便装排练不能覆盖所有问题。",
        "看脸谱时应先描述底色、额纹、眉眼和头冠，再结合队伍、日期、队列位置与行为职能判断候选。颜色不能直接等于人物。看英歌槌则要记录长度、直径、重量、握位、是否成对以及实际接触方式；通用名录尺寸不能替代具体队伍的实物测量。",
        "如果同一人物出现不同造型，应先检查是否属于不同年份、少年队、女子队、不同板式或舞台定制版本，而不是马上判断其中一个“画错了”。"
      ].join("\n\n"),
      sources: ["64_服饰头饰脸谱与道具协同观察.md", "38_脸谱服饰视觉辨识指南.md", "19_英歌槌制作工艺详解.md"],
      citationIds: ["shanwei_jiazi", "npc_yingge"],
      confidence: "较高（观察方法；具体造型需队伍确认）"
    };
  }
  if (/中华战舞|正式名称|为什么叫英歌舞|英歌和英歌舞/.test(query)) {
    return {
      answer: [
        "国家级非物质文化遗产名录使用的正式项目名称是“英歌”；“英歌舞”是公众传播中常见的称呼，用来突出舞蹈形态。两者日常交流都能理解，但涉及名录、项目编号和正式来源时，应优先写“英歌”。",
        "“中华战舞”是当代传播中对英歌刚健气质、持槌群舞、英雄叙事和武术性表达的概括，传播力很强，但它不是国家级非遗名录中的正式项目名称，也不能单独证明英歌直接源自古代军事训练。",
        "较准确的说法是：英歌常被媒体和公众称为“中华战舞”，正式非遗项目名称仍是“英歌”。如果讨论历史起源，还要分别核对尚武习俗、水浒叙事、南拳、戏曲和礼俗等不同证据，不能从一个昵称倒推出唯一源流。"
      ].join("\n\n"),
      sources: ["65_高频称谓传播话语与事实边界.md", "00_英歌舞总纲.md", "30_常见争议与事实辨析.md"],
      citationIds: ["npc_yingge", "mct_puning"],
      confidence: "较高"
    };
  }
  if (/(女子|女生|女性).*(能不能|可以|英歌|跳)|英歌.*(女子|女生|女性)/.test(query)) {
    return {
      answer: [
        "女性当然可以参与英歌，而且已有公开资料可核实的女子英歌队伍。较早的国家名录资料用男子表演描述英歌的传统形态，这是对当时常见组织方式的记录，不应被理解为永久禁止女性。",
        "当代女子英歌并不是简单复制男队。具体队伍会根据自身师承、成员身体条件、服饰、槌法和演出任务形成训练与呈现方式。评价时仍应看节奏、控制、队形、角色表达和空间适配，而不是用“像不像男队”作为唯一标准。",
        "讨论女子英歌时要同时保留两层事实：传统组织在性别参与上有自己的历史；当代实践正在扩展参与者和传承路径。具体成立时间、师承和角色配置应回到队伍公开介绍。"
      ].join("\n\n"),
      sources: ["12_女子英歌.md", "35_代表队伍档案.md", "65_高频称谓传播话语与事实边界.md"],
      citationIds: ["shantou_youth_women", "shantou_teams"],
      confidence: "较高"
    };
  }
  return null;
}

function cleanKnowledgeText(content) {
  return content
    .replace(/```[\s\S]*?```/g, "")
    .replace(/【[^】]+】/g, "")
    .replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .split("\n")
    .filter((line) => {
      const text = line.trim();
      return text && !text.startsWith("|") && !/^[-\w\u4e00-\u9fff]+:\s*$/.test(text);
    })
    .map((line) => line.replace(/^#{1,6}\s*/, "").replace(/^>\s*\[![^\]]+\]\s*/i, "").replace(/^[-*]\s*/, "• "))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function queryAnchors(query) {
  const vocabulary = [
    "108", "人数", "历史", "起源", "水浒", "傩", "非遗", "编号", "传承人",
    "前棚", "后棚", "快板", "中板", "慢板", "板式", "锣鼓", "鼓点", "乐器",
    "曲牌", "脸谱", "角色", "头槌", "时迁", "英歌槌", "木棒", "队形", "变阵",
    "动作", "步法", "女子", "儿童", "训练", "安全", "巡游", "仪式", "海外",
    "潮阳", "普宁", "潮南", "惠来", "甲子", "神泉", "照片", "视频", "海报"
  ];
  return vocabulary.filter((term) => query.includes(term));
}

function evidenceDetails(query, chunks, existingAnswer) {
  const details = [];
  const usedFiles = new Set();
  const anchors = queryAnchors(query);
  if (!anchors.length) return details;
  for (const chunk of chunks) {
    if (usedFiles.has(chunk.source_file)) continue;
    const cleaned = cleanKnowledgeText(chunk.content);
    const paragraphs = cleaned
      .split(/\n\n+/)
      .map((x) => x.trim())
      .filter((x) => x.length >= 45 && x.length <= 360 && !existingAnswer.includes(x.slice(0, 24)));
    const candidate = paragraphs.find((paragraph) => anchors.some((anchor) => paragraph.includes(anchor)));
    if (!candidate) continue;
    details.push(candidate.length > 260 ? `${candidate.slice(0, 258)}……` : candidate);
    usedFiles.add(chunk.source_file);
    if (details.length >= 2) break;
  }
  return details;
}

async function loadKnowledge() {
  const status = $("#knowledge-status");
  try {
    const [faqRes, chunksRes, sourceRes] = await Promise.all([
      fetch("./data/faq_100.json"),
      fetch("./data/chunks.jsonl"),
      fetch("./data/source_registry.json")
    ]);
    const faqData = await faqRes.json();
    const chunkText = await chunksRes.text();
    state.sourceRegistry = await sourceRes.json();
    state.faq = faqData.items || [];
    state.chunks = chunkText.trim().split("\n").filter(Boolean).map((line) => JSON.parse(line));
    state.ready = true;
    status.className = "ready";
      status.innerHTML = "<i></i> 60篇知识文档已就绪";
  } catch (_) {
    state.loadError = true;
    status.className = "error";
    status.innerHTML = "<i></i> 知识库载入失败";
  }
}

function routeQuestion(query) {
  if (/今天|明天|几点|票务|买票|天气|路线|临时停演/.test(query)) return "realtime";
  if (/(照片|图片|视频).*(是谁|哪个村|哪一派|什么角色)/.test(query)) return "clarify";
  return "knowledge";
}

function retrieve(query) {
  const expanded = expandQuery(query);
  const mode = questionMode(query);
  const faqRanked = state.faq
    .map((item) => {
      const itemMode = questionMode(item.question);
      let score = Math.max(similarity(query, item.question), similarity(expanded, item.question) * .9);
      if (mode !== "general" && itemMode === mode) score += .55;
      if (mode !== "general" && itemMode !== "general" && itemMode !== mode) score *= .62;
      return { ...item, score };
    })
    .sort((a, b) => b.score - a.score);
  const chunkRanked = state.chunks
    .map((item) => ({
      ...item,
      score: similarity(expanded, `${item.title} ${item.included_headings?.join(" ") || ""} ${item.content}`) * (item.retrieval_boost || 1)
    }))
    .sort((a, b) => b.score - a.score);

  const bestFaq = faqRanked[0];
  const sources = [];
  const seen = new Set();
  const evidenceChunks = chunkRanked.filter((item) =>
    !["agent_product", "entry"].includes(item.collection) &&
    !/^3[234]_/.test(item.source_file) &&
    !/^51_/.test(item.source_file)
  );
  [bestFaq?.source_file, ...evidenceChunks.slice(0, 10).map((x) => x.source_file)].forEach((file) => {
    if (file && !seen.has(file) && sources.length < 3) {
      sources.push(file);
      seen.add(file);
    }
  });

  if (bestFaq && bestFaq.score > .28) {
    let answer = bestFaq.answer;
    if (answer.length < 220) {
      const details = evidenceDetails(query, evidenceChunks.slice(0, 10), answer);
      if (details.length) answer += `\n\n进一步说明：\n${details.map((x) => `• ${x.replace(/^•\s*/, "")}`).join("\n\n")}`;
    }
    return { answer, sources, confidence: bestFaq.score > 2.4 ? "较高" : "参考" };
  }
  const bestChunk = chunkRanked[0];
  if (bestChunk && bestChunk.score > .28) {
    let answer = bestChunk.content
      .replace(/【[^】]+】/g, "")
      .replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/^[-#>|]+\s*/gm, "")
      .trim();
    if (answer.length > 650) answer = `${answer.slice(0, 648)}……`;
    return { answer, sources, confidence: "参考" };
  }
  return {
    answer: "这个问题可能因地区、村落或队伍而不同。现有资料不足以给出唯一答案。如果你提供演出地点、队伍名称、时间或节目单，我可以进一步缩小范围。",
    sources: ["30_常见争议与事实辨析.md"],
    confidence: "待补充信息"
  };
}

function answerQuestion(query) {
  const route = routeQuestion(query);
  if (route === "realtime") {
    return {
      answer: "活动时间、票务、路线和临时安排属于实时信息，静态知识库不能替你确认。请提供具体日期与地区，并以当地文旅部门或主办方当日公告为准。",
      sources: ["agent/knowledge_manifest.json · 实时信息规则"],
      confidence: "需要实时核实"
    };
  }
  if (route === "clarify") {
    return {
      answer: "只凭照片或没有地点的视频，不能可靠判断具体人物、村落或流派。请补充拍摄地点、队伍名称、时间或节目单；在未确认前，我不会把脸谱推测写成事实。",
      sources: ["38_脸谱服饰视觉辨识指南.md"],
      confidence: "需要补充信息"
    };
  }
  if (!state.ready) {
    return {
      answer: state.loadError
        ? "知识库数据暂时没有载入成功。请刷新页面后重试；页面中的英歌概览仍可正常浏览。"
        : "知识库还在载入，请稍后再问一次。你也可以先浏览页面中的英歌概览。",
      sources: [],
      confidence: state.loadError ? "载入失败" : "载入中"
    };
  }
  const topicAnswer = detailedTopicAnswer(query);
  if (topicAnswer) return topicAnswer;
  return retrieve(query);
}

const panel = $(".agent-panel");
const chatLog = $("#chat-log");
const chatInput = $("#chat-input");
let lastFocused = null;
let agentHistory = [];

function openAgent(query = "") {
  lastFocused = document.activeElement;
  panel.classList.add("open");
  panel.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  setTimeout(() => chatInput.focus(), 180);
  if (query) {
    chatInput.value = query;
    submitQuestion(query);
  }
}
function closeAgent() {
  panel.classList.remove("open");
  panel.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  lastFocused?.focus?.();
  playPetAction("idle");
}
function startNewChat() {
  agentHistory = [];
  const welcome = chatLog.querySelector(".message.assistant");
  chatLog.querySelectorAll(".message").forEach((node) => {
    if (node !== welcome) node.remove();
  });
  chatLog.scrollTop = 0;
  chatInput.value = "";
  chatInput.focus();
  playPetAction("idle");
}
function appendMessage(type, content, sources = [], meta = "", options = {}) {
  const node = document.createElement("div");
  node.className = `message ${type}`;
  const contentNode = document.createElement(type === "assistant" ? "div" : "p");
  if (type === "assistant") {
    contentNode.className = "answer-content";
    contentNode.innerHTML = renderAnswerMarkdown(content);
  } else {
    contentNode.textContent = content;
  }
  node.appendChild(contentNode);
  if (sources.length) {
    const sourceBox = document.createElement("div");
    sourceBox.className = "sources";
    sourceBox.innerHTML = `
      <b class="sources-title">引用来源</b>
      ${sources.map((source) => `
        <a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">
          <span class="source-grade">${escapeHtml(source.grade)}级</span>
          <span class="source-copy">
            <strong>${escapeHtml(source.title)}</strong>
            <small>${escapeHtml(sourceEvidenceLabel(source))} · ${escapeHtml(source.publisher)}</small>
          </span>
          <i aria-hidden="true">↗</i>
        </a>
      `).join("")}
    `;
    node.appendChild(sourceBox);
  }
  if (meta) {
    const span = document.createElement("span");
    span.textContent = meta;
    node.appendChild(span);
  }
  if (type === "assistant" && options.messageId) {
    const feedback = document.createElement("div");
    feedback.className = "answer-feedback";
    feedback.dataset.messageId = options.messageId;
    feedback.innerHTML = `<span>这条回答有帮助吗？</span><button type="button" data-feedback-rating="up" aria-label="有帮助">赞</button><button type="button" data-feedback-rating="down" aria-label="需要改进">踩</button><div class="feedback-reasons" hidden>${["答非所问", "事实不准", "不够详细", "来源不足", "表达冗长"].map((reason) => `<button type="button" data-feedback-reason="${reason}">${reason}</button>`).join("")}</div>`;
    node.appendChild(feedback);
  }
  chatLog.appendChild(node);
  chatLog.scrollTop = chatLog.scrollHeight;
  return node;
}
function sourceEvidenceLabel(source) {
  const refs = Array.isArray(source?.evidence_numbers) ? source.evidence_numbers.filter(Number.isFinite) : [];
  return refs.length ? `证据${refs.join("、")}` : "来源";
}
function escapeHtml(text) {
  return String(text ?? "").replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m]));
}
function renderInlineMarkdown(text) {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/__([^_]+)__/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}
// Model responses may contain internal scaffolding labels. Keep those labels
// out of the user-facing answer while preserving the actual content.
function cleanAnswerPresentation(text) {
  return String(text ?? "")
    .replace(/^\s*(?:#{1,3}\s*)?(?:(?:\*\*|__)?(?:直接回答|直接结论)(?:\*\*|__)?)\s*[:：]?\s*/u, "")
    .replace(/^\s*#{1,3}\s*(?:直接回答|直接结论)\s*\r?\n?/imu, "")
    .trim();
}
function renderAnswerMarkdown(text) {
  const lines = cleanAnswerPresentation(text).split(/\r?\n/);
  const html = [];
  let paragraph = [];
  let inList = false;
  const flushParagraph = () => {
    if (!paragraph.length) return;
    html.push(`<p>${paragraph.map(renderInlineMarkdown).join("<br>")}</p>`);
    paragraph = [];
  };
  const closeList = () => {
    if (!inList) return;
    html.push("</ul>");
    inList = false;
  };
  lines.forEach((line) => {
    const value = line.trim();
    if (!value) { flushParagraph(); closeList(); return; }
    const heading = value.match(/^#{1,3}\s+(.+)$/);
    if (heading) {
      flushParagraph(); closeList();
      html.push(`<h4>${renderInlineMarkdown(heading[1])}</h4>`);
      return;
    }
    const listItem = value.match(/^(?:[-*•]|\d+[.)])\s+(.+)$/);
    if (listItem) {
      flushParagraph();
      if (!inList) { html.push("<ul>"); inList = true; }
      html.push(`<li>${renderInlineMarkdown(listItem[1])}</li>`);
      return;
    }
    closeList();
    paragraph.push(line);
  });
  flushParagraph();
  closeList();
  return html.join("");
}

function resolvePublicSources(files = [], citationIds = [], query = "") {
  const registry = state.sourceRegistry;
  const resolved = [];
  const seen = new Set();
  files.filter((item) => item && typeof item === "object" && item.url).forEach((source) => {
    const key = source.source_id || source.url;
    if (seen.has(key) || resolved.length >= 8) return;
    resolved.push(source);
    seen.add(key);
  });
  if (resolved.length) return resolved;
  citationIds.forEach((sourceId) => {
    const source = registry.sources?.[sourceId];
    if (!source || seen.has(sourceId) || resolved.length >= 8) return;
    resolved.push(source);
    seen.add(sourceId);
  });
  if (resolved.length) return resolved;
  const candidates = [];
  files.forEach((file) => {
    (registry.file_map?.[file] || []).forEach((sourceId) => {
      const source = registry.sources?.[sourceId];
      if (!source || seen.has(sourceId)) return;
      const sourceText = `${source.title} ${(source.supports || []).join(" ")}`;
      candidates.push({ source, sourceId, score: similarity(query, sourceText) });
      seen.add(sourceId);
    });
  });
  candidates
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .forEach(({ source }) => resolved.push(source));
  return resolved;
}
function remoteAgentConfig() {
  try {
    const config = JSON.parse(localStorage.getItem("yingge-admin-config") || "null");
    if (config?.enabled && config.apiBase) return config;
  } catch (_) {}

  // Production self-hosting exposes the API on the same origin through
  // Nginx. New visitors should use the real RAG agent without first opening
  // the provider settings page. Local static preview and the separately
  // hosted OpenAI Sites build keep their existing explicit configuration.
  const localPreview = /^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname);
  const hostedPreview = /\.chatgpt\.site$/i.test(window.location.hostname);
  if (/^https?:$/.test(window.location.protocol) && !localPreview && !hostedPreview) {
    return {
      enabled: true,
      apiBase: window.location.origin,
      appId: "yingge-h5",
      model: "deepseek-v4-flash",
      thinking: true,
    };
  }
  return null;
}
async function requestRemoteAnswer(query, onDelta = () => {}) {
  const config = remoteAgentConfig();
  if (!config) return null;
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(`${config.apiBase.replace(/\/$/, "")}/api/agent/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: query, history: agentHistory.slice(-10), app_id: config.appId || "yingge-h5", model: config.model, thinking: config.thinking, client: { knowledge_version: "2026.08.08.1", locale: "zh-CN" } }),
      signal: controller.signal,
    });
    if (!response.ok || !response.body) return null;
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let answer = "";
    let citationIds = [];
    let citationSources = [];
    let confidence = "检索支持";
    let messageId = "";
    let evidenceQuality = "";
    const consume = (packet) => {
      const eventLine = packet.split(/\n/).find((line) => line.startsWith("event:"));
      const dataLine = packet.split(/\n/).find((line) => line.startsWith("data:"));
      if (!dataLine) return;
      try {
        const data = JSON.parse(dataLine.slice(5).trim());
        if (eventLine?.includes("meta")) messageId = data.message_id || messageId;
        if (eventLine?.includes("delta")) {
          answer += data.text || "";
          onDelta(answer);
        }
        if (eventLine?.includes("citations")) {
          citationSources = data.items || [];
          citationIds = citationSources.map((item) => item.source_id).filter(Boolean);
        }
        if (eventLine?.includes("done")) { confidence = data.confidence || confidence; evidenceQuality = data.evidence_quality || evidenceQuality; messageId = data.message_id || messageId; }
      } catch (_) {}
    };
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const packets = buffer.split(/\n\n/);
      buffer = packets.pop() || "";
      packets.forEach(consume);
    }
    if (!answer.trim()) return null;
    return { answer, sources: citationSources, citationIds, confidence: `远程模型 · ${confidence}`, messageId, evidenceQuality };
  } finally { window.clearTimeout(timeout); }
}
async function submitQuestion(raw) {
  const query = raw.trim();
  if (!query) return;
  playPetAction("idle");
  appendMessage("user", query, [], "刚刚");
  chatInput.value = "";
  chatInput.style.height = "";
  const typing = document.createElement("div");
  typing.className = "message assistant typing";
  typing.innerHTML = "<i></i><i></i><i></i>";
  chatLog.appendChild(typing);
  chatLog.scrollTop = chatLog.scrollHeight;
  let result = await requestRemoteAnswer(query, (partial) => {
    typing.classList.remove("typing");
    typing.innerHTML = `<div class="answer-content">${renderAnswerMarkdown(partial)}</div>`;
    chatLog.scrollTop = chatLog.scrollHeight;
  }).catch(() => null) || answerQuestion(query);
  // A focused why-question must not fall back to a nearby “英歌很燃” FAQ.
  // If a remote answer misses the requested reason, use the scoped local answer.
  if (/敲槌|木槌|英歌槌|木棒/.test(query) && !/(作用|原因|因为|节奏|协同)/.test(String(result.answer || "").slice(0, 260))) {
    result = detailedTopicAnswer(query) || result;
  }
  if (/(七种|7种|地方标准|基础队形|潮阳.*(?:队形|阵形|阵法))/.test(query)
    && !["双列队形", "方形阵", "双龙出海", "田螺阵", "麦穗花阵", "四海升平", "八卦阵"].every((name) => String(result.answer || "").includes(name))) {
    result = detailedTopicAnswer(query) || result;
  }
  agentHistory.push({ role: "user", content: query }, { role: "assistant", content: result.answer });
  agentHistory = agentHistory.slice(-10);
  const publicSources = resolvePublicSources(result.sources, result.citationIds, query);
  setTimeout(() => {
    typing.remove();
    appendMessage("assistant", result.answer, publicSources, `置信提示：${result.confidence}`, { messageId: result.messageId });
    playPetAction("idle");
  }, 420 + Math.random() * 320);
}

$$("[data-open-agent]").forEach((button) => button.addEventListener("click", () => openAgent()));
$$("[data-close-agent]").forEach((button) => button.addEventListener("click", closeAgent));
$("[data-new-chat]")?.addEventListener("click", startNewChat);
$$("[data-query]").forEach((item) => {
  const handler = () => openAgent(item.dataset.query);
  item.addEventListener("click", handler);
  item.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); handler(); }
  });
});
$(".suggestions").addEventListener("click", (event) => {
  if (event.target.matches("button")) submitQuestion(event.target.textContent);
});
$("#chat-form").addEventListener("submit", (event) => {
  event.preventDefault();
  submitQuestion(chatInput.value);
});
chatInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    submitQuestion(chatInput.value);
  }
});
chatInput.addEventListener("input", () => {
  chatInput.style.height = "auto";
  chatInput.style.height = `${Math.min(chatInput.scrollHeight, 120)}px`;
});
document.addEventListener("keydown", (event) => { if (event.key === "Escape" && panel.classList.contains("open")) closeAgent(); });

async function sendAnswerFeedback(messageId, rating, reasons = []) {
  const config = remoteAgentConfig();
  if (!config?.apiBase || !messageId) return false;
  const response = await fetch(`${config.apiBase.replace(/\/$/, "")}/api/agent/feedback`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message_id: messageId, rating, reasons, app_id: config.appId || "yingge-h5" }) });
  return response.ok;
}

chatLog.addEventListener("click", async (event) => {
  const feedback = event.target.closest(".answer-feedback");
  if (!feedback || feedback.dataset.sent === "true") return;
  const ratingButton = event.target.closest("[data-feedback-rating]");
  if (ratingButton?.dataset.feedbackRating === "down") {
    feedback.querySelector(".feedback-reasons").hidden = false;
    feedback.classList.add("choosing");
    return;
  }
  const reasonButton = event.target.closest("[data-feedback-reason]");
  const rating = reasonButton ? "down" : ratingButton?.dataset.feedbackRating;
  if (!rating) return;
  const reasons = reasonButton ? [reasonButton.dataset.feedbackReason] : [];
  feedback.querySelectorAll("button").forEach((button) => { button.disabled = true; });
  try {
    const ok = await sendAnswerFeedback(feedback.dataset.messageId, rating, reasons);
    feedback.dataset.sent = ok ? "true" : "false";
    feedback.innerHTML = ok ? `<span class="feedback-thanks">已收到，谢谢你帮英歌小槌变得更准。</span>` : `<span>反馈发送失败，请稍后再试。</span>`;
  } catch (_) {
    feedback.dataset.sent = "false";
    feedback.innerHTML = `<span>反馈发送失败，请稍后再试。</span>`;
  }
});

const menu = $(".site-header nav");
$(".menu-toggle").addEventListener("click", (event) => {
  const open = menu.classList.toggle("open");
  event.currentTarget.setAttribute("aria-expanded", String(open));
});
$$(".site-header nav a").forEach((link) => link.addEventListener("click", () => menu.classList.remove("open")));

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    }
  });
}, { threshold: .12 });
$$(".reveal").forEach((item) => observer.observe(item));
// Content must never remain hidden if a browser throttles IntersectionObserver.
setTimeout(() => $$(".reveal").forEach((item) => item.classList.add("visible")), 360);

const tempos = { slow: { bpm: 72, pitch: 75 }, mid: { bpm: 104, pitch: 92 }, fast: { bpm: 138, pitch: 112 } };
$$("[data-tempo]").forEach((button) => button.addEventListener("click", () => {
  $$(".tempo-tabs button").forEach((x) => x.classList.remove("active"));
  button.classList.add("active");
  state.tempo = button.dataset.tempo;
}));
$("#drum").addEventListener("click", async () => {
  const drum = $("#drum");
  drum.classList.remove("hit");
  requestAnimationFrame(() => drum.classList.add("hit"));
  setTimeout(() => drum.classList.remove("hit"), 900);
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    osc.type = "sine";
    osc.frequency.setValueAtTime(tempos[state.tempo].pitch, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(45, ctx.currentTime + .24);
    filter.type = "lowpass";
    filter.frequency.value = 380;
    gain.gain.setValueAtTime(.65, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + .45);
    osc.connect(filter).connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + .46);
  } catch (_) {}
});

const beatButtons = $$(".beat-grid button");
const beatToggle = $("#beat-toggle");
const beatStatus = $("#beat-status");
let beatTimer = null;
let beatIndex = 0;

function showBeat(index, playSound = true) {
  beatButtons.forEach((button, i) => button.classList.toggle("active", i === index));
  beatIndex = index;
  const active = beatButtons[index];
  beatStatus.textContent = `第 ${index + 1} 拍：${active?.querySelector("span")?.textContent || ""}`;
  if (playSound) $("#drum").click();
}

function stopBeatSequence() {
  if (beatTimer) window.clearInterval(beatTimer);
  beatTimer = null;
  beatToggle.setAttribute("aria-pressed", "false");
  beatToggle.textContent = "开始";
  beatStatus.textContent = "点击开始，观察鼓点怎样推进动作";
  beatButtons.forEach((button) => button.classList.remove("active"));
}

function startBeatSequence() {
  stopBeatSequence();
  beatToggle.setAttribute("aria-pressed", "true");
  beatToggle.textContent = "暂停";
  showBeat(0);
  const interval = Math.round(60000 / tempos[state.tempo].bpm);
  beatTimer = window.setInterval(() => showBeat((beatIndex + 1) % beatButtons.length), interval);
}

beatToggle?.addEventListener("click", () => {
  if (beatTimer) stopBeatSequence();
  else startBeatSequence();
});
beatButtons.forEach((button, index) => button.addEventListener("click", () => showBeat(index)));
$$("[data-tempo]").forEach((button) => button.addEventListener("click", () => {
  if (beatTimer) startBeatSequence();
}));

function initMotion() {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !window.gsap || !window.ScrollTrigger) return;
  const gsap = window.gsap;
  gsap.registerPlugin(window.ScrollTrigger);

  const heroTimeline = gsap.timeline({ defaults: { ease: "power3.out" } });
  heroTimeline
    .from(".hero-copy .eyebrow", { opacity: 0, y: 18, duration: .6 })
    .from(".hero-copy h1", { opacity: 0, y: 44, duration: .9 }, "-=.3")
    .from(".hero-lead,.hero-actions", { opacity: 0, y: 24, duration: .7, stagger: .12 }, "-=.45")
    .from(".mascot-stage", { opacity: 0, y: 70, scale: .92, duration: 1 }, "-=.8")
    .from(".hero-beat-lines i", { scaleX: 0, opacity: 0, duration: .5, stagger: .09 }, "-=.5");

  gsap.to(".hero-bg", {
    scale: 1.12,
    ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 1 }
  });
  gsap.to(".mascot-stage img", {
    yPercent: 8,
    ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 1 }
  });

  if (window.matchMedia("(min-width: 901px)").matches) {
    const mechanism = $(".mechanism-section");
    const mechanismTitle = $(".mechanism-sticky");
    window.ScrollTrigger.create({
      trigger: mechanism,
      start: "top top",
      end: "bottom bottom",
      pin: mechanismTitle,
      pinSpacing: false
    });
    $$(".mechanism-steps article").forEach((card) => {
      gsap.fromTo(card, { scale: .9, opacity: .35 }, {
        scale: 1,
        opacity: 1,
        ease: "none",
        scrollTrigger: { trigger: card, start: "top 82%", end: "top 28%", scrub: 1 }
      });
    });

    const journey = $(".region-journey");
    const track = $(".region-journey-track");
    const horizontalDistance = () => Math.max(0, track.scrollWidth - window.innerWidth);
    gsap.to(track, {
      x: () => -horizontalDistance(),
      ease: "none",
      scrollTrigger: {
        trigger: journey,
        start: "top top",
        end: () => `+=${horizontalDistance()}`,
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true
      }
    });
  }

  $$(".journey-card,.feature-card").forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      if (event.pointerType === "touch") return;
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - .5;
      const y = (event.clientY - rect.top) / rect.height - .5;
      gsap.to(card, { rotateY: x * 3, rotateX: y * -3, transformPerspective: 900, duration: .35, overwrite: true });
    });
    card.addEventListener("pointerleave", () => gsap.to(card, { rotateY: 0, rotateX: 0, duration: .55, ease: "power3.out" }));
  });

  const heroPet = $(".mascot-stage");
  heroPet?.addEventListener("pointermove", (event) => {
    const rect = heroPet.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - .5;
    const y = (event.clientY - rect.top) / rect.height - .5;
    gsap.to(heroPet, { rotateY: x * 5, rotateX: y * -3, transformPerspective: 1100, duration: .45, overwrite: true });
  });
  heroPet?.addEventListener("pointerleave", () => gsap.to(heroPet, { rotateY: 0, rotateX: 0, duration: .7, ease: "power3.out" }));

  const petImage = $("#pet-sprite");
  if (petImage) {
    const moveX = gsap.quickTo(petImage, "x", { duration: .35, ease: "power3.out" });
    const moveY = gsap.quickTo(petImage, "y", { duration: .35, ease: "power3.out" });
    document.addEventListener("pointermove", (event) => {
      const pet = $("#desktop-pet");
      if (!pet || pet.classList.contains("dragging")) return;
      const rect = pet.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const distance = Math.hypot(event.clientX - cx, event.clientY - cy);
      if (distance > 320) { moveX(0); moveY(0); return; }
      moveX(Math.max(-5, Math.min(5, (event.clientX - cx) / 35)));
      moveY(Math.max(-4, Math.min(4, (event.clientY - cy) / 45)));
    }, { passive: true });
  }
}

const heroPetFacts = [
  ["好势！", "点点我，先听一声槌响。"],
  ["先听鼓", "起鼓、加速、转段、收势，都在组织全队。"],
  ["再看脚", "低重心要看稳定，不是蹲得越低越好。"],
  ["退远一点", "近看槌法，远看队形，才看得见完整变化。"]
];
let heroPetFactIndex = 0;
$(".mascot-stage")?.addEventListener("click", () => {
  const stage = $(".mascot-stage");
  const bubble = $(".hero-pet-bubble");
  heroPetFactIndex = (heroPetFactIndex + 1) % heroPetFacts.length;
  const [title, text] = heroPetFacts[heroPetFactIndex];
  bubble.querySelector("b").textContent = title;
  bubble.querySelector("span").textContent = text;
  stage.classList.remove("is-reacting");
  requestAnimationFrame(() => stage.classList.add("is-reacting"));
  $("#drum")?.click();
  window.setTimeout(() => stage.classList.remove("is-reacting"), 2400);
});

const desktopPet = $("#desktop-pet");
const petMain = $("#pet-main");
const petBubbleTitle = $("#pet-bubble-title");
const petBubbleText = $("#pet-bubble-text");
const petSprite = $("#pet-sprite");
const petFacts = [
  ["人数不是定数", "英歌不一定要108人，具体取决于队伍传统、空间和活动规模。"],
  ["脸谱不能硬猜", "只看红脸或黑脸，不能可靠确认具体人物。"],
  ["锣鼓在指挥", "鼓点不仅伴奏，也在提示速度、段落和队形变化。"],
  ["先看队伍", "比较普宁和潮阳时，最好具体到某一支队伍和某一场演出。"],
  ["短视频有边界", "高潮片段不能代替完整的入场、变阵与收势。"]
];
let petFactIndex = 0;
let petTalkTimer = null;
let petActionTimer = null;
let petIdleTimer = null;
let petRoamTimer = null;
let petDrag = null;
let suppressPetClick = false;
let petPoseIndex = 0;
const petPoses = [
  ["think", "让我想想", "动作、队形和锣鼓要放在具体队伍里一起看。", 3600],
  ["surprised", "原来如此！", "同叫英歌，不同村落与队伍也会有自己的板式和讲法。", 1500],
  ["sleep", "歇一歇鼓", "我先打个盹；碰一下我就醒。", 5200],
  ["cheer", "好势！", "精神抖擞，再看一段英歌。", 1700]
];

function petSpeak(title, text, duration = 7000) {
  if (!desktopPet) return;
  petBubbleTitle.textContent = title;
  petBubbleText.textContent = text;
  desktopPet.classList.add("talking");
  window.clearTimeout(petTalkTimer);
  petTalkTimer = window.setTimeout(() => desktopPet.classList.remove("talking"), duration);
}

function playPetAction(stateName = "idle", hold = 0) {
  if (!desktopPet || !petSprite) return;
  window.clearTimeout(petActionTimer);
  desktopPet.dataset.state = stateName;
  const labels = {
    idle: "安静待机、偶尔眨眼的英歌小槌",
    beat: "正在连续击槌的英歌小槌",
    cheer: "正在欢呼跃起的英歌小槌",
    think: "正在认真思考的英歌小槌",
    explain: "正在展开卷轴讲解的英歌小槌",
    surprised: "露出惊喜反应的英歌小槌",
    sleep: "正在困倦打哈欠的英歌小槌"
  };
  petSprite.setAttribute("aria-label", labels[stateName] || labels.idle);
  petSprite.style.animation = "none";
  void petSprite.offsetWidth;
  petSprite.style.animation = "";
  if (hold > 0 && stateName !== "idle") {
    petActionTimer = window.setTimeout(() => playPetAction("idle"), hold);
  }
  resetPetIdleClock();
}

function resetPetIdleClock() {
  window.clearTimeout(petIdleTimer);
  petIdleTimer = window.setTimeout(() => {
    if (!document.hidden && !desktopPet?.classList.contains("menu-open") && !panel?.classList.contains("open")) {
      playPetAction("idle");
    }
  }, 90000);
}

function schedulePetRoam() {
  // 英歌小槌默认保持安静，只做低频眨眼；不再自动走动或频繁换动作。
  window.clearTimeout(petRoamTimer);
  petRoamTimer = null;
}

function roamPet() {
  schedulePetRoam();
}

function restorePetPosition() {
  try {
    const saved = JSON.parse(localStorage.getItem("yingge-pet-position") || "null");
    if (!saved || window.innerWidth < 700) return;
    desktopPet.style.left = `${Math.max(8, Math.min(window.innerWidth - 134, saved.left))}px`;
    desktopPet.style.top = `${Math.max(82, Math.min(window.innerHeight - 154, saved.top))}px`;
    desktopPet.style.right = "auto";
    desktopPet.style.bottom = "auto";
  } catch (_) {}
}

petMain?.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) return;
  window.clearTimeout(petRoamTimer);
  const rect = desktopPet.getBoundingClientRect();
  petDrag = { startX: event.clientX, startY: event.clientY, left: rect.left, top: rect.top };
  suppressPetClick = false;
  playPetAction("surprised", 900);
  petMain.setPointerCapture(event.pointerId);
});
petMain?.addEventListener("pointermove", (event) => {
  if (!petDrag || window.innerWidth < 700) return;
  const dx = event.clientX - petDrag.startX;
  const dy = event.clientY - petDrag.startY;
  if (Math.hypot(dx, dy) < 6 && !desktopPet.classList.contains("dragging")) return;
  suppressPetClick = true;
  desktopPet.classList.add("dragging");
  desktopPet.style.left = `${Math.max(8, Math.min(window.innerWidth - 134, petDrag.left + dx))}px`;
  desktopPet.style.top = `${Math.max(82, Math.min(window.innerHeight - 154, petDrag.top + dy))}px`;
  desktopPet.style.right = "auto";
  desktopPet.style.bottom = "auto";
});
petMain?.addEventListener("pointerup", (event) => {
  if (!petDrag) return;
  petMain.releasePointerCapture(event.pointerId);
  if (desktopPet.classList.contains("dragging")) {
    const rect = desktopPet.getBoundingClientRect();
    try { localStorage.setItem("yingge-pet-position", JSON.stringify({ left: rect.left, top: rect.top })); } catch (_) {}
  }
  desktopPet.classList.remove("dragging");
  desktopPet.classList.remove("dropped");
  requestAnimationFrame(() => desktopPet.classList.add("dropped"));
  window.setTimeout(() => desktopPet.classList.remove("dropped"), 650);
  petDrag = null;
  schedulePetRoam(7000);
});
petMain?.addEventListener("click", () => {
  if (suppressPetClick) { suppressPetClick = false; return; }
  const open = !desktopPet.classList.contains("menu-open");
  desktopPet.classList.toggle("menu-open", open);
  petMain.setAttribute("aria-expanded", String(open));
  playPetAction("idle");
  petFactIndex = (petFactIndex + 1) % petFacts.length;
  petSpeak(...petFacts[petFactIndex]);
  schedulePetRoam(open ? 15000 : 6500);
});
petMain?.addEventListener("dblclick", () => openAgent());
$("[data-pet-dismiss]")?.addEventListener("click", () => desktopPet.classList.remove("talking"));
$$("[data-pet-action]").forEach((button) => button.addEventListener("click", () => {
  const action = button.dataset.petAction;
  if (action === "ask") {
    playPetAction("explain", 2200);
    openAgent();
  }
  if (action === "drum") {
    $("#drum")?.click();
    playPetAction("beat", 900);
    petSpeak("铿锵！", "这一声是互动示意。真实鼓点要按具体队伍的谱例来听。");
  }
  if (action === "pose") {
    const [pose, title, text, hold] = petPoses[petPoseIndex % petPoses.length];
    petPoseIndex += 1;
    playPetAction(pose, hold);
    petSpeak(title, text, Math.max(hold, 2800));
  }
  if (action === "side") {
    const next = desktopPet.dataset.side === "right" ? "left" : "right";
    desktopPet.dataset.side = next;
    desktopPet.removeAttribute("style");
    try { localStorage.removeItem("yingge-pet-position"); } catch (_) {}
    playPetAction("surprised", 950);
    petSpeak("换个位置", next === "left" ? "我到左边陪你看。" : "我回右边守着入口。");
    schedulePetRoam(7000);
  }
}));
restorePetPosition();
playPetAction("idle");

loadKnowledge();
initMotion();
