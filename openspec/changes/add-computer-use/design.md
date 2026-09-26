# Design — add-computer-use

## Context

见 proposal.md（Why）。三个外部事实框住本设计：

1. **宿主能力面**（实测，opencode 1.18.32 / @opencode-ai/plugin）：`tool()` 自定义工具的 `ToolResult.attachments` 支持 `{type:"file", mime, url}`，宿主 `message-v2` 只把 `data:` URL 转 media 块进模型上下文（非 Anthropic provider 自动降级为合成 user message）；`ctx.ask()` + config `permission` 注入构成审批两件套（forge 0.3.0 已实践）。
2. **后端能力面**（trycua/cua `cua-driver`，MIT，26.5k★，日更）：`cua-driver mcp` 是 stdio MCP 服务，`cua-driver manifest` 自述版本 + `mcp_invocation` + 子命令面；三平台；macOS 需 TCC（挂驱动自己身份），Windows/Linux 免管理员；遥测由 `CUA_DRIVER_RS_TELEMETRY_ENABLED` 门控。
3. **纪律基线**：openspec-libretto skill §1.1 的外部 CLI 纪律（缺失→报命令给用户→STOP，绝不 try-anyway，绝不代装）；避坑文档的红线（七触发器、双入口、终验只认官方安装模式）。

## Goals / Non-Goals

**Goals**：Hermes 验证过的动作面原样进 opencode；"只探测—降级—指引"生命周期；宿主与后端零意外（超时/互斥/崩溃恢复/遥测关闭）；零 npm 运行时依赖的可测试单包。

**Non-Goals**（v1 明确排除）：
- `auxiliary.vision` 辅助视觉路由（需插件自持 LLM 凭据；README/status 明示需视觉模型，边界记录在 proposal）
- SOM 图上编号叠加的**像素渲染**（v1 的 som 模式 = 截图 + 带序号/bounds 的元素文本清单，序号可直接用于元素寻址动作；渲染叠加留后续 change）
- 浏览器专用工具面（用户可并行配 playwright-mcp，README 给并装说明）
- 云 CUA API 兜底、多显示器高级寻址、capability manifest（bounded 权限模式）

## Decisions

### D1 MCP 客户端：自研最小 JSON-RPC over stdio（零依赖）

只用协议的稳定子集：`initialize` 握手 → `tools/list`（记入契约观察）→ `tools/call`。传输层抽象成可注入接口（fake 即测）。**备选**：`@modelcontextprotocol/sdk`（协议演进更稳，但引入依赖树、破坏零依赖姿态、bundle 体积与避坑红线复杂化）。协议漂移由 D4 契约门兜底，SDK 的收益不足以抵消。

### D2 二进制解析与契约门：manifest 自述，两段式检查

解析顺序：`OPENCODE_CUA_DRIVER_CMD`（权威，坏了也不换）→ PATH → 平台规范位置（Windows `%LOCALAPPDATA%\Programs\Cua\cua-driver\bin`、`~/.local/bin`、`~/.cargo/bin`、homebrew 两处）。
契约门 = `cua-driver manifest` JSON：`binary_version` ≥ 下限（初始 0.20.0，实测后按 installed 定）+ `mcp_invocation` 存在且合法 + 必需子命令 flag 面（沿用 Hermes 的 `mcp/serve/stop` 三组）。**两段式**：启动只做 manifest 门（毫秒级，无 spawn MCP、无网络）；首次调用才惰性起 MCP 会话，`tools/list` 结果若缺本集成所需工具 → 当次调用返回结构化错误并指引（不吞、不半工作）。**备选**：启动即起 MCP 全握手——Windows Defender 首扫下拖慢 opencode 启动，否决。

### D3 生命周期：探测—降级—指引（openskill 纪律平移）

启动探测（D2）→ 就绪：注册 `computer` 全工具面 + `computer_status`；未就绪：只注册 `computer_status`，返回 failing check + **用户自己跑**的平台命令（Windows `irm https://cua.ai/driver/install.ps1 | iex`，POSIX curl|bash；升级 = 同命令）。插件进程内零安装器执行、零生命周期网络；`computer_status` 可按需调驱动自带 `check-update --json`（驱动内部缓存 ~20h）纯信息汇报。版本策略单向：验证过新驱动才在同一次变更里抬下限与 tested-against。

