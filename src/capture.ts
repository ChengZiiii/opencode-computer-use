// Capture result shaping: element list rendering (bounded), screenshot
// attachment construction (inline data URLs — the only channel the host
// turns into model-visible media), and the scale metadata that warns the
// model off pixel reasoning. Element rendering follows the cua-driver's
// structured shape (element_index / role / label / value / frame).

import type { CallContent, CallResult } from "./mcp-client.ts"

export const MAX_ELEMENTS = 100

export type Element = {
  index?: number
  element_index?: number
  role?: string
  label?: string
  name?: string
  value?: string
  enabled?: boolean
  frame?: { x?: number; y?: number; w?: number; h?: number }
  bounds?: { x?: number; y?: number; width?: number; height?: number } | number[]
  [k: string]: unknown
}

export type CaptureMode = "som" | "vision" | "ax"

export type Attachment = { type: "file"; mime: string; url: string; filename?: string }

function fmtFrame(el: Element): string {
  const f = el.frame
  if (f && [f.x, f.y, f.w, f.h].every((n) => typeof n === "number")) return `(${f.x},${f.y},${f.w},${f.h})`
  const b = el.bounds
  if (Array.isArray(b) && b.length >= 4) return `(${b[0]},${b[1]},${b[2]},${b[3]})`
  if (b && typeof b === "object") {
    const { x, y, width, height } = b as { x?: number; y?: number; width?: number; height?: number }
    if ([x, y, width, height].every((n) => typeof n === "number")) return `(${x},${y},${width},${height})`
  }
  return ""
}

export function renderElements(elements: Element[]): { text: string; truncated: boolean } {
  const truncated = elements.length > MAX_ELEMENTS
  const shown = truncated ? elements.slice(0, MAX_ELEMENTS) : elements
  const lines = shown.map((el) => {
    const rawIdx = el.element_index ?? el.index
    const idx = typeof rawIdx === "number" ? rawIdx : "?"
    const role = String(el.role ?? el.type ?? "element")
    const label = String(el.label ?? el.name ?? "").slice(0, 60).replace(/\s+/g, " ").trim()
    const value = typeof el.value === "string" && el.value ? ` = ${JSON.stringify(el.value.slice(0, 40))}` : ""
    const frame = fmtFrame(el)
    return `  [${idx}] ${role}${label ? ` "${label}"` : ""}${frame ? ` ${frame}` : ""}${value}${el.enabled === false ? " (disabled)" : ""}`
  })
  return {
    text: lines.join("\n") + (truncated ? `\n  … truncated after ${MAX_ELEMENTS} of ${elements.length} elements — narrow with query= or an app/pid capture` : ""),
    truncated,
  }
}

export function extractImages(content: CallContent[]): Array<{ data: string; mimeType: string }> {
  return content
    .filter((c): c is Extract<CallContent, { type: "image" }> => c.type === "image" && typeof c.data === "string")
    .map((c) => ({ data: c.data, mimeType: c.mimeType ?? "image/png" }))
}

export function extractText(content: CallContent[]): string {
  return content
    .filter((c): c is Extract<CallContent, { type: "text" }> => c.type === "text")
    .map((c) => c.text)
    .join("\n")
}

/**
 * Build the capture tool result. Scale metadata is mandatory with any image:
 * Anthropic's guidance names coordinate-space mismatch as the top accuracy
 * killer, and our countermeasure is element addressing + explicit mapping.
 */
export function buildCaptureResult(args: {
  mode: CaptureMode
  call: CallResult
  screen?: { width?: number; height?: number; scaleFactor?: number }
  windowTitle?: string
}): { output: string; attachments?: Attachment[]; elements?: Element[] } {
  const text = extractText(args.call.content)
  const images = args.mode === "ax" ? [] : extractImages(args.call.content)
  const structured = (args.call.structured ?? {}) as {
    elements?: Element[]
    window_title?: string
    screenshot_width?: number
    screenshot_height?: number
    window_bounds?: { w?: number; h?: number }
  }
  let elements: Element[] | undefined
  if (Array.isArray(structured.elements)) elements = structured.elements

  const title = args.windowTitle ?? structured.window_title
  const header = `capture(${args.mode})${title ? ` — ${JSON.stringify(title)}` : ""} — ${args.call.isError ? "driver reported an error" : "ok"}`
  const parts: string[] = [header]

  if (elements?.length) {
    const rendered = renderElements(elements)
    parts.push(`elements (address actions by [index], do not compute pixel coordinates):`, rendered.text)
  } else if (text) {
    parts.push(text.slice(0, 4000))
  }

  const attachments: Attachment[] | undefined = images.length
    ? images.map((img, i) => ({
        type: "file" as const,
        mime: img.mimeType,
        url: `data:${img.mimeType};base64,${img.data}`,
        ...(i === 0 && images.length > 1 ? { filename: `capture-${i}.png` } : {}),
      }))
    : undefined

  if (attachments?.length) {
    const sw = structured.screenshot_width
    const sh = structured.screenshot_height
    const wb = structured.window_bounds
    const scaleNote =
      typeof sw === "number" && typeof wb?.w === "number" && sw > 0 && wb.w > 0 && Math.abs(sw - wb.w) > 1
        ? `screenshot is ${sw}x${sh} for a ${wb.w}x${wb.h} window (scale ${(wb.w / sw).toFixed(3)}) — map pixel ideas back by this factor`
        : `screenshot at native window resolution`
    parts.push(
      `screenshot attached (${attachments.length} image${attachments.length > 1 ? "s" : ""}; ${scaleNote}).`,
      `The image may have been resized upstream — never derive pixel coordinates from it. Prefer element [index] addressing; for pixel fallback, capture first, then act on the coordinates the backend reports. For small targets use the zoom path (native-resolution crop) rather than zooming the full screenshot.`,
    )
  }

  return { output: parts.join("\n"), ...(attachments ? { attachments } : {}), ...(elements ? { elements } : {}) }
}
