import { test } from "node:test"
import assert from "node:assert/strict"
import { ComputerSession, REQUIRED_TOOLS } from "../src/session.ts"
import { ACTIONS } from "../src/tool.ts"
import { setup, _testInjectProbe } from "../plugin.ts"

// V2 registration matrix (change v2-plugin-api-port tasks 1.1–1.5, per
// conventions §6): wired + drifted legs per registration domain, mock ctx
// domains, and the setup-returned cleanup driven against a fake session.

// ── fakes (same shapes as wiring.test.mjs) ──────────────────────────────────

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
    this.order?.push("kill")
    this.exitCb?.(-1)
  }
  respond(id, result) {
    this.lineCb(JSON.stringify({ jsonrpc: "2.0", id, result }))
  }
}

function scriptedTransport({ tools = REQUIRED_TOOLS, calls = {} } = {}) {
  const t = new FakeTransport()
  t.order = []
  t.script = {
    initialize: () => ({ serverInfo: { name: "cua-driver", version: "0.28.2" } }),
    "tools/list": () => ({ tools: tools.map((name) => ({ name })) }),
    "tools/call": (p) => {
      t.order?.push(p.name)
      return calls[p.name]?.(p.arguments) ?? { content: [{ type: "text", text: "ok" }] }
    },
  }
  return t
}

/** Fake session factory: a real ComputerSession over a scripted transport. */
function fakeSessionFactory(overrides = {}) {
  const transports = []
  return {
    transports,
    makeSession: (invocation, sessionId, log) => {
      const t = overrides.makeTransport ? overrides.makeTransport() : scriptedTransport(overrides)
      transports.push({ invocation, sessionId, t })
      return new ComputerSession(invocation, sessionId, { spawnTransport: () => t, ...(log ? { log } : {}) })
    },
  }
}

/** Mock V2 ctx: recording implementations of tool/permission/skill domains,
 *  shaped to the OBSERVED v2.3.2 host API (task 2.3): skill editor.add takes
 *  a full Skill.Info; permission exposes hook("evaluate") + assert. */
function mockV2Ctx() {
  const added = []
  const evaluateHooks = []
  const skillAdds = []
  const asserts = []
  return {
    added,
    evaluateHooks,
    skillAdds,
    asserts,
    ctx: {
      tool: {
        transform: async (cb) => cb({ add: (def) => added.push(def) }),
      },
      permission: {
        hook: (name, cb) => {
          assert.equal(name, "evaluate")
          evaluateHooks.push(cb)
        },
        assert: async (input) => asserts.push(input),
      },
      skill: {
        transform: async (cb) => cb({ add: (s) => skillAdds.push(s) }),
      },
    },
  }
}

const READY_PROBE = {
  ready: true,
  resolved: "C:/cua.exe",
  version: "0.28.2",
  reason: "",
  mcpInvocation: { command: "C:/cua.exe", args: ["mcp"] },
}
const NOT_READY_PROBE = {
  ready: false,
  resolved: null,
  version: null,
  reason: "cua-driver is not installed",
  mcpInvocation: null,
}

test.afterEach(() => {
  _testInjectProbe(null)
})

const byName = (added, name) => added.find((d) => d.name === name)

// ── 1.1 two-state registration via ctx.tool.transform ─────────────────────

test("1.1 wired ready: editor adds computer + computer_status with JSON Schema contracts", async () => {
  _testInjectProbe(READY_PROBE)
  const rig = mockV2Ctx()
  const factory = fakeSessionFactory()
  const cleanup = await setup(rig.ctx, { makeSession: factory.makeSession })
  try {
    assert.deepEqual(rig.added.map((d) => d.name).sort(), ["computer", "computer_status"])
    const computer = byName(rig.added, "computer")
    assert.equal(computer.input.type, "object")
    assert.deepEqual(computer.input.properties.action.enum, [...ACTIONS], "17-action discriminator enum")
    assert.equal(computer.input.properties.action.enum.length, 17)
    assert.deepEqual(computer.input.required, ["action"])
    assert.ok(computer.input.properties.predicates.type === "array", "per-action fields carried over")
    assert.ok(typeof computer.description === "string" && computer.description.length > 0)
    const status = byName(rig.added, "computer_status")
    assert.deepEqual(status.input, { type: "object", properties: {} }, "status schema unchanged")
    assert.equal(typeof computer.execute, "function")
    assert.equal(typeof status.execute, "function")
  } finally {
    cleanup()
  }
})

