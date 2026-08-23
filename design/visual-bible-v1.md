# 英歌智能体网站视觉圣经 V1

## 核心方向

不是复刻传统宣传画，也不是把所有画面做成黑红 3D 海报。统一采用“双层展陈”：

- **黑漆数字展馆**承载沉浸、角色与空间气势。
- **暖白档案纸 / 半透明描图纸**承载动作分解、器物说明与证据边界。

纸本层像研究档案悬浮在展馆里；3D 物件和角色穿过纸面，形成真实物件与知识标注之间的联系。

## 角色连续性锁定

- 家雀永远保持：圆润 Q 版比例、大棕眼、黑色眉眼与颊纹、银红盔饰、白珠、红紫绒球、两根长翎、红色刺绣服、红鞋、双短槌。
- 生成新动作时只改变四肢、重心、视线和槌位，不改变脸、头身比、盔饰结构和服装纹样区域。
- 同一画面出现多个时间切片时，它们是同一角色的连续动作，不是多个不同人物。
- 其他角色必须使用独立脸谱、盔饰轮廓、服色与体态；不得只是给家雀换色。

## 材质词典

- 黑漆地面：低反射、可见微小磨痕，不使用纯黑渐变背景。
- 档案纸：暖象牙白、棉纤维、轻微毛边、非常淡的旧金云纹水印。
- 盔饰：做旧银、手工錾刻、珍珠与绒球，不使用镜面铬金属。
- 服装：丝缎、盘金绣、绒边，保留缝线和厚度。
- 朱砂标签：哑光印泥质感，颜色不超过画面 12%。
- 运动线：旧金细线与朱砂虚线；用于说明轨迹，不做炫光特效。

## 色彩比例

- 墨黑 / 深褐：55%
- 暖纸白：25%
- 朱砂红：12%
- 做旧银：6%
- 旧金：2%

## 镜头连续性

- 主叙事镜头统一 35mm 等效、略低机位或平视；器物档案统一 50mm、近正交视感。
- 灯光固定：左前方暖色主光，右后方冷银轮廓光，底部仅有极弱朱砂反射。
- 不随意加入舞台烟、火焰、强镜头光晕和霓虹。

## 信息图规则

- 图片只负责角色、器物和运动关系；准确名称、尺寸、出处与适用边界由 HTML 文本承载。
- 每屏只讲一个结论：动作如何发生、器物如何配合、角色如何区分。
- 轨迹线必须服务于动作方向；装饰云纹透明度低于 10%。
- 生成图中不写文字，避免错字；网页标注统一使用可访问的真实文字。

## 母提示词

> Contemporary Chinese cultural museum campaign, one coherent Yingge IP universe, black lacquer exhibition space intersected by warm ivory archival paper and translucent drafting vellum, cinnabar annotation marks, restrained antique-gold motion lines, aged silver filigree, tactile silk embroidery, controlled warm key light from front-left and cool silver rim light from rear-right, 35mm cinematic perspective, high material fidelity, quiet negative space, no text, no watermark, no neon, no fire, no generic opera styling.

每张资产在母提示词之后添加唯一的“知识任务”，其余角色、材质、光线与色彩规则不变。
