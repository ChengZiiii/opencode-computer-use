# Verification notes — harden-and-complete-v2 (0.2.0)

## 沙箱（guard 串行）

62/62 全绿：unit 16 + wiring 22 + v2 24（新增覆盖 env 白名单、set_value 扫描、
token 寻址/拒发、重启披露、有序 dispose、app 解析梯、zoom/from_zoom、verify 三态、
invoke_menu、launch_app sticky、focus 拆分、双审批域、max_elements 钳制、dedup
streak、captureAfter 策略、health 折入、cursor 默认关）。

## 实机（live-verify.mjs，真驱动 0.28.2，全部只读 + 拒绝路径，零输入注入）

| 场景 | 结果 |
|---|---|
| 6.2a launch_app（默认 start_minimized）| PASS — 启动、sticky 绑定、GetForegroundWindow 前后不变 |
| 6.2b README 首例 capture(app="Notepad") | PASS — 解析梯（list_apps 精确）→ sticky |
| 6.2c verify 谓词 | PASS — 驱动 status=satisfied → verdict done（bounds/observed_json 透传）|
| 6.2d focus_app 纯选择 | PASS — 前台不变 |
| 6.2e zoom 裁剪闭环 | PASS — 角点参数、附件图、from_zoom 指引（点击路径单测覆盖）|
| 6.2f 陈旧寻址拒绝 | PASS — 清空令牌表后 unaddressable_element，零派发 |
| 6.2g 崩溃重启披露 | PASS — kill 本会话驱动 → 下一个结果带 restarted:true + re-capture 指引 |
| 6.3 if-changed 去重 | PASS — 静止窗口字节相同省略（omit2/omit3）；streak 上限强制重带由单测 4.3 覆盖 |
| 6.3 sticky 指纹 | PASS — focus 结果携带 selected={app,pid,windowId} |

## 实施中的活体发现（全部已修复）

1. **驱动签名对齐**（describe 实测）：verify_state 用 `expect`（不是
   predicates），聚合字段是 `structured.status: satisfied|unsatisfied|...`；
   zoom 用角点 `x1,y1,x2,y2`（resized-image 像素）；click 的 from_zoom 由驱动
   按 pid 自记（插件不传 region）。
2. **list_apps 文本形态混入 installed-not-running（pid 0）**——解析梯过滤
   pid>0 + .exe 规范化，否则 "Notepad" 永远 ambiguous。
3. **launch_app 普通启动会激活窗口**（实测抢前台一次）——插件默认
   start_minimized:true，显式 false 才常规启动。
4. **focus_app 被自己的 sticky 守卫拦住**（input_target_mismatch）——focus_app
   是目标设定器，豁免 mismatch 检查（切换本身仍在输入审批门后）。
5. **重启披露时机**：标志读取必须在 call 之后（respawn 发生在 call 内部）。
6. **dedup 的字节语义**：驱动截图字节稳定性依赖实例状态（冻结缓存→恒定；
   长寿命实例→合法变化）。省略只在 bytes 相同时发生，符合 spec。

## 输入注入事故与纪律（2026-09-26 深夜）

早轮实机对 Notepad 真实注入过 click；驱动 background 输入通道 + 随后的
taskkill 清理组合导致**用户鼠标键盘短时无法交互**；根因链为"进程强杀后
serve 计划任务重新拉起 daemon、输入会话未归还"。处置：revoke --all + stop +
Stop-ScheduledTask；全项健康检查（按键状态/覆盖窗口/shell 响应/前台焦点）
确认系统干净。**纪律（已写进 live-verify 头注释与 README 精神）**：
- 输入类动作（click/type/launch 非最小化等）**永不在用户使用中实测**——单测覆盖；
- 任何驱动相关测试收尾必须走官方清理（revoke --all + stop），不得 taskkill；
- 事故后 live-verify 已重写为只读 + 拒绝路径版本，本轮九项全 PASS 于该版本。
