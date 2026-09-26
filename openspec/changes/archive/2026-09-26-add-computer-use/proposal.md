# Proposal — add-computer-use

## Why

opencode 生态里桌面级 computer use 是空白：官方内建只做浏览器（PR #48755，评审中）且明确把 OS 级控制留给插件生态；Hermes 已经验证了"agent + trycua/cua 的 cua-driver 后端"这条路能规模化工作，但它没有 opencode 插件形态的实现。本插件把这条被大量验证的路径带进 opencode，同时以"只探测—降级—指引"的生命周期纪律确保不给 opencode 宿主和 cua-driver 后端任何一方制造意外。

## What Changes

- 新建独立插件包 `@sorenllm/opencode-computer-use`（零运行时 npm 依赖，dist 自包含入库，遵循避坑文档全部红线）。
- 注册单一 `computer` 工具（action 判别器，Hermes 同款动作面按 0.28.2 Windows 实测裁剪）：`capture`（som/vision/ax 三模式）/ `click` / `double_click` / `right_click` / `drag` / `scroll` / `type` / `key` / `set_value` / `wait`（客户端本地）/ `list_apps` / `list_windows` / `focus_app`（映射驱动 `bring_to_front`），透传给 cua-driver 的 MCP stdio 服务。注：cua 官方 `mcp-config --client opencode` 已提供裸 MCP 接入片段；本插件的增值在安全闸、verdict 判定、生命周期引导与截图回传契约——这些裸 MCP 配置做不到。
- 截图经 `ToolResult.attachments` 以 `data:` URL 回传（模型可直读），带预缩放（最长边 ~1568px）与坐标映射；SOM 元素清单有上限截断。
- 安全层：封禁键组与危险 type 文本硬拦截、粘性目标守卫（防打错窗口）、审批两件套（config permission `computer: "ask"` 默认 + `ctx.ask()`）、单飞互斥（同进程一次只允许一个在途驱动调用）。
- 生命周期"只探测—降级—指引"：启动时本地解析二进制 + `cua-driver manifest` 契约检查（毫秒级、零网络）；就绪才注册 `computer` 工具面，未就绪只注册 `computer_status` 一个问询窗，返回精确诊断与**用户自己执行**的安装/升级命令；插件进程内永不执行安装器、永不为生命周期做网络请求。
- 进程卫生：单 opencode 进程单 MCP 子进程复用、每次驱动调用硬超时（超时失败的是当次工具调用而非会话）、dispose 杀干净、驱动崩溃后惰性重启并失效粘性目标、cua 遥测默认关闭。

## Capabilities

### New Capabilities

- `computer-use` — 工具面契约：动作集与参数、capture 三模式、截图回传契约（attachments + 缩放 + 坐标映射）、语义判定三态（done / verify_fresh_state / escalate，禁止盲目重放输入）、安全层（封禁清单、粘性目标、审批、单飞）。
- `driver-lifecycle` — cua-driver 后端生命周期：二进制解析顺序与环境变量 override、manifest 运行时契约门（版本下限 + mcp_invocation 自述 + 所需工具面）、就绪/未就绪的注册分层与 `computer_status` 引导模式、安装与升级仅限用户操作、版本策略单向、进程卫生（子进程、超时、崩溃恢复、遥测）。

### Modified Capabilities

（无 — 新仓库空基线）

## Impact

- **新仓库/新包**：`opencode_plugin_dev/opencode-computer-use`，独立发布车（首个版本 0.1.0），不触碰 `@sorenllm/opencode-forge`。
- **外部依赖（用户自装，非 npm 依赖）**：trycua/cua 的 `cua-driver` ≥ 契约下限（初始按实测版本定，预计 0.20+），MIT；SOM/perception 扩展（AGPL）不在集成范围。
- **宿主**：opencode ≥ 1.18 插件 API（`tool()` v1 + `attachments` 回传，已在 forge 0.3.0 开发中实测同一 API 面）。
- **已知边界**（记录为范围决策）：v1 不实现 Hermes 的 `auxiliary.vision` 辅助视觉路由（需要插件自持 LLM 凭据，重）；README 明示需视觉模型，`computer_status` 提示非视觉模型下截图不可读。后续 change 再评估。
- **平台**：v1 以 Windows 实机为准（用户环境），macOS/Linux 走与 forge watchdog 6.2 同款的"机制单测 + Linux 原生验证延后"姿态。