### D4 截图回传链：attachments + 缩放职责在驱动侧探测

`capture` 拿到驱动返回的 PNG（base64）→ `attachments: [{type:"file", mime:"image/png", url:"data:image/png;base64,..."}]`，文本输出带坐标映射说明（图长边 vs 原生分辨率比例 + 元素寻址优先提示）。缩放优先用驱动侧分辨率参数（live 验证任务确认）；若驱动不支持且原始分辨率超长边 ~1568px，v1 接受原始图并在输出中给比例映射（零依赖约束下不自研 PNG 重采样），把"驱动参数不满足时的插件侧缩放"记为已知取舍（见 Risks）。元素清单上限默认 100，超出截断并声明。

### D5 安全层：照抄 Hermes 实战清单

封禁键组（Win+L、Cmd+Ctrl+Q、Cmd+Shift+Q、Ctrl+Alt+Del 类，别名归一化 + 连字符切分防绕过）、封禁 type 文本（curl|bash 类、sudo rm -rf /、fork bomb）——先于审批拦截；粘性目标守卫（app 参数明显不符即拒绝）；verdict 三态映射驱动结构化字段（effect/verified/escalation 缺失时默认 `verify_fresh_state`）；单飞互斥（promise 链串行化 + 有界等待）。审批两件套：config hook 注入 `permission.computer = "ask"`（显式 deny 胜）+ execute 内 `ctx.ask()`（run 模式自动拒绝的语义已由 forge 7.2 实测）。

### D6 进程卫生

单进程单驱动子进程（manifest 的 `mcp_invocation` 直接 spawn，无孙进程链——#42191 免疫）；每调用硬超时（默认：capture 类 30s、输入类 15s、list 类 10s，Windows 首调用放宽——Defender 首扫）；`dispose` 终止子进程；崩溃 → 当次调用结构化报错 + 粘性目标/元素引用全失效 + 下次调用惰性重启；会话标签 `opencode-computer-use-<uuid>` 传 `start_session`；遥测 env 默认关；`--no-overlay` 平台默认沿用 Hermes 实证（macOS/X11 关，Wayland/Windows 开），probe `--help` 探测支持度。

### D7 模块布局（对齐 forge 的 src/ 纪律）

```
plugin.ts               入口（id/server/setup 双入口，避坑 §2）
src/driver-resolve.ts   解析顺序 + override
src/contract.ts         manifest 门 + 两段式状态机（ready/guide）
src/mcp-client.ts       最小 JSON-RPC stdio 客户端（传输可注入）
src/capture.ts          附件构造、元素清单截断、坐标映射文本
src/safety.ts           封禁清单、别名归一、粘性目标、verdict 映射
src/tool.ts             computer / computer_status 工具定义与 execute
tests/*.test.mjs        node --test + fake 传输/假 manifest
```

## Risks / Trade-offs

- **驱动参数不支持分辨率控制** → v1 原图回传，token 开销偏高；文本输出给映射与元素寻址优先的引导缓解，缩放列为后续 change 候选。
- **非视觉主模型** → 截图模型不可读（opencode 静默剥离类坑 #47480）；`computer_status` 与 README 明示，v1 不做辅助路由（Non-Goal）。
- **上游 cua-driver 破坏性变更** → manifest 契约门启动即拦，降级 guide 模式带具名诊断；单向版本策略保证不半兼容运行。
- **Windows Defender 首扫慢** → 超时放宽 + status 工具的 doctor 输出提示；绝不因慢而挂会话（超时失败的是调用）。
- **token 体量**（截图 + 元素清单）→ 元素上限、`ax` 模式（纯文本）作为便宜档、capture_after 仅在输入动作显式要求时附图。
- **审批疲劳** → 单工具单权限键 `computer`（一次 always 即放行会话），doom_loop 交给宿主守卫；封禁清单在审批前拦截故 always 放行也不放行破坏性输入。
