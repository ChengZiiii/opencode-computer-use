# Tasks — add-computer-use

## 1. 仓库脚手架与红线

- [ ] 1.1 新包脚手架：`package.json`（`@sorenllm/opencode-computer-use` 0.1.0、`exports["."]`+`exports["./server"]`、`engines.opencode`、scripts 仅 `bundle`/`test`/`typecheck`、无 `workspaces`）、`tsconfig`、`.gitignore`（不含 dist）、AGENTS.md 骨架；验证：`npm pack --dry-run` 无七触发器字段，避坑 §TL;DR 逐条核对
- [ ] 1.2 构建链：`bun build plugin.ts --outfile dist/index.js`（dist 入库）+ `node --test --test-timeout=20000 tests/*.test.mjs` 测试脚本 + `tsc --noEmit`；验证：空实现下三命令全绿

## 2. 驱动解析与契约门

- [ ] 2.1 `src/driver-resolve.ts`：override（`OPENCODE_CUA_DRIVER_CMD`，权威不偷换）→ PATH → 平台规范位置的解析顺序；验证：单测覆盖 override 命中/失效报因、各平台候选路径构造
- [ ] 2.2 `src/contract.ts`：`cua-driver manifest` JSON 解析（可注入 runner），契约 = 版本 ≥ 下限 + `mcp_invocation` 合法 + 必需子命令 flag 面；结果缓存进程级、硬超时；验证：单测覆盖通过/版本低/manifest 缺字段/超时/坏 JSON 五分支与失败原因文本
- [ ] 2.3 两段式状态机：启动 manifest 门（就绪/引导）+ 首调 MCP `tools/list` 工具面核对（缺失→结构化错误指引，不半工作）；验证：fake 传输单测断言两段各自的行为与报错文本
- [ ] 2.4 版本策略声明落点：代码内契约下限常量与 README 的 tested-against 区间声明，注明"验证过新驱动后须同一变更内抬下限与区间、单向不回退"；`computer_status` 的 check-update 仅在确认驱动该子命令读缓存零网络时接入，否则只报 manifest 版本；验证：常量与 README 断言存在 + 单测覆盖该条件分支

## 3. MCP stdio 最小客户端

- [ ] 3.1 `src/mcp-client.ts`：initialize 握手 → `tools/call` → 通知处理的 JSON-RPC 子集，传输接口可注入（fake ChildProcess）；验证：单测用 fake 传输覆盖握手、调用、响应超时、进程退出四路径
- [ ] 3.2 子进程管理：按 manifest `mcp_invocation` spawn（无孙进程）、`dispose` 终止、崩溃后下次调用惰性重启、会话标签 `opencode-computer-use-<uuid>`、遥测 env 默认关、`--no-overlay` 平台默认 + `--help` 探测；验证：单测断言 spawn 参数组装、env 注入、dispose 杀进程、崩溃重开

## 4. 工具面与截图回传

- [ ] 4.1 `src/tool.ts` 注册 `computer`（action 判别器 14 动作 + 参数 schema，未知 action 报最近拼写）与 `computer_status`（就绪/引导两态输出 + 用户自跑命令 + 按需 check-update 信息）；验证：接线单测断言 schema、未知 action、status 两态文本
- [ ] 4.2 `src/capture.ts`：som/vision/ax 三模式、attachments data URL 构造、元素清单上限 100 截断声明、坐标映射文本（图 vs 原生分辨率 + scale-factor/DPR 元数据 + "勿像素推理、元素寻址优先"提示）、zoom 作为小目标精读路径的引导；验证：fake 驱动响应单测覆盖三模式、附件构造、截断、映射与元数据文本
- [ ] 4.3 verdict 映射：驱动结构化字段（ok/effect/verified/escalation）→ done/verify_fresh_state/escalate 三态，字段缺失默认 verify_fresh_state；文案含"重试前先 capture"与"不得凭建议重放"；验证：单测覆盖五类驱动响应组合

## 5. 安全层与审批

- [ ] 5.1 `src/safety.ts`：封禁键组（别名归一化 + 连字符/空格切分防绕过）与封禁 type 文本清单，先于审批拦截；验证：单测覆盖 Hermes 清单全量 + 变体绕过尝试（"ctrl-alt-delete"、"command shift q"）
- [ ] 5.2 粘性目标守卫：capture/focus_app 设定目标，输入动作 app 参数明显不符即拒绝；元素引用陈旧 fail-closed；验证：单测覆盖设定、匹配、不符拒绝、陈旧报错
- [ ] 5.3 审批两件套：config hook 注入 `permission.computer = "ask"`（显式 deny 胜）+ execute 内 `ctx.ask()`（capture 豁免）；验证：接线单测（fake ToolContext）断言 ask 流程、deny 短路、capture 不触发 ask
- [ ] 5.4 单飞互斥：在途调用期间并发调用有界等待不交错；验证：单测两并发调用断言串行完成与顺序

## 6. 插件装配与文档

- [ ] 6.1 `plugin.ts` 装配：双入口（server/setup）、启动探测→就绪注册全工具面/未就绪只注册 status、dispose 清场、所有钩子交互 try/catch 不抛宿主；验证：装配单测两态注册 + dispose
- [ ] 6.2 README：安装（npm spec + 用户自装 cua-driver 的平台命令）、配置（override env、权限键）、文件账本三块（安装器写的/插件写的/无）、卸载、与 playwright-mcp 并装说明、非视觉模型边界声明、**有意偏离 Anthropic 缩放建议的声明**（元素寻址 + scale 元数据 + zoom 路径的理由）、bounded 权限模式的进阶引导（回应社区对 Accessibility 权限的顾虑）；验证：按避坑 §6 口径核对
- [ ] 6.3 AGENTS.md 架构表与模块职责；验证：与实际模块一致

## 7. 实机验证（Windows，真驱动）

- [ ] 7.1 cua-driver 已就位（本机 0.28.2，Hermes 带入；全新机器则用户自装——插件只报命令不代装）后端到端：capture som 出图（模型可读）、元素寻址 click、type、set_value、list_apps/focus_app(bring_to_front)；验证：以具备视觉能力的模型会话执行 `opencode run --auto` 冒烟全过 + 附件真图确认
- [ ] 7.2 生命周期姿态：无驱动环境（PATH 隔离）只注册 `computer_status` 且报用户命令；契约门版本低/坏 manifest 的 guide 输出；安装器永不被执行（审计代码路径）；验证：沙箱 XDG 复现两态
- [ ] 7.3 稳定性：驱动 kill -9 后当次调用结构化报错 + 下次惰性重启 + 粘性目标失效要求重新 capture；慢驱动（假挂起）超时失败不挂会话；验证：实机脚本化复现两场景
- [ ] 7.4 审批与安全实机：默认 ask 姿态（无 --auto 拒绝 / --auto 放行）；封禁键组在 --auto 下依旧拦截；验证：两姿态度跑 + 封禁输入实测

## 8. 发布门槛

- [ ] 8.1 `bundle` 打包、dist 入库、版本 0.1.0、`npm pack` 产物检查（无七触发器、双导出）；tsc + 全测试绿；验证：pack 清单核对
- [ ] 8.2 npm 发布（浏览器密钥流程，沿用 forge 0.3.0 的 passkey + granular token + 用后撤销路径）+ 官方安装终验：`opencode plugin @sorenllm/opencode-computer-use --global`（npm registry spec）安装、注册、7.1 冒烟复跑全过；卸载四步 + 同 spec 重装回到干净可用状态；**最终状态硬性要求：用户环境 npm plugin 模式且冒烟通过**
