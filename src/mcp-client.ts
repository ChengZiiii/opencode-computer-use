// Minimal MCP stdio client: newline-delimited JSON-RPC 2.0 subset
// (initialize -> notifications/initialized -> tools/list -> tools/call).
// Zero npm dependencies; transport injectable for tests. Every call carries
// a hard timeout whose expiry fails THAT call, never the host session; a
// process exit rejects all in-flight calls and marks the client crashed.

import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process"

export type TextContent = { type: "text"; text: string }
export type ImageContent = { type: "image"; data: string; mimeType?: string }
export type CallContent = TextContent | ImageContent

export type CallResult = { content: CallContent[]; isError?: boolean; structured?: Record<string, unknown> }

export interface McpTransport {
  write(line: string): void
  onLine(cb: (line: string) => void): void
  onExit(cb: (code: number | null) => void): void
  kill(): void
  /** Child pid when the transport owns a process (diagnostics / crash tests). */
  pid?(): number | undefined
}

// Spawn environment for the driver subprocess: a MINIMAL whitelist of system
// essentials (PATH so the driver's own children resolve, Windows system
// roots, temp dirs, identity basics) — never the host's full environment.
// Provider API keys and other credentials present in opencode's process env
// must not leak into the driver (spec: process hygiene). The telemetry flag
// rides along from the session.
export const ENV_WHITELIST = [
  "PATH",
  "PATHEXT",
  "ComSpec",
  "SystemRoot",
  "SYSTEMROOT",
  "SystemDrive",
  "SYSTEMDRIVE",
  "windir",
  "WINDIR",
  "LOCALAPPDATA",
  "APPDATA",
  "PROGRAMDATA",
  "TEMP",
  "TMP",
  "HOME",
  "TMPDIR",
  "USERPROFILE",
  "USERNAME",
  "NUMBER_OF_PROCESSORS",
  "PROCESSOR_ARCHITECTURE",
  "OS",
]

export function buildChildEnv(extra: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const key of ENV_WHITELIST) {
    const v = process.env[key]
    if (typeof v === "string" && v !== "") out[key] = v
  }
  return { ...out, ...extra }
}

/** Real transport over a spawned child process (stdout/stderr line-split). */
export function childTransport(cmd: string, args: string[], env: Record<string, string>): McpTransport {
  const child: ChildProcessWithoutNullStreams = spawn(cmd, args, {
    env: buildChildEnv(env),
    stdio: ["pipe", "pipe", "pipe"],
    windowsHide: true,
  }) as ChildProcessWithoutNullStreams
  let lineCb: ((line: string) => void) | null = null
  let exitCb: ((code: number | null) => void) | null = null
  let buf = ""
  const feed = (chunk: string) => {
    buf += chunk
    let idx: number
    while ((idx = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, idx).replace(/\r$/, "")
      buf = buf.slice(idx + 1)
      if (line.trim() && lineCb) lineCb(line)
    }
  }
  child.stdout.setEncoding("utf8")
  child.stdout.on("data", feed)
  child.stderr.setEncoding("utf8")
  child.stderr.on("data", (d: string) => feed(d)) // some servers log JSON to stderr; harmless split
  child.on("exit", (code) => exitCb?.(code ?? null))
  return {
    write: (line) => child.stdin.write(line + "\n"),
    pid: () => child.pid,
    onLine: (cb) => {
      lineCb = cb
    },
    onExit: (cb) => {
      exitCb = cb
    },
    kill: () => {
      try {
        child.kill()
      } catch {}
    },
  }
}

type Pending = {
  resolve: (value: unknown) => void
  reject: (err: Error) => void
  timer: NodeJS.Timeout
}

export class McpClient {
  private nextId = 1
  private pending = new Map<number, Pending>()
  /** Public so ordered-shutdown callers can skip end_session on a dead client. */
  disposed = false
  private transport: McpTransport
  private opts: { name: string; version: string; defaultTimeoutMs?: number }
  crashed = false
  serverTools: string[] = []
  serverInfo: Record<string, unknown> | null = null

  constructor(transport: McpTransport, opts: { name: string; version: string; defaultTimeoutMs?: number }) {
    this.transport = transport
    this.opts = opts
    transport.onLine((line) => this.onLine(line))
    transport.onExit(() => this.onExit())
  }

  private onLine(line: string) {
    let msg: { id?: unknown; result?: unknown; error?: { message?: unknown } }
    try {
      msg = JSON.parse(line)
    } catch {
      return // non-JSON noise (e.g. telemetry notices) is ignored
    }
    if (typeof msg.id !== "number") return // notifications from the server
    const entry = this.pending.get(msg.id)
    if (!entry) return
    this.pending.delete(msg.id)
    clearTimeout(entry.timer)
    if (msg.error) entry.reject(new Error(String(msg.error.message ?? "MCP error")))
    else entry.resolve(msg.result)
  }

  private onExit() {
    this.crashed = true
    for (const [, entry] of this.pending) {
      clearTimeout(entry.timer)
      entry.reject(new Error("cua-driver process exited before responding"))
    }
    this.pending.clear()
  }

  private request(method: string, params: Record<string, unknown>, timeoutMs: number): Promise<unknown> {
    if (this.disposed) return Promise.reject(new Error("MCP client disposed"))
    if (this.crashed) return Promise.reject(new Error("cua-driver process has exited; a new one starts on the next call"))
    const id = this.nextId++
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id)
        reject(new Error(`${method} timed out after ${timeoutMs}ms (the call failed, not the session; retry or re-capture)`))
      }, timeoutMs)
      timer.unref?.()
      this.pending.set(id, { resolve, reject, timer })
      this.transport.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }))
    })
  }

  private notify(method: string) {
    if (this.disposed || this.crashed) return
    this.transport.write(JSON.stringify({ jsonrpc: "2.0", method }))
  }

  async initialize(timeoutMs = 20000): Promise<void> {
    const result = (await this.request(
      "initialize",
      {
        protocolVersion: "2025-06-18",
        capabilities: {},
        clientInfo: { name: this.opts.name, version: this.opts.version },
      },
      timeoutMs,
    )) as { serverInfo?: Record<string, unknown> } | null
    this.serverInfo = result?.serverInfo ?? null
    this.notify("notifications/initialized")
    const tools = (await this.request("tools/list", {}, timeoutMs)) as { tools?: Array<{ name?: unknown }> } | null
    this.serverTools = Array.isArray(tools?.tools)
      ? tools!.tools.map((t) => String(t?.name ?? "")).filter(Boolean)
      : []
  }

  missingTools(required: string[]): string[] {
    return required.filter((t) => !this.serverTools.includes(t))
  }

  async call(tool: string, args: Record<string, unknown>, timeoutMs?: number): Promise<CallResult> {
    const result = (await this.request(
      "tools/call",
      { name: tool, arguments: args },
      timeoutMs ?? this.opts.defaultTimeoutMs ?? 30000,
    )) as { content?: CallContent[]; isError?: boolean; structuredContent?: Record<string, unknown> } | null
    return {
      content: Array.isArray(result?.content) ? result!.content! : [],
      isError: result?.isError === true,
      structured: result?.structuredContent,
    }
  }

  dispose() {
    this.disposed = true
    for (const [, entry] of this.pending) {
      clearTimeout(entry.timer)
      entry.reject(new Error("MCP client disposed"))
    }
    this.pending.clear()
    this.transport.kill()
  }
}
