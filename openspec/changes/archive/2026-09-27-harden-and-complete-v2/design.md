# Design — harden-and-complete-v2

## Context

全面性审计结论（2026-09-26）：v0.1.0 的生命周期纪律、verdict、封锁清单、单飞互斥扎实；
四个硬伤（env 泄漏 / 裸 index 寻址 / app 参数未实现 / focus 语义反转）与三处文档自相矛盾
（zoom 文案指向不存在的动作、middle_click 提示与 0.28.2 事实相反、"无降 scale"表述 vs
`max_dimension=1568` 实现）。三个教训的 Hermes issue 出处：#47072（token）、#53503 系
（env 消毒）、#67052（foreground 独立审批域）。延后清单（kill_app、剪贴板、delay_ms、
modifiers、多显示器、录制、溢写）见 proposal Impact。

## Goals / Non-Goals

**Goals**：0.2.0 一车完成 must 全部 + should 精选八项；动作面只增不改既有语义（focus_app
不抢焦点属缺陷修复，README 标注）；零依赖与"绝不代装"纪律不动。

**Non-Goals**：auxiliary.vision（维持）；browser_*/page/replay_trajectory/set_config/
安装器全家（维持永不）；later 清单（见 proposal）。

## Decisions

### D1 环境白名单（安全，最优先）

spawn env 从 `{...process.env}` 改为白名单构造：`PATH`、`SYSTEMROOT`/`SystemDrive`
（Windows）、`HOME`/`TMPDIR`（POSIX）、`LOCALAPPDATA`（驱动的规范位置解析依赖它）+
`CUA_DRIVER_RS_TELEMETRY_ENABLED`。**被否备选**：黑名单剔除 `*KEY*`/`*TOKEN*`（名单
永远追不完，白名单才是封闭集）。测试断言：注入假 API key 的宿主 env 不出现在子进程 env。

### D2 陈旧寻址：snapshot 令牌表 + 显式失败

`ComputerSession` 维护 `lastSnapshot: Map<windowKey, {snapshotId, tokens: Map<index, token>}>`；
capture 时从 `structuredContent.snapshot_id`/`elements[].element_token` 入账；元素寻址
动作自动附带 `element_token`（有则带，无则回退裸 index）。驱动报 stale → 结构化
`stale_snapshot` 错误（文案：重新 capture）。崩溃重启 → 令牌表清空 + 首个结果带
`restarted: true` 提示（spec 场景兑现；v1 的 `restarted` 标志置而无读者是漂移根因）。

### D3 app 解析梯（README 首例兑现）

capture/launch 入口的 app 参数解析：list_apps 的 running 条目名精确匹配 → 不区分大小写
包含 → list_windows 的窗口 title/app_name 包含 → 多命中时返回候选清单让模型选
（Hermes `_match_windows_for_app` 四级的精简：去本地化 display-name 层，0.28.2 的
list_apps 已回 launch_path/AUMID 足够）。解析成功即设 sticky；失败错误附 running
应用前 N 个。

### D4 动作面四增 + focus 拆分

- `zoom`：参数 region（x,y,w,h 截图坐标）→ 驱动 zoom；返回图 + 提示后续动作可带
  `from_zoom`；click/type 等透传 `from_zoom: true`（参数进 schema）。
- `verify`：参数 predicates 数组（exists/enabled/selected/value_equals + window bounds），
  透传 verify_state；结果三态映射 verdict（unknown ≠ 成功）。
- `invoke_menu`：参数 path 数组，透传；fail-closed 错误原样带失败层级。
- `launch_app`：参数 name/launch_path/start_minimized → 驱动 launch_app（SW_SHOWNOACTIVATE）；
  审批域同输入动作；返回 pid+windows 并自动设 sticky。
- focus 拆分：`focus_app` 改为纯选择（list_apps/list_windows 匹配 + 设 sticky，不调
  bring_to_front）；新增 `raise` 布尔参数（focus_app 与任意输入动作上可用）→ 调
  bring_to_front 且走 foreground 审批域（D6）。

### D5 审批域拆分（#67052）

`ctx.ask` 的 permission 字段按域命名：背景输入 `computer`（沿用，兼容既有用户规则）；
foreground/raise 用 `computer:foreground`（config hook 同步注入 ask 默认；显式 deny 胜）。
背景域的 once/always 授权不覆盖 foreground——ask 的 permission 名不同即天然隔离，
不需要额外状态。

### D6 经济性三件

- 遍历界：captureFlow 给 get_window_state 传 `max_elements: 200`（配置可调 50–1000），
  输出报界与截断；
- if-changed 去重：session 记每 windowKey 最近截图字节 hash，连续相同则省略附件并在
  文本标注 "screenshot unchanged (streak n/2)"，第三次强制带图（防 compaction 后失忆）；
- capture_after 策略化：配置 `computerUse.captureAfter: "off"|"som"|"ax"`（默认 off 维持
  v1 显式语义）；开启时精确 pid+window_id 重拍、失败动作不拍、结果与 verdict 合并输出。

### D7 status 增强与 cursor 开关

`computer_status` ready 态追加驱动 `health_report`（薄客户端，失败降级为 manifest 信息）
与 `check_permissions` 摘要；macOS 检测到"TCC 显示开启但 health 拒绝"时输出
`tccutil reset … && permissions grant` 指引（stale grant，trycua/cua#3170）。
agent cursor：配置 `computerUse.agentCursor: false`（默认），spawn 后
`set_agent_cursor_enabled(false)` best-effort——Windows 合成器风险低，但默认关与
Hermes 烧核教训一致，想要可见性用户自己开。

### D8 dispose 与文档卫生

dispose 顺序：`end_session`（10s 上限）→ kill；README 的 resolution 段改写为
"驱动侧 max_dimension=1568 上限 + 比例映射"；middle_click 提示删除（schema 的 button
参数描述已足够）。

## Risks / Trade-offs

- **env 白名单过窄破坏驱动解析**：LOCALAPPDATA/PATH 保留覆盖规范位置与 bash 包装；
  实机验证 7.x 复跑兜底；发现缺项进白名单并记录理由。
- **token 表内存**：每窗口一表、cap 5 窗口 LRU，元素 token 每快照重建，量级可忽略。
- **去重误省**：streak≤2 硬上限 + 文本明示省略，模型可显式要求 vision 强制带图。
- **focus 行为变更的用户感知**：README 变更标注（原"选目标即抢焦点"是缺陷）。
- **审批新键**：`computer:foreground` 是新 permission 名，用户旧规则不覆盖它 → 默认
  ask 注入保证行为（不静默放行）。
