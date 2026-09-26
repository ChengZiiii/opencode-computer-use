# Verification notes — add-computer-use

环境：Windows 11，opencode 1.18.32，cua-driver 0.28.2（`%LOCALAPPDATA%\Programs\Cua\`，Hermes 带入），
模型 glm-coding-worker/glm-4.6v（视觉）与 glm-5.3（纯文本），沙箱 `XDG_CONFIG_HOME` + file-spec 插件
（用户配置全程未动）。单测 38/38 + `tsc --noEmit` 干净 + bundle 0.44 MB。

## 7.1 端到端（通过）

一次性靶子（临时 notepad + 空文件，不碰用户数据）：

1. `capture mode=som pid=<n>`（**未给 window_id**）→ 插件经 `list_windows`
   structured.windows 自动解析出 window_id → `get_window_state` 返回
   截图 + 元素树。**视觉模型真读到截图**（报出窗口标题"cu-smoke-target.txt - Notepad"
   与菜单结构）——attachments data-URL 回传契约在实机成立。
2. `type text=SMOKE-TARGET-TYPED` → 交付。
3. `capture query=Text editor` → **元素 value 字段回读**：
   `Document "Text editor" = "SMOKE-TARGET-TYPED\r"` —— 输入效果经
   新快照闭环验证（cua 官方教程的"read the result back from a fresh
   snapshot"自动化）。
4. `focus_app` / `list_apps` 正常。

驱动面校准（实机 describe + 直连探针）：`get_window_state` 强制
window_id（驱动从不隐式选窗）；`max_dimension` 驱动侧缩放可用（我们
固定传 1568，规格契约由驱动强制）；元素结构化形状为
element_index/role/label/**value**/**frame**（非 bounds）；
`list_windows` 结构化在 `structured.windows`。全部已按实测定型并配
单测（含人类可读文本格式的回退解析）。

早期轮发现的三个缺陷均已修复并有测试：value 字段未渲染（文本模型
读不到编辑区内容）、vision 模式误打全桌面而非目标窗口、window_id-only
时未对称解析 pid。

## 7.2 生命周期姿态（通过）

- **引导模式**：`OPENCODE_CUA_DRIVER_CMD` 指向不存在路径 → 仅注册
  `computer_status`（`computer` 工具不存在），输出精确命名 override
  问题 + 用户自跑安装命令（`irm https://cua.ai/driver/install.ps1 | iex`）
  + "插件永不代装/永不轮询"声明。实机输出见 tasks 7.2。
- 版本低/坏 manifest/超时分支：单测覆盖（假 runner 五分支）。
- 插件代码路径审计：无任何安装器执行、无生命周期网络请求（唯一子进程
  是 `cua-driver mcp --direct` 的 stdio 对话）。

## 7.3 稳定性（通过）

- **dispose 无泄漏（实机）**：多轮 `opencode run` 退出后
  `Get-CimInstance Win32_Process` 查 `cua-driver%` 为空——每个宿主进程
  的驱动子进程都被 dispose 杀干净，无残留。
- **崩溃/超时语义（单测层）**：在途调用被进程退出拒绝、粘性目标失效、
  下次调用惰性重启（respawn 计数=2）；超时失败当次调用不挂会话。
  实机人为制造挂死驱动的编排成本高，按 watchdog 6.2 的同款姿态以
  单测 + 直连探针（initialize/tools/list/call 真驱动往返）覆盖。

## 7.4 审批与安全（通过）

- **默认 ask（无 --auto）**：`type` → `user denied: The user rejected
  permission to use this specific tool call.`，且
  `capture query=Text editor` 回读确认 `MUST-STAY-OUT` **未落地**。
  修复记录：初版 ask 请求误带 `always:["computer"]`（自我预授权，
  实机暴露：文本落地了）；照 forge 两件套姿态改为
  `patterns:["*"], always:[]` 后正确拒绝。此次事故反而实机验证了
  "显式规则覆盖"语义——沙箱里显式 `computer:'allow'` 时 ask 放行。
- **--auto 下硬封锁依旧**：`key win+l` →
  `{"ok":false,"error":"blocked key combo: win+l — destructive system
  shortcuts are hard-blocked."}`，未触达系统。
- 纯文本模型（glm-5.3）边界行为符合设计：自报无法读图，改用元素树
  完成验证闭环（ax-first 路线可用）。

## 姿态说明

- 实机验证以 Windows 为主（用户环境）；macOS/Linux 的解析顺序与安装
  命令为代码路径 + 单测覆盖，Linux 原生验证延后（同 forge watchdog
  6.2 姿态）。
- 所有 verdict 目前默认 `verify_fresh_state`（0.28.2 成功路径不回
  effect/verified 结构化字段；文本 JSON 合并已实现，字段出现即生效）——
  安全默认，符合 spec"transport 成功≠生效"。

## 8.1 / 8.2 — 发布与官方安装终验（2026-09-26）

- **8.1 通过**：`npm pack` 产物检查——`@sorenllm/opencode-computer-use@0.1.0`，
  3 文件（README 6.9kB / dist 444.2kB / package.json），无七触发器脚本、
  无 workspaces、双导出、`engines.opencode "^1.18.0"`；38/38 测试 +
  tsc 干净后发布。
- **8.2 通过（硬性最终态达成）**：
  - 发布凭据走 Edge 浏览器闭环（同 forge 0.3.0 流程）：npmjs 会话
    sudo-auth 当日有效 → granular token 表单（令牌名
    `opencode-computer-use-0.1.0-publish`、Read and write (publish and
    stage)、bypass-2FA）→ `+ @sorenllm/opencode-computer-use@0.1.0` →
    **两个孤儿 token 全部删除**（列表复核零 token 行）、本地临时
    凭据文件删除、浏览器标签还原。**偏差记录**：单包 scoping 的
    包选择下拉在 a11y 树中不浮出（400 元素裁剪），本退而使用
    All-packages 读写范围 + 发布后立即撤销的有界方案；granular
    单包路径已于同日 forge 0.3.0 发布中完整验证过。
  - registry `@latest`→0.1.0 后官方安装终验：
    `opencode plugin @sorenllm/opencode-computer-use --global`（npm
    registry spec）→ store 0.1.0、用户 `opencode.jsonc` 三插件全 npm
    spec、注释保留（3406→3445 字节，仅新增插件行）。
  - npm 安装态冒烟（--auto + glm-4.6v 视觉）：capture som 截图可读
    （窗口标题）、type 落地并经元素 value 回读闭环
    （"NPM-MODE-FINAL"）。**已知输入通道差异（记录不阻塞）**：
    XAML 宿主（现代记事本）上 ctrl+a 热键与空值 set_value 未生效
    ——verdict 梯如实上报"未落地"且 agent 拒绝盲重试（设计行为），
    type/ValuePattern 主通道正常；后续 change 可补热键的元素级寻址。
  - **最终状态：用户环境 npm plugin 模式（registry 名安装）且冒烟通过**，
    forge 0.3.0 共存不受影响。
