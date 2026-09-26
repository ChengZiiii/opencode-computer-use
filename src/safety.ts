// Safety layer: hard-blocked destructive input (checked BEFORE any approval
// or dispatch — an "always" approval must never let these through), sticky
// target guard helpers, and the semantic verdict mapping. Blocklists are the
// battle-tested Hermes lists (aliases canonicalized, hyphen/space splitting
// closes the "ctrl-alt-delete" bypass).

const KEY_ALIASES: Record<string, string> = {
  command: "cmd",
  control: "ctrl",
  alt: "option",
  "⌘": "cmd",
  "⌥": "option",
  windows: "win",
  super: "win",
  meta: "win",
  delete: "del",
}

// Lock / log out / force-quit class: killing the session the agent runs in.
const BLOCKED_KEY_COMBOS: ReadonlyArray<readonly string[]> = [
  ["cmd", "shift", "backspace"],
  ["cmd", "option", "backspace"],
  ["cmd", "ctrl", "q"],
  ["cmd", "shift", "q"],
  ["cmd", "option", "shift", "q"],
  ["win", "l"],
  ["ctrl", "option", "delete"],
  ["ctrl", "option", "del"],
  ["option", "f4"],
]

const BLOCKED_TYPE_PATTERNS: RegExp[] = [
  /curl\s+[^|]*\|\s*bash/i,
  /curl\s+[^|]*\|\s*sh/i,
  /wget\s+[^|]*\|\s*bash/i,
  /wget\s+[^|]*\|\s*sh/i,
  /\bsudo\s+rm\s+-[rf]/i,
  /\brm\s+-rf\s+\/\s*$/i,
  /:\s*\(\)\s*\{\s*:\|:\s*&\s*\}/,
]

export function canonKeyCombo(keys: string): string[] {
  return keys
    .split(/[\s+\-]+/)
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean)
    .map((part) => KEY_ALIASES[part] ?? part)
}

export function blockedKeyReason(keys: string): string | null {
  const combo = canonKeyCombo(keys)
  if (!combo.length) return null
  const set = new Set(combo)
  for (const blocked of BLOCKED_KEY_COMBOS) {
    if (blocked.every((k) => set.has(k))) {
      return `blocked key combo: ${[...blocked].join("+")} — destructive system shortcuts are hard-blocked.`
    }
  }
  return null
}

export function blockedTypeReason(text: string): string | null {
  for (const pat of BLOCKED_TYPE_PATTERNS) {
    if (pat.test(text)) {
      return `blocked pattern in type text: ${pat.source} — dangerous shell patterns cannot be typed via computer use.`
    }
  }
  return null
}

// ── Sticky target ───────────────────────────────────────────────────────────

export type StickyTarget = { app: string; pid?: number; windowId?: number } | null

/** True when requested names a different app than the current sticky target. */
export function inputTargetMismatch(sticky: StickyTarget, requestedApp: string | undefined): string | null {
  if (!sticky || !requestedApp) return null
  const current = (sticky.app ?? "").trim().toLowerCase()
  const wanted = requestedApp.trim().toLowerCase()
  if (!current || !wanted) return null
  if (wanted.includes(current) || current.includes(wanted)) return null
  return sticky.app
}

// ── Verdict mapping ─────────────────────────────────────────────────────────

export type DriverVerdictFields = {
  ok?: boolean
  verified?: boolean | null
  effect?: string | null
  escalation?: { recommended?: string } | null
}

export type Verdict = { decision: "done" | "verify_fresh_state" | "escalate"; hint: string; recommended?: string }

const HINT_VERIFY =
  "Input was delivered but not confirmed (or proof is missing). Re-capture and check the result BEFORE any retry — do not repeat the input on a recommendation alone."

export function mapVerdict(f: DriverVerdictFields): Verdict {
  if (f.verified === true || f.effect === "confirmed") {
    return { decision: "done", hint: "Effect confirmed." }
  }
  if (f.effect === "unverifiable") {
    return { decision: "verify_fresh_state", hint: HINT_VERIFY }
  }
  if (f.effect === "suspected_noop" || f.ok === false) {
    return {
      decision: "escalate",
      hint: "The input likely did not land. Climb one rung if the backend recommends it; never predict the rung from the app being Electron/Chromium — react to this signal.",
      ...(typeof f.escalation?.recommended === "string" ? { recommended: f.escalation.recommended } : {}),
    }
  }
  // Transport success without semantic proof is not proof of effect.
  return { decision: "verify_fresh_state", hint: HINT_VERIFY }
}