test("1.1 wired not-ready: editor adds computer_status only (guide mode)", async () => {
  _testInjectProbe(NOT_READY_PROBE)
  const rig = mockV2Ctx()
  const cleanup = await setup(rig.ctx)
  try {
    assert.deepEqual(rig.added.map((d) => d.name), ["computer_status"])
    const guide = byName(rig.added, "computer_status")
    const r = await guide.execute({}, {})
    const payload = JSON.parse(r.content)
    assert.equal(payload.ready, false)
    assert.match(payload.remediation, /cua-driver is not installed|install/i)
  } finally {
    cleanup()
  }
})

test("1.1 drifted: missing tool domain (or missing editor.add) no-ops without throwing", async () => {
  _testInjectProbe(READY_PROBE)
  // no domains at all
  const cleanup = await setup({})
  cleanup()
  // tool domain present, transform present, editor reshaped (no add)
  let sawEditor = false
  const cleanup2 = await setup({
    tool: { transform: async (cb) => { sawEditor = true; cb({}) } },
  })
  cleanup2()
  assert.ok(sawEditor, "drifted transform still invoked its callback")
  // permission/skill shapes drifted: hook/transform not functions
  const cleanup3 = await setup({ permission: {}, skill: {}, tool: {} })
  cleanup3()
})

// ── 1.2 functional ask gate via ctx.permission.hook("evaluate") ────────────

function evalDecision(rig, event) {
  let hooked = null
  for (const cb of rig.evaluateHooks) cb((hooked = event))
  return hooked ?? event
}

test("1.2 default-ask: computer input requests with no explicit rule evaluate to ask", async () => {
  _testInjectProbe(READY_PROBE)
  const rig = mockV2Ctx()
  const cleanup = await setup(rig.ctx, { makeSession: fakeSessionFactory().makeSession })
  try {
    assert.equal(rig.evaluateHooks.length, 1, "one evaluate hook registered")
    // observed PermissionEvaluation shape: top-level mutable `effect`
    const e1 = evalDecision(rig, { action: "computer" })
    assert.equal(e1.effect, "ask")
    const e2 = evalDecision(rig, { action: "computer:foreground" })
    assert.equal(e2.effect, "ask", "foreground domain also gated")
    const e3 = evalDecision(rig, { action: "computer", effect: "ask" })
    assert.equal(e3.effect, "ask", "already-ask stays ask (not upgraded)")
    // source.id fallback when action is absent
    const e4 = evalDecision(rig, { source: { type: "tool", messageID: "m", id: "computer" } })
    assert.equal(e4.effect, "ask")
  } finally {
    cleanup()
  }
})

test("1.2 explicit rules pass through: user allow/deny is never overwritten", async () => {
  _testInjectProbe(READY_PROBE)
  const rig = mockV2Ctx()
  const cleanup = await setup(rig.ctx, { makeSession: fakeSessionFactory().makeSession })
  try {
    assert.equal(evalDecision(rig, { action: "computer", effect: "allow" }).effect, "allow")
    assert.equal(evalDecision(rig, { action: "computer", effect: "deny" }).effect, "deny")
    // other actions' requests are untouched
    const other = evalDecision(rig, { action: "bash", effect: "allow" })
    assert.equal(other.effect, "allow")
  } finally {
    cleanup()
  }
})

test("1.2 hard-block precedence: a blocked combo is refused even when evaluate allowed the call", async () => {
  _testInjectProbe(READY_PROBE)
  const rig = mockV2Ctx()
  const factory = fakeSessionFactory()
  const cleanup = await setup(rig.ctx, { makeSession: factory.makeSession })
  try {
    const allow = { action: "computer", effect: "allow" }
    evalDecision(rig, allow) // gate says allow (explicit-rule shape)
    const computer = byName(rig.added, "computer")
    const r = JSON.parse((await computer.execute({ action: "key", keys: "win+l" }, {})).content)
    assert.equal(r.ok, false)
    assert.match(r.error, /blocked key combo/)
    const dispatched = factory.transports[0].t.written.filter((m) => m.method === "tools/call")
    assert.equal(dispatched.length, 0, "hard-blocked input never reaches the driver — upstream of any approval")
  } finally {
    cleanup()
  }
})

test("1.2 assert wiring: computer execute routes through ctx.permission.assert with the observed input shape", async () => {
  _testInjectProbe(READY_PROBE)
  const rig = mockV2Ctx()
  const factory = fakeSessionFactory()
  const cleanup = await setup(rig.ctx, { makeSession: factory.makeSession })
  try {
    const computer = byName(rig.added, "computer")
    await computer.execute({ action: "list_apps" }, { sessionID: "ses_1", agent: "build", messageID: "msg_1", id: "computer" })
    assert.equal(rig.asserts.length, 1, "one assert before the core ran")
    const input = rig.asserts[0]
    assert.equal(input.action, "computer")
    assert.equal(input.sessionID, "ses_1")
    assert.equal(input.agent, "build")
    assert.deepEqual(input.source, { type: "tool", messageID: "msg_1", id: "computer" })
    // computer_status never asserts (read-only diagnostics, unguarded in V1 too)
    const status = byName(rig.added, "computer_status")
    await status.execute({}, { sessionID: "ses_1", id: "computer_status" })
    assert.equal(rig.asserts.length, 1, "status tool does not gate")
    // no sessionID in the host context (shape drift) → assert skipped, never throws
    await computer.execute({ action: "list_apps" }, {})
    assert.equal(rig.asserts.length, 1, "drifted host context skips the assert")
  } finally {
    cleanup()
  }
})

