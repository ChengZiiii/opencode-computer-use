# Tasks — harden-and-complete-v2

## 1. 安全加固（最优先）

- [ ] 1.1 `src/mcp-client.ts`：spawn env 白名单（PATH/SYSTEMROOT/SystemDrive/LOCALAPPDATA/HOME/TMPDIR + 遥测 flag）；验证：单测注入假 API key 断言子进程 env 不含；实机复跑 7.x 确认驱动解析不受影响
- [ ] 1.2 `src/safety.ts`：`set_value` 的 value 纳入 blockedTypeReason 扫描；验证：单测 blocked pattern 经 set_value 被拒（先于审批）

## 2. 陈旧寻址与重启告知

- [ ] 2.1 `src/session.ts`：snapshot 令牌表（每窗口 {snapshotId, tokens}，LRU≤5），capture 入账、崩溃清空；元素寻址动作自动附带 element_token；验证：单测 capture→动作带 token、stale 错误透传为 `stale_snapshot` 结构化错误
- [ ] 2.2 重启告知：restarted 标志在首个后续结果中输出 `restarted: true` + "re-capture required"；验证：单测崩溃→下次调用结果含重启提示（兑现既有 spec 场景）
- [ ] 2.3 dispose 顺序：end_session（≤10s）→ kill；验证：单测断言调用顺序与超时回退

## 3. app 解析与动作面

- [ ] 3.1 app 解析梯：list_apps 精确/包含 → list_windows title 匹配 → 多命中返回候选；capture/launch 入口生效并设 sticky；验证：单测三档 + 多命中候选清单 + 未命中附 running 列表；实机 README 首例 `capture(app="Notepad")` 直接过
- [ ] 3.2 `zoom` 动作 + `from_zoom` 参数透传（click/type 等 schema 增 from_zoom）；验证：单测参数组装 + 坐标回映射提示文案
- [ ] 3.3 `verify` 动作：predicates 透传 verify_state，三态映射 verdict（unknown≠成功）；验证：单测三态 + 与既有 verdict 合并
- [ ] 3.4 `invoke_menu`：path 透传，fail-closed 层级错误原样；验证：单测路径组装与错误透传
- [ ] 3.5 `launch_app`：name/launch_path/start_minimized 透传，返回 pid+windows 自动设 sticky，走输入审批域；验证：单测参数与 sticky；实机隐藏启动不抢焦点（GetForegroundWindow 断言）
- [ ] 3.6 focus 拆分：`focus_app` 纯选择（不调 bring_to_front）；`raise` 参数（focus_app/输入动作）走 foreground 审批域并调 bring_to_front；验证：单测默认不动前台、raise 触发独立 ask

## 4. 审批域与经济性

- [ ] 4.1 前台独立审批域：ask permission `computer:foreground`，config hook 注入 ask 默认（显式 deny 胜）；背景授权不覆盖前台；验证：接线单测双域隔离（allow computer 不放行 raise）
- [ ] 4.2 遍历界：captureFlow 传 `max_elements`（默认 200，配置 50–1000），输出报界；验证：单测参数 + 界与截断标注
- [ ] 4.3 if-changed 去重：session 记每窗口截图 hash，连续相同省略附件（streak≤2 硬上限）+ 文本标注；验证：单测同图两次省略、第三次强制带图
- [ ] 4.4 capture_after 策略化：配置 `computerUse.captureAfter`（默认 off）；开启时精确窗口重拍、失败不拍、与 verdict 合并；验证：单测三态 + 实机一轮

## 5. status 增强与配置

- [ ] 5.1 `computer_status` ready 态折入 health_report（失败降级 manifest）与 check_permissions 摘要；macOS stale-TCC 指引文案；验证：单测两源合并 + 降级路径
- [ ] 5.2 agent cursor 配置（默认关）：spawn 后 set_agent_cursor_enabled best-effort；验证：单测调用与容错
- [ ] 5.3 文档修正：middle_click 提示删除、README resolution 段对齐 max_dimension 实现、focus 行为变更标注、新配置项（captureAfter/agentCursor/maxElements）与 `computer:foreground` 权限键说明；验证：按避坑 §6 口径核对

## 6. 回归与实机

- [ ] 6.1 全量回归：`node --test --test-timeout=20000 tests/*.test.mjs` + `tsc --noEmit` + bundle；既有 38 测试无回归；验证：全绿输出
- [ ] 6.2 实机（真驱动）：README 首例 app 捕获、zoom→click from_zoom 精读闭环、verify 谓词断言、launch_app 隐藏启动 + sticky、focus 不抢前台/raise 抢前台、env 消毒（子进程 env dump 断言无 KEY）、崩溃重启告知；验证：脚本化记录进 verification-notes
- [ ] 6.3 并发与去重实机：同图连拍省略、第三次带图；多 chat 串扰的 sticky 指纹输出；验证：实机记录

## 7. 发布

- [ ] 7.1 版本 0.2.0、pack 检查（红线口径）；验证：npm pack 清单核对
- [ ] 7.2 浏览器密钥 npm 发布 + npm spec 官方安装终验 + 冒烟（最终态 npm plugin 模式）；验证：同 forge 8.2 闭环（token 用后即撤）
