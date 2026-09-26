# Proposal — harden-and-complete-v2

## Why

全面性审计（2026-09-26，三方对照：本插件 v0.1.0 源码 × 本地 Hermes 实现 × cua-driver 0.28.2 全部 57 工具）发现四个硬伤与三处文档/实现自相矛盾，其中 **spawn 全量继承宿主环境（含 provider API key）是已发布 0.1.0 携带的安全缺陷**；另有 Hermes 用 issue 换来的教训（#47072 陈旧寻址、#67052 前台审批域）与一批让工具面"周到全面"的补全（zoom/verify_state/invoke_menu/launch_app）。本 change 合并一车发布 0.2.0：安全加固 + 缺陷修复 + 面补全。

## What Changes

- **安全**：驱动子进程环境白名单（PATH/SystemRoot 等必需项 + 遥测开关，provider 凭据绝不进入第三方二进制）；`set_value` 的 value 纳入危险文本封锁扫描（超出 Hermes 的一步，堵终端控件旁路）。
- **陈旧寻址防护**：动作携带 `element_token`/`snapshot_id`，陈旧引用显式失败（驱动 fail-closed），会话层维护每窗口最近快照令牌表。
- **app 名解析**：`capture(app=...)` 经 list_apps/list_windows 解析为 pid（Hermes 四级匹配的简化版），README 首例真正可跑。
- **动作面补全**：`zoom`（原生分辨率裁剪 + `from_zoom` 坐标回映射，兑现 v1 文本里自己写下的承诺）、`verify_state`（确定性谓词校验，unknown≠成功，接入 verdict 体系）、`invoke_menu`（原生菜单 fail-closed）、`launch_app`（隐藏启动不抢焦点，补"启动应用"第一环，堵 Win+R 旁路）。
- **focus 语义拆分**：`focus_app` 默认纯选目标不抬窗；`raise` 显式参数且**独立审批域**（foreground 与 background 输入分开审批）；`delivery_mode=foreground` 同域。
- **崩溃/退出卫生**：dispose 尽力调用 `end_session`（驱动光标/录制清理钩子）；崩溃重启后的下一次调用在结果中**报告重启**并要求重新 capture（兑现 spec 既有场景）。
- **经济性**：驱动侧 `max_elements` 遍历界（默认 ~200，Hermes 实测 Finder 6.9s→0.6s）；截图 if-changed 去重（同目标连续同图省略图片块，streak≤2 上限）；`capture_after` 策略化（配置默认档 + 精确窗口重拍 + verdict 合并）。
- **status 增强**：`computer_status` 折入驱动 `health_report`（薄客户端）与权限检查（macOS 含 stale-TCC 提示文案）；agent cursor 插件级开关（默认关，spawn 后设置）。
- **文档修正**：middle_click 提示改为事实（`click` 的 `button` 参数已支持中键）；README "无降 scale" 表述与 `max_dimension=1568` 实现对齐。

## Capabilities

### Modified Capabilities

- `computer-use` — 动作面扩展（zoom/verify/invoke_menu/launch_app + focus 拆分）、陈旧寻址防护（新 requirement）、审批域拆分（foreground/raise 独立）、封锁扫描扩至 set_value、capture 经济性（遍历界/去重/策略化跟拍）、verify_state 接入 verdict。
- `driver-lifecycle` — 进程卫生强化（环境白名单、end_session、重启告知）与引导面增强（health_report/权限折入）。

## Impact

- 代码面：`src/mcp-client.ts`（env 构造）、`src/session.ts`（令牌表、end_session、重启告知）、`src/tool.ts`（动作面、app 解析、审批域、capture_after）、`src/capture.ts`（去重、遍历界参数）、`src/safety.ts`（set_value 扫描）、`plugin.ts`（cursor 配置）。
- 兼容性：动作枚举只增不改语义；`focus_app` 行为变更（不再抢焦点）属缺陷修复并在 README 标注。
- 明确延后（later，记录在案）：`kill_app`、`clipboard_write/read`、`type delay_ms`、click/drag modifiers、多显示器 display_id、录制三件套、元素树溢写文件。
- 发布：0.2.0 一车，沿用浏览器密钥发布 + npm spec 官方安装终验。