// ── 1.3 skill registration via editor.add(full Skill.Info) ──────────────────

test("1.3 wired: skill transform registers the bundled SKILL.md as a full Skill.Info", async () => {
  _testInjectProbe(READY_PROBE)
  const rig = mockV2Ctx()
  const cleanup = await setup(rig.ctx, { makeSession: fakeSessionFactory().makeSession })
  try {
    assert.equal(rig.skillAdds.length, 1)
    const skill = rig.skillAdds[0]
    assert.equal(skill.id, "computer-use")
    assert.equal(skill.name, "computer-use")
    assert.ok(String(skill.path).replace(/\\/g, "/").endsWith("/skills/computer-use/SKILL.md"), `SKILL.md path (got ${skill.path})`)
    assert.match(skill.description, /Desktop GUI automation/, "frontmatter description parsed (scope constraint)")
    assert.ok(skill.content.includes("# "), "content is the SKILL.md body (frontmatter stripped)")
  } finally {
    cleanup()
  }
})

test("1.3 drifted: missing skill domain no-ops without throwing", async () => {
  _testInjectProbe(READY_PROBE)
  const cleanup = await setup({ tool: undefined, permission: undefined }) // no skill domain
  cleanup()
  const cleanup2 = await setup({ skill: { transform: async (cb) => cb({}) } }) // editor without add
  cleanup2()
})

// ── 1.4 dispose via the setup-returned cleanup ──────────────────────────────

test("1.4 cleanup drives the session: end_session before kill, same ordering as V1 dispose", async () => {
  _testInjectProbe(READY_PROBE)
  const rig = mockV2Ctx()
  const factory = fakeSessionFactory()
  const cleanup = await setup(rig.ctx, { makeSession: factory.makeSession })
  // exercise the session (free action, no approval) so the child exists
  const computer = byName(rig.added, "computer")
  await computer.execute({ action: "list_apps" }, {})
  const t = factory.transports[0].t
  assert.ok(t.written.some((m) => m.method === "tools/call"), "child spawned and exercised")
  cleanup()
  await new Promise((r) => setTimeout(r, 20))
  assert.deepEqual(t.order.filter((n) => n === "end_session" || n === "kill"), ["end_session", "kill"], "session cleanup first, bounded grace, then kill")
  assert.equal(t.killed, true)
  // cleanup is idempotent (session dropped)
  cleanup()
})

// ── 1.5 V2 execute returns the structured result in the content shape ───────

test("1.5 wrapper shape (observed): string results keep { content: string }; captures map attachments to file content entries", async () => {
  _testInjectProbe(READY_PROBE)
  const rig = mockV2Ctx()
  const factory = fakeSessionFactory({
    calls: {
      get_window_state: () => ({
        content: [{ type: "image", data: "QUFBQQ==" }],
        structuredContent: { snapshot_id: "s", elements: [] },
      }),
      list_apps: () => ({ content: [{ type: "text", text: "- Notepad (pid 11)" }] }),
    },
  })
  const cleanup = await setup(rig.ctx, { makeSession: factory.makeSession })
  try {
    const computer = byName(rig.added, "computer")
    const list = await computer.execute({ action: "list_apps" }, {})
    assert.equal(typeof list.content, "string", "string result stays a plain content string")
    assert.deepEqual(Object.keys(list).sort(), ["content"], "no extra keys on plain results")
    const cap = await computer.execute({ action: "capture", pid: 11, window_id: 110, mode: "vision" }, {})
    assert.ok(Array.isArray(cap.content), "capture result content is the observed Tool.Content array")
    assert.equal(cap.content[0].type, "text")
    assert.equal(typeof cap.content[0].text, "string")
    const files = cap.content.filter((c) => c.type === "file")
    assert.equal(files.length, 1, "screenshot attachment rides as a file content entry")
    assert.equal(files[0].mime, "image/png")
    assert.match(files[0].uri, /^data:image\/png;base64,/, "V1 data-URL attachment maps url → uri")
    assert.equal(cap.attachments, undefined, "no non-observed top-level attachments key")
  } finally {
    cleanup()
  }
})
