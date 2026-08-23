# 英歌角色动作视频交接包

## 上传素材

- `frames/01-first-frame-16x9.png`：首帧
- `frames/02-last-frame-16x9.png`：尾帧
- `frames/character-reference.png`：可选的角色参考图
- `提示词.txt`：正向提示词、负向提示词与参数建议

首尾帧已经统一为 1920×1080，角色尺寸和位置保持一致。绿幕用于后续抠像，请勿让视频平台替换背景或自动运镜。

## 视频回存位置

生成完成后，将原始视频保存为：

`D:\vctest\英歌舞\production\video-input\output\yingge-character-action-v1.mp4`

如果平台只能导出 `.mov` 或 `.webm`，保留原格式并保持文件名 `yingge-character-action-v1`。

不要通过聊天软件二次压缩。直接把原始导出文件复制到 `output` 文件夹，然后告诉 Codex“视频已放进去”。

Codex 后续会检查：角色身份漂移、脚底滑动、冠饰闪烁、羽翎断裂、绿幕色差、动作节奏和编码信息；通过后再进行抠像、阴影、背景合成和网页接入。
